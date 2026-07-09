import '@servicenow/sdk/global'
import { Acl } from '@servicenow/sdk/core'
import { adminRole, operatorRole } from '../roles/roles.now'

// Record ACLs for x_912401_jamf_pro_device. Operators need read (UI Actions resolve
// management_id/jamf_id from here); writes come from the in-scope registry
// (which bypasses ACLs), so restricting create/write/delete to admin is safe.

Acl({
    $id: Now.ID['device-read-acl'],
    type: 'record',
    table: 'x_912401_jamf_pro_device',
    operation: 'read',
    roles: [operatorRole],
})

Acl({
    $id: Now.ID['device-create-acl'],
    type: 'record',
    table: 'x_912401_jamf_pro_device',
    operation: 'create',
    roles: [adminRole],
})

Acl({
    $id: Now.ID['device-write-acl'],
    type: 'record',
    table: 'x_912401_jamf_pro_device',
    operation: 'write',
    roles: [adminRole],
})

Acl({
    $id: Now.ID['device-delete-acl'],
    type: 'record',
    table: 'x_912401_jamf_pro_device',
    operation: 'delete',
    roles: [adminRole],
})
