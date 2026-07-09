import '@servicenow/sdk/global'
import { Acl } from '@servicenow/sdk/core'
import { adminRole } from '../roles/roles.now'

// Record ACLs for the x_912401_jamf_pro_import_run table. Reference the Role object
// directly — never hardcode sys_ids. One ACL per operation keeps intent
// auditable. Runtime writes come from the server-side scoped scripts and bypass
// ACLs, so restricting every operation to the admin role is safe.

Acl({
    $id: Now.ID['import-run-read-acl'],
    type: 'record',
    table: 'x_912401_jamf_pro_import_run',
    operation: 'read',
    roles: [adminRole],
})

Acl({
    $id: Now.ID['import-run-create-acl'],
    type: 'record',
    table: 'x_912401_jamf_pro_import_run',
    operation: 'create',
    roles: [adminRole],
})

Acl({
    $id: Now.ID['import-run-write-acl'],
    type: 'record',
    table: 'x_912401_jamf_pro_import_run',
    operation: 'write',
    roles: [adminRole],
})

Acl({
    $id: Now.ID['import-run-delete-acl'],
    type: 'record',
    table: 'x_912401_jamf_pro_import_run',
    operation: 'delete',
    roles: [adminRole],
})
