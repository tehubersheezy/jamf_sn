# Jamf Digital Forensics & Incident Response (ServiceNow) — Scope & Implementation Plan

> Third plan in the suite. Companions: `PLAN.md` (inbound Jamf→CMDB sync) and `OUTBOUND_PLAN.md` (ServiceNow→Jamf device actions / command layer).
> Scope `x_912401_jamf_pro`, app "JAMF PRO". This plan adds a **forensics capability layer** on top of the outbound command infrastructure — it does not re-implement HTTP/auth.

---

## 0. Honest framing — what this is and is NOT

**Jamf/MDM is not a forensic acquisition tool.** It cannot produce a bit-for-bit disk image or a RAM capture, and every MDM command runs *on* a live device and mutates its state. Nothing here replaces proper forensic acquisition (write-blockers, `dd`/imaging, physical custody).

**What this layer genuinely supports** — the *front half* of an investigation:
- **Locate** a lost/stolen/suspect device
- **Contain** it (lock, disable remote access) to stop further tampering
- **Collect evidence-of-state** — security posture, installed apps, profiles, certificates — as of the device's last check-in
- **Acquire logs** (macOS enhanced/managed log collection)
- **Maintain a defensible chain of custody inside ServiceNow** — who requested what, when the device responded, an immutable hashed record, all linked to a Security Incident (SIR)

**Hard constraints to state up front:**
- Evidence is **metadata, best-effort, as-of-check-in** — not disk-level, not guaranteed complete, mutable on the device. Document this on every evidence record.
- Commands are **asynchronous**: an offline or wiped device returns nothing.
- **Legal/privacy**: location tracking and log collection on user devices carry HR/legal/privacy exposure. Every forensic action must be authorization-gated, logged, and (for location) justified against an open, approved investigation.

---

## 1. Scope & goals

Give a ServiceNow SecOps analyst, from a **Security Incident (SIR)** or a CMDB device CI, the ability to:
1. **Locate** a mobile device.
2. **Isolate/contain** a compromised or lost device.
3. **Collect a forensic evidence bundle** (state snapshots + logs) that attaches to the SIR with chain-of-custody metadata.
4. **Automatically block anti-forensic (destructive) commands** on any device under an open investigation or legal hold.

Non-goals (v1): disk imaging, memory capture, live-response shell, third-party EDR integration.

---

## 2. Forensic capability catalog (the allowlist)

All "collect" items are Jamf **read commands** issued through the shared command queue (`POST /v2/mdm/commands`, `commandType`) or dedicated endpoints; results return asynchronously and are retrieved via `GET /v2/mdm/commands` + updated inventory.

| DFIR phase | Capability | Mechanism (`commandType` / endpoint) | Mac | Mobile | Notes |
|---|---|---|:-:|:-:|---|
| **Locate** | Device location | `DEVICE_LOCATION` | | ✓ | Supervised iOS/iPadOS; typically requires Lost Mode enabled |
| | Enable Lost Mode (lock+locate+message) | `ENABLE_LOST_MODE`, `PLAY_LOST_MODE_SOUND` | | ✓ | Supervised only |
| **Contain** | Lock device | `DEVICE_LOCK` | ✓ | ✓ | Preserves state; blocks interactive use. Computer lock uses a 6-digit PIN — **must be recorded** (see §5) |
| | Disable remote desktop | `DISABLE_REMOTE_DESKTOP` | ✓ | | Cut screen-sharing access |
| **Collect: state** | Security posture (encryption/FileVault, firewall, passcode present, activation lock, firmware/recovery lock, jailbreak/mgmt state) | `SECURITY_INFO` | ✓ | ✓ | Highest-value single snapshot |
| | Full device snapshot (OS, hw, identifiers, last check-in) | `DEVICE_INFORMATION` | ✓ | ✓ | |
| | Installed / managed apps (rogue software) | `INSTALLED_APPLICATION_LIST`, `MANAGED_APPLICATION_LIST` | ✓ | ✓ | |
| | Config & provisioning profiles (tampering, unauthorized profiles) | `PROFILE_LIST`, `PROVISIONING_PROFILE_LIST` | ✓ | ✓/iOS | Provisioning profiles are iOS |
| | Certificates (rogue CAs / MITM) | `CERTIFICATE_LIST` | ✓ | ✓ | |
| | Managed media | `MANAGED_MEDIA_LIST` | | ✓ | |
| | App integrity | `VALIDATE_APPLICATIONS` | ✓ | ✓ | |
| | Recovery-lock verification (boot tamper) | `VERIFY_RECOVERY_LOCK` | ✓ (Apple Silicon) | | |
| **Acquire: logs** | Enhanced/managed device log collection | `TRIGGER_ENHANCED_LOG_COLLECTION` / `CANCEL_…` | ✓ | | macOS-focused; produces a retrievable log archive in Jamf. **Verify OS-version support during impl.** |
| **Chain of custody** | Command history (issuer, timing, ack/error) | `GET /v2/mdm/commands?filter=` | ✓ | ✓ | Feeds evidence-record reconciliation |

