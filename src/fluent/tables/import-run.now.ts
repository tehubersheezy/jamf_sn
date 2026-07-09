import '@servicenow/sdk/global'
import {
    DateTimeColumn,
    IntegerColumn,
    StringColumn,
    Table,
} from '@servicenow/sdk/core'

// The exported variable name MUST match the `name` property exactly — the build
// enforces this. Columns on a table you own take no scope prefix.
// allowWebServiceAccess is required for REST access via /api/now/table.
export const x_912401_jamf_pro_import_run = Table({
    name: 'x_912401_jamf_pro_import_run',
    label: 'Jamf Import Run',
    allowWebServiceAccess: true,
    schema: {
        run_type: StringColumn({
            label: 'Run type',
            choices: {
                scheduled: 'Scheduled',
                manual: 'Manual',
                test: 'Test',
            },
            dropdown: 'dropdown_without_none',
        }),
        status: StringColumn({
            label: 'Status',
            choices: {
                running: 'Running',
                completed: 'Completed',
                completed_with_errors: 'Completed with errors',
                failed: 'Failed',
                skipped: 'Skipped',
            },
            dropdown: 'dropdown_without_none',
            default: 'running',
        }),
        started: DateTimeColumn({ label: 'Started' }),
        ended: DateTimeColumn({ label: 'Ended' }),
        computers_fetched: IntegerColumn({ label: 'Computers fetched', default: 0 }),
        mobile_fetched: IntegerColumn({ label: 'Mobile devices fetched', default: 0 }),
        inserts: IntegerColumn({ label: 'Inserts', default: 0 }),
        updates: IntegerColumn({ label: 'Updates', default: 0 }),
        no_change: IntegerColumn({ label: 'No change', default: 0 }),
        errors: IntegerColumn({ label: 'Errors', default: 0 }),
        message: StringColumn({
            label: 'Message',
            maxLength: 1000,
        }),
        error_detail: StringColumn({
            label: 'Error detail',
            maxLength: 8000, // >= 255 renders as a multi-line textarea in forms
        }),
    },
})
