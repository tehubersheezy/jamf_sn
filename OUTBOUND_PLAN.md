# Jamf Device Actions (ServiceNow -> Jamf) — Scope & Implementation Plan

> Outbound companion to `PLAN.md` (the inbound Jamf → CMDB sync). Same app (`x_912401_jamf_pro`, "JAMF PRO"), same now-sdk 4.8.1 / `sdk-core` conventions, same ES5 `Class.create()` script-include style. Where PLAN.md **reads** Jamf into the CMDB, this plan **acts on** Jamf devices from ServiceNow: lock, wipe, restart, lost mode, software updates, unmanage, etc.
>
> Fluent artifact shapes, trigger surface, and the async lifecycle below are verified against `@servicenow/sdk-core/dist` (UiAction, BusinessRule, Flow, Action, Subflow, CatalogItem, Acl, Role, ScheduledScript), the Jamf Pro API v11.29 Postman collection + schema, and PLAN.md's established patterns.

---

## 1. Scope & goals

**In scope:** ServiceNow-initiated MDM actions against Jamf-managed **computers** (`cmdb_ci_computer`) and **mobile devices** (`cmdb_ci_handheld_computing`), issued through the modern Jamf Pro API (v2 command queue + dedicated v1/v2 action endpoints — NOT classic JSSResource). Every action is triggered from within ServiceNow (a form button, a catalog request, a flow, or a security-incident record), recorded in an audit table, governed by a kill switch / dry-run / approval gate, and reconciled asynchronously because MDM commands are queued, not synchronous.

**Goals:**
1. A curated **v1 action set** (helpdesk + security response) exposed as ServiceNow triggers, with the long tail of niche/query commands deferred.
2. A single outbound HTTP path that **reuses the inbound `JamfApiClient` / `JamfConfig`** (OAuth `client_credentials` → Bearer, 401-retry-once) — no second REST stack, no connection alias.
3. A durable **audit table** (`x_912401_jamf_pro_command_log`) that is the system of record for every command: what was sent, by whom, to which device, its (secret-redacted) payload, and its lifecycle status.
4. **Async reconciliation**: "sent" ≠ "done." A scheduled reconciler polls `GET /v2/mdm/commands` and advances rows to `acknowledged` / `error` / `expired`.
5. **Safety first**: outbound is OFF by default (kill switch), destructive actions require approval **enforced in the service layer, not just at the trigger**, group-erase is disabled by default, firmware-lock/erase PINs are captured before the POST and locked to admins, and a dry-run mode lets the whole thing be exercised without touching a real device.

**Explicit non-goals (v1):** classroom/education commands (mirroring, shared-iPad user management), inventory/query commands already covered by the inbound sync, and writing identifiers onto the global CMDB CI (avoided — see §3).

**Prerequisite dependency:** the inbound sync (PLAN.md) must be deployed first — this plan extends `JamfSyncRunner` and reuses `JamfApiClient`, `JamfConfig`, `JamfRunLogger` patterns, and the `x_912401_jamf_pro.admin` role.

---

## 2. Action catalog

Legend — **Destructiveness**: safe < moderate < destructive (manageability loss / code execution) < catastrophic (irreversible data loss or firmware brick). **Identifier**: which of the three Jamf identifiers the endpoint keys on.

