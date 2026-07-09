import '@servicenow/sdk/global'
import { ScriptInclude } from '@servicenow/sdk/core'

// Shared mapping helpers extended by JamfComputerMapper / JamfMobileDeviceMapper
// via Object.extendsObject(x_912401_jamf_pro.JamfMapperBase, {...}). ES5 body lives in
// its own .js file, pulled in with Now.include() for string-only script APIs.
ScriptInclude({
    $id: Now.ID['JamfMapperBase'],
    name: 'JamfMapperBase', // must match the class name and its `type` property
    description: 'Shared Jamf → CMDB IRE mapping helpers (base for the device mappers)',
    script: Now.include('../../scripts/script-includes/JamfMapperBase.js'),
    clientCallable: false,
    accessibleFrom: 'package_private',
})
