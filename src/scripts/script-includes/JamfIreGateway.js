/**
 * Script Include class file: Glide APIs and sn_cmdb are auto-available in this
 * execution context — do NOT import them here. ES5 only (Class.create, no ES6
 * classes, no arrow functions, var only). `type` must match the class name and
 * the `name` in the fluent definition (JamfIreGateway) exactly.
 *
 * JamfIreGateway — streaming batcher and the only class that touches sn_cmdb.
 * Accumulates mapper fragments ({items, relations} with fragment-local indices),
 * offsets relation indices as items are appended, and flushes batches through
 * sn_cmdb.IdentificationEngine.createOrUpdateCIEnhanced. Tallies IRE per-item
 * operations and errors into run stats. See PLAN.md §2.6.
 */
var JamfIreGateway = Class.create()

JamfIreGateway.prototype = {
    // Hard safety under the 500-item IRE cap (adapters inflate item count).
    ITEM_HARD_CAP: 450,

    // Maximum number of persisted error detail strings.
    MAX_ERROR_DETAILS: 20,

    initialize: function (config) {
        this._config = config
        this.reset()
    },

    /**
     * Clears the pending buffers and zeroes all statistics. Called by
     * initialize() and by the orchestrator before each device-type sync.
     */
    reset: function () {
        this._items = []
        this._relations = []
        this._deviceCount = 0
        this._stats = {
            devicesSubmitted: 0,
            inserts: 0,
            updates: 0,
            noChange: 0,
            errors: 0,
            errorDetails: [],
        }
    },

    /**
     * Appends one device fragment to the pending batch. Relation indices in the
     * fragment are fragment-local (parent:0, child:i) and are offset by the
     * current item count so they remain valid in the combined payload.
     * Auto-flushes when the per-batch device count reaches the configured batch
     * size or the item count reaches the hard cap.
     */
    add: function (fragment) {
        if (!fragment || !fragment.items || !fragment.items.length) {
            return
        }

        var offset = this._items.length
        var i

        for (i = 0; i < fragment.items.length; i++) {
            this._items.push(fragment.items[i])
        }

        if (fragment.relations) {
            for (i = 0; i < fragment.relations.length; i++) {
                var rel = fragment.relations[i]
                this._relations.push({
                    parent: rel.parent + offset,
                    child: rel.child + offset,
                    type: rel.type,
                })
            }
        }

        this._deviceCount++
        this._stats.devicesSubmitted++

        var batchSize = this._config.getBatchSize()
        if (this._deviceCount >= batchSize || this._items.length >= this.ITEM_HARD_CAP) {
            this.flush()
        }
    },

    /**
     * Submits the pending batch to the IRE. No-op when empty. Parses the returned
     * JSON string and tallies per-item operations/errors into stats. A thrown
     * exception from the IRE marks the whole batch's device count as errors and
     * records the message. Always clears the buffers; keeps stats.
     */
    flush: function () {
        if (!this._items.length) {
            return
        }

        var payload = { items: this._items, relations: this._relations }
        var batchDeviceCount = this._deviceCount

        try {
            var responseStr = sn_cmdb.IdentificationEngine.createOrUpdateCIEnhanced(
                this._config.getDiscoverySource(),
                JSON.stringify(payload),
                {
                    deduplicate_payloads: true,
                    partial_payloads: true,
                    partial_commits: true,
                    generate_summary: false,
                }
            )
            this._tally(responseStr)
        } catch (e) {
            this._stats.errors += batchDeviceCount
            this._pushErrorDetail('IRE exception: ' + (e.message || e))
        }

        this._items = []
        this._relations = []
        this._deviceCount = 0
    },

    /**
     * Returns a snapshot of the accumulated run statistics.
     */
    getStats: function () {
        return {
            devicesSubmitted: this._stats.devicesSubmitted,
            inserts: this._stats.inserts,
            updates: this._stats.updates,
            noChange: this._stats.noChange,
            errors: this._stats.errors,
            errorDetails: this._stats.errorDetails,
        }
    },

    /**
     * Parses the IRE response string and tallies operations/errors per item.
     */
    _tally: function (responseStr) {
        var parsed
        try {
            parsed = typeof responseStr === 'string' ? JSON.parse(responseStr) : responseStr
        } catch (e) {
            this._pushErrorDetail('Unparseable IRE response: ' + (e.message || e))
            return
        }

        if (!parsed || !parsed.items) {
            return
        }

        var items = parsed.items
        var i
        for (i = 0; i < items.length; i++) {
            var item = items[i]
            var op = String(item.operation || '').toUpperCase()

            if (op === 'INSERT') {
                this._stats.inserts++
            } else if (op === 'UPDATE') {
                this._stats.updates++
            } else if (op === 'NO_CHANGE') {
                this._stats.noChange++
            }

            var errCount = item.errorCount
            if (errCount === undefined || errCount === null) {
                errCount = item.errors && item.errors.length ? item.errors.length : 0
            }

            if (errCount > 0) {
                this._stats.errors++
                var nativeKey = item.sysId || item.identifierEntrySysId || ''
                var firstMsg = ''
                if (item.errors && item.errors.length) {
                    var firstErr = item.errors[0]
                    firstMsg = firstErr.message || firstErr.error || String(firstErr)
                }
                this._pushErrorDetail((item.className || '?') + ' ' + nativeKey + ': ' + firstMsg)
            }
        }
    },

    /**
     * Appends an error detail string, capped at MAX_ERROR_DETAILS total.
     */
    _pushErrorDetail: function (msg) {
        if (this._stats.errorDetails.length < this.MAX_ERROR_DETAILS) {
            this._stats.errorDetails.push(msg)
        }
    },

    type: 'JamfIreGateway',
}
