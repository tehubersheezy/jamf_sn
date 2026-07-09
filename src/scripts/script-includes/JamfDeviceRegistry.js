/**
 * Script Include class file: Glide APIs (gs, GlideRecord, GlideDateTime, ...) are
 * auto-available — do NOT import them. ES5 only (Class.create, no ES6 classes,
 * no arrow functions, `var` only). `type` must match the class + fluent name.
 *
 * JamfDeviceRegistry — owns x_912401_jamf_pro_device (OUTBOUND_PLAN §3). Persists the
 * three Jamf identifiers (managementId / jamf id / udid) per device so outbound
 * actions can resolve a target WITHOUT writing to the global cmdb_ci tables. The
 * raw Jamf device JSON already carries all three at inbound-fetch time; this
 * class extracts them, resolves the CI IRE just created (by serial), and upserts
 * one row per device. Keeps JamfSyncRunner thin.
 */
var JamfDeviceRegistry = Class.create()

JamfDeviceRegistry.prototype = {
    TABLE: 'x_912401_jamf_pro_device',

    initialize: function (config) {
        this._config = config || null
    },

    /**
     * Extract identifiers from a raw Jamf device object and upsert its row,
     * resolving `ci` from the CMDB by serial (the CI IRE created/updated).
     * @param {String} deviceType 'computer' | 'mobile'
     * @param {Object} raw the raw Jamf device JSON from the inbound fetch
     * @return {String} sys_id of the device row, or '' when unidentifiable
     */
    register: function (deviceType, raw) {
        var d = this._extract(deviceType, raw)
        if (!d || ((d.jamfId === null || d.jamfId === undefined || d.jamfId === '') && !d.udid)) {
            return ''
        }
        d.ciSysId = this._ciSysIdBySerial(deviceType, d.serial)
        d.managed = true
        return this.upsert(deviceType, d)
    },

    /**
     * Upsert a device row, coalescing on (jamf_id + device_type), or (udid +
     * device_type) when no jamf id is present.
     * @param {String} deviceType
     * @param {Object} d {jamfId, managementId, udid, serial, ciSysId, managed}
     * @return {String} sys_id or '' on failure
     */
    upsert: function (deviceType, d) {
        d = d || {}
        var hasJamfId = (d.jamfId !== null && d.jamfId !== undefined && d.jamfId !== '')

        var gr = new GlideRecord(this.TABLE)
        var found = false
        if (hasJamfId) {
            gr.addQuery('device_type', deviceType)
            gr.addQuery('jamf_id', d.jamfId)
            gr.query()
            found = gr.next()
        } else if (d.udid) {
            gr.addQuery('device_type', deviceType)
            gr.addQuery('udid', d.udid)
            gr.query()
            found = gr.next()
        }

        if (!found) {
            gr = new GlideRecord(this.TABLE)
            gr.initialize()
            gr.setValue('device_type', deviceType)
            if (hasJamfId) {
                gr.setValue('jamf_id', d.jamfId)
            }
        }

        if (d.ciSysId) {
            gr.setValue('ci', d.ciSysId)
        }
        if (d.managementId) {
            gr.setValue('management_id', d.managementId)
        }
        if (d.udid) {
            gr.setValue('udid', d.udid)
        }
        if (d.serial) {
            gr.setValue('serial_number', d.serial)
        }
        gr.setValue('managed', d.managed === false ? false : true)
        gr.setValue('last_seen', new GlideDateTime().getValue())

        return found ? (gr.update() ? String(gr.getUniqueValue()) : '') : String(gr.insert())
    },

    /**
     * Flip a device's managed flag (called after unmanage/erase is acknowledged).
     * @param {String} deviceRowSysId
     * @param {Boolean} managed
     */
    setManaged: function (deviceRowSysId, managed) {
        var gr = new GlideRecord(this.TABLE)
        if (gr.get(deviceRowSysId)) {
            gr.setValue('managed', managed ? true : false)
            gr.update()
        }
    },

    // ---- internal helpers -------------------------------------------------

    _extract: function (deviceType, raw) {
        if (!raw) {
            return null
        }
        if (deviceType === 'computer') {
            return {
                jamfId: this._num(raw.id),
                managementId: this._pick(raw, ['general.managementId', 'managementId']),
                udid: this._pick(raw, ['udid', 'general.udid']),
                serial: this._pick(raw, ['hardware.serialNumber', 'serialNumber']),
            }
        }
        return {
            jamfId: this._num(this._pick(raw, ['mobileDeviceId', 'id'])),
            managementId: this._pick(raw, ['managementId', 'general.managementId', 'deviceInformation.managementId']),
            udid: this._pick(raw, ['udid', 'general.udid']),
            serial: this._pick(raw, ['serialNumber', 'general.serialNumber', 'hardware.serialNumber']),
        }
    },

    _ciSysIdBySerial: function (deviceType, serial) {
        if (!serial) {
            return ''
        }
        var table = deviceType === 'computer' ? 'cmdb_ci_computer' : 'cmdb_ci_handheld_computing'
        var gr = new GlideRecord(table)
        gr.addQuery('serial_number', serial)
        gr.setLimit(1)
        gr.query()
        return gr.next() ? String(gr.getUniqueValue()) : ''
    },

    /** First non-empty value across dot-delimited candidate paths. */
    _pick: function (obj, paths) {
        for (var i = 0; i < paths.length; i++) {
            var v = this._val(obj, paths[i])
            if (v !== null && v !== undefined && v !== '') {
                return v
            }
        }
        return ''
    },

    _val: function (obj, path) {
        if (obj === null || obj === undefined || !path) {
            return undefined
        }
        var parts = String(path).split('.')
        var cur = obj
        for (var i = 0; i < parts.length; i++) {
            if (cur === null || cur === undefined) {
                return undefined
            }
            cur = cur[parts[i]]
        }
        return cur
    },

    _num: function (v) {
        if (v === null || v === undefined || v === '') {
            return null
        }
        var n = parseInt(v, 10)
        return isNaN(n) ? null : n
    },

    type: 'JamfDeviceRegistry',
}
