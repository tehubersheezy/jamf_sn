import '@servicenow/sdk/global'
import { ScriptInclude } from '@servicenow/sdk/core'

// The single place that writes x_912401_jamf_pro_command_log. Mirrors JamfRunLogger.
ScriptInclude({
    $id: Now.ID['JamfCommandLogger'],
    name: 'JamfCommandLogger',
    description: 'Insert/update/read access to the x_912401_jamf_pro_command_log audit table.',
    script: Now.include('../../scripts/script-includes/JamfCommandLogger.js'),
    clientCallable: false,
    accessibleFrom: 'package_private',
})