| Action | Device type(s) | Mechanism (commandType / endpoint) | Identifier | Destructiveness | In v1? | Approval? | Trigger |
|---|---|---|---|---|---|---|---|
| Blank push (force check-in) | computer, mobile | `POST /v2/mdm/blank-push` `{clientManagementIds}` | managementId | safe | ✅ | no | Flow action / UI Action |
| Lock **mobile** device | mobile | `DEVICE_LOCK` → `POST /v2/mdm/commands` (optional `Message`/`PhoneNumber`, **no PIN**) | managementId | moderate | ✅ | no | UI Action (confirm) |
| Lock **computer** (firmware PIN) | computer | `DEVICE_LOCK` → `POST /v2/mdm/commands` (**6-digit `PIN` required**) | managementId | catastrophic (firmware/EFI lock) | ✅ | **yes** | Catalog item w/ approval |
| Clear passcode | **mobile only** | `CLEAR_PASSCODE` → `POST /v2/mdm/commands` | managementId | moderate | ✅ | no | UI Action (confirm) |
| Restart device | computer, mobile | `RESTART_DEVICE` → `POST /v2/mdm/commands` | managementId | moderate | ✅ | no | UI Action (confirm) |
| Shut down device | computer, mobile | `SHUT_DOWN_DEVICE` → `POST /v2/mdm/commands` | managementId | moderate | ✅ | no | UI Action (confirm) |
| Enable Lost Mode | mobile | `ENABLE_LOST_MODE` → `POST /v2/mdm/commands` | managementId | moderate | ✅ | no | UI Action / Security flow |
| Disable Lost Mode | mobile | `DISABLE_LOST_MODE` → `POST /v2/mdm/commands` | managementId | moderate | ✅ | no | UI Action |
| Play Lost Mode sound | mobile | `PLAY_LOST_MODE_SOUND` → `POST /v2/mdm/commands` | managementId | safe | ✅ | no | UI Action |
| Redeploy Jamf mgmt framework | computer | `POST /v1/jamf-management-framework/redeploy/{id}` | jamfId | moderate | ✅ | no | UI Action |
| Send macOS software updates | computer | `POST /v1/macos-managed-software-updates/send-updates` | deviceIds (jamfId) | moderate; **destructive if `forceRestart` or multi-device** | ✅ | **yes** when `forceRestart` true or multi-device | Catalog item |
| Create SW update plan (devices) | computer, mobile | `POST /v1/managed-software-updates/plans` | deviceIds (jamfId) | moderate | ✅ | no (single); **yes** if forced-restart | Catalog item |
| Create SW update plan (group) | computer, mobile | `POST /v1/managed-software-updates/plans/group` | groupId | destructive (blast radius) | ✅ | **yes** | Catalog item w/ approval |
| Deploy package | computer | `POST /v1/deploy-package?verbose=true` | deviceIds (jamfId) | destructive (arbitrary code execution) | ✅ | **yes** (admin-gated) | Catalog item w/ approval |
| Erase computer (dedicated) | computer | `POST /v1/computer-inventory/{id}/erase` `{pin}` | jamfId | catastrophic | ✅ | **yes** | Catalog item w/ approval |
| Remove MDM profile (unmanage) | computer | `POST /v1/computer-inventory/{id}/remove-mdm-profile` | jamfId | destructive | ✅ | **yes** | Catalog item w/ approval |
| Erase mobile device (dedicated) | mobile | `POST /v2/mobile-devices/{id}/erase` | jamfId | catastrophic | ✅ | **yes** | Catalog item w/ approval |
| Unmanage mobile device | mobile | `POST /v2/mobile-devices/{id}/unmanage` | jamfId | destructive | ✅ | **yes** | Catalog item w/ approval |
| Erase device (command-queue form) | computer, mobile | `ERASE_DEVICE` → `POST /v2/mdm/commands` (computer reuses the 6-digit erase `PIN`; mobile no PIN) | managementId | catastrophic | ⚠️ fallback only | **yes** | Catalog / Security flow |
| Read MDM command status | computer, mobile | `GET /v2/mdm/commands?filter=...` | n/a | safe | ✅ (internal) | no | Reconciliation job |

Notes:
- **macOS `DEVICE_LOCK` requires a 6-digit `PIN`** in the command payload — that PIN sets a firmware/EFI lock and is the ONLY way to unlock/boot the Mac. It is therefore treated as **brick-class, exactly like computer erase**: the PIN is generated and persisted to `unlock_pin` **before** the POST (crash-safe), surfaced only to `x_912401_jamf_pro.admin`, and the action is gated behind approval. **iOS/iPadOS `DEVICE_LOCK` takes no PIN** (only optional `Message`/`PhoneNumber`) and stays a moderate, no-approval helpdesk action.
- **`CLEAR_PASSCODE` is iOS/iPadOS only.** macOS has no ClearPasscode MDM command (the `ClearPasscode`/`allowClearPasscode` strings in Postman are config-profile restriction keys, not a computer command). The action, its UI Action, and its choice are restricted to `mobile`; it is never rendered on the `cmdb_ci_computer` form.
- **Prefer the dedicated erase endpoints** (`/v1/computer-inventory/{id}/erase` with `pin`; `/v2/mobile-devices/{id}/erase` with `preserveDataPlan/disallowProximitySetup/clearActivationLock/returnToService`) over the generic `ERASE_DEVICE` command. The command-queue `ERASE_DEVICE` is a fallback path only; for `device_type=computer` it **reuses the same PIN-generation logic** as the dedicated erase (Intel Macs require a `PIN`; Apple silicon obliterates without one, so the PIN is captured regardless and passed when present), and for `device_type=mobile` it sends no PIN.
- **Deploy-package and forced-restart software updates are code-execution / disruptive-reboot capabilities** — pushing an arbitrary package to managed endpoints is remote code execution, and forced restarts interrupt users fleet-wide. Both sit in the same governance class as unmanage/erase: approval required and admin-gated for multi-device/group scope.
- **`send-updates` `deviceIds` vs `computerIds`** and the **`deploy-package` field name** must be confirmed against the Postman body before coding.
- Every `POST /v2/mdm/commands` action is **queued** — it executes on the device's next check-in.

### Deferred to later (with reason)

