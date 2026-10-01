# JAMF PRO — Implementation Plan

> Recovered from CLI session `c857593e` (Plan subagent `agent-a1cdd135eb6ccd4f7`), 2026-07-08.
> Original task: consume the Jamf Pro API and create a suite of Script Includes to populate the CMDB via the IRE engine.

All conventions and SDK type signatures are now verified directly from the starter repo and the installed `@servicenow/sdk` 4.8.1 / `sdk-core` type definitions (Property `password2` type confirmed; `CrossScopePrivilege` shape confirmed; `ScheduledScript` accepts string scripts, `frequency: 'daily'`, `executionTime` confirmed; column functions incl. `IntegerColumn`, `DateTimeColumn`, `Password2Column` confirmed). Here is the implementation plan.

---

# Implementation Plan: JAMF PRO (`x_912401_jamf_pro`, now-sdk 4.8.1)

## 1. Project scaffold & full file tree

Scaffold (Phase 0, run in `/Users/abey/Projects/jamf_sn`):

```bash
pnpm exec now-sdk auth --add <dev-instance-url>   # if not already authenticated
npx @servicenow/sdk@4.8.1 init --appName "JAMF PRO" \
    --packageName jamf-cmdb-connector --scopeName x_912401_jamf_pro --template base
```

Then align `package.json` with the starter: devDeps `@servicenow/sdk: 4.8.1` + `@servicenow/glide: 27.0.5`, `imports: {"#now:*": "./@types/servicenow/fluent/*/index.js"}`, scripts `build` / `build:ci --frozenKeys` / `deploy` / `types` / `transform`. Copy the starter's `CLAUDE.md`, `.claude/settings.json` (build-on-edit hook, keys.ts edit-block hook), and `.gitignore`.

```
/Users/abey/Projects/jamf_sn
├── now.config.json                          # {scope:"x_912401_jamf_pro", scopeId:<generated>, name:"JAMF PRO"}
├── package.json
├── .gitignore
├── CLAUDE.md
├── .claude/settings.json
├── src/
│   ├── fluent/
│   │   ├── generated/keys.ts                # build-generated ledger — committed, never hand-edited
│   │   ├── roles/roles.now.ts               # x_912401_jamf_pro.admin role
│   │   ├── tables/import-run.now.ts         # x_912401_jamf_pro_import_run
│   │   ├── acls/import-run-acls.now.ts
│   │   ├── properties/jamf-properties.now.ts
│   │   ├── script-includes/
│   │   │   ├── jamf-config.now.ts
│   │   │   ├── jamf-api-client.now.ts
│   │   │   ├── jamf-mapper-base.now.ts
│   │   │   ├── jamf-computer-mapper.now.ts
│   │   │   ├── jamf-mobile-device-mapper.now.ts
│   │   │   ├── jamf-ire-gateway.now.ts
│   │   │   ├── jamf-run-logger.now.ts
│   │   │   └── jamf-sync-runner.now.ts
│   │   ├── scheduled-scripts/daily-sync.now.ts
│   │   ├── records/discovery-source-choice.now.ts   # sys_choice on cmdb_ci.discovery_source
│   │   ├── privileges/cross-scope.now.ts
│   │   └── navigation/app-menu.now.ts
│   └── scripts/
│       └── script-includes/
│           ├── JamfConfig.js
│           ├── JamfApiClient.js
│           ├── JamfMapperBase.js
│           ├── JamfComputerMapper.js
│           ├── JamfMobileDeviceMapper.js
│           ├── JamfIreGateway.js
│           ├── JamfRunLogger.js
│           └── JamfSyncRunner.js
```

Every `.now.ts` file starts with `import '@servicenow/sdk/global'`. No `src/server/` modules are needed — the scheduled script uses an inline one-liner string (see §4), which is cleaner than a typed module for a single constructor call and avoids the ES-module/Glide-import machinery entirely.

## 2. Script Include suite (all ES5 `Class.create()` in `src/scripts/script-includes/`)

