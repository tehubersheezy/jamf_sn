/**
 * Script Include class file: Glide APIs auto-available — do NOT import. ES5 only
 * (Class.create, no ES6, `var` only). `type` must match the class + fluent name.
 *
 * JamfCommandReconciler — the periodic job body (OUTBOUND_PLAN §6). Three passes:
 *   1. send  — POST rows in approved/pending_send (keeps POST off the click
 *              thread; send() re-checks approval on destructive rows).
 *   2. poll  — advance sent/not_now rows via GET /v2/mdm/commands (uuid mode).
 *   3. expiry — non-terminal rows past date_expires become expired.
 * A coarse property-based lock prevents overlapping passes from double-sending.
 *
 *   new x_912401_jamf_pro.JamfCommandReconciler().run();
 */
var JamfCommandReconciler = Class.create()

JamfCommandReconciler.prototype = {
    TABLE: 'x_912401_jamf_pro_command_log',
    LOCK_PROP: 'x_912401_jamf_pro.command.reconcile_lock',

    initialize: function (overrides) {
        overrides = overrides || {}
        this._config = overrides.config || new x_912401_jamf_pro.JamfConfig()
        this._service = overrides.service || new x_912401_jamf_pro.JamfCommandService({ config: this._config })
        this._client = overrides.client || new x_912401_jamf_pro.JamfCommandClient(this._config)
        this._logger = overrides.logger || new x_912401_jamf_pro.JamfCommandLogger(this._config)
    },

    run: function () {
        if (!this._config.areActionsEnabled()) {
            this._config.debug('Reconciler: outbound actions disabled; skipping')
            return
        }
        if (!this._acquireLock()) {
            this._config.debug('Reconciler: another pass is active; skipping')
            return
        }
        try {
            this._sendPass()
            this._pollPass()
            this._expiryPass()
        } finally {
            this._releaseLock()
        }
    },

    _sendPass: function () {
        var gr = new GlideRecord(this.TABLE)
        gr.addQuery('status', 'IN', 'approved,pending_send')
        gr.query()
        while (gr.next()) {
            this._service.send(String(gr.getUniqueValue()))
        }
    },

    _pollPass: function () {
        var gr = new GlideRecord(this.TABLE)
        gr.addQuery('status', 'IN', 'sent,not_now')
        gr.addQuery('reconcile_mode', 'uuid')
        gr.addQuery('jamf_command_uuid', '!=', '')
        gr.query()
        while (gr.next()) {
            this._pollOne(gr)
        }
        // reconcile_mode 'effect' rows are confirmed by the next inbound sync
        // (device dropped from managed inventory) — see OUTBOUND_PLAN §6; not
        // polled here in v1.
    },

    _pollOne: function (gr) {
        var sysId = String(gr.getUniqueValue())
        var patch = {
            last_polled: this._now(),
            poll_attempts: parseInt(gr.getValue('poll_attempts') || '0', 10) + 1,
        }
        try {
            var resp = this._client.getCommands('uuid=="' + gr.getValue('jamf_command_uuid') + '"')
            var st = this._statusFromCommands(resp && resp.body)
            if (st) {
                patch.status = st
                if (st === 'acknowledged') {
                    patch.date_acknowledged = this._now()
                }
                if (st === 'error') {
                    patch.error_reason = 'Jamf reported command Error'
                }
            }
        } catch (e) {
            patch.error_reason = 'Poll failed: ' + ((e && e.message) ? e.message : String(e))
        }
        this._logger.update(sysId, patch)
    },

    _expiryPass: function () {
        var gr = new GlideRecord(this.TABLE)
        gr.addQuery('status', 'IN', 'requested,pending_approval,approved,pending_send,sent,not_now')
        gr.addQuery('date_expires', '<', this._now())
        gr.query()
        while (gr.next()) {
            this._logger.update(String(gr.getUniqueValue()), {
                status: 'expired',
                error_reason: 'Expired before acknowledgement',
            })
        }
    },

    _statusFromCommands: function (body) {
        var results = (body && body.results) ? body.results : []
        if (!results.length) {
            return ''
        }
        var s = results[0].status || results[0].state
        if (s === 'Acknowledged') {
            return 'acknowledged'
        }
        if (s === 'Error') {
            return 'error'
        }
        if (s === 'NotNow') {
            return 'not_now'
        }
        if (s === 'Pending') {
            return 'sent'
        }
        return ''
    },

    // Coarse mutex via a scoped property timestamp (stale window < cadence).
    _acquireLock: function () {
        var now = new Date().getTime()
        var prev = parseInt(gs.getProperty(this.LOCK_PROP, '0'), 10)
        if (!isNaN(prev) && prev > 0 && (now - prev) < (9 * 60 * 1000)) {
            return false
        }
        gs.setProperty(this.LOCK_PROP, String(now))
        return true
    },

    _releaseLock: function () {
        gs.setProperty(this.LOCK_PROP, '0')
    },

    _now: function () {
        return new GlideDateTime().getValue()
    },

    type: 'JamfCommandReconciler',
}
