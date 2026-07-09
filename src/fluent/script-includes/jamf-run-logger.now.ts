import '@servicenow/sdk/global'
import { ScriptInclude } from '@servicenow/sdk/core'

ScriptInclude({
    $id: Now.ID['JamfRunLogger'],
    name: 'JamfRunLogger', // must match the class name and its `type` property
    description: 'Writer/reader for the x_912401_jamf_pro_import_run run-log table (start/skip/complete lifecycle, stale-run mutex, IRE stat accumulation, retention cleanup).',
    script: Now.include('../../scripts/script-includes/JamfRunLogger.js'),
    clientCallable: false,
    accessibleFrom: 'package_private',
})
