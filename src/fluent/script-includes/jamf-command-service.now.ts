import '@servicenow/sdk/global'
import { ScriptInclude } from '@servicenow/sdk/core'

// The brain + enforcement layer: maps a command row to endpoint/body/identifier,
// owns kill-switch/dry-run/dedupe/in-flight/blast-radius guards, PIN capture,
// secret redaction, and the dual (create + send) approval gate.
ScriptInclude({
    $id: Now.ID['JamfCommandService'],
    name: 'JamfCommandService',
    description: 'Creates, guards, and sends outbound Jamf MDM commands with service-layer approval enforcement.',
    script: Now.include('../../scripts/script-includes/JamfCommandService.js'),
    clientCallable: false,
    accessibleFrom: 'package_private',
})