| Action(s) | Reason deferred |
|---|---|
| `DEVICE_INFORMATION`, `SECURITY_INFO`, `CERTIFICATE_LIST`, `PROFILE_LIST`, `PROVISIONING_PROFILE_LIST`, `INSTALLED_APPLICATION_LIST`, `MANAGED_APPLICATION_LIST`, `MANAGED_MEDIA_LIST`, `VALIDATE_APPLICATIONS`, `DEVICE_LOCATION`, `VERIFY_RECOVERY_LOCK` | Read-only **query** commands. Inventory already flows inbound — redundant for an *action* app. `DEVICE_LOCATION` is also privacy-sensitive; if added, gate behind lost/stolen flow with approval. |
| `ENABLE_REMOTE_DESKTOP` / `DISABLE_REMOTE_DESKTOP` | Enabling screen observation is a real security exposure; niche. Gate with approval if added. |
| `SET_RECOVERY_LOCK`, `SET_AUTO_ADMIN_PASSWORD`, `UNLOCK_USER_ACCOUNT` | Sensitive credential/config management better run through a controlled flow than self-service. If ever added, their credential values must be redacted from `action_payload` exactly like the erase/lock PIN (§4.2). |
| `REFRESH_CELLULAR_PLANS`, `CLEAR_RESTRICTIONS_PASSWORD`, `APPLY_REDEMPTION_CODE` | Narrow use cases; low priority. |
| `REQUEST_MIRRORING`, `STOP_MIRRORING`, `DELETE_USER`, `LOG_OUT_USER` | Classroom / Shared-iPad (education) features — out of scope for a CMDB action app. |
| `DECLARATIVE_MANAGEMENT`, `SETTINGS` | Infrastructure/config toggles better owned by Jamf configuration profiles. |
| `TRIGGER_ENHANCED_LOG_COLLECTION` / `CANCEL_ENHANCED_LOG_COLLECTION` | Support-tooling niche. |
| **Erase mobile device GROUP** (`POST /v2/mobile-device-groups/{id}/erase`) | **Extreme blast radius**. Disabled by default (`group_erase_max = 0`); if enabled, restrict to a security-incident flow with mandatory approval. |
| Renew MDM profile (`/v1/mdm/renew-profile`), Reinstall managed app config (`/v1/mobile-device-apps/reinstall-app-config`) | Niche remediation. Renew-profile is the only udid-keyed action; plumbed in the client but not surfaced as a v1 trigger. |

---

## 3. Identifier prerequisite (blocks everything)

Three different identifiers are required depending on the endpoint, and the inbound plan persists only one of them:

| Identifier | Used by | Persisted by inbound today? |
|---|---|---|
| `managementId` (GUID) | `POST /v2/mdm/commands`, `blank-push` | ❌ no |
| jamf integer `id` | `computer-inventory/{id}/*`, `mobile-devices/{id}/*`, `redeploy/{id}`, `send-updates`, `plans` | ❌ no |
| `udid` | `renew-profile` | ✅ as IRE `source_native_key` in `sys_object_source_info` (not directly queryable as a column) |

Writing these onto the **global** `cmdb_ci_computer` / `cmdb_ci_handheld_computing` tables would require a global/`sn_cmdb` write cross-scope privilege, dictionary changes on foreign tables, and generated typedefs for those tables. **Avoid all of that.** Persist the identifiers in a **new scoped table** the app fully owns.

### New table `x_912401_jamf_pro_device` — `src/fluent/tables/jamf-device.now.ts`

One uniform row per device across both platforms; the join target for `x_912401_jamf_pro_command_log.target_ci`.

| column | type | notes |
|---|---|---|
| `ci` | ReferenceColumn → `cmdb_ci` | the CI created/updated by IRE (both computer & handheld) |
| `device_type` | StringColumn choices `{computer, mobile}` | selects the endpoint family + identifier |
| `jamf_id` | IntegerColumn | for `/computer-inventory/{id}/*`, `/mobile-devices/{id}/*`, `redeploy/{id}`, `deviceIds` |
| `management_id` | StringColumn | GUID for `/v2/mdm/commands`, `blank-push` |
| `udid` | StringColumn | for `/v1/mdm/renew-profile`; same value IRE used as `source_native_key` |
| `serial_number` | StringColumn | correlation / display |
| `managed` | BooleanColumn | last-known managed state; guards sends (unmanage flips it false) |
| `last_seen` | DateTimeColumn | from the inbound run |

**Uniqueness:** coalesce on (`jamf_id` + `device_type`); index `management_id` and `udid`.

### Where the write happens (inbound edit)

Extend `JamfSyncRunner._syncComputers` / `_syncMobileDevices` (PLAN §2.8): the raw Jamf device JSON already contains `general.managementId`, `id`, and `udid` **at fetch time** — no extra API call. After `gateway.flush()` returns IRE result sys_ids, upsert one `x_912401_jamf_pro_device` row per device, resolving `ci` by the sys_id IRE returned (correlated by `udid`/serial). All writes are **in-scope** (`x_912401_jamf_pro` → `x_912401_jamf_pro_device`), so **no new privilege**. This is the single most important prerequisite — every outbound endpoint depends on it. Do it via a small `JamfDeviceRegistry` script include (`upsert(deviceType, {jamfId, managementId, udid, serial, ciSysId, managed})`) so `JamfSyncRunner` stays thin.

---

## 4. Architecture

### 4.1 New ES5 `Class.create()` script includes

All in `src/scripts/script-includes/`, `accessibleFrom: 'package_private'`, `clientCallable: false`, `var` only, no ES6 / arrow functions, Glide APIs ambient. Each has a matching `*.now.ts` using `Now.include(...)` exactly like PLAN §3.8.

**1. `JamfApiClient` (EDIT the existing inbound class) — add a generic `post()`**
Keeps the invariant that `JamfApiClient` owns *all* `sn_ws.RESTMessageV2` usage:
- `post(path, body, headers)` — POST `{base}{path}`, `Authorization: Bearer` + `Content-Type: application/json` + `Accept: application/json`, `body = JSON.stringify(body)`. Same **401 → invalidate → re-fetch → retry-once** logic as `get()`. Returns `{httpStatus, body}` (parsed JSON when present; some endpoints return `202` empty). Throws on network failure; does NOT throw on 4xx/5xx — returns the status so the Service maps it to an `error` row.

