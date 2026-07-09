import '@servicenow/sdk/global'
import { Property } from '@servicenow/sdk/core'
import { adminRole } from '../roles/roles.now'

// System properties are the standard way to make behavior tunable without a
// code deploy. Read at runtime via gs.getProperty('x_912401_jamf_pro.<name>').
// Every property restricts read + write to the admin role — the client_secret
// especially must never be readable by unprivileged users.

Property({
    $id: Now.ID['prop-base-url'],
    name: 'x_912401_jamf_pro.base_url',
    type: 'string',
    value: '',
    description: 'Jamf Pro base URL, e.g. https://yourorg.jamfcloud.com (trailing slash stripped at read time)',
    roles: {
        read: [adminRole],
        write: [adminRole],
    },
})

Property({
    $id: Now.ID['prop-client-id'],
    name: 'x_912401_jamf_pro.client_id',
    type: 'string',
    value: '',
    description: 'Jamf Pro API client (OAuth) client_id',
    roles: {
        read: [adminRole],
        write: [adminRole],
    },
})

Property({
    $id: Now.ID['prop-client-secret'],
    name: 'x_912401_jamf_pro.client_secret',
    type: 'password2',
    value: '',
    description: 'Jamf Pro API client (OAuth) client_secret — encrypted (password2)',
    roles: {
        read: [adminRole],
        write: [adminRole],
    },
})

Property({
    $id: Now.ID['prop-sync-enabled'],
    name: 'x_912401_jamf_pro.sync.enabled',
    type: 'boolean',
    value: 'true',
    description: 'Master kill switch for the Jamf CMDB sync. When false, scheduled runs are recorded as skipped',
    roles: {
        read: [adminRole],
        write: [adminRole],
    },
})

Property({
    $id: Now.ID['prop-sync-computers-enabled'],
    name: 'x_912401_jamf_pro.sync.computers.enabled',
    type: 'boolean',
    value: 'true',
    description: 'Enable syncing Jamf computer inventory into the CMDB',
    roles: {
        read: [adminRole],
        write: [adminRole],
    },
})

Property({
    $id: Now.ID['prop-sync-mobile-enabled'],
    name: 'x_912401_jamf_pro.sync.mobile_devices.enabled',
    type: 'boolean',
    value: 'true',
    description: 'Enable syncing Jamf mobile devices into the CMDB',
    roles: {
        read: [adminRole],
        write: [adminRole],
    },
})

Property({
    $id: Now.ID['prop-page-size'],
    name: 'x_912401_jamf_pro.page_size',
    type: 'integer',
    value: '100',
    description: 'Jamf API page size (clamped 1–200 per Jamf max)',
    roles: {
        read: [adminRole],
        write: [adminRole],
    },
})

Property({
    $id: Now.ID['prop-ire-batch-size'],
    name: 'x_912401_jamf_pro.ire.batch_size',
    type: 'integer',
    value: '200',
    description: 'Devices per IRE createOrUpdateCIEnhanced call (item hard cap of 450 enforced in code)',
    roles: {
        read: [adminRole],
        write: [adminRole],
    },
})

Property({
    $id: Now.ID['prop-discovery-source'],
    name: 'x_912401_jamf_pro.discovery_source',
    type: 'string',
    value: 'JamfPro',
    description: 'CMDB discovery_source value written for CIs sourced from Jamf',
    roles: {
        read: [adminRole],
        write: [adminRole],
    },
})

Property({
    $id: Now.ID['prop-mobile-detail-mode'],
    name: 'x_912401_jamf_pro.mobile.detail_mode',
    type: 'string',
    value: 'bulk',
    description: 'Mobile device detail fetch mode: bulk | per_device (bulk falls back to per_device on HTTP 404)',
    roles: {
        read: [adminRole],
        write: [adminRole],
    },
})

Property({
    $id: Now.ID['prop-map-assigned-to'],
    name: 'x_912401_jamf_pro.map_assigned_to',
    type: 'boolean',
    value: 'false',
    description: 'Resolve and set assigned_to on CIs from the Jamf userAndLocation.email (only on unique sys_user match)',
    roles: {
        read: [adminRole],
        write: [adminRole],
    },
})

Property({
    $id: Now.ID['prop-run-log-retention-days'],
    name: 'x_912401_jamf_pro.run_log.retention_days',
    type: 'integer',
    value: '90',
    description: 'Days to retain x_912401_jamf_pro_import_run records before cleanup deletes them',
    roles: {
        read: [adminRole],
        write: [adminRole],
    },
})

Property({
    $id: Now.ID['prop-log-verbose'],
    name: 'x_912401_jamf_pro.log.verbose',
    type: 'boolean',
    value: 'false',
    description: 'Emit verbose gs.info debug logging during sync runs',
    roles: {
        read: [adminRole],
        write: [adminRole],
    },
})

// ---- Outbound device-action properties (OUTBOUND_PLAN §4.3) --------------
// Outbound is OFF by default (kill switch) and dry-run is ON by default, so the
// action layer can be exercised without touching a real device until enabled.

Property({
    $id: Now.ID['prop-actions-enabled'],
    name: 'x_912401_jamf_pro.actions.enabled',
    type: 'boolean',
    value: 'false',
    description: 'Master outbound kill switch. When false, no MDM command is ever POSTed to Jamf',
    roles: {
        read: [adminRole],
        write: [adminRole],
    },
})

Property({
    $id: Now.ID['prop-actions-destructive-enabled'],
    name: 'x_912401_jamf_pro.actions.destructive.enabled',
    type: 'boolean',
    value: 'false',
    description: 'Coarse global gate for destructive/catastrophic actions (in addition to the per-request approval enforced in JamfCommandService)',
    roles: {
        read: [adminRole],
        write: [adminRole],
    },
})

Property({
    $id: Now.ID['prop-actions-dry-run'],
    name: 'x_912401_jamf_pro.actions.dry_run',
    type: 'boolean',
    value: 'true',
    description: 'When true, commands are logged as dry_run with secrets redacted and NOT sent to Jamf',
    roles: {
        read: [adminRole],
        write: [adminRole],
    },
})

Property({
    $id: Now.ID['prop-command-batch-size'],
    name: 'x_912401_jamf_pro.command.batch_size',
    type: 'integer',
    value: '50',
    description: 'Max managementIds per /v2/mdm/commands POST',
    roles: {
        read: [adminRole],
        write: [adminRole],
    },
})

Property({
    $id: Now.ID['prop-command-expiry-hours'],
    name: 'x_912401_jamf_pro.command.expiry_hours',
    type: 'integer',
    value: '72',
    description: 'Hours after which a non-terminal command row is marked expired',
    roles: {
        read: [adminRole],
        write: [adminRole],
    },
})

Property({
    $id: Now.ID['prop-command-group-erase-max'],
    name: 'x_912401_jamf_pro.command.group_erase_max',
    type: 'integer',
    value: '0',
    description: 'Max group size erasable via GROUP_ERASE; 0 = group erase disabled (blast-radius guard)',
    roles: {
        read: [adminRole],
        write: [adminRole],
    },
})

Property({
    $id: Now.ID['prop-command-reconcile-interval-min'],
    name: 'x_912401_jamf_pro.command.reconcile_interval_min',
    type: 'integer',
    value: '10',
    description: 'Reconciler cadence in minutes (informational; the ScheduledScript interval is the source of truth)',
    roles: {
        read: [adminRole],
        write: [adminRole],
    },
})
