import '@servicenow/sdk/global'
import { ScriptInclude } from '@servicenow/sdk/core'

ScriptInclude({
    $id: Now.ID['JamfComputerMapper'],
    name: 'JamfComputerMapper', // must match the class name and its `type` property
    description: 'Maps Jamf Pro computer inventory records into IRE payload fragments for the CMDB.',
    script: Now.include('../../scripts/script-includes/JamfComputerMapper.js'),
    clientCallable: false,
    accessibleFrom: 'package_private',
})