**2. `JamfCommandClient` — thin semantic HTTP verbs**
Composes a `JamfApiClient`; never touches `sn_ws` directly. Endpoint knowledge lives here.
`sendCommands(managementIds, commandData)`, `blankPush(managementIds)`, `renewProfile(udids)`, `eraseComputer(jamfId, pin)`, `removeMdmComputer(jamfId)`, `redeployFramework(jamfId)`, `sendMacosUpdates(deviceIds, opts)`, `createUpdatePlanDevices(deviceIds, opts)`, `createUpdatePlanGroup(groupId, opts)`, `deployPackage(deviceIds, opts)`, `eraseMobile(jamfId, opts)`, `unmanageMobile(jamfId)`, `eraseMobileGroup(groupId)`, `getCommands(rsqlFilter)`, `getMobileGroupMembership(groupId)`.

**3. `JamfCommandService` — the brain (and the enforcement layer)**
Maps an `x_912401_jamf_pro_command_log` row → endpoint + body + identifier (reads `management_id`/`jamf_id`/`udid` from `x_912401_jamf_pro_device`). Owns kill-switch/dry-run checks, dedupe, per-device in-flight guard, batching, blast-radius guard, PIN generation (computer erase **and** computer lock), reconcile-mode assignment, secret redaction, and — critically — the **approval gate itself**.
- `create(request)` — idempotent create from `{ci, deviceType, action, payload, source, requestedBy}`; applies dedupe, sets `is_destructive`, and **forces every `is_destructive` row to `status = pending_approval` regardless of `source`** (including `source=api` and any mis-wired trigger). Non-destructive rows start at `requested`/`pending_send`. Returns existing row on duplicate.
- `send(rowSysId)` — the POST; re-checks guards. **Before POSTing any `is_destructive` row it verifies a resolvable approval: `approved_by` populated AND `approval` referencing a `sysapproval_approver` record in an `approved` state.** A destructive row lacking that linkage is refused and written to `error` with `error_reason='missing/invalid approval'` — it is never sent, even if its `status` was hand-set to `pending_send`/`approved`. Snapshots identifiers, dispatches to the right client verb, records `jamf_command_uuid` + `http_status`, transitions `sent` (2xx) / `error` (non-2xx). Called off the click thread by the reconciler's send pass.
- `_endpointFor` / `_identifierFor` / `_buildBody` internals. **`_buildBody` splits `DEVICE_LOCK` by `device_type`:** for `computer` it generates a 6-digit `unlock_pin`, persists it (crash-safe, before the POST) and sends it as the DeviceLock `PIN`; for `mobile` it sends optional `Message`/`PhoneNumber` and no PIN. The command-queue `ERASE_DEVICE` fallback shares the same computer-PIN path.
- `_redactPayload(body)` — strips secrets (`pin`, and any future credential fields such as `SET_AUTO_ADMIN_PASSWORD`/`SET_RECOVERY_LOCK` values) to a masked placeholder (`"***"`) **before** the body is written to `action_payload`, so the PIN lives in exactly one ACL-controlled column (`unlock_pin`).

**4. `JamfCommandLogger`** — mirrors `JamfRunLogger`. Writes/updates `x_912401_jamf_pro_command_log`, `markStaleSends()`, `isReconcilerActive()` mutex, batch correlation.

**5. `JamfCommandReconciler`** — the polling-job body (§6); reuses Service for the send pass and Client+Logger for state writes.

**Composition:** `JamfCommandService` → `new JamfCommandClient(config)` → `new JamfApiClient(config)` → `new JamfConfig()`. Same DI seam as PLAN §2.8 — `initialize(overrides)` lets a background script inject a fake client for HTTP-free testing.

### 4.2 Audit table `x_912401_jamf_pro_command_log` — `src/fluent/tables/command-log.now.ts`

