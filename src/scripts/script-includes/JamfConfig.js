/**
 * Script Include class file: Glide APIs (gs, GlideRecord, GlideDateTime, ...) are
 * auto-available in this execution context — do NOT import them here. ES5 only
 * (Class.create, no ES6 classes, no arrow functions, `var` only). `type` must
 * match the class name and the `name` in the fluent definition exactly.
 *
 * JamfConfig — single source of truth for all system-property reads. Every other
 * Jamf class takes a JamfConfig instance so property names live in exactly one
 * place. Scope: x_912401_jamf_pro.
 *
 *   var config = new x_912401_jamf_pro.JamfConfig();
 *   var missing = config.validate();
 */
var JamfConfig = Class.create()

JamfConfig.prototype = {
    initialize: function () {
        // no-op — all reads are lazy against gs.getProperty
    },

    /**
     * @return {string} base_url with any trailing slashes stripped (may be '')
     */
    getBaseUrl: function () {
        var url = this._getString('x_912401_jamf_pro.base_url', '')
        // strip one or more trailing slashes so callers can safely append paths
        return url.replace(/\/+$/, '')
    },

    /**
     * @return {string} OAuth client id
     */
    getClientId: function () {
        return this._getString('x_912401_jamf_pro.client_id', '')
    },

    /**
     * @return {string} OAuth client secret (password2 property — decrypts when
     *   read from its own scope via gs.getProperty)
     */
    getClientSecret: function () {
        return this._getString('x_912401_jamf_pro.client_secret', '')
    },

    /**
     * @return {number} Jamf page size, default 100, clamped to Jamf's 1..200 max
     */
    getPageSize: function () {
        var n = this._getInt('x_912401_jamf_pro.page_size', 100)
        if (n < 1) {
            n = 1
        }
        if (n > 200) {
            n = 200
        }
        return n
    },

    /**
     * @return {number} devices per IRE batch, default 200
     */
    getBatchSize: function () {
        var n = this._getInt('x_912401_jamf_pro.ire.batch_size', 200)
        if (n < 1) {
            n = 1
        }
        return n
    },

    /**
     * @return {number} run-log retention window in days, default 90
     */
    getRetentionDays: function () {
        var n = this._getInt('x_912401_jamf_pro.run_log.retention_days', 90)
        if (n < 0) {
            n = 0
        }
        return n
    },

    /**
     * @return {string} CMDB discovery source name, default 'JamfPro'
     */
    getDiscoverySource: function () {
        var src = this._getString('x_912401_jamf_pro.discovery_source', '')
        if (src === '') {
            return 'JamfPro'
        }
        return src
    },

    /**
     * @return {string} 'bulk' | 'per_device' (mobile detail fetch strategy)
     */
    getMobileDetailMode: function () {
        var mode = this._getString('x_912401_jamf_pro.mobile.detail_mode', '').toLowerCase()
        if (mode === 'per_device') {
            return 'per_device'
        }
        return 'bulk'
    },

    /**
     * @return {boolean} master kill switch
     */
    isSyncEnabled: function () {
        return this._getBool('x_912401_jamf_pro.sync.enabled', true)
    },

    /**
     * @return {boolean} computer inventory sync enabled
     */
    isComputersEnabled: function () {
        return this._getBool('x_912401_jamf_pro.sync.computers.enabled', true)
    },

    /**
     * @return {boolean} mobile device sync enabled
     */
    isMobileEnabled: function () {
        return this._getBool('x_912401_jamf_pro.sync.mobile_devices.enabled', true)
    },

    /**
     * @return {boolean} verbose gs.info logging enabled
     */
    isVerbose: function () {
        return this._getBool('x_912401_jamf_pro.log.verbose', false)
    },

    /**
     * @return {boolean} whether to resolve/populate assigned_to from Jamf user email
     */
    isAssignedToMappingEnabled: function () {
        return this._getBool('x_912401_jamf_pro.map_assigned_to', false)
    },

    // ---- outbound action config (OUTBOUND_PLAN §4.3) ----------------------

    /**
     * @return {boolean} master outbound kill switch (default false = OFF)
     */
    areActionsEnabled: function () {
        return this._getBool('x_912401_jamf_pro.actions.enabled', false)
    },

    /**
     * @return {boolean} coarse global gate for destructive/catastrophic actions
     *   (in addition to the per-request approval enforced in JamfCommandService)
     */
    areDestructiveActionsEnabled: function () {
        return this._getBool('x_912401_jamf_pro.actions.destructive.enabled', false)
    },

    /**
     * @return {boolean} when true, requests are logged as dry_run and NOT POSTed
     */
    isDryRun: function () {
        return this._getBool('x_912401_jamf_pro.actions.dry_run', true)
    },

    /**
     * @return {number} max managementIds per /v2/mdm/commands POST, default 50
     */
    getCommandBatchSize: function () {
        var n = this._getInt('x_912401_jamf_pro.command.batch_size', 50)
        if (n < 1) {
            n = 1
        }
        return n
    },

    /**
     * @return {number} hours before a non-terminal command row is expired, default 72
     */
    getCommandExpiryHours: function () {
        var n = this._getInt('x_912401_jamf_pro.command.expiry_hours', 72)
        if (n < 1) {
            n = 1
        }
        return n
    },

    /**
     * @return {number} max group size erasable; 0 (default) = group erase disabled
     */
    getGroupEraseMax: function () {
        var n = this._getInt('x_912401_jamf_pro.command.group_erase_max', 0)
        if (n < 0) {
            n = 0
        }
        return n
    },

    /**
     * @return {number} reconciler cadence in minutes, default 10
     */
    getCommandReconcileIntervalMin: function () {
        var n = this._getInt('x_912401_jamf_pro.command.reconcile_interval_min', 10)
        if (n < 1) {
            n = 1
        }
        return n
    },

    /**
     * Validates that all required properties are set.
     * @return {Array} names of missing required properties; empty array = OK
     */
    validate: function () {
        var missing = []
        if (this.getBaseUrl() === '') {
            missing.push('x_912401_jamf_pro.base_url')
        }
        if (this.getClientId() === '') {
            missing.push('x_912401_jamf_pro.client_id')
        }
        if (this.getClientSecret() === '') {
            missing.push('x_912401_jamf_pro.client_secret')
        }
        return missing
    },

    /**
     * Emits a gs.info message only when verbose logging is enabled.
     * @param {string} msg
     */
    debug: function (msg) {
        if (this.isVerbose()) {
            gs.info('[JamfConfig] ' + msg)
        }
    },

    // ---- internal helpers -------------------------------------------------

    /**
     * @return {string} trimmed property value, or defaultValue when unset/null
     */
    _getString: function (name, defaultValue) {
        var v = gs.getProperty(name, defaultValue)
        if (v === null || v === undefined) {
            return defaultValue
        }
        return String(v).trim()
    },

    /**
     * @return {number} integer property value, or defaultValue when unparseable
     */
    _getInt: function (name, defaultValue) {
        var raw = this._getString(name, '')
        if (raw === '') {
            return defaultValue
        }
        var n = parseInt(raw, 10)
        if (isNaN(n)) {
            return defaultValue
        }
        return n
    },

    /**
     * Interprets a boolean-ish property. 'true'/'1'/'yes'/'on' => true,
     * 'false'/'0'/'no'/'off' => false, anything else => defaultValue.
     * @return {boolean}
     */
    _getBool: function (name, defaultValue) {
        var raw = this._getString(name, '').toLowerCase()
        if (raw === '') {
            return defaultValue
        }
        if (raw === 'true' || raw === '1' || raw === 'yes' || raw === 'on') {
            return true
        }
        if (raw === 'false' || raw === '0' || raw === 'no' || raw === 'off') {
            return false
        }
        return defaultValue
    },

    type: 'JamfConfig',
}
