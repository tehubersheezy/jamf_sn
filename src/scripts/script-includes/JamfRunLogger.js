/**
 * Script Include class file: Glide APIs (gs, GlideRecord, GlideDateTime, ...) are
 * auto-available in this execution context — do NOT import them here. ES5 only
 * (Class.create, no ES6 classes, no arrow functions, var only). `type` must match
 * the class name and the `name` in the fluent definition exactly.
 *
 * JamfRunLogger — writer/reader for the x_912401_jamf_pro_import_run run-log table.
 * One instance per sync run. Accumulates IRE + error stats in memory and
 * persists them to a single run record (start -> ...updates... -> complete).
 */
var JamfRunLogger = Class.create()

JamfRunLogger.TABLE = 'x_912401_jamf_pro_import_run'
JamfRunLogger.STALE_SECONDS = 6 * 60 * 60 // runs older than 6h stuck in 'running' are stale
JamfRunLogger.MAX_ERROR_DETAILS = 20 // keep only the first N error strings
JamfRunLogger.MAX_ERROR_DETAIL_LEN = 8000 // matches error_detail column maxLength

JamfRunLogger.prototype = {
    initialize: function () {
        this._sysId = ''
        this._inserts = 0
        this._updates = 0
        this._noChange = 0
        this._errors = 0
        this._errorDetails = []
    },

    /**
     * Insert a fresh run record in 'running' state and remember its sys_id.
     * Returns this for chaining.
     */
    start: function (runType) {
        var gr = new GlideRecord(JamfRunLogger.TABLE)
        gr.initialize()
        gr.setValue('run_type', runType || 'scheduled')
        gr.setValue('status', 'running')
        gr.setValue('started', this._nowValue())
        gr.setValue('computers_fetched', 0)
        gr.setValue('mobile_fetched', 0)
        gr.setValue('inserts', 0)
        gr.setValue('updates', 0)
        gr.setValue('no_change', 0)
        gr.setValue('errors', 0)
        this._sysId = gr.insert()
        return this
    },

    /**
     * Any 'running' record whose start time is older than the stale threshold is
     * a leaked run (process died mid-flight); flip it to 'failed' so it does not
     * hold the mutex forever.
     */
    markStaleRuns: function () {
        var cutoff = this._cutoffValue(JamfRunLogger.STALE_SECONDS)
        var gr = new GlideRecord(JamfRunLogger.TABLE)
        gr.addQuery('status', 'running')
        gr.addQuery('started', '<', cutoff)
        gr.query()
        while (gr.next()) {
            gr.setValue('status', 'failed')
            gr.setValue('message', 'Marked stale by subsequent run')
            gr.setValue('ended', this._nowValue())
            gr.update()
        }
    },

    /**
     * True when a genuinely-active run exists: 'running' and started within the
     * stale window. Used as a mutex to prevent overlapping syncs.
     */
    isAnotherRunActive: function () {
        var cutoff = this._cutoffValue(JamfRunLogger.STALE_SECONDS)
        var gr = new GlideRecord(JamfRunLogger.TABLE)
        gr.addQuery('status', 'running')
        gr.addQuery('started', '>=', cutoff)
        if (this._sysId) {
            gr.addQuery('sys_id', '!=', this._sysId)
        }
        gr.query()
        return gr.getRowCount() > 0
    },

    /**
     * Persist the fetched-device count for a device type onto the run record.
     * deviceType: 'computers' | 'mobile' (or 'mobile_devices').
     */
    setFetched: function (deviceType, n) {
        if (!this._sysId) {
            return
        }
        var field = deviceType === 'computers' ? 'computers_fetched' : 'mobile_fetched'
        var gr = new GlideRecord(JamfRunLogger.TABLE)
        if (gr.get(this._sysId)) {
            gr.setValue(field, parseInt(n, 10) || 0)
            gr.update()
        }
    },

    /**
     * Accumulate a JamfIreGateway stats object into the in-memory tallies.
     * stats: {devicesSubmitted, inserts, updates, noChange, errors, errorDetails}
     */
    addIreStats: function (stats) {
        if (!stats) {
            return
        }
        this._inserts += this._num(stats.inserts)
        this._updates += this._num(stats.updates)
        this._noChange += this._num(stats.noChange)
        this._errors += this._num(stats.errors)
        if (stats.errorDetails && stats.errorDetails.length) {
            for (var i = 0; i < stats.errorDetails.length; i++) {
                this._pushError(stats.errorDetails[i])
            }
        }
    },

    /**
     * Record a free-form error, bumping the error counter and buffering the
     * message for the error_detail field.
     */
    addError: function (msg) {
        this._errors++
        this._pushError(msg)
    },

    /**
     * Insert a standalone 'skipped' record (disabled sync / mutex / missing
     * config). Keeps an audit trail without a full run lifecycle.
     * @param {String} reason human-readable skip reason
     * @param {String} [runType] the invocation type; defaults to 'scheduled'
     *   so a skipped manual/test run is not misrecorded.
     * Returns this for chaining.
     */
    skip: function (reason, runType) {
        var gr = new GlideRecord(JamfRunLogger.TABLE)
        gr.initialize()
        gr.setValue('run_type', runType || 'scheduled')
        gr.setValue('status', 'skipped')
        gr.setValue('started', this._nowValue())
        gr.setValue('ended', this._nowValue())
        gr.setValue('message', this._truncate(String(reason || ''), 1000))
        this._sysId = gr.insert()
        return this
    },

    /**
     * Finalize the run: write counters, joined error detail, ended timestamp,
     * and the terminal status derived from the tallies.
     */
    complete: function () {
        if (!this._sysId) {
            return
        }
        var gr = new GlideRecord(JamfRunLogger.TABLE)
        if (!gr.get(this._sysId)) {
            return
        }
        gr.setValue('ended', this._nowValue())
        gr.setValue('inserts', this._inserts)
        gr.setValue('updates', this._updates)
        gr.setValue('no_change', this._noChange)
        gr.setValue('errors', this._errors)
        if (this._errorDetails.length) {
            var joined = this._errorDetails.join('\n')
            gr.setValue('error_detail', this._truncate(joined, JamfRunLogger.MAX_ERROR_DETAIL_LEN))
        }
        gr.setValue('status', this._finalStatus())
        gr.update()
    },

    /**
     * Delete run records whose start time is older than the retention window.
     */
    cleanupOldRuns: function (days) {
        var d = parseInt(days, 10)
        if (isNaN(d) || d <= 0) {
            return
        }
        var cutoff = this._cutoffValue(d * 24 * 60 * 60)
        var gr = new GlideRecord(JamfRunLogger.TABLE)
        gr.addQuery('started', '<', cutoff)
        gr.query()
        gr.deleteMultiple()
    },

    // --- internals -------------------------------------------------------

    _finalStatus: function () {
        var successCount = this._inserts + this._updates + this._noChange
        if (this._errors > 0 && successCount === 0) {
            return 'failed'
        }
        if (this._errors > 0) {
            return 'completed_with_errors'
        }
        return 'completed'
    },

    _pushError: function (msg) {
        if (msg === null || typeof msg === 'undefined') {
            return
        }
        if (this._errorDetails.length >= JamfRunLogger.MAX_ERROR_DETAILS) {
            return
        }
        this._errorDetails.push(String(msg))
    },

    _num: function (v) {
        var n = parseInt(v, 10)
        return isNaN(n) ? 0 : n
    },

    _nowValue: function () {
        return new GlideDateTime().getValue()
    },

    _cutoffValue: function (secondsAgo) {
        var gdt = new GlideDateTime()
        gdt.addSeconds(-1 * secondsAgo)
        return gdt.getValue()
    },

    _truncate: function (str, len) {
        var s = String(str)
        if (s.length <= len) {
            return s
        }
        return s.substring(0, len)
    },

    type: 'JamfRunLogger',
}