| column | type | notes |
|---|---|---|
| `target_ci` | ReferenceColumn → `cmdb_ci` | the CI acted on |
| `device` | ReferenceColumn → `x_912401_jamf_pro_device` | identity row that supplied identifiers |
| `device_type` | StringColumn choices `{computer, mobile}` | drives endpoint/identifier |
| `action` | StringColumn choices (`BLANK_PUSH, DEVICE_LOCK, CLEAR_PASSCODE, RESTART_DEVICE, SHUT_DOWN_DEVICE, ENABLE_LOST_MODE, DISABLE_LOST_MODE, PLAY_LOST_MODE_SOUND, REDEPLOY_FRAMEWORK, MACOS_UPDATE, UPDATE_PLAN_DEVICES, UPDATE_PLAN_GROUP, DEPLOY_PACKAGE, COMPUTER_ERASE, COMPUTER_REMOVE_MDM, MOBILE_ERASE, MOBILE_UNMANAGE, ERASE_DEVICE, RENEW_PROFILE, GROUP_ERASE`) | `dropdown_without_none` |
| `target_management_id` | StringColumn | snapshotted at send |
| `target_jamf_id` | IntegerColumn | snapshotted at send |
| `target_udid` | StringColumn | snapshotted at send |
| `action_payload` | StringColumn maxLength 4000 | JSON of the body actually sent, **with `pin` / credential fields redacted to `"***"`** (§4.1 `_redactPayload`) — no secret is ever stored here |
| `jamf_command_uuid` | StringColumn | UUID from `POST /v2/mdm/commands` — join key |
| `reconcile_mode` | StringColumn choices `{uuid, effect, none}` | how the row is confirmed (§6) |
| `status` | StringColumn choices `{requested, pending_approval, approved, rejected, dry_run, pending_send, sent, not_now, acknowledged, error, expired, canceled}` | default `requested` |
| `is_destructive` | BooleanColumn | drives in-flight guard + **mandatory `pending_approval` on create + approval check on send** |
| `dedupe_key` | StringColumn (indexed) | sha256 of ci+action+payload+window |
| `unlock_pin` | StringColumn | 6-digit erase **or macOS-lock** PIN — plain string, ACL-locked to `x_912401_jamf_pro.admin` (§6). Written before the POST |
| `requested_by` / `approved_by` | ReferenceColumn → `sys_user` | `approved_by` must be present before a destructive send |
| `approval` | **StringColumn** | holds the `sysapproval_approver` sys_id. **NOT a ReferenceColumn** — `sysapproval_approver` is not among the shipped sdk-core typedefs (unlike `cmdb_ci`/`sys_user`/`incident`), so a typed reference would fail to compile; a plain sys_id column avoids the foreign-typedef dependency and is consistent with `approval_state` |
| `approval_state` | StringColumn | mirrors `askForApproval` output |
| `source` | StringColumn choices `{ui_action, catalog, flow, security_incident, api}` | provenance |
| `batch` | StringColumn | groups multi-device / offboarding ops |
| `http_status` | IntegerColumn | |
| `date_requested` / `date_sent` / `date_acknowledged` / `date_expires` | DateTimeColumn ×4 | |
| `poll_attempts` | IntegerColumn (default 0) / `last_polled` DateTimeColumn | |
| `error_reason` | StringColumn maxLength 4000 | truncated Jamf error / guard-refusal / missing-approval reason |

> If a typed reference to `sysapproval_approver` is later preferred over the plain sys_id column, add it to the `now-sdk dependencies` / `npm run types` typedef-generation list (the same mechanism used for the CI and SIR tables) **before** defining this table.

### 4.3 New `sys_properties` — EDIT `src/fluent/properties/jamf-properties.now.ts`

All `roles: {read:[adminRole], write:[adminRole]}`.

| name | type | default | purpose |
|---|---|---|---|
| `x_912401_jamf_pro.actions.enabled` | boolean | `false` | **master outbound kill switch** |
| `x_912401_jamf_pro.actions.destructive.enabled` | boolean | `false` | second **global** gate for catastrophic/destructive (not a per-request approval — the per-request gate lives in the Service, §4.1/§6) |
| `x_912401_jamf_pro.actions.dry_run` | boolean | `true` | log request as `dry_run`, no POST |
| `x_912401_jamf_pro.command.batch_size` | integer | `50` | max managementIds per `/v2/mdm/commands` POST |
| `x_912401_jamf_pro.command.expiry_hours` | integer | `72` | non-terminal rows past this → `expired` |
| `x_912401_jamf_pro.command.group_erase_max` | integer | `0` | max group size erasable; `0` = disabled |
| `x_912401_jamf_pro.command.reconcile_interval_min` | integer | `10` | reconciler cadence |

`JamfConfig` gains `areActionsEnabled()`, `areDestructiveActionsEnabled()`, `isDryRun()`, `getCommandBatchSize()`, `getCommandExpiryHours()`, `getGroupEraseMax()`.

---

## 5. Trigger surface

### 5.1 Form UI Actions (primary surface) — first-class
`UiAction<T>` is typed (`ui/UiAction.d.ts`). **Prerequisite:** `cmdb_ci_computer` and `cmdb_ci_handheld_computing` are NOT in the shipped typedefs — run the `types` npm script (`now-sdk dependencies`) to generate them before `UiAction`/`Acl`/`BusinessRule` on those tables will type-check (shared Phase-0/1 prerequisite with inbound). Each UI Action: `condition` (device type + `management_id` present + `x_912401_jamf_pro.operator`), `client.onClick` ES5 `confirm()`, server `script` → `new x_912401_jamf_pro.JamfCommandService().create(...)`, `roles:[operatorRole]`, `form.style:'destructive'` where apt. Files: `src/fluent/ui-actions/{computer-actions,mobile-actions}.now.ts`.
- **Computer form — non-destructive (call `create` directly):** Blank Push, Restart, Shut Down, Redeploy Mgmt Framework. (No "Clear Passcode" button — mobile-only. No direct "Lock" button — macOS lock is brick-class, see below.)
- **Mobile form — non-destructive (call `create` directly):** Blank Push, Lock (no PIN), Clear Passcode, Restart, Shut Down, Enable/Disable Lost Mode, Play Lost Mode Sound.
- **Destructive / brick-class (do NOT call Jamf directly):** Computer Lock (firmware PIN), Wipe/Erase, Unmanage/Remove MDM, Deploy Package — `form.style:'destructive'`; the click launches the Catalog request / approval flow so the confirmation is a formal request record and the Service enforces `pending_approval`.

