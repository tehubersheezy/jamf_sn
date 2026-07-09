/**
 * JamfMobileDeviceMapper — maps a single Jamf Pro mobile-device payload to an
 * IRE fragment ({items, relations}) targeting cmdb_ci_handheld_computing.
 *
 * Script Include class file: Glide APIs (gs, GlideRecord, GlideDateTime, ...)
 * are auto-available in this execution context — do NOT import them. ES5 only
 * (Class.create / Object.extendsObject, var only, no ES6/arrow syntax).
 * `type` must match the class name and the fluent `name` exactly.
 *
 * Extends JamfMapperBase (shared helpers: _val, _buildSourceInfo,
 * _formatDateTime, _serialLookup, _adapterItem). Field names differ between
 * Jamf list / detail / bulk-detail payloads, so every read goes through
 * ordered _val() fallbacks (osVersion vs operatingSystemVersion, etc.).
 */
var JamfMobileDeviceMapper = Class.create()

JamfMobileDeviceMapper.prototype = Object.extendsObject(x_912401_jamf_pro.JamfMapperBase, {

    initialize: function (config) {
        // Chain to the base initializer so _config / caches are set up.
        x_912401_jamf_pro.JamfMapperBase.prototype.initialize.call(this, config)
    },

    /**
     * Return the first non-empty value found among an ordered list of dotted
     * paths, using the base _val() safe getter. '' when none resolve.
     */
    _pick: function (device, paths) {
        var i, v
        for (i = 0; i < paths.length; i++) {
            v = this._val(device, paths[i])
            if (v !== null && v !== undefined && String(v) !== '') {
                return v
            }
        }
        return ''
    },

    _getSerial: function (device) {
        return this._pick(device, ['hardware.serialNumber', 'serialNumber'])
    },

    /**
     * Native key for source-tracking: prefer UDID, fall back to the numeric id
     * under any of its known spellings.
     */
    _getNativeKey: function (device) {
        return this._pick(device, [
            'general.udid',
            'udid',
            'mobileDeviceId',
            'id',
            'general.id',
            'hardware.deviceId'
        ])
    },

    /**
     * Derive the OS name. iPad hardware runs iPadOS (13+); everything else
     * defaults to iOS. Inspect model display, model identifier and deviceType.
     */
    _deriveOs: function (device) {
        var hint = String(this._pick(device, [
            'hardware.model',
            'model',
            'hardware.modelDisplay',
            'modelDisplay',
            'hardware.modelIdentifier',
            'modelIdentifier'
        ])).toLowerCase()
        var deviceType = String(this._pick(device, [
            'deviceType',
            'general.deviceType',
            'hardware.deviceType',
            'type'
        ])).toLowerCase()
        if (hint.indexOf('ipad') !== -1 || deviceType.indexOf('ipad') !== -1) {
            return 'iPadOS'
        }
        return 'iOS'
    },

    /**
     * True when the device carries a serial number. Devices without a serial
     * are counted as skipped by the caller, not errored.
     */
    canMap: function (device) {
        if (!device) {
            return false
        }
        return String(this._getSerial(device)) !== ''
    },

    /**
     * Map one mobile device to an IRE fragment, or null when unmappable.
     * Fragment relation indices are fragment-local; the gateway offsets them.
     */
    map: function (device) {
        if (!this.canMap(device)) {
            return null
        }

        var serial = String(this._getSerial(device))
        var nativeKey = this._getNativeKey(device)
        var recency = this._pick(device, [
            'general.lastInventoryUpdate',
            'lastInventoryUpdate',
            'general.lastInventoryUpdateTimestamp',
            'lastInventoryUpdateDate'
        ])

        var name = this._pick(device, [
            'general.displayName',
            'general.name',
            'displayName',
            'name'
        ])
        var osVersion = this._pick(device, [
            'general.osVersion',
            'operatingSystemVersion',
            'osVersion',
            'general.operatingSystemVersion'
        ])
        var imei = this._pick(device, ['network.imei', 'imei'])
        var meid = this._pick(device, ['network.meid', 'meid'])
        var phoneNumber = this._pick(device, ['network.phoneNumber', 'phoneNumber'])
        var model = this._pick(device, [
            'hardware.model',
            'model',
            'hardware.modelDisplay',
            'modelDisplay'
        ])
        var capacityMb = this._pick(device, ['hardware.capacityMb', 'capacityMb'])

        var values = {
            name: String(name),
            serial_number: serial,
            os: this._deriveOs(device),
            manufacturer: 'Apple Inc.'
        }

        if (String(osVersion) !== '') {
            values.os_version = String(osVersion)
        }
        if (String(imei) !== '') {
            values.imei = String(imei)
        }
        if (String(meid) !== '') {
            values.meid = String(meid)
        }
        if (String(phoneNumber) !== '') {
            values.phone_number = String(phoneNumber)
        }
        if (String(model) !== '') {
            // model display string; IRE resolves/creates model & manufacturer
            // references from the display value.
            values.model_id = String(model)
        }
        if (String(capacityMb) !== '') {
            var cap = parseInt(capacityMb, 10)
            if (!isNaN(cap)) {
                values.disk_space = Math.round(cap / 1024)
            }
        }

        var lastDiscovered = this._formatDateTime(recency)
        if (lastDiscovered !== '') {
            values.last_discovered = lastDiscovered
        }

        var item0 = {
            className: 'cmdb_ci_handheld_computing',
            values: values,
            lookup: this._serialLookup(serial),
            sys_object_source_info: this._buildSourceInfo(nativeKey, 'mobile_devices', recency)
        }

        var items = [item0]
        var relations = []

        var wifiMac = this._pick(device, ['hardware.wifiMacAddress', 'wifiMacAddress'])
        if (String(wifiMac) !== '') {
            items.push(this._adapterItem('en0', String(wifiMac)))
            relations.push({ parent: 0, child: items.length - 1, type: 'Owns::Owned by' })
        }

        return { items: items, relations: relations }
    },

    type: 'JamfMobileDeviceMapper'
})
