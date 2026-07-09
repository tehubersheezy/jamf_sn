import '@servicenow/sdk/global'
import { ScriptInclude } from '@servicenow/sdk/core'

// Periodic job body: send pass + poll pass + expiry pass for the command log.
ScriptInclude({
    $id: Now.ID['JamfCommandReconciler'],
    name: 'JamfCommandReconciler',
    description: 'Sends approved/pending commands, polls async MDM status, and expires stale rows.',
    script: Now.include('../../scripts/script-includes/JamfCommandReconciler.js'),
    clientCallable: false,
    accessibleFrom: 'package_private',
})
