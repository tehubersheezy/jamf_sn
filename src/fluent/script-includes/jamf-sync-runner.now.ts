import '@servicenow/sdk/global'
import { ScriptInclude } from '@servicenow/sdk/core'

// Orchestrator / scheduled-script entry point for the Jamf -> CMDB sync.
// The JS body is ES5 Class.create(); keep it in its own file and pull it in
// with Now.include() (ScriptInclude scripts are string-only).
ScriptInclude({
    $id: Now.ID['JamfSyncRunner'],
    name: 'JamfSyncRunner', // must match the class name and its `type` property
    description: 'Orchestrates the Jamf Pro -> CMDB sync run (config/mutex checks, per-type sync, run-log finalize, retention cleanup).',
    script: Now.include('../../scripts/script-includes/JamfSyncRunner.js'),
    clientCallable: false,
    accessibleFrom: 'package_private',
})
