/**
 * Script Include class file: Glide APIs auto-available — do NOT import. ES5 only
 * (Class.create, no ES6, `var` only). `type` must match the class + fluent name.
 *
 * JamfCommandService — the brain and the enforcement layer (OUTBOUND_PLAN §4.1,
 * §6). Maps a command-log row to an endpoint + body + identifier, and owns:
 * kill-switch/dry-run checks, dedupe, per-device in-flight guard, blast-radius
 * guard, PIN generation (computer erase AND macOS lock), secret redaction, and —
 * critically — the approval gate enforced in BOTH create() and send() (defense
 * in depth), independent of the trigger.
 *
 *   new x_912401_jamf_pro.JamfCommandService().create({ci, deviceType, action, payload, source, requestedBy});
 */
var JamfCommandService = Class.create()

JamfCommandService.prototype = {
    TABLE: 'x_912401_jamf_pro_command_log',

    // Per-action metadata. destructive: true | false | 'computer' (destructive
    // only for computers) | 'conditional' (destructive when forceRestart/multi).
    // reconcile: how the row is later confirmed. queue: uses /v2/mdm/commands.
    _meta: {
        BLANK_PUSH: { id: 'managementId', destructive: false, reconcile: 'none' },
        DEVICE_LOCK: { id: 'managementId', destructive: 'computer', reconcile: 'uuid', queue: true },
        CLEAR_PASSCODE: { id: 'managementId', destructive: false, reconcile: 'uuid', queue: true },
        RESTART_DEVICE: { id: 'managementId', destructive: false, reconcile: 'uuid', queue: true },
        SHUT_DOWN_DEVICE: { id: 'managementId', destructive: false, reconcile: 'uuid', queue: true },
        ENABLE_LOST_MODE: { id: 'managementId', destructive: false, reconcile: 'uuid', queue: true },
        DISABLE_LOST_MODE: { id: 'managementId', destructive: false, reconcile: 'uuid', queue: true },
        PLAY_LOST_MODE_SOUND: { id: 'managementId', destructive: false, reconcile: 'uuid', queue: true },
        ERASE_DEVICE: { id: 'managementId', destructive: true, reconcile: 'uuid', queue: true },
        REDEPLOY_FRAMEWORK: { id: 'jamfId', destructive: false, reconcile: 'effect' },
        MACOS_UPDATE: { id: 'jamfId', destructive: 'conditional', reconcile: 'effect' },
        UPDATE_PLAN_DEVICES: { id: 'jamfId', destructive: 'conditional', reconcile: 'effect' },
        UPDATE_PLAN_GROUP: { id: 'groupId', destructive: true, reconcile: 'effect' },
        DEPLOY_PACKAGE: { id: 'jamfId', destructive: true, reconcile: 'effect' },
        COMPUTER_ERASE: { id: 'jamfId', destructive: true, reconcile: 'effect' },
        COMPUTER_REMOVE_MDM: { id: 'jamfId', destructive: true, reconcile: 'effect' },
        MOBILE_ERASE: { id: 'jamfId', destructive: true, reconcile: 'effect' },
        MOBILE_UNMANAGE: { id: 'jamfId', destructive: true, reconcile: 'effect' },
        GROUP_ERASE: { id: 'groupId', destructive: true, reconcile: 'effect' },
        RENEW_PROFILE: { id: 'udid', destructive: false, reconcile: 'effect' },
    },

    initialize: function (overrides) {
        overrides = overrides || {}
        this._config = overrides.config || new x_912401_jamf_pro.JamfConfig()
        this._client = overrides.client || new x_912401_jamf_pro.JamfCommandClient(this._config)
        this._logger = overrides.logger || new x_912401_jamf_pro.JamfCommandLogger(this._config)
    },

    /**
     * Idempotently create a command-log row. Forces every destructive row to
     * pending_approval regardless of source; non-destructive rows go to
     * pending_send. Returns the (possibly pre-existing) row sys_id.
     * @param {Object} request {ci, deviceType, action, payload, source, requestedBy, device, batch}
     * @return {String} row sys_id
     */
    create: function (request) {
        request = request || {}
        var config = this._config
        var logger = this._logger
        var action = request.action
        var deviceType = request.deviceType
        var payload = request.payload || {}

        if (!this._meta[action]) {
            throw new Error('JamfCommandService: unknown action ' + action)
        }

        var dev = this._resolveDevice(request)
        var isDestructive = this._isDestructive(action, deviceType, payload)

        var f = {
            target_ci: request.ci || (dev ? dev.getValue('ci') : ''),
            device: request.device || (dev ? String(dev.getUniqueValue()) : ''),
            device_type: deviceType,
            action: action,
            source: request.source || 'api',
            requested_by: request.requestedBy || gs.getUserID(),
            is_destructive: isDestructive,
            reconcile_mode: this._meta[action].reconcile,
            date_requested: this._now(),
            date_expires: this._nowPlusHours(config.getCommandExpiryHours()),
            action_payload: JSON.stringify(this._redactPayload(payload)),
            batch: request.batch || '',
        }
        if (dev) {
            f.target_management_id = dev.getValue('management_id')
            f.target_jamf_id = dev.getValue('jamf_id')
            f.target_udid = dev.getValue('udid')
        }

        // Kill switch — record an auditable canceled row, never POST.
        if (!config.areActionsEnabled()) {
            f.status = 'canceled'
            f.error_reason = 'Outbound actions disabled (x_912401_jamf_pro.actions.enabled = false)'
            return logger.insert(f)
        }

        // Dedupe against a recent identical request.
        var key = this._dedupeKey(f.target_ci, action, payload)
        f.dedupe_key = key
        var existing = this._findActiveByDedupe(key)
        if (existing) {
            return existing
        }

        f.status = isDestructive ? 'pending_approval' : 'pending_send'
        return logger.insert(f)
    },

    /**
     * Perform the POST for a row in `approved`/`pending_send`. Re-checks every
     * guard; a destructive row without a resolvable approval is refused to
     * `error` and never sent. Called off the click thread by the reconciler.
     * @param {String} rowSysId
     * @return {Boolean} whether a state change was written
     */
    send: function (rowSysId) {
        var config = this._config
        var logger = this._logger
        var row = logger.get(rowSysId)
        if (!row) {
            return false
        }
        var status = row.getValue('status')
        if (status !== 'pending_send' && status !== 'approved') {
            return false
        }

        if (!config.areActionsEnabled()) {
            return logger.update(rowSysId, { status: 'canceled', error_reason: 'Outbound actions disabled' })
        }

        var action = row.getValue('action')
        var deviceType = row.getValue('device_type')
        var isDestructive = this._truthy(row.getValue('is_destructive'))
        var payload = this._parse(row.getValue('action_payload'))

        if (isDestructive) {
            if (!config.areDestructiveActionsEnabled()) {
                return logger.update(rowSysId, { status: 'error', error_reason: 'Destructive actions globally disabled (x_912401_jamf_pro.actions.destructive.enabled = false)' })
            }
            if (!this._hasValidApproval(row)) {
                return logger.update(rowSysId, { status: 'error', error_reason: 'Missing or invalid approval — destructive command refused at send' })
            }
            if (this._inFlightConflict(row)) {
                return logger.update(rowSysId, { status: 'error', error_reason: 'Another non-terminal destructive command is in flight for this device' })
            }
        }

        if (action === 'GROUP_ERASE') {
            var guardErr = this._groupEraseGuard(payload)
            if (guardErr) {
                return logger.update(rowSysId, { status: 'error', error_reason: guardErr })
            }
        }

        // Managed-state guard: refuse acting on an already-unmanaged device.
        if (this._isUnmanaged(row) && action !== 'RENEW_PROFILE') {
            return logger.update(rowSysId, { status: 'error', error_reason: 'Device is not managed (x_912401_jamf_pro_device.managed = false)' })
        }

        // Capture the PIN BEFORE the POST (crash-safe) for brick-class actions.
        var pin = null
        if (this._needsPin(action, deviceType)) {
            pin = row.getValue('unlock_pin')
            if (!pin) {
                pin = this._generatePin()
                logger.update(rowSysId, { unlock_pin: pin })
            }
        }

        // Dry-run short-circuit — log intent, no POST.
        if (config.isDryRun()) {
            return logger.update(rowSysId, { status: 'dry_run', http_status: 0, error_reason: '' })
        }

        var resp
        try {
            resp = this._dispatch(row, action, deviceType, payload, pin)
        } catch (e) {
            return logger.update(rowSysId, { status: 'error', error_reason: 'Send failed: ' + this._msg(e) })
        }

        var httpStatus = (resp && resp.httpStatus) ? resp.httpStatus : 0
        var patch = { http_status: httpStatus, date_sent: this._now() }
        if (httpStatus >= 200 && httpStatus < 300) {
            var uuid = this._extractUuid(resp.body)
            if (uuid) {
                patch.jamf_command_uuid = uuid
            }
            // blank-push (reconcile none) is terminal on 2xx; everything else waits.
            patch.status = (row.getValue('reconcile_mode') === 'none') ? 'acknowledged' : 'sent'
        } else {
            patch.status = 'error'
            patch.error_reason = 'Jamf returned HTTP ' + httpStatus + ' ' + this._truncate(JSON.stringify(resp && resp.body), 1000)
        }
        return logger.update(rowSysId, patch)
    },

    // ---- dispatch ---------------------------------------------------------

    _dispatch: function (row, action, deviceType, payload, pin) {
        var client = this._client
        var mid = row.getValue('target_management_id')
        var jid = row.getValue('target_jamf_id')
        var udid = row.getValue('target_udid')

        switch (action) {
            case 'BLANK_PUSH':
                return client.blankPush([mid])
            case 'DEVICE_LOCK':
                var lock = { commandType: 'DEVICE_LOCK' }
                if (deviceType === 'computer') {
                    lock.pin = pin
                } else {
                    if (payload && payload.message) { lock.message = payload.message }
                    if (payload && payload.phoneNumber) { lock.phoneNumber = payload.phoneNumber }
                }
                return client.sendCommands([mid], lock)
            case 'CLEAR_PASSCODE':
                return client.sendCommands([mid], { commandType: 'CLEAR_PASSCODE' })
            case 'RESTART_DEVICE':
                return client.sendCommands([mid], { commandType: 'RESTART_DEVICE' })
            case 'SHUT_DOWN_DEVICE':
                return client.sendCommands([mid], { commandType: 'SHUT_DOWN_DEVICE' })
            case 'ENABLE_LOST_MODE':
                return client.sendCommands([mid], this._extend({ commandType: 'ENABLE_LOST_MODE' }, payload))
            case 'DISABLE_LOST_MODE':
                return client.sendCommands([mid], { commandType: 'DISABLE_LOST_MODE' })
            case 'PLAY_LOST_MODE_SOUND':
                return client.sendCommands([mid], { commandType: 'PLAY_LOST_MODE_SOUND' })
            case 'ERASE_DEVICE':
                var erase = { commandType: 'ERASE_DEVICE' }
                if (deviceType === 'computer' && pin) { erase.pin = pin }
                return client.sendCommands([mid], erase)
            case 'REDEPLOY_FRAMEWORK':
                return client.redeployFramework(jid)
            case 'MACOS_UPDATE':
                return client.sendMacosUpdates([jid], payload)
            case 'UPDATE_PLAN_DEVICES':
                return client.createUpdatePlanDevices([jid], payload)
            case 'UPDATE_PLAN_GROUP':
                return client.createUpdatePlanGroup(payload && payload.groupId, payload)
            case 'DEPLOY_PACKAGE':
                return client.deployPackage([jid], payload)
            case 'COMPUTER_ERASE':
                return client.eraseComputer(jid, pin)
            case 'COMPUTER_REMOVE_MDM':
                return client.removeMdmComputer(jid)
            case 'MOBILE_ERASE':
                return client.eraseMobile(jid, payload)
            case 'MOBILE_UNMANAGE':
                return client.unmanageMobile(jid)
            case 'GROUP_ERASE':
                return client.eraseMobileGroup(payload && payload.groupId)
            case 'RENEW_PROFILE':
                return client.renewProfile([udid])
            default:
                throw new Error('Unknown action: ' + action)
        }
    },

    // ---- guards / helpers -------------------------------------------------

    _isDestructive: function (action, deviceType, payload) {
        var m = this._meta[action]
        if (!m) {
            return false
        }
        if (m.destructive === true) {
            return true
        }
        if (m.destructive === 'computer') {
            return deviceType === 'computer'
        }
        if (m.destructive === 'conditional') {
            return !!(payload && this._truthy(payload.forceRestart))
        }
        return false
    },

    _needsPin: function (action, deviceType) {
        if (action === 'COMPUTER_ERASE') {
            return true
        }
        if (action === 'DEVICE_LOCK' && deviceType === 'computer') {
            return true
        }
        if (action === 'ERASE_DEVICE' && deviceType === 'computer') {
            return true
        }
        return false
    },

    _generatePin: function () {
        var s = ''
        for (var i = 0; i < 6; i++) {
            s += String(Math.floor(Math.random() * 10))
        }
        return s
    },

    _dedupeKey: function (ci, action, payload) {
        var windowMs = 5 * 60 * 1000
        var bucket = Math.floor(new Date().getTime() / windowMs)
        var raw = String(ci) + '|' + String(action) + '|' + JSON.stringify(payload || {}) + '|' + bucket
        var h = 5381
        for (var i = 0; i < raw.length; i++) {
            h = ((h << 5) + h) + raw.charCodeAt(i)
            h = h & 0xffffffff
        }
        return 'd' + (h >>> 0).toString(16)
    },

    _findActiveByDedupe: function (key) {
        var gr = new GlideRecord(this.TABLE)
        gr.addQuery('dedupe_key', key)
        gr.addQuery('status', 'IN', 'requested,pending_approval,approved,pending_send,sent,not_now')
        gr.setLimit(1)
        gr.query()
        return gr.next() ? String(gr.getUniqueValue()) : ''
    },

    _hasValidApproval: function (row) {
        var approvedBy = row.getValue('approved_by')
        var approvalId = row.getValue('approval')
        if (!approvedBy || !approvalId) {
            return false
        }
        var ga = new GlideRecord('sysapproval_approver')
        if (!ga.get(approvalId)) {
            return false
        }
        return ga.getValue('state') === 'approved'
    },

    _inFlightConflict: function (row) {
        var dev = row.getValue('device')
        if (!dev) {
            return false
        }
        var gr = new GlideRecord(this.TABLE)
        gr.addQuery('device', dev)
        gr.addQuery('is_destructive', true)
        gr.addQuery('sys_id', '!=', row.getUniqueValue())
        gr.addQuery('status', 'IN', 'pending_send,approved,sent,not_now')
        gr.setLimit(1)
        gr.query()
        return gr.next()
    },

    _groupEraseGuard: function (payload) {
        var max = this._config.getGroupEraseMax()
        if (max <= 0) {
            return 'Group erase is disabled (x_912401_jamf_pro.command.group_erase_max = 0)'
        }
        var groupId = payload && payload.groupId
        if (!groupId) {
            return 'Group erase requires payload.groupId'
        }
        try {
            var resp = this._client.getMobileGroupMembership(groupId)
            var count = this._memberCount(resp && resp.body)
            if (count > max) {
                return 'Group erase refused: ' + count + ' devices exceeds group_erase_max ' + max
            }
        } catch (e) {
            return 'Group erase membership check failed: ' + this._msg(e)
        }
        return ''
    },

    _memberCount: function (body) {
        if (!body) {
            return 0
        }
        if (typeof body.count === 'number') {
            return body.count
        }
        if (body.mobileDevices && body.mobileDevices.length) {
            return body.mobileDevices.length
        }
        if (body.results && body.results.length) {
            return body.results.length
        }
        return 0
    },

    _isUnmanaged: function (row) {
        var dev = row.getValue('device')
        if (!dev) {
            return false
        }
        var gr = new GlideRecord('x_912401_jamf_pro_device')
        if (!gr.get(dev)) {
            return false
        }
        return !this._truthy(gr.getValue('managed'))
    },

    _redactPayload: function (payload) {
        var clone = {}
        if (!payload) {
            return clone
        }
        var secrets = { pin: true, PIN: true, password: true, unlockToken: true, recoveryPassword: true, recoveryLockPassword: true, autoAdminPassword: true }
        for (var k in payload) {
            if (!payload.hasOwnProperty(k)) {
                continue
            }
            clone[k] = secrets[k] ? '***' : payload[k]
        }
        return clone
    },

    _extractUuid: function (body) {
        if (!body) {
            return ''
        }
        if (body.commandUuid) {
            return body.commandUuid
        }
        if (body.uuid) {
            return body.uuid
        }
        if (body.id) {
            return String(body.id)
        }
        return ''
    },

    _resolveDevice: function (request) {
        var gr = new GlideRecord('x_912401_jamf_pro_device')
        if (request.device) {
            return gr.get(request.device) ? gr : null
        }
        if (request.ci) {
            gr.addQuery('ci', request.ci)
            if (request.deviceType) {
                gr.addQuery('device_type', request.deviceType)
            }
            gr.setLimit(1)
            gr.query()
            return gr.next() ? gr : null
        }
        return null
    },

    _extend: function (base, extra) {
        if (extra) {
            for (var k in extra) {
                if (extra.hasOwnProperty(k) && k !== 'groupId') {
                    base[k] = extra[k]
                }
            }
        }
        return base
    },

    _parse: function (s) {
        if (!s) {
            return {}
        }
        try {
            return JSON.parse(s)
        } catch (e) {
            return {}
        }
    },

    _truthy: function (v) {
        return v === true || v === 'true' || v === '1' || v === 1
    },

    _now: function () {
        return new GlideDateTime().getValue()
    },

    _nowPlusHours: function (h) {
        var gdt = new GlideDateTime()
        gdt.add(h * 60 * 60 * 1000)
        return gdt.getValue()
    },

    _truncate: function (str, max) {
        if (str === null || typeof str === 'undefined') {
            return ''
        }
        var s = String(str)
        return s.length <= max ? s : s.substring(0, max)
    },

    _msg: function (e) {
        return (e && e.message) ? e.message : String(e)
    },

    type: 'JamfCommandService',
}
