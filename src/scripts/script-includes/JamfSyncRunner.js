/**
 * Script Include class file: Glide APIs (gs, GlideRecord, GlideDateTime, ...)
 * are auto-available in this execution context — do NOT import them here.
 * ES5 only (Class.create, no ES6 classes, no arrow functions, var only).
 * `type` must match the class name and the `name` in the fluent definition.
 *
 * JamfSyncRunner — the scheduled-script entry point / orchestrator (PLAN.md 2.8).
 * Owns the end-to-end flow: pre-flight config/mutex checks, per-device-type
 * sync (computers, mobile devices) with per-type isolation, run-log finalize,
 * and retention cleanup. All collaborators are injected via `initialize` so a
 * background script can supply fakes (the DI test seam).
 *
 *   new x_912401_jamf_pro.JamfSyncRunner().run('scheduled');
 *   new x_912401_jamf_pro.JamfSyncRunner({ client: fakeClient }).run('test');
 */
var JamfSyncRunner = Class.create()

JamfSyncRunner.prototype = {

    /**
     * @param {Object} [overrides] optional DI seam:
     *   {config, client, gateway, logger, computerMapper, mobileMapper}.
     *   Anything not supplied is constructed in-scope.
     */
    initialize: function (overrides) {
        overrides = overrides || {}

        this._config = overrides.config || new x_912401_jamf_pro.JamfConfig()
        this._client = overrides.client || new x_912401_jamf_pro.JamfApiClient(this._config)
        this._gateway = overrides.gateway || new x_912401_jamf_pro.JamfIreGateway(this._config)
        this._logger = overrides.logger || new x_912401_jamf_pro.JamfRunLogger(this._config)
        this._computerMapper = overrides.computerMapper || new x_912401_jamf_pro.JamfComputerMapper(this._config)
        this._mobileMapper = overrides.mobileMapper || new x_912401_jamf_pro.JamfMobileDeviceMapper(this._config)
        // OUTBOUND_PLAN §3: persist Jamf identifiers per device so outbound
        // actions can resolve a target. Registration is best-effort — a failure
        // must never abort the inbound sync.
        this._registry = overrides.registry || new x_912401_jamf_pro.JamfDeviceRegistry(this._config)
    },

    /**
     * Best-effort registration of a device's identifiers into x_912401_jamf_pro_device.
     * Never throws — a registry failure must not disrupt the CMDB sync.
     */
    _register: function (deviceType, device) {
        try {
            this._registry.register(deviceType, device)
        } catch (e) {
            this._config.debug('device registry upsert failed (' + deviceType + '): ' + (e && e.message ? e.message : e))
        }
    },

    /**
     * Full sync flow. Never leaves a run record in the `running` state.
     * @param {String} runType 'scheduled' | 'manual' | 'test'
     */
    run: function (runType) {
        runType = runType || 'scheduled'

        var config = this._config
        var logger = this._logger

        // --- Pre-flight checks (no run record created yet; skips are their own inserts) ---
        var missing = config.validate()
        if (missing && missing.length > 0) {
            logger.skip('Missing configuration: ' + missing.join(', '), runType)
            return
        }

        if (!config.isSyncEnabled()) {
            logger.skip('Sync disabled via x_912401_jamf_pro.sync.enabled', runType)
            return
        }

        logger.markStaleRuns()
        if (logger.isAnotherRunActive()) {
            logger.skip('Another run in progress', runType)
            return
        }

        // --- Run record opens here; outer try/catch guarantees it is finalized ---
        logger.start(runType)

        try {
            // Per-type isolation: a computers failure never blocks mobile.
            try {
                this._syncComputers()
            } catch (ce) {
                logger.addError('computers: ' + (ce && ce.message ? ce.message : ce))
            }

            try {
                this._syncMobileDevices()
            } catch (me) {
                logger.addError('mobile_devices: ' + (me && me.message ? me.message : me))
            }

            logger.complete()

            // Retention cleanup is best-effort; a failure here must not re-open the run.
            try {
                logger.cleanupOldRuns(config.getRetentionDays())
            } catch (cleanupErr) {
                config.debug('cleanupOldRuns failed: ' + (cleanupErr && cleanupErr.message ? cleanupErr.message : cleanupErr))
            }
        } catch (fatal) {
            // Crash safety: force-finalize the run record — never leave it running.
            logger.addError('fatal: ' + (fatal && fatal.message ? fatal.message : fatal))
            try {
                logger.complete()
            } catch (finalErr) {
                gs.error('JamfSyncRunner: failed to finalize run record: ' + (finalErr && finalErr.message ? finalErr.message : finalErr))
            }
        }
    },

    /**
     * Sync Jamf computer inventory into the CMDB via the IRE gateway.
     * Streaming: pages are mapped and handed to the gateway, never accumulated.
     */
    _syncComputers: function () {
        var config = this._config
        if (!config.isComputersEnabled()) {
            return
        }

        var gateway = this._gateway
        var mapper = this._computerMapper
        var logger = this._logger
        var self = this

        gateway.reset()

        var seen = {}
        var skipped = 0

        var onPage = function (results) {
            for (var i = 0; i < results.length; i++) {
                var device = results[i]

                // Guard against pagination drift (records added/removed mid-run).
                var id = self._deviceId(device)
                if (id && seen[id]) {
                    continue
                }
                if (id) {
                    seen[id] = true
                }

                if (mapper.canMap(device)) {
                    gateway.add(mapper.map(device))
                } else {
                    skipped++
                }

                // Capture outbound identifiers (managementId/id/udid/serial).
                self._register('computer', device)
            }
        }

        var total = 0
        try {
            total = this._client.getAllPages(
                '/api/v1/computers-inventory',
                {
                    'sort': 'id:asc',
                    'section': ['GENERAL', 'HARDWARE', 'OPERATING_SYSTEM', 'USER_AND_LOCATION', 'STORAGE']
                },
                onPage
            )
        } finally {
            // Always commit the last partial batch and record progress, even if
            // getAllPages threw mid-pagination: earlier batches were already
            // flushed to CMDB, so their inserts/updates must survive in the run
            // record instead of the run being reported as a total failure.
            gateway.flush()
            logger.setFetched('computers', total)
            logger.addIreStats(gateway.getStats())
        }
        config.debug('Computers sync complete: fetched=' + total + ' skipped=' + skipped)
    },

    /**
     * Sync Jamf mobile devices into the CMDB. Prefers the bulk-detail endpoint
     * and falls back to per-device detail fetches on a 404 (older Jamf Pro).
     */
    _syncMobileDevices: function () {
        var config = this._config
        if (!config.isMobileEnabled()) {
            return
        }

        var gateway = this._gateway
        var mapper = this._mobileMapper
        var logger = this._logger
        var client = this._client
        var self = this

        gateway.reset()

        var seen = {}
        var skipped = 0

        var handleDevice = function (device) {
            var id = self._deviceId(device)
            if (id && seen[id]) {
                return
            }
            if (id) {
                seen[id] = true
            }

            if (mapper.canMap(device)) {
                gateway.add(mapper.map(device))
            } else {
                skipped++
            }

            // Capture outbound identifiers (managementId/id/udid/serial).
            self._register('mobile', device)
        }

        var total = 0
        var mode = config.getMobileDetailMode()

        try {
            if (mode === 'per_device') {
                total = this._syncMobilePerDevice(handleDevice)
            } else {
                // Bulk detail mode with 404 fallback to per-device.
                try {
                    var onPage = function (results) {
                        for (var i = 0; i < results.length; i++) {
                            handleDevice(results[i])
                        }
                    }

                    total = client.getAllPages(
                        '/api/v2/mobile-devices/detail',
                        {
                            'section': ['GENERAL', 'HARDWARE'],
                            'sort': 'mobileDeviceId:asc'
                        },
                        onPage
                    )
                } catch (e) {
                    if (e && e.httpStatus === 404) {
                        // Bulk-detail endpoint absent on this Jamf version; fall back.
                        config.debug('Bulk mobile-detail endpoint returned 404; falling back to per-device mode')
                        gateway.reset()
                        seen = {}
                        skipped = 0
                        total = this._syncMobilePerDevice(handleDevice)
                    } else {
                        throw e
                    }
                }
            }
        } finally {
            // Always commit the last partial batch and record progress, even if
            // pagination/detail fetches threw mid-run: earlier batches were
            // already flushed to CMDB, so their inserts/updates must survive in
            // the run record instead of the run being reported as a failure.
            gateway.flush()
            logger.setFetched('mobile', total)
            logger.addIreStats(gateway.getStats())
        }
        config.debug('Mobile sync complete: fetched=' + total + ' skipped=' + skipped)
    },

    /**
     * Per-device mobile sync: page the list endpoint for ids, then fetch each
     * device's detail individually (N+1 — acceptable for typical fleets).
     * @param {Function} handleDevice callback that maps/adds one device
     * @returns {Number} count of devices whose detail was fetched
     */
    _syncMobilePerDevice: function (handleDevice) {
        var client = this._client
        var config = this._config
        var self = this
        var count = 0
        var fetchErrors = 0

        var onPage = function (results) {
            for (var i = 0; i < results.length; i++) {
                var listItem = results[i]
                var id = self._deviceId(listItem)
                if (!id) {
                    continue
                }

                // Per-device isolation: a device deleted between the list page
                // and its detail fetch (404) — or any single-device error — must
                // not abort the entire mobile sync. Skip it and continue.
                try {
                    var detail = client.get('/api/v2/mobile-devices/' + id + '/detail')
                    handleDevice(detail)
                    count++
                } catch (de) {
                    fetchErrors++
                    config.debug('mobile detail fetch failed for id=' + id + ': ' + (de && de.message ? de.message : de))
                }
            }
        }

        client.getAllPages('/api/v2/mobile-devices', { 'sort': 'id:asc' }, onPage)
        if (fetchErrors > 0) {
            config.debug('mobile per-device detail: ' + fetchErrors + ' fetch error(s) skipped')
        }
        return count
    },

    /**
     * Stable per-device identity for the pagination-drift dedupe map.
     * Reads the several id spellings across Jamf list/detail/bulk payloads.
     * @returns {String} the device id, or '' when none is present
     */
    _deviceId: function (device) {
        if (!device) {
            return ''
        }
        if (device.id !== undefined && device.id !== null && device.id !== '') {
            return String(device.id)
        }
        if (device.mobileDeviceId !== undefined && device.mobileDeviceId !== null && device.mobileDeviceId !== '') {
            return String(device.mobileDeviceId)
        }
        if (device.udid !== undefined && device.udid !== null && device.udid !== '') {
            return String(device.udid)
        }
        return ''
    },

    type: 'JamfSyncRunner'
}