### 5.2 Flow action library + subflows — first-class
`Action<I,O>` (`sys_hub_action_type_definition`): **Send MDM Command**, **Erase Device**, **Unmanage Device**, each wrapping a script step to `JamfCommandService.create`. `Subflow<I,O,V>`: an **Offboarding subflow** (blank-push → lock → erase → unmanage, one `batch` id) reused by catalog + security paths. Files: `src/fluent/flow-actions/*.now.ts`, `src/fluent/subflows/offboard-device.now.ts`.

### 5.3 Service Catalog + approval (destructive) — first-class
`CatalogItem` with a `Reference` variable to the CI, `roles:[operatorRole]`, fulfilled by **one** `flow:` running the built-in **`askForApproval`** (the ONLY native approval primitive — no standalone Approval type) → on `approved` calls the offboarding subflow / target action. The flow writes `approved_by`, `approval` (sysapproval_approver sys_id), and `approval_state` onto the row atomically before the Service is allowed to send. Items: "Lock Mac (firmware PIN)", "Wipe Apple Device", "Offboard Device", "Unmanage Device", "Deploy Package", "macOS Software Update" (approval when forced-restart/multi-device), "Software Update Plan (group)". Files: `src/fluent/catalog/*.now.ts`, `src/fluent/flows/wipe-device-flow.now.ts`.

### 5.4 Security-Incident path
`Flow` with `updatedTrigger` on `sn_si_incident` (requires SIR plugin + generated typedef), lost/stolen filter → `lookUpRecords` CIs. **Immediate, no-approval response is MOBILE-only and recoverable:** `ENABLE_LOST_MODE` + mobile `DEVICE_LOCK` (passcode-recoverable, no PIN). **All computer actions in this flow are gated:** macOS `DEVICE_LOCK` (brick-class, PIN-captured) and any `ERASE` route through `askForApproval` — the flow never auto-locks or auto-wipes a Mac, because a firmware lock/erase with no captured, surfaced PIN is unrecoverable. **Fallback if SIR unlicensed:** a first-class `BusinessRule` (`when:'after'`, `action:['update']`) on `incident` calling the same subflow with the same mobile-immediate / computer-gated split. File: `src/fluent/flows/security-incident-response.now.ts`.

### 5.5 Honest artifact summary
First-class: `UiAction` (needs generated CI typedefs), `BusinessRule`, `Flow`/`Subflow`/`Action`, approval via built-in `askForApproval` only, `CatalogItem`+client scripts/variables, `Acl`/`Role`. Generic `Record()` / ES5-in-string: bespoke `sysapproval_approver` rows (referenced by sys_id, not a typed column — §4.2), `sys_choice` on foreign tables, fancy GlideModal dialogs. `sn_si_incident` needs the SIR plugin + generated typedef.

---

## 6. Async lifecycle & reconciliation

**State model** (default `requested`): `requested → [pending_approval → approved/rejected] → pending_send → sent → {not_now↺, acknowledged, error}`; plus `dry_run`, `expired`, `canceled`. Every `is_destructive` row is **forced through `pending_approval` by the Service on create** regardless of source. **Jamf→SN map:** `Pending`→`sent`, `Acknowledged`→`acknowledged`, `Error`→`error`, `NotNow`→`not_now`. **Terminal** = {acknowledged, error, expired, canceled, rejected, dry_run}.

**Reconciler ScheduledScript** — `src/fluent/scheduled-scripts/command-reconciler.now.ts`. Verified API: `frequency:'periodically'` + `executionInterval:<Duration>` (NOT `daily`/`executionTime`), 10 min, `timeZone:'floating'`, inline `script:"new x_912401_jamf_pro.JamfCommandReconciler().run();"`. Each pass: (1) **send pass** — `status IN (approved, pending_send)` → `Service.send` (keeps POST off the click thread; `send` re-runs the approval check on destructive rows before POSTing); (2) **poll pass** — `status IN (sent, not_now) AND date_expires >= now` → batch `GET /v2/mdm/commands?filter=...`, update status/timestamps/`error_reason`, bump `poll_attempts`; (3) **expiry pass** — non-terminal past `date_expires` → `expired`. Mirrors `JamfRunLogger` mutex/stale-guard so overlapping runs can't double-send.

**uuid vs effect reconciliation (key asymmetry):** `POST /v2/mdm/commands` returns a per-command `uuid` → `reconcile_mode=uuid`, join on it. Dedicated `202`-returning endpoints (erase/remove-mdm/redeploy/unmanage/renew/blank-push/group-erase) have no `uuid` → `reconcile_mode=effect`, marked `sent` on 2xx, confirmed by (a) `filter=clientManagementId==<GUID>` on commandType+dateSent window, or (b) **effect confirmation via the next inbound sync** (device dropped from managed inventory ⇒ set `acknowledged`, `x_912401_jamf_pro_device.managed=false`). Blank-push: `reconcile_mode=none`, terminal on 2xx.

**Idempotency/guards** (in the Service — the single enforcement point even when API/Flow create the row): dedupe via indexed `dedupe_key = sha256(ci + action + payload + window)` (returns existing non-terminal row); per-device in-flight guard blocks a second destructive command while one is non-terminal; batching chunks managementIds at `batch_size` with one child row per device grouped by `batch`; group-erase pre-checks membership count, refuses if > `group_erase_max` (0=off), requires an approved row, logs the member list.

