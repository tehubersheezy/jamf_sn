/**
 * Script Include class file: Glide APIs (gs, GlideRecord, GlideDateTime, ...)
 * are auto-available in this execution context — do NOT import them here.
 * ES5 only (Class.create / Object.extendsObject, no ES6 classes, no arrow
 * functions, var only). `type` must match the class name and the `name` in the
 * fluent definition exactly.
 *
 * JamfComputerMapper — maps a Jamf Pro computers-inventory record into an IRE
 * payload fragment (items + fragment-local relations) suitable for
 * sn_cmdb.IdentificationEngine.createOrUpdateCIEnhanced. Extends
 * x_912401_jamf_pro.JamfMapperBase for the shared mapping helpers.
 */
var JamfComputerMapper = Class.create()

JamfComputerMapper.prototype = Object.extendsObject(x_912401_jamf_pro.JamfMapperBase, {

    /**
     * A computer is mappable only if it carries a hardware serial number.
     * Devices without a serial are counted as skipped by the caller, not
     * errored.
     */
    canMap: function (device) {
        return !!this._val(device, 'hardware.serialNumber')
    },

    /**
     * Build the IRE fragment for a single Jamf computer.
     * Returns { items: [...], relations: [...] } with fragment-local item
     * indices (item 0 is always the computer), or null when !canMap.
     */
    map: function (device) {
        if (!this.canMap(device)) {
            return null
        }

        var serial = this._val(device, 'hardware.serialNumber')
        var lastContact = this._val(device, 'general.lastContactTime')

        // Native key: prefer the stable udid, fall back to the numeric id.
        // In the computers-inventory schema udid is a top-level field (sibling
        // of id/general); older/other shapes nest it under general — try both.
        var udid = this._val(device, 'udid') || this._val(device, 'general.udid')
        var nativeKey = udid ? udid : this._val(device, 'id')

        var values = {
            os: 'macOS',
            manufacturer: 'Apple Inc.'
        }
        this._put(values, 'name', this._val(device, 'general.name'))
        this._put(values, 'serial_number', serial)
        this._put(values, 'os_version', this._val(device, 'operatingSystem.version'))
        this._put(values, 'ram', this._val(device, 'hardware.totalRamMegabytes'))
        this._put(values, 'cpu_name', this._val(device, 'hardware.processorType'))
        this._put(values, 'cpu_type', this._val(device, 'hardware.processorArchitecture'))
        this._put(values, 'cpu_core_count', this._val(device, 'hardware.coreCount'))
        this._put(values, 'cpu_count', this._val(device, 'hardware.processorCount'))
        this._put(values, 'disk_space', this._computeDiskSpaceGb(device))
        this._put(values, 'mac_address', this._val(device, 'hardware.macAddress'))
        // model_id carries the display string; IRE resolves/creates the
        // cmdb_model + cmdb_hardware_manufacturer references from it, matching
        // ServiceNow's own SG-Jamf connector behavior.
        this._put(values, 'model_id', this._val(device, 'hardware.model'))
        this._put(values, 'last_discovered', this._formatDateTime(lastContact))

        // assigned_to only when explicitly enabled and uniquely resolvable.
        if (this._config && this._config.isAssignedToMappingEnabled()) {
            var email = this._val(device, 'userAndLocation.email')
            if (email) {
                var userSysId = this._resolveUserByEmail(email)
                if (userSysId) {
                    values.assigned_to = userSysId
                }
            }
        }

        var items = []
        var relations = []

        items.push({
            className: 'cmdb_ci_computer',
            values: values,
            lookup: this._serialLookup(serial),
            sys_object_source_info: this._buildSourceInfo(nativeKey, 'computers', lastContact)
        })

        // Network adapters: en0 (primary MAC) + en1 (alt MAC) when present.
        var primaryMac = this._val(device, 'hardware.macAddress')
        if (primaryMac) {
            items.push(this._adapterItem('en0', primaryMac))
            relations.push({ parent: 0, child: items.length - 1, type: 'Owns::Owned by' })
        }
        var altMac = this._val(device, 'hardware.altMacAddress')
        if (altMac) {
            items.push(this._adapterItem('en1', altMac))
            relations.push({ parent: 0, child: items.length - 1, type: 'Owns::Owned by' })
        }

        return { items: items, relations: relations }
    },

    /**
     * Primary storage disk size in GB (rounded), derived from the first disk
     * reporting a sizeMegabytes value in the STORAGE section. Returns '' when
     * no disk size is available.
     */
    _computeDiskSpaceGb: function (device) {
        var disks = this._val(device, 'storage.disks')
        if (!disks || !disks.length) {
            return ''
        }
        var sizeMb = 0
        for (var i = 0; i < disks.length; i++) {
            var s = disks[i] ? disks[i].sizeMegabytes : null
            if (s) {
                sizeMb = s
                break
            }
        }
        if (!sizeMb) {
            return ''
        }
        return String(Math.round(sizeMb / 1024))
    },

    /**
     * Set values[key] = String(val) only when val is a non-empty, defined
     * value — keeps empty Jamf fields out of the IRE payload so they never
     * clobber existing CI attributes.
     */
    _put: function (values, key, val) {
        if (val === null || val === undefined || val === '') {
            return
        }
        values[key] = String(val)
    },

    type: 'JamfComputerMapper'
})
