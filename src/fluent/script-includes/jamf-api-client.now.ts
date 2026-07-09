import '@servicenow/sdk/global'
import { ScriptInclude } from '@servicenow/sdk/core'

// OAuth (client credentials) + generic paginated HTTP client for the Jamf Pro
// API. Server-side only — never called from the client. Kept package_private
// so it is reachable only from within the x_912401_jamf_pro scope.
ScriptInclude({
    $id: Now.ID['JamfApiClient'],
    name: 'JamfApiClient', // must match the class name and its `type` property
    description: 'OAuth token management + paginated Jamf Pro REST access (sn_ws.RESTMessageV2).',
    script: Now.include('../../scripts/script-includes/JamfApiClient.js'),
    clientCallable: false,
    accessibleFrom: 'package_private',
})
