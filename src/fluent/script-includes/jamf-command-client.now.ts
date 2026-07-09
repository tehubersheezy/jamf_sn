import '@servicenow/sdk/global'
import { ScriptInclude } from '@servicenow/sdk/core'

// Thin semantic HTTP verbs for outbound Jamf actions. Composes JamfApiClient;
// holds endpoint knowledge only.
ScriptInclude({
    $id: Now.ID['JamfCommandClient'],
    name: 'JamfCommandClient',
    description: 'Semantic Jamf Pro action endpoints (MDM command queue + dedicated v1/v2 endpoints).',
    script: Now.include('../../scripts/script-includes/JamfCommandClient.js'),
    clientCallable: false,
    accessibleFrom: 'package_private',
})
