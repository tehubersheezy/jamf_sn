import '@servicenow/sdk/global'
import { ScriptInclude } from '@servicenow/sdk/core'

ScriptInclude({
    $id: Now.ID['JamfMobileDeviceMapper'],
    name: 'JamfMobileDeviceMapper', // must match the class name and its `type` property
    description: 'Maps a Jamf Pro mobile-device payload to an IRE fragment (cmdb_ci_handheld_computing).',
    script: Now.include('../../scripts/script-includes/JamfMobileDeviceMapper.js'),
    clientCallable: false,
    accessibleFrom: 'package_private',
})
