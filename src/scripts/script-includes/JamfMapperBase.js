/**
 * Script Include class file: Glide APIs (gs, GlideRecord, GlideDateTime, ...) are
 * auto-available in this execution context — do NOT import them here. ES5 only
 * (Class.create, no ES6 classes, no arrow functions, var only). `type` must match
 * the class name and the `name` in the fluent definition exactly.
 *
 * JamfMapperBase — shared mapping helpers for the Jamf → CMDB (IRE) mappers.
 * Both concrete mappers extend it:
 *   JamfComputerMapper.prototype =
 *       Object.extendsObject(x_912401_jamf_pro.JamfMapperBase, { ... });
 */
var JamfMapperBase = Class.create()

JamfMapperBase.prototype = {
    /**
     * @param {Object} config a JamfConfig instance (source of discovery source,
     *                         assigned-to toggle, etc.)
     */
    initialize: function (config) {
        this._config = config
        this._userCache = {}
    },

    /**
     * Build the sys_object_source_info block for an IRE item.
     * @param {String|Number} nativeKey Jamf-side unique key (udid / id)
     * @param {String} feed e.g. 'computers' | 'mobile_devices'
     * @param {String} recencyIso Jamf ISO-8601 timestamp for source recency
     */
    _buildSourceInfo: function (nativeKey, feed, recencyIso) {
        return {
            source_name: this._config.getDiscoverySource(),
            source_native_key: String(nativeKey),
            source_feed: feed,
            source_recency_timestamp: this._formatDateTime(recencyIso),
        }
    },

    /**
     * Convert a Jamf ISO-8601 timestamp (e.g. '2026-07-01T10:22:33Z' or
     * '2026-07-01T10:22:33.123+0000') to the ServiceNow internal UTC format
     * 'yyyy-MM-dd HH:mm:ss'. Returns '' on empty or unparseable input.
     */
    _formatDateTime: function (isoString) {
        if (!isoString) {
            return ''
        }
        try {
            var s = String(isoString)
            // Normalize: 'T' separator -> space.
            s = s.replace('T', ' ')
            // Strip fractional seconds (e.g. '.123').
            s = s.replace(/\.\d+/, '')
            s = s.replace(/^\s+|\s+$/g, '')
            // Capture the trailing zone designator ('Z' or an offset like
            // '+00:00' / '-0500') BEFORE stripping, so a non-UTC offset is
            // converted rather than silently dropped.
            var offsetMinutes = 0 // default: treat the wall clock as UTC
            var zoneMatch = s.match(/(Z|[+-]\d{2}:?\d{2})\s*$/)
            if (zoneMatch) {
                var z = zoneMatch[1]
                s = s.substring(0, zoneMatch.index).replace(/\s+$/, '')
                if (z !== 'Z') {
                    var zm = z.match(/([+-])(\d{2}):?(\d{2})/)
                    var sign = zm[1] === '-' ? -1 : 1
                    offsetMinutes = sign * (parseInt(zm[2], 10) * 60 + parseInt(zm[3], 10))
                }
            }
            if (!s) {
                return ''
            }
            var gdt = new GlideDateTime()
            gdt.setValueUTC(s, 'yyyy-MM-dd HH:mm:ss')
            if (!gdt.getValue()) {
                return ''
            }
            // The wall clock was parsed as if UTC; the true UTC instant is
            // (wall - offset). e.g. 10:00-05:00 == 15:00 UTC.
            if (offsetMinutes !== 0) {
                gdt.add(-offsetMinutes * 60 * 1000)
            }
            var out = gdt.getValue()
            return out ? out : ''
        } catch (e) {
            return ''
        }
    },

    /**
     * IRE lookup fragment keying a CI on its hardware serial number.
     * @param {String} serial
     */
    _serialLookup: function (serial) {
        return [
            {
                className: 'cmdb_serial_number',
                values: {
                    serial_number: serial,
                    serial_number_type: 'system',
                    valid: 'true',
                },
            },
        ]
    },

    /**
     * A single cmdb_ci_network_adapter IRE item.
     * @param {String} name interface name (e.g. 'en0')
     * @param {String} mac MAC address
     */
    _adapterItem: function (name, mac) {
        return {
            className: 'cmdb_ci_network_adapter',
            values: {
                name: name,
                mac_address: mac,
            },
        }
    },

    /**
     * Resolve a sys_user sys_id from an email address, only when a single active
     * user matches (ambiguous / no match -> ''). Results are memoized for the run.
     * Callers should gate this on config.isAssignedToMappingEnabled().
     * @param {String} email
     * @returns {String} sys_id or ''
     */
    _resolveUserByEmail: function (email) {
        if (!email) {
            return ''
        }
        var key = String(email).toLowerCase()
        if (this._userCache.hasOwnProperty(key)) {
            return this._userCache[key]
        }
        var resolved = ''
        var gr = new GlideRecord('sys_user')
        gr.addQuery('email', email)
        gr.addActiveQuery()
        gr.query()
        if (gr.getRowCount() === 1 && gr.next()) {
            resolved = String(gr.getUniqueValue())
        }
        this._userCache[key] = resolved
        return resolved
    },

    /**
     * Safe nested property getter. _val(d, 'hardware.serialNumber') returns the
     * value at that path or undefined if any segment is missing/null.
     * @param {Object} obj
     * @param {String} path dot-delimited path
     */
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

    type: 'JamfMapperBase',
}