**Approval enforcement (defense in depth):** approval is enforced in **two** places, not just the trigger. (1) `create()` sets every `is_destructive` row to `pending_approval` no matter the `source` — an `api`- or mis-wired-trigger-created destructive row can never start at `pending_send`. (2) `send()` refuses to POST any destructive row unless it resolves a valid approval linkage (`approved_by` + a `sysapproval_approver` record in an `approved` state via the `approval` sys_id) — checking the linkage, not merely `status`. A destructive send without a resolvable approval is written straight to `error`. The global `destructive.enabled` kill switch is an additional coarse gate, not a substitute for this per-request check.

**Erase / lock PIN (critical):** both `/v1/computer-inventory/{id}/erase` (`{pin}`) and **macOS `DEVICE_LOCK`** need a 6-digit PIN that is the ONLY way to unlock the affected Mac; the command-queue `ERASE_DEVICE` fallback for `device_type=computer` reuses the same logic (Intel requires the PIN; Apple silicon obliterates without one, but the PIN is captured either way). The Service generates the PIN and writes `unlock_pin` **before** the POST (crash-safe). It is a **plain StringColumn (NOT `password2`)** — an operator must be able to read it back to unlock the Mac; a hashed/`password2` PIN would brick the machine. It is **ACL-locked to `x_912401_jamf_pro.admin`** and surfaced **only** in the ACL-protected form field. **The PIN is redacted from `action_payload` (§4.1) and is never emailed.** If a notification is needed, send only a **link to the ACL-guarded command-log record** so the recipient must authenticate and pass the field ACL to see the PIN — never the PIN value in the message body. Edge handling: 401 retry-once (shared); offline device → `sent`→`expired`; `NotNow` → keep polling, never auto-resend; already-unmanaged → guard on `x_912401_jamf_pro_device.managed` refuses; send non-2xx → immediate `error`, never `sent`.

---

## 7. Governance & safety

**Roles** (EDIT `roles.now.ts`): `x_912401_jamf_pro.operator` (non-destructive actions, read command log), `x_912401_jamf_pro.admin` (existing, `containsRoles:[operatorRole]`; destructive actions, reads `unlock_pin`, deploy-package, config), `x_912401_jamf_pro.approver` (approval step, not necessarily operator).

**Approval matrix:**
- **No approval** — blank push, restart, shut down, redeploy, renew (operational); **mobile** lock/clear-passcode/lost-mode; single-device non-forced software update; and the security-incident **mobile-only** auto lock + lost-mode (time-critical, recoverable).
- **Approval required** — computer (macOS) `DEVICE_LOCK` (firmware brick, PIN-captured), erase (computer/mobile), remove-MDM/unmanage, deploy package, forced-restart software updates, multi-device/group update plans, and all computer actions inside the security-incident flow.
- **Mandatory approval + disabled by default** — group erase.

**Defense in depth:** UI Action `roles` (visibility) + `Acl` (authorization on `x_912401_jamf_pro_command_log`; field-level read on `unlock_pin` **and** on `action_payload` restricted so secrets never leak even before redaction is trusted) + approval gate enforced in **both** the Flow/Catalog trigger **and** `JamfCommandService.create/send` (§6). Deploy-package and forced-restart updates are additionally restricted to `x_912401_jamf_pro.admin`. ACL file `src/fluent/acls/command-log-acls.now.ts`.

**Controls:** kill switch `x_912401_jamf_pro.actions.enabled` (default false) + `.destructive.enabled` (default false); dry-run `x_912401_jamf_pro.actions.dry_run` (default true, logs built request with secrets redacted, no POST); group-erase blast-radius guard; secret hygiene — PINs redacted from `action_payload`, stored only in admin-ACL'd `unlock_pin`, never emailed; full audit — every command (incl. refused/dry-run/missing-approval) writes a log row; "MDM Commands" list module (EDIT `app-menu.now.ts`).

---

## 8. Cross-scope privileges

**None needed beyond what all scopes have.** `sn_ws.RESTMessageV2` is privilege-free; `sn_cmdb.IdentificationEngine` is **not called outbound** (inbound-only); global/`cmdb` writes are avoided because identifiers live in the scoped `x_912401_jamf_pro_device`; `gs.getProperty`/`GlideDateTime`/`GlideDigest`/`Math.random` (PIN)/in-scope table writes/`sys_user` read need nothing extra. `askForApproval`/Flow/Catalog are platform features; `sysapproval_approver` is referenced by sys_id (a plain string), so no foreign typedef or cross-scope read is required. `sn_si_incident` is not a privilege — it needs the **SIR plugin** + generated typedef (falls back to `incident` BR). Same post-deploy `sys_scope_privilege` sweep + `npm run transform` as inbound.

**Jamf API Role (outbound-only, README):** "Send Computer/Mobile Device MDM Command" (per device type + each command — including **DeviceLock with PIN** for computers), "Send Blank Push", "Renew MDM Profile", "Erase Computer", "Erase Mobile Device", "Remove MDM Profile", "Read/Update Mobile Device Groups", deploy-package / managed-software-update grants, and "View MDM Command Information" (reconciler `GET`).

---

## 9. Phased build order

