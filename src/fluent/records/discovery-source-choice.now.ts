import '@servicenow/sdk/global'
import { Record } from '@servicenow/sdk/core'

// Discovery source choice (PLAN §3.4). Adds 'JamfPro' to the cmdb_ci
// discovery_source choice list so CIs created by this connector surface a
// clean, unambiguous source (distinct from ServiceNow's own SG-Jamf).
// This is a sys_choice row on the foreign cmdb_ci table shipped as app data.

Record({
    $id: Now.ID['discovery-source-jamfpro'],
    table: 'sys_choice',
    data: {
        name: 'cmdb_ci',
        element: 'discovery_source',
        value: 'JamfPro',
        label: 'JamfPro',
        language: 'en',
        inactive: false,
        sequence: 100,
    },
})