**Deferred (v2+):** `REQUEST_MIRRORING`/`STOP_MIRRORING` (live screen — observation, not evidence), inbound inventory-derived artifacts (already in CMDB via `PLAN.md`).

---

## 3. Anti-forensic block list (enforced during an open investigation)

While a device is under an **open SIR** or **forensic hold**, the following commands are **hard-blocked** by `JamfInvestigationGuard` (§5) — they destroy or mutate evidence:

| Command | Why blocked |
|---|---|
| `ERASE_DEVICE`, `/v*/…/erase`, group-erase | Destroys all evidence (group-erase = catastrophic blast radius) |
| `RESTART_DEVICE`, `SHUT_DOWN_DEVICE` | Loses volatile memory / in-flight artifacts |
| `CLEAR_PASSCODE`, `SET_AUTO_ADMIN_PASSWORD` | Alters authentication state |
| `DELETE_USER`, `LOG_OUT_USER` | Alters user/session state |
| `remove-mdm-profile` / `unmanage` | Removes the very channel used to investigate |

Block is a **guard**, not a suggestion: the guard is invoked inside `JamfCommandService.send()` (outbound plan) and refuses the command with a logged reason, independent of who invokes it (UI Action, Flow, or script). An explicit break-glass override (e.g. `x_912401_jamf_pro.forensics.allow_destructive_override` + a second approval) is the only bypass, and it is itself audited.

---

## 4. Trigger surface — Security-Incident driven

Primary entry point is the **Security Incident (SIR, `sn_si_incident`)**; secondary is the device CI form.

- **On the SIR form** (UI Actions / Flow Designer actions against the affected CI):
  - **"Isolate Host"** → `DEVICE_LOCK` (+ `DISABLE_REMOTE_DESKTOP` on Mac) + opens/records a forensic hold on the device.
  - **"Collect Evidence Bundle"** → fires the configured read-command set (`SECURITY_INFO`, `DEVICE_INFORMATION`, `*_LIST`, `CERTIFICATE_LIST`) and, for Mac, `TRIGGER_ENHANCED_LOG_COLLECTION`; results land as evidence records attached to the SIR.
  - **"Locate Device"** (mobile) → `ENABLE_LOST_MODE` + `DEVICE_LOCATION`.
  - **"Release Hold"** → clears the forensic hold (re-enables destructive commands), audited.
- **On the CI form** (`cmdb_ci_computer` / `cmdb_ci_handheld_computing`): the same actions, but ad-hoc actions require an approval when no SIR is linked.
- **Composition**: a Flow Designer subflow **"Forensic Triage"** chains isolate → collect → attach-to-SIR so an analyst runs one action.

*Feasibility note (reconcile with `OUTBOUND_PLAN.md`):* UI Actions and Flow actions may not be first-class now-sdk fluent artifact types and may need to ship as generic `Record()` / XML — the outbound workflow is confirming this; this plan inherits whatever it concludes.

---

## 5. Architecture

Reuses from the outbound plan: `JamfConfig`, `JamfCommandClient` (OAuth token + Bearer HTTP via `sn_ws.RESTMessageV2`), `JamfCommandService` (action→endpoint/body), `JamfCommandReconciler` (async status polling), `x_912401_jamf_pro_command_log`.

**New ES5 `Class.create()` script includes** (`src/scripts/script-includes/`):

- **`JamfInvestigationGuard`** — the block-during-investigation enforcement.
  - `isUnderHold(ciSysId)` → true if device has an active `x_912401_jamf_pro_forensic_hold` or an open linked SIR.
  - `assertAllowed(ciSysId, commandType)` → throws (logged) if `commandType` ∈ block list and `isUnderHold()`, unless override property + approval present. Called from `JamfCommandService.send()`.

