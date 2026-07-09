import '@servicenow/sdk/global'
import { ScriptInclude } from '@servicenow/sdk/core'

// Owns x_912401_jamf_pro_device: persists managementId/jamf id/udid per device so
// outbound actions can resolve a target without touching the global CMDB.
ScriptInclude({
    $id: Now.ID['JamfDeviceRegistry'],
    name: 'JamfDeviceRegistry',
    description: 'Upserts x_912401_jamf_pro_device rows (identifiers + CI) from inbound Jamf device JSON.',
    script: Now.include('../../scripts/script-includes/JamfDeviceRegistry.js'),
    clientCallable: false,
    accessibleFrom: 'package_private',
})
