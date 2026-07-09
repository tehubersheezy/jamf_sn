/**
 * Script Include class file: Glide APIs auto-available — do NOT import. ES5 only
 * (Class.create, no ES6, `var` only). `type` must match the class + fluent name.
 *
 * JamfCommandClient — thin semantic HTTP verbs for outbound Jamf actions
 * (OUTBOUND_PLAN §4.1). Composes JamfApiClient (which owns all sn_ws usage) and
 * holds the endpoint knowledge. Every verb returns JamfApiClient.post()/get()'s
 * { httpStatus, body } (or the parsed GET body) — it never interprets state.
 */
var JamfCommandClient = Class.create()

JamfCommandClient.prototype = {
    initialize: function (config, apiClient) {
        this._config = config
        this._api = apiClient || new x_912401_jamf_pro.JamfApiClient(config)
    },

    // --- /v2/mdm command queue (keyed on managementId) ---------------------

    /** POST /v2/mdm/commands for a list of managementIds with one commandData. */
    sendCommands: function (managementIds, commandData) {
        var clientData = []
        for (var i = 0; i < managementIds.length; i++) {
            clientData.push({ managementId: managementIds[i] })
        }
        return this._api.post('/v2/mdm/commands', { clientData: clientData, commandData: commandData })
    },

    /** POST /v2/mdm/blank-push — wake devices to check in. */
    blankPush: function (managementIds) {
        return this._api.post('/v2/mdm/blank-push', { clientManagementIds: managementIds })
    },

    // --- dedicated endpoints ----------------------------------------------

    /** POST /v1/mdm/renew-profile (keyed on udid). */
    renewProfile: function (udids) {
        return this._api.post('/v1/mdm/renew-profile', { udids: udids })
    },

    /** POST /v1/computer-inventory/{id}/erase — pin required on Intel Macs. */
    eraseComputer: function (jamfId, pin) {
        var body = pin ? { pin: pin } : {}
        return this._api.post('/v1/computer-inventory/' + jamfId + '/erase', body)
    },

    /** POST /v1/computer-inventory/{id}/remove-mdm-profile — unmanage a Mac. */
    removeMdmComputer: function (jamfId) {
        return this._api.post('/v1/computer-inventory/' + jamfId + '/remove-mdm-profile', null)
    },

    /** POST /v1/jamf-management-framework/redeploy/{id}. */
    redeployFramework: function (jamfId) {
        return this._api.post('/v1/jamf-management-framework/redeploy/' + jamfId, null)
    },

    /** POST /v1/macos-managed-software-updates/send-updates. */
    sendMacosUpdates: function (deviceIds, opts) {
        var body = this._clone(opts)
        body.deviceIds = deviceIds // TODO confirm deviceIds vs computerIds against Postman
        return this._api.post('/v1/macos-managed-software-updates/send-updates', body)
    },

    /** POST /v1/managed-software-updates/plans (devices). */
    createUpdatePlanDevices: function (deviceIds, opts) {
        var body = this._clone(opts)
        body.deviceIds = deviceIds // TODO confirm plan payload shape against Postman
        return this._api.post('/v1/managed-software-updates/plans', body)
    },

    /** POST /v1/managed-software-updates/plans/group. */
    createUpdatePlanGroup: function (groupId, opts) {
        var body = this._clone(opts)
        body.groupId = groupId // TODO confirm group plan payload shape against Postman
        return this._api.post('/v1/managed-software-updates/plans/group', body)
    },

    /** POST /v1/deploy-package?verbose=true. */
    deployPackage: function (deviceIds, opts) {
        var body = this._clone(opts)
        body.deviceIds = deviceIds // TODO confirm deploy-package field name against Postman
        return this._api.post('/v1/deploy-package?verbose=true', body)
    },

    /** POST /v2/mobile-devices/{id}/erase. */
    eraseMobile: function (jamfId, opts) {
        return this._api.post('/v2/mobile-devices/' + jamfId + '/erase', opts || {})
    },

    /** POST /v2/mobile-devices/{id}/unmanage. */
    unmanageMobile: function (jamfId) {
        return this._api.post('/v2/mobile-devices/' + jamfId + '/unmanage', null)
    },

    /** POST /v2/mobile-device-groups/{id}/erase — extreme blast radius. */
    eraseMobileGroup: function (groupId) {
        return this._api.post('/v2/mobile-device-groups/' + groupId + '/erase', null)
    },

    // --- reads (reconciliation / guards) ----------------------------------

    /** GET /v2/mdm/commands?filter=<rsql> — command status/history. */
    getCommands: function (rsqlFilter) {
        return { httpStatus: 200, body: this._api.get('/v2/mdm/commands', { 'page-size': 100, 'sort': 'dateSent:asc', 'filter': rsqlFilter }) }
    },

    /** GET /v1/mobile-device-groups/{id} — membership count for the erase guard. */
    getMobileGroupMembership: function (groupId) {
        return { httpStatus: 200, body: this._api.get('/v1/mobile-device-groups/' + groupId, {}) }
    },

    _clone: function (o) {
        var out = {}
        if (o) {
            for (var k in o) {
                if (o.hasOwnProperty(k)) {
                    out[k] = o[k]
                }
            }
        }
        return out
    },

    type: 'JamfCommandClient',
}