- **`JamfForensicsService`** — orchestrates a collection run.
  - `initialize(overrides)` — DI seam (fake client for testing).
  - `openHold(ciSysId, sirSysId, reason)` / `releaseHold(holdSysId, reason)`.
  - `isolate(ciSysId)` → lock + (Mac) disable remote desktop; opens hold.
  - `collectBundle(ciSysId, sirSysId, commandSet)` → for each read command: resolve `managementId` via `JamfDeviceRegistry` (`x_912401_jamf_pro_device`), call `JamfCommandService.send()`, create a pending `x_912401_jamf_pro_evidence` record linked to the returned Jamf command uuid.
  - `locate(ciSysId)` → mobile lost-mode + location.

- **`JamfEvidenceCollector`** — retrieval + integrity (invoked by the reconciler when a command completes).
  - `harvest(commandUuid)` → pulls the returned payload (from `GET /v2/mdm/commands` / updated inventory / log archive), serializes canonical JSON, computes **SHA-256** (`GlideDigest`/`GlideCertificateEncryption`), writes it to the evidence record, attaches the raw payload as a sys_attachment, stamps `collected_at`, sets status `collected`.
  - Log-archive case: records the Jamf download reference / retrieves and attaches the archive; hashes it.

- **`JamfForensicsReconciler`** — thin wrapper over `JamfCommandReconciler` that, on command completion, calls `JamfEvidenceCollector.harvest()` and flips evidence status; expires stalled collections after a configurable window.

**New tables** (`src/fluent/tables/`):

- **`x_912401_jamf_pro_forensic_hold`** — one row per active hold.
  | column | type | notes |
  |---|---|---|
  | `device` | Reference → cmdb_ci | the held device |
  | `security_incident` | Reference → sn_si_incident | nullable (ad-hoc holds allowed) |
  | `status` | choice {active, released} | |
  | `reason` | String(1000) | |
  | `opened_by` / `opened_at` | Reference sys_user / DateTime | |
  | `released_by` / `released_at` | Reference sys_user / DateTime | |

- **`x_912401_jamf_pro_evidence`** — one row per collected artifact (the chain-of-custody record).
  | column | type | notes |
  |---|---|---|
  | `security_incident` | Reference → sn_si_incident | evidence container |
  | `device` | Reference → cmdb_ci | |
  | `evidence_type` | choice {security_info, device_information, installed_apps, managed_apps, profiles, provisioning_profiles, certificates, managed_media, app_validation, recovery_lock, device_location, logs} | |
  | `jamf_command_uuid` | String | links to Jamf command / `x_912401_jamf_pro_command_log` |
  | `status` | choice {requested, sent, collected, error, expired} | |
  | `requested_by` / `requested_at` | Reference sys_user / DateTime | who initiated |
  | `collected_at` | DateTime | when device responded |
  | `payload_sha256` | String(64) | integrity hash |
  | `payload_size` | Integer | |
  | `error_detail` | String(4000) | |

  Raw payloads/log archives are stored as **attachments** on the evidence record, not inline columns.

**Evidence immutability / ACLs** (`src/fluent/acls/`): `x_912401_jamf_pro_evidence` — create/write by `x_912401_jamf_pro.forensics` role via the collector only; **no interactive edit or delete** after `status=collected` (write ACL denies on collected rows; delete ACL denies to all). This is what makes the record defensible.

---

## 6. Async collection lifecycle & chain of custody

```
Analyst clicks "Collect Evidence Bundle" on SIR
  → JamfForensicsService.collectBundle()
      → per command: JamfCommandService.send()  (JamfInvestigationGuard.assertAllowed passes for read cmds)
          → x_912401_jamf_pro_evidence row: status=requested → sent, jamf_command_uuid captured, requested_by/at stamped
  ... device checks in, executes command, returns data to Jamf (seconds → days) ...
  → JamfForensicsReconciler (scheduled) polls GET /v2/mdm/commands
      → on Acknowledged: JamfEvidenceCollector.harvest()
          → serialize canonical payload, SHA-256, attach raw, stamp collected_at, status=collected (now immutable)
      → on Error/expiry: status=error/expired, error_detail set
```

**Chain of custody = the tuple** {requested_by, requested_at, jamf_command_uuid, collected_at, payload_sha256, immutable-after-collected, SIR link}. Every hop is timestamped and attributable; nothing is hand-editable once collected.

---

## 7. Governance & safety

- **Roles**: `x_912401_jamf_pro.forensics` (run collection, open/release holds) — grant to SecOps analysts / map to existing `sn_si` roles; `x_912401_jamf_pro.forensics_admin` for the destructive-override break-glass.
- **Authorization gate**: ad-hoc forensic actions with no linked SIR require approval; location/log collection always require an open, approved investigation (privacy).
- **Break-glass**: destructive command on a held device needs `x_912401_jamf_pro.forensics.allow_destructive_override=true` **and** a second approval; the override event is itself written to `x_912401_jamf_pro_command_log` with justification.
- **Kill switch / dry-run**: inherit `x_912401_jamf_pro.forensics.enabled` and the outbound `x_912401_jamf_pro.command.dry_run` property.
- **Audit**: every hold open/release, evidence request, harvest, and override is logged.