All are `accessibleFrom: 'package_private'`, `clientCallable: false`, fluent `name` === class name === `type` property. No ES6 class syntax, no arrow functions; `var` only; Glide APIs ambient (never imported).

### 2.1 `JamfConfig` — property access + validation
Single source of truth for `gs.getProperty` reads; every other class takes a config instance.

- `initialize()` — no-op
- `getBaseUrl()` → `x_912401_jamf_pro.base_url`, trailing `/` stripped
- `getClientId()`, `getClientSecret()` — secret via `gs.getProperty('x_912401_jamf_pro.client_secret')` (password2 properties decrypt when read from their own scope — verify in Phase 2, see Risks)
- `getPageSize()` (int, default 100, clamped 1–200 per Jamf max), `getBatchSize()` (int, default 200 devices), `getRetentionDays()` (default 90)
- `getDiscoverySource()` → `x_912401_jamf_pro.discovery_source`, default `'JamfPro'`
- `isSyncEnabled()`, `isComputersEnabled()`, `isMobileEnabled()`, `isVerbose()`, `isAssignedToMappingEnabled()`
- `getMobileDetailMode()` → `'bulk'` | `'per_device'`
- `validate()` → array of missing required property names (`base_url`, `client_id`, `client_secret`); empty array = OK
- `debug(msg)` — `gs.info` gated on `isVerbose()`

### 2.2 `JamfApiClient` — OAuth + generic paginated HTTP
Owns all `sn_ws.RESTMessageV2` usage. No REST Message records, no connection aliases.

- `initialize(config)` — stores config; `this._token = null; this._tokenExpiresAt = 0;`
- `_fetchToken()` — `RESTMessageV2()` direct-endpoint: POST `{base}/api/oauth/token`, header `Content-Type: application/x-www-form-urlencoded`, body `grant_type=client_credentials&client_id=...&client_secret=...` (values `encodeURIComponent`ed). Parses `{access_token, expires_in}`; caches token with expiry `now + (expires_in - 60)s`. Throws `Error('Jamf token request failed: HTTP <status> <body first 500 chars>')` on non-200.
- `_getToken()` — returns cached token or calls `_fetchToken()`
- `invalidateToken()` — clears cache
- `get(path, params)` — GET `{base}{path}` with `Authorization: Bearer` + `Accept: application/json`; query params appended (encoded). On **401: invalidate token, re-fetch, retry exactly once**. Returns parsed JSON object on 2xx; throws on anything else (message includes status + truncated body). 404 is thrown with a distinguishable `err.httpStatus = 404` marker property so callers can implement fallback (mobile bulk-detail probe).
- `getAllPages(path, params, onPage)` — Jamf-style pagination: `page` starting at 0, `page-size` from config, `sort` from params. Loop: fetch page → if `results` empty, stop; call `onPage(results)`; stop when accumulated ≥ `totalCount` (captured on first page) **or** `results.length < pageSize` **or** hard cap of 1000 pages (drift guard). Returns total fetched count. Callback style keeps memory bounded — pages are mapped and released, never accumulated.

### 2.3 `JamfMapperBase` — shared mapping helpers
Both mappers do `Object.extendsObject(x_912401_jamf_pro.JamfMapperBase, {...})`.

- `initialize(config)`
- `_buildSourceInfo(nativeKey, feed, recencyIso)` → `{source_name: config.getDiscoverySource(), source_native_key: String(nativeKey), source_feed: feed, source_recency_timestamp: <formatted>}`
- `_formatDateTime(isoString)` — Jamf ISO-8601 (`2026-07-01T10:22:33Z`) → `'yyyy-MM-dd HH:mm:ss'` UTC via `GlideDateTime`; returns `''` on unparseable input
- `_serialLookup(serial)` → `[{className:'cmdb_serial_number', values:{serial_number: serial, serial_number_type:'system', valid:'true'}}]`
- `_adapterItem(name, mac)` → network adapter item `{className:'cmdb_ci_network_adapter', values:{name: name, mac_address: mac}}`
- `_resolveUserByEmail(email)` — GlideRecord on `sys_user` (email, active) returning sys_id or `''`; caches results in `this._userCache` for the run; only invoked when `isAssignedToMappingEnabled()`
- `_val(obj, path)` — safe nested getter (`_val(d, 'hardware.serialNumber')`)