Each phase deploys green; verification touches no real device (dry-run + fake client + mock base_url). Inbound deployed first.
- **A — identifier prerequisite:** `x_912401_jamf_pro_device` table + ACLs; edit `JamfSyncRunner`/`JamfDeviceRegistry` to upsert after IRE flush. Verify one row per device with all 3 identifiers + `ci`.
- **B — data + governance:** `x_912401_jamf_pro_command_log` (`approval` as StringColumn sys_id, `action_payload` redacted + ACL'd), operator/approver roles, command-log ACLs (incl. `unlock_pin` and `action_payload`), new properties (kill switch OFF, dry-run ON), app-menu module. Compiles without a `sysapproval_approver` typedef.
- **C — HTTP + client:** edit `JamfApiClient.post()`, add `JamfCommandClient`. Verify token + `getCommands` GET against a **mock base_url**.
- **D — service + logger (dry-run):** `JamfCommandService` + `JamfCommandLogger`. Verify `create` blank-push produces a `dry_run` row, no POST; verify a `source=api` destructive `create` lands in `pending_approval` (not `pending_send`) and that `send` refuses it without an approval; exercise dedupe, in-flight guard, and `_redactPayload` (PIN absent from `action_payload`).
- **E — reconciler + first safe live command:** reconciler script (`periodically`, 10 min). With a real tenant + dry-run OFF, issue **Blank Push** (safest) to one test device; watch `pending_send → sent → acknowledged`; confirm expiry on an offline device.
- **F — trigger surface:** generate CI typedefs (`npm run types`), then non-destructive UI Actions (mobile lock/clear-passcode present; computer lock/clear-passcode absent). Verify gating + dry-run rows.
- **G — destructive + approvals:** flow actions, offboarding subflow, catalog items with `askForApproval`, erase-**and-computer-lock** PIN handling. Verify "Wipe Apple Device" and "Lock Mac" route to approver; on approve, log a `dry_run` row with `unlock_pin` visible only to admin and redacted from `action_payload`; reject sets `rejected`; a hand-forced `pending_send` destructive row with no approval is refused at `send` (→ `error`).
- **H — security-incident + hardening:** SIR flow (or `incident` BR fallback) with mobile-immediate / computer-gated split, group-erase guard, README, `sys_scope_privilege` sweep + `transform`. Verify immediate mobile lock+lost-mode, gated computer lock/erase, and group-erase refusal while `group_erase_max=0`.

---

## 10. Risks & open questions

1. `send-updates`/`deploy-package` body field names (`deviceIds` vs `computerIds`) — confirm against Postman before coding.
2. Effect-linked reconciliation for `202` endpoints is the biggest design uncertainty; depends on inbound-sync cadence — validate against a live tenant.
3. CI typedef generation must run before UI Actions/ACLs on the two CI tables type-check.
4. SIR licensing — `sn_si_incident` needs the plugin; degrades to an `incident` BR otherwise.
5. `x_912401_jamf_pro_device.ci` correlation on re-enrolled devices (new managementId, same serial) — coalesce on (`jamf_id`+`device_type`), re-verify `management_id` each sync.
6. `unlock_pin` is deliberately plain + admin-readable (a `password2` PIN would brick the Mac) and is used by **both** computer erase and macOS lock; verify the field ACL holds on the instance and that the PIN is redacted from `action_payload`.
7. Fleet-wide commands create one row per device — add command-log retention/cleanup mirroring inbound.
8. Approval + async-send race — the approval flow must write `approved`/`approved_by`/`approval` atomically; the Service's `send`-time approval-linkage check is the backstop. Confirm a rejected-then-resubmitted request mints a fresh row.
9. No rate-limit handling in v1 — add retry-after to `JamfApiClient.post` if 429s appear on large batches.
10. `GROUP_ERASE` stays opt-in even with guards — consider forbidding it entirely in v1.
11. macOS `DEVICE_LOCK` PIN semantics (Intel vs Apple silicon; whether Jamf returns the PIN vs expects it supplied) — confirm against a live tenant that the supplied 6-digit PIN is what unlocks the Mac, and that it is captured/surfaced before the device acts on the command.

---

**Key files:** `src/fluent/tables/{jamf-device,command-log}.now.ts`; `src/scripts/script-includes/{JamfApiClient(edit),JamfCommandClient,JamfCommandService,JamfCommandLogger,JamfCommandReconciler,JamfDeviceRegistry}.js` + matching `.now.ts`; `src/fluent/properties/jamf-properties.now.ts` (edit); `src/fluent/ui-actions/{computer-actions,mobile-actions}.now.ts`; `src/fluent/flow-actions/*.now.ts`; `src/fluent/subflows/offboard-device.now.ts`; `src/fluent/catalog/*.now.ts`; `src/fluent/flows/{wipe-device-flow,security-incident-response}.now.ts`; `src/fluent/scheduled-scripts/command-reconciler.now.ts`; `src/fluent/acls/command-log-acls.now.ts`; `src/fluent/roles.now.ts` (edit); `src/fluent/app-menu.now.ts` (edit).

The plan reuses the inbound `JamfApiClient`/`JamfConfig`/`JamfRunLogger` patterns, avoids any new cross-scope privilege, and gates the destructive surface behind a default-off kill switch, default-on dry-run, service-layer approval enforcement, PIN capture for both erase and macOS lock, secret redaction, and native `askForApproval`.
