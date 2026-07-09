import '@servicenow/sdk/global'
import {
    BooleanColumn,
    DateTimeColumn,
    IntegerColumn,
    ReferenceColumn,
    StringColumn,
    Table,
} from '@servicenow/sdk/core'

// OUTBOUND_PLAN §3: the identifier prerequisite. One uniform row per Jamf device
// across both platforms, owned entirely by this scope, so outbound actions can
// resolve the three Jamf identifiers (managementId / jamf id / udid) WITHOUT
// writing to the global cmdb_ci tables. Upserted by JamfDeviceRegistry after the
// inbound IRE flush. Coalesce on (jamf_id + device_type).
export const x_912401_jamf_pro_device = Table({
    name: 'x_912401_jamf_pro_device',
    label: 'Jamf Device',
    allowWebServiceAccess: true,
    schema: {
        ci: ReferenceColumn({
            label: 'Configuration item',
            referenceTable: 'cmdb_ci', // the CI IRE created/updated (computer & handheld)
        }),
        device_type: StringColumn({
            label: 'Device type',
            choices: { computer: 'Computer', mobile: 'Mobile' },
            dropdown: 'dropdown_without_none',
        }),
        jamf_id: IntegerColumn({ label: 'Jamf ID' }),
        management_id: StringColumn({ label: 'Management ID' }),
        udid: StringColumn({ label: 'UDID' }),
        serial_number: StringColumn({ label: 'Serial number' }),
        managed: BooleanColumn({ label: 'Managed', default: true }),
        last_seen: DateTimeColumn({ label: 'Last seen' }),
    },
})
