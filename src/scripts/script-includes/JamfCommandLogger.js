/**
 * Script Include class file: Glide APIs auto-available — do NOT import. ES5 only
 * (Class.create, no ES6, `var` only). `type` must match the class + fluent name.
 *
 * JamfCommandLogger — read/write access to x_912401_jamf_pro_command_log
 * (OUTBOUND_PLAN §4.1). Mirrors JamfRunLogger: the single place that touches the
 * audit table, so column names live in one class.
 */
var JamfCommandLogger = Class.create()

JamfCommandLogger.prototype = {
    TABLE: 'x_912401_jamf_pro_command_log',

    initialize: function (config) {
        this._config = config || null
    },

    /**
     * Insert a new command row.
     * @param {Object} f column => value map
     * @return {String} sys_id of the inserted row
     */
    insert: function (f) {
        var gr = new GlideRecord(this.TABLE)
        gr.initialize()
        this._apply(gr, f)
        return String(gr.insert())
    },

    /**
     * Patch an existing row by sys_id.
     * @return {Boolean} success
     */
    update: function (sysId, f) {
        var gr = new GlideRecord(this.TABLE)
        if (!gr.get(sysId)) {
            return false
        }
        this._apply(gr, f)
        return gr.update() ? true : false
    },

    /**
     * @return {GlideRecord|null} the positioned row, or null if not found
     */
    get: function (sysId) {
        var gr = new GlideRecord(this.TABLE)
        return gr.get(sysId) ? gr : null
    },

    _apply: function (gr, f) {
        if (!f) {
            return
        }
        for (var k in f) {
            if (f.hasOwnProperty(k) && f[k] !== undefined) {
                gr.setValue(k, f[k])
            }
        }
    },

    type: 'JamfCommandLogger',
}
