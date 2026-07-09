import '@servicenow/sdk/global'
import { ScriptInclude } from '@servicenow/sdk/core'

// ScriptInclude scripts are string-only — the ES5 Class.create() body lives in
// its own .js file and is pulled in with Now.include() (keeps highlighting and
// two-way sync). name === class name === the class's `type` property.
ScriptInclude({
    $id: Now.ID['JamfConfig'],
    name: 'JamfConfig',
    description:
        'Single source of truth for x_912401_jamf_pro system-property reads and validation; every other Jamf class takes a JamfConfig instance.',
    script: Now.include('../../scripts/script-includes/JamfConfig.js'),
    clientCallable: false,
    accessibleFrom: 'package_private',
})
