import '@servicenow/sdk/global'
import { Acl } from '@servicenow/sdk/core'
import { adminRole, operatorRole } from '../roles/roles.now'

// OUTBOUND_PLAN §7 defense-in-depth. Operators may READ the command log and
// CREATE requests; only admin may WRITE/DELETE. Runtime state transitions come
// from in-scope server scripts (which bypass ACLs). Two FIELD-level read ACLs
// then claw back the sensitive columns to admin only, so an operator sees the
// audit trail but never the unlock PIN or the raw payload.

Acl({
    $id: Now.ID['command-log-read-acl'],
    type: 'record',
    table: 'x_912401_jamf_pro_command_log',
    operation: 'read',
    roles: [operatorRole],
})

Acl({
    $id: Now.ID['command-log-create-acl'],
    type: 'record',
    table: 'x_912401_jamf_pro_command_log',
    operation: 'create',
    roles: [operatorRole],
})

Acl({
    $id: Now.ID['command-log-write-acl'],
    type: 'record',
    table: 'x_912401_jamf_pro_command_log',
    operation: 'write',
    roles: [adminRole],
})

Acl({
    $id: Now.ID['command-log-delete-acl'],
    type: 'record',
    table: 'x_912401_jamf_pro_command_log',
    operation: 'delete',
    roles: [adminRole],
})

// Field-level: the unlock/erase PIN is readable ONLY by admins.
Acl({
    $id: Now.ID['command-log-pin-field-acl'],
    type: 'record',
    table: 'x_912401_jamf_pro_command_log',
    operation: 'read',
    field: 'unlock_pin',
    roles: [adminRole],
})

// Field-level: the sent payload is admin-only too (belt-and-suspenders — it is
// already secret-redacted before write, but this guards against any gap).
Acl({
    $id: Now.ID['command-log-payload-field-acl'],
    type: 'record',
    table: 'x_912401_jamf_pro_command_log',
    operation: 'read',
    field: 'action_payload',
    roles: [adminRole],
})