---

## 8. Cross-scope privileges & Jamf API role

- **ServiceNow cross-scope**: outbound uses `sn_ws.RESTMessageV2` (no privilege). **New**: if integrating with Security Incident Response, cross-scope read/write to `sn_si_incident` (SIR is the `sn_si` scope, a separate installed app) — enumerate a `CrossScopePrivilege` for it, and make the SIR integration **conditional** (degrade gracefully to CI-only + `x_912401_jamf_pro_forensic_hold` if SIR isn't installed). `GlideDigest`/hashing is in-scope.
- **Jamf API Role**: the client must be granted **"Send MDM command information in Jamf Pro API"** / **"View MDM command information"** plus read on device inventory. Each device type + command needs its own privilege — enumerate: Send Device Lock, Send Erase (kept but guarded), View MDM Command Information, Read Computers, Read Mobile Devices, and log-collection privilege.

---

## 9. Phased build order (each phase builds & deploys green)

1. **Phase F0 — prerequisites**: depends on `OUTBOUND_PLAN.md` through the command layer (`JamfCommandClient` / `JamfCommandService` / `JamfCommandLogger` + `x_912401_jamf_pro_command_log`) and the **`x_912401_jamf_pro_device` registry (`JamfDeviceRegistry`)** that persists managementId/jamfId/udid per device (the outbound plan stores these in a companion table, not on the global CMDB CI). Do not start forensics until the command layer deploys.
2. **Phase F1 — data + guard**: `x_912401_jamf_pro_forensic_hold`, `x_912401_jamf_pro_evidence` tables + ACLs (immutability), `x_912401_jamf_pro.forensics` role, `JamfInvestigationGuard` wired into `JamfCommandService.send()`. Verify: open a hold on a test CI, confirm `ERASE_DEVICE` is refused and logged; release hold, confirm allowed.
3. **Phase F2 — collection (read path)**: `JamfForensicsService` + `JamfEvidenceCollector` + `JamfForensicsReconciler`. **Safest first live command: `SECURITY_INFO` or `DEVICE_INFORMATION`** against one enrolled test device. Verify evidence row: requested→sent→collected, SHA-256 present, raw payload attached, immutable after collection.
4. **Phase F3 — contain + locate**: isolate (lock + disable remote desktop), mobile locate/lost-mode. Verify against a spare test device (lock is reversible; do NOT test erase).
5. **Phase F4 — triggers**: SIR/CI UI Actions, the "Forensic Triage" subflow, evidence-to-SIR attachment. Conditional SIR integration.
6. **Phase F5 — hardening**: break-glass override + second approval, log-collection archive retrieval, expiry/stall handling, analyst runbook doc.

**Testing without touching a real device / without SIR installed**: DI fake client returns fixture command payloads; assert hashing, immutability ACLs, and guard behavior. HTTP path validated with `SECURITY_INFO` on a lab device; `dry_run` short-circuits sends and writes would-be evidence stubs.

---

## 10. Risks & open questions

1. **Admissibility / defensibility** — MDM metadata is not court-grade forensic acquisition. The chain-of-custody model documents provenance, but legal should confirm what's acceptable; label evidence as "MDM-derived, as-of-check-in."
2. **Async / offline** — an offline, locked, or wiped device returns no evidence; collections must expire cleanly and say so.
3. **`TRIGGER_ENHANCED_LOG_COLLECTION` OS support** — availability and the log-archive retrieval API path need verification against the target Jamf/macOS versions; may be limited.
4. **`DEVICE_LOCATION`** — supervised-only, generally needs Lost Mode; Macs don't report location via MDM. Manage analyst expectations.
5. **Privacy/legal** — location and log collection on user-owned or employee devices need policy sign-off; the approval gate is mandatory, not optional.
6. **SIR dependency** — Security Incident Response is a separate paid app; integration must degrade gracefully when absent.
7. **Computer lock/erase PIN** — the 6-digit PIN must be captured and surfaced to the analyst (and stored), or the device can't be unlocked; losing it is unrecoverable.
8. **Guard bypass surface** — the block must live in the lowest common chokepoint (`JamfCommandService.send()`), or a direct script call could route around it. Verify no send path skips the guard.
