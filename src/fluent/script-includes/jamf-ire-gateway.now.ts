import '@servicenow/sdk/global'
import { ScriptInclude } from '@servicenow/sdk/core'

ScriptInclude({
    $id: Now.ID['JamfIreGateway'],
    name: 'JamfIreGateway', // must match the class name and its `type` property
    description: 'Streaming IRE batcher — the only class that calls sn_cmdb.IdentificationEngine.createOrUpdateCIEnhanced.',
    script: Now.include('../../scripts/script-includes/JamfIreGateway.js'),
    clientCallable: false,
    accessibleFrom: 'package_private',
})
