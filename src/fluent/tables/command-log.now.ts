import '@servicenow/sdk/global'
import {
    BooleanColumn,
    DateTimeColumn,
    IntegerColumn,
    ReferenceColumn,
    StringColumn,
    Table,
} from '@servicenow/sdk/core'

// OUTBOUND_PLAN §4.2: system-of-record audit table for every outbound MDM
// command — what was sent, by whom, to which device, its (secret-redacted)
// payload, and its async lifecycle status. `approval` is a plain StringColumn
// holding a sysapproval_approver sys_id (that table is not in the shipped
// typedefs, so a typed ReferenceColumn would not compile). `unlock_pin` is a
// plain string (NOT password2 — an operator must read it back to unlock the
// Mac) and is ACL-locked to the admin role.
export const x_912401_jamf_pro_command_log = Table({
    name: 'x_912401_jamf_pro_command_log',
    label: 'Jamf Command Log',
    allowWebServiceAccess: true,
    schema: {
        target_ci: ReferenceColumn({ label: 'Target CI', referenceTable: 'cmdb_ci' }),
        device: ReferenceColumn({ label: 'Jamf device', referenceTable: 'x_912401_jamf_pro_device' }),
        device_type: StringColumn({
            label: 'Device type',
            choices: { computer: 'Computer', mobile: 'Mobile' },
            dropdown: 'dropdown_without_none',
        }),
        action: StringColumn({
            label: 'Action',
            choices: {
                BLANK_PUSH: 'Blank push',
                DEVICE_LOCK: 'Device lock',
                CLEAR_PASSCODE: 'Clear passcode',
                RESTART_DEVICE: 'Restart device',
                SHUT_DOWN_DEVICE: 'Shut down device',
                ENABLE_LOST_MODE: 'Enable lost mode',
                DISABLE_LOST_MODE: 'Disable lost mode',
                PLAY_LOST_MODE_SOUND: 'Play lost mode sound',
                REDEPLOY_FRAMEWORK: 'Redeploy management framework',
                MACOS_UPDATE: 'macOS software update',
                UPDATE_PLAN_DEVICES: 'Software update plan (devices)',
                UPDATE_PLAN_GROUP: 'Software update plan (group)',
                DEPLOY_PACKAGE: 'Deploy package',
                COMPUTER_ERASE: 'Erase computer',
                COMPUTER_REMOVE_MDM: 'Remove MDM profile (computer)',
                MOBILE_ERASE: 'Erase mobile device',
                MOBILE_UNMANAGE: 'Unmanage mobile device',
                ERASE_DEVICE: 'Erase device (command queue)',
                RENEW_PROFILE: 'Renew MDM profile',
                GROUP_ERASE: 'Erase mobile device group',
            },
            dropdown: 'dropdown_without_none',
        }),
        target_management_id: StringColumn({ label: 'Target management ID' }),
        target_jamf_id: IntegerColumn({ label: 'Target Jamf ID' }),
        target_udid: StringColumn({ label: 'Target UDID' }),
        action_payload: StringColumn({
            label: 'Action payload (redacted)',
            maxLength: 4000, // secrets (pin/credentials) masked to *** before write
        }),
        jamf_command_uuid: StringColumn({ label: 'Jamf command UUID' }),
        reconcile_mode: StringColumn({
            label: 'Reconcile mode',
            choices: { uuid: 'UUID', effect: 'Effect', none: 'None' },
            dropdown: 'dropdown_without_none',
        }),
        status: StringColumn({
            label: 'Status',
            choices: {
                requested: 'Requested',
                pending_approval: 'Pending approval',
                approved: 'Approved',
                rejected: 'Rejected',
                dry_run: 'Dry run',
                pending_send: 'Pending send',
                sent: 'Sent',
                not_now: 'Not now',
                acknowledged: 'Acknowledged',
                error: 'Error',
                expired: 'Expired',
                canceled: 'Canceled',
            },
            dropdown: 'dropdown_without_none',
            default: 'requested',
        }),
        is_destructive: BooleanColumn({ label: 'Destructive', default: false }),
        dedupe_key: StringColumn({ label: 'Dedupe key' }),
        unlock_pin: StringColumn({ label: 'Unlock PIN' }), // ACL-locked to admin
        requested_by: ReferenceColumn({ label: 'Requested by', referenceTable: 'sys_user' }),
        approved_by: ReferenceColumn({ label: 'Approved by', referenceTable: 'sys_user' }),
        approval: StringColumn({ label: 'Approval (sysapproval_approver sys_id)' }),
        approval_state: StringColumn({ label: 'Approval state' }),
        source: StringColumn({
            label: 'Source',
            choices: {
                ui_action: 'UI action',
                catalog: 'Catalog',
                flow: 'Flow',
                security_incident: 'Security incident',
                api: 'API',
            },
            dropdown: 'dropdown_without_none',
        }),
        batch: StringColumn({ label: 'Batch' }),
        http_status: IntegerColumn({ label: 'HTTP status' }),
        date_requested: DateTimeColumn({ label: 'Requested' }),
        date_sent: DateTimeColumn({ label: 'Sent' }),
        date_acknowledged: DateTimeColumn({ label: 'Acknowledged' }),
        date_expires: DateTimeColumn({ label: 'Expires' }),
        poll_attempts: IntegerColumn({ label: 'Poll attempts', default: 0 }),
        last_polled: DateTimeColumn({ label: 'Last polled' }),
        error_reason: StringColumn({ label: 'Error reason', maxLength: 4000 }),
    },
})