### 2.4 `JamfComputerMapper` — Jamf computer inventory → IRE fragment
- `canMap(device)` → truthy `hardware.serialNumber` (devices without serials are counted as skipped, not errored)
- `map(device)` → **fragment** `{items:[...], relations:[...]}` with fragment-local indices, or `null` if `!canMap`:
  - Item 0, `className: 'cmdb_ci_computer'`, `values`: `name` (general.name), `serial_number` (hardware.serialNumber), `os: 'macOS'`, `os_version` (operatingSystem.version), `ram` (hardware.totalRamMegabytes), `cpu_name` (hardware.processorType), `cpu_type` (hardware.processorArchitecture), `cpu_core_count` (hardware.coreCount), `cpu_count` (hardware.processorCount), `disk_space` (primary storage disk MB / 1024, rounded), `mac_address` (hardware.macAddress), `manufacturer: 'Apple Inc.'`, `model_id` (hardware.model — display string; IRE resolves/creates model & manufacturer references from display values, same as ServiceNow's own Jamf SGC), `last_discovered` (formatted general.lastContactTime), `assigned_to` (resolved sys_id, only if enabled and uniquely matched by userAndLocation.email)
  - `lookup`: `_serialLookup(serial)`
  - `sys_object_source_info`: native key = `udid` (fallback `id`), feed `'computers'`, recency = general.lastContactTime
  - Items 1..n: `_adapterItem('en0', hardware.macAddress)` and `_adapterItem('en1', hardware.altMacAddress)` when present; `relations`: `{parent:0, child:i, type:'Owns::Owned by'}` per adapter. Empty/missing MACs skipped.

### 2.5 `JamfMobileDeviceMapper` — mobile device detail → IRE fragment
- `canMap(device)` → truthy serialNumber
- `map(device)` → fragment: Item 0 `className: 'cmdb_ci_handheld_computing'`, `values`: `name`, `serial_number`, `os` (`'iOS'`/`'iPadOS'` from device type/model, default `'iOS'`), `os_version`, `imei`, `meid`, `phone_number`, `disk_space` (capacityMb/1024), `model_id` (model display string), `manufacturer: 'Apple Inc.'`, `last_discovered` (lastInventoryUpdate). Serial lookup + source info (feed `'mobile_devices'`, native key `udid`/`id`). Wifi MAC → one related `cmdb_ci_network_adapter` + `Owns::Owned by` relation.
- Field names differ between Jamf list/detail/bulk-detail payloads — mapper reads both spellings (`osVersion` vs `operatingSystemVersion` etc.) via `_val` fallbacks; flagged for verification.

### 2.6 `JamfIreGateway` — batching + `createOrUpdateCIEnhanced`
Streaming batcher; the only class that touches `sn_cmdb`.

- `initialize(config)` — `reset()`
- `reset()` — `this._items = []; this._relations = []; this._deviceCount = 0;` stats zeroed
- `add(fragment)` — offsets fragment relation indices by `this._items.length`, appends items/relations, `_deviceCount++`. Auto-`flush()` when `_deviceCount >= config.getBatchSize()` **or** `_items.length >= 450` (hard safety under the 500-item IRE cap, since adapters inflate item count)
- `flush()` — no-op when empty; builds `{items, relations}`, calls:
  `sn_cmdb.IdentificationEngine.createOrUpdateCIEnhanced(this._config.getDiscoverySource(), JSON.stringify(payload), {deduplicate_payloads: true, partial_payloads: true, partial_commits: true, generate_summary: false})` — parses returned JSON string; per result item tallies `operation` INSERT/UPDATE/NO_CHANGE into `this._stats.inserts/updates/noChange`; items with `errorCount > 0` increment `errors` and push up to 20 total `errorDetails` strings (`className + sysId/native key + first error message`). A thrown exception from IRE marks the whole batch's device count as errors and records the message. Clears buffers, keeps stats.
- `getStats()` → `{devicesSubmitted, inserts, updates, noChange, errors, errorDetails:[...]}`

### 2.7 `JamfRunLogger` — `x_912401_jamf_pro_import_run` writer
- `start(runType)` — inserts record (`status:'running'`, `started: now`, `run_type`), keeps sys_id; returns this
- `markStaleRuns()` — before starting: any record `status=running` with `started < 6h ago` → `status='failed'`, message `'Marked stale by subsequent run'`
- `isAnotherRunActive()` — `status=running` and `started >= 6h ago` exists
- `setFetched(deviceType, n)` — writes `computers_fetched` / `mobile_fetched`
- `addIreStats(stats)` — accumulates inserts/updates/no_change/errors counters and error details
- `addError(msg)` — appends to error detail buffer, bumps error flag
- `skip(reason)` — inserts a record directly in `status:'skipped'` with message (used for disabled/mutex cases; keeps an audit trail)
- `complete()` — sets `ended`, flushes counters, `error_detail` (joined, truncated to field length), final `status`: `failed` (nothing succeeded / fatal), `completed_with_errors` (errors > 0), else `completed`
- `cleanupOldRuns(days)` — deletes runs older than retention

### 2.8 `JamfSyncRunner` — orchestrator (the scheduled-script entry point)
- `initialize(overrides)` — `overrides` optional object `{config, client, gateway, logger, computerMapper, mobileMapper}`; anything not supplied is constructed (`new x_912401_jamf_pro.JamfConfig()` etc.). **This DI seam is the test strategy** — a background script can inject a fake client returning fixture JSON.
- `run(runType)` — full flow:
  1. `config.validate()` → if missing props: `logger.skip('Missing configuration: ...')`, return
  2. `!config.isSyncEnabled()` → `logger.skip('Sync disabled via x_912401_jamf_pro.sync.enabled')`, return
  3. `logger.markStaleRuns()`; `logger.isAnotherRunActive()` → `logger.skip('Another run in progress')`, return
  4. `logger.start(runType)`
  5. `try { this._syncComputers(); } catch(e) { logger.addError('computers: ' + e.message); }` — then same for mobile. Per-type isolation: a computers failure never blocks mobile.
  6. `logger.complete(); logger.cleanupOldRuns(config.getRetentionDays());`
  Everything wrapped in an outer try/catch that force-completes the run record as `failed` (a run record must never be left `running` by an exception).
- `_syncComputers()` — if disabled, return. `gateway.reset()`; `client.getAllPages('/api/v1/computers-inventory', {'sort':'id:asc','section':['GENERAL','HARDWARE','OPERATING_SYSTEM','USER_AND_LOCATION','STORAGE']}, onPage)` where `onPage` maps each device (`mapper.canMap` → `gateway.add(mapper.map(d))`, else skip counter, dedupe by device id in a seen-map to guard pagination drift); `gateway.flush()`; `logger.setFetched('computers', total)`; `logger.addIreStats(gateway.getStats())`.
- `_syncMobileDevices()` — mode `'bulk'`: try `getAllPages('/api/v2/mobile-devices/detail', {'section':['GENERAL','HARDWARE'],'sort':'mobileDeviceId:asc'})`; on `err.httpStatus === 404` (endpoint absent on older Jamf) fall back to per-device mode. Per-device mode: `getAllPages('/api/v2/mobile-devices', ...)`, then for each id `client.get('/api/v2/mobile-devices/' + id + '/detail')` (N+1 — acceptable for typical fleets; flagged in Risks). Same map/add/flush/log tail as computers.

## 3. Fluent artifact inventory

### 3.1 Table — `src/fluent/tables/import-run.now.ts`
`export const x_912401_jamf_pro_import_run = Table({ name: 'x_912401_jamf_pro_import_run', label: 'Jamf Import Run', allowWebServiceAccess: true, schema: {...} })`:

| column | type | notes |
|---|---|---|
| `run_type` | StringColumn choices `{scheduled:'Scheduled', manual:'Manual', test:'Test'}` | dropdown_without_none |
| `status` | StringColumn choices `{running, completed, completed_with_errors, failed, skipped}` | default `running` |
| `started` | DateTimeColumn | display field |
| `ended` | DateTimeColumn | |
| `computers_fetched` | IntegerColumn | default 0 |
| `mobile_fetched` | IntegerColumn | default 0 |
| `inserts` / `updates` / `no_change` / `errors` | IntegerColumn ×4 | IRE aggregate tallies |
| `message` | StringColumn maxLength 1000 | skip reason / summary |
| `error_detail` | StringColumn maxLength 8000 | multi-line (≥255 renders textarea); truncated join of first ~20 IRE errors |

### 3.2 Properties — `src/fluent/properties/jamf-properties.now.ts`
All with `roles: {read:[adminRole], write:[adminRole]}` (secret especially):

| name | type | default |
|---|---|---|
| `x_912401_jamf_pro.base_url` | string | `''` (e.g. `https://yourorg.jamfcloud.com`) |
| `x_912401_jamf_pro.client_id` | string | `''` |
| `x_912401_jamf_pro.client_secret` | **password2** | `''` |
| `x_912401_jamf_pro.sync.enabled` | boolean | `true` (master kill switch) |
| `x_912401_jamf_pro.sync.computers.enabled` | boolean | `true` |
| `x_912401_jamf_pro.sync.mobile_devices.enabled` | boolean | `true` |
| `x_912401_jamf_pro.page_size` | integer | `100` |
| `x_912401_jamf_pro.ire.batch_size` | integer | `200` (devices per IRE call; item hard cap 450 enforced in code) |
| `x_912401_jamf_pro.discovery_source` | string | `JamfPro` |
| `x_912401_jamf_pro.mobile.detail_mode` | string | `bulk` (`bulk` \| `per_device`) |
| `x_912401_jamf_pro.map_assigned_to` | boolean | `false` |
| `x_912401_jamf_pro.run_log.retention_days` | integer | `90` |
| `x_912401_jamf_pro.log.verbose` | boolean | `false` |

**Discovery source decision: `JamfPro`.** ServiceNow's Service Graph connector owns `SG-Jamf`; bare `Jamf` invites confusion with it in reports. `JamfPro` is unambiguous and clearly third-party. Overridable by property, but the shipped sys_choice is `JamfPro`.

### 3.3 Role & ACLs
- `roles/roles.now.ts`: `export const adminRole = Role({ name: 'x_912401_jamf_pro.admin', description: ... })`
- `acls/import-run-acls.now.ts`: record ACLs on `x_912401_jamf_pro_import_run` — read: `[adminRole]`; create/write: `[adminRole]` (runtime writes come from server-side scoped script and bypass ACLs); delete: `[adminRole]`.

### 3.4 Discovery source choice — `records/discovery-source-choice.now.ts`
```ts
Record({
  $id: Now.ID['discovery-source-jamfpro'],
  table: 'sys_choice',
  data: { name: 'cmdb_ci', element: 'discovery_source', value: 'JamfPro',
          label: 'JamfPro', language: 'en', inactive: false, sequence: 100 },
})
```
(Choice on a foreign table shipped as app data; verify it lands on deploy — fallback noted in Risks.)

### 3.5 Cross-scope privileges — `privileges/cross-scope.now.ts`
Exactly one is required up front:
```ts
CrossScopePrivilege({
  $id: Now.ID['xsp-ire-execute'],
  operation: 'execute', status: 'allowed',
  targetName: 'sn_cmdb.IdentificationEngine',
  targetScope: 'sn_cmdb', targetType: 'scriptable',
})
```
Not needed: `sn_ws.RESTMessageV2` (available to all scopes without privilege), `gs.getProperty`, `GlideDateTime`, read of `sys_user` (global tables default-readable from scoped script). CMDB writes happen inside IRE's own context, not ours. **Verification step**: after the first end-to-end run, check `sys_scope_privilege` for any auto-created `requested` rows; if the instance demanded more (e.g. `sys_user` read on hardened instances), set them to allowed and `pnpm run transform` to pull them into source.

### 3.6 Scheduled script — `scheduled-scripts/daily-sync.now.ts`
```ts
ScheduledScript({
  $id: Now.ID['daily-sync-job'],
  name: 'Jamf CMDB Daily Sync',
  frequency: 'daily',
  executionTime: '02:00:00',   // verify TimeOfDay literal via: pnpm exec now-sdk explain scheduled-script
  timeZone: 'floating',
  active: true,
  script: "new x_912401_jamf_pro.JamfSyncRunner().run('scheduled');",
})
```
Decision: **inline string, not a server module**. The SDK accepts both; a module buys type-checking for a one-line constructor call but adds an entire `src/server` module pipeline for zero logic. The string runs in-scope, so `package_private` script includes resolve. Manual runs = "Execute Now" on the job form, or a scoped background script `new x_912401_jamf_pro.JamfSyncRunner().run('manual');`.

### 3.7 Navigation — `navigation/app-menu.now.ts`
`ApplicationMenu` "JAMF PRO" (`roles: [adminRole]`, `active: true`) + `sys_app_module` Records (all `active: true`):
- "Import Runs" — LIST on `x_912401_jamf_pro_import_run`, order 100
- "Properties" — LIST on `sys_properties`, filter `nameSTARTSWITHx_912401_jamf_pro.`, order 200
- "Scheduled Sync" — LIST on `sysauto_script`, filter `nameSTARTSWITHJamf CMDB`, order 300

### 3.8 Script include fluent defs — `script-includes/*.now.ts`
Eight files, one per class, each exactly like the starter pattern: `$id: Now.ID['JamfConfig']`, `name` = class name, `script: Now.include('../../scripts/script-includes/JamfConfig.js')`, `clientCallable: false`, `accessibleFrom: 'package_private'`.

## 4. Error-handling strategy (consolidated)

| failure | handling |
|---|---|
| Missing config | `validate()` fails → run recorded as `skipped` with missing-property list; no HTTP attempted |
| Token request fails | Exception with status+body → per-type catch → `failed`/`completed_with_errors`, detail in run log |
| 401 mid-run (token expiry/revocation) | Client invalidates cache, re-fetches token, retries the GET once; second 401 throws |
| Jamf 5xx / network | Exception thrown from `get()`; aborts that device type only; other type still runs |
| Pagination drift (records added/removed mid-run) | `sort=id:asc`, stop on empty/short page, 1000-page hard cap, per-run seen-id dedupe map |
| Device unmappable (no serial) | Skipped + counted, not errored |
| IRE per-item errors | `partial_payloads` + `partial_commits` = good items commit; error items tallied to `errors`, first 20 details persisted to `error_detail` |
| IRE call throws | Batch's device count added to errors, message logged, sync continues with next batch |
| Overlapping runs | Mutex via run-log query (`status=running`, started <6h); stale `running` rows auto-marked `failed` by next run |
| Kill switch | `x_912401_jamf_pro.sync.enabled=false` → `skipped` run record (auditable) |
| Crash safety | Outer try/catch in `run()` force-finalizes the run record — never left `running` |

## 5. Implementation order (each phase builds & deploys green)

1. **Phase 0 — scaffold**: auth, `sdk init` (scope `x_912401_jamf_pro`), align package.json/CLAUDE.md/settings, `pnpm run build && pnpm run deploy` (empty app). Confirm scope creates cleanly (see Risk #1).
2. **Phase 1 — data layer**: role, table, ACLs, properties, app menu, discovery-source choice. Build/deploy; verify table + properties + `cmdb_ci.discovery_source` choice on instance; commit `keys.ts`.
3. **Phase 2 — config + logging**: `JamfConfig.js`, `JamfRunLogger.js` + fluent defs. Deploy; scoped background script (scope picker = JAMF PRO): set dummy secret, assert `gs.getProperty('x_912401_jamf_pro.client_secret')` returns plaintext (password2 check), exercise `start/complete/skip`.
4. **Phase 3 — HTTP client**: `JamfApiClient.js`. Deploy; background-script token fetch + one `getAllPages` against real Jamf (or mock base_url, §Verification).
5. **Phase 4 — mappers + IRE**: `JamfMapperBase/JamfComputerMapper/JamfMobileDeviceMapper/JamfIreGateway` + cross-scope privilege. Deploy; background script feeds one hand-written sample device JSON through `mapper.map` → `gateway.add/flush` → assert `cmdb_ci_computer` created, `discovery_source=JamfPro`, `cmdb_serial_number` entry, adapter + `cmdb_rel_ci` relation. Re-run → `NO_CHANGE`.
6. **Phase 5 — orchestrator + schedule**: `JamfSyncRunner.js`, scheduled script. Deploy; Execute Now; verify run record counters vs CMDB.
7. **Phase 6 — hardening pass**: mutex/stale/retention paths, verbose logging, README (setup: Jamf API role grants needed for the client — Read Computers, Read Mobile Devices), `pnpm run transform` sweep for any instance-side `requested` privileges.

**Verification without a real Jamf instance** — two layers: (a) *no HTTP at all*: the DI seam — background script builds `{ get:function(p,q){...fixtures...}, getAllPages:function(...){...} }` fake client, `new x_912401_jamf_pro.JamfSyncRunner({client: fake}).run('test')`, then asserts run-log counters and CMDB records; (b) *HTTP path*: point `x_912401_jamf_pro.base_url` at a mock (Beeceptor/mockoon, or a scripted REST API in a throwaway scope on the same instance serving the fixture JSON for `/api/oauth/token`, `/api/v1/computers-inventory`, `/api/v2/mobile-devices*`).

## 6. Risks & open questions

1. **Scope name `x_912401_jamf_pro`**: instances normally enforce `x_<vendorprefix>_<name>`; `sdk init` validates against the instance vendor prefix. If rejected, the confirmed name needs revisiting — surface immediately in Phase 0.
2. **password2 same-scope read**: expected to decrypt via `gs.getProperty` from `x_912401_jamf_pro`; verified in Phase 2 before anything depends on it. Fallback: `GlideRecord` on `sys_properties` + `getDecryptedValue()` (same-scope).
3. **Jamf mobile bulk detail** (`/api/v2/mobile-devices/detail`) exists only on newer Jamf Pro; handled by 404 fallback to per-device, but per-device is N+1 (slow >2k devices). Field-name differences between bulk/detail payloads need verification against a live tenant.
4. **`executionTime`/TimeOfDay literal format** — confirm via `pnpm exec now-sdk explain scheduled-script` before writing the fluent file.
5. **sys_choice on cmdb_ci from app scope** — should deploy as app data; if the platform blocks it, fallback is a one-time fix script or documented manual choice creation.
6. **IRE reference resolution** (`model_id`/`manufacturer` as display strings) — matches SG-connector behavior, but first live run should confirm no `identificationAttempts` errors; if so, pre-create `cmdb_model` via related items.
7. **Coexistence with ServiceNow's SG-Jamf connector**: if a customer later installs it, two discovery sources will feed the same CIs — reconciliation/precedence rules (`cmdb_reconciliation_definition`) are out of scope but should be documented in the README.
8. **Jamf API rate limits** — no throttling in v1; if 429s appear, add a retry-after sleep in `JamfApiClient.get`.

### Critical Files for Implementation
- /Users/abey/Projects/jamf_sn/src/scripts/script-includes/JamfSyncRunner.js
- /Users/abey/Projects/jamf_sn/src/scripts/script-includes/JamfApiClient.js
- /Users/abey/Projects/jamf_sn/src/scripts/script-includes/JamfIreGateway.js
- /Users/abey/Projects/jamf_sn/src/fluent/tables/import-run.now.ts
- /Users/abey/Projects/jamf_sn/src/fluent/properties/jamf-properties.now.ts

(Reference conventions verified in: /Users/abey/Projects/now-sdk-perfect-starter/CLAUDE.md, src/fluent/*, and node_modules/@servicenow/sdk-core/dist/{app/CrossScopePrivilege.d.ts, sys/ScheduledScript.d.ts, fluent/tables/sys_properties.now.d.ts}.)
