import '@servicenow/sdk/global'
import { Role } from '@servicenow/sdk/core'

// Role names must be scoped: '<scope>.<name>'. Role identity is derived from
// `name` (no $id needed) — renaming a role creates a new one.

// Non-destructive outbound actions + read access to the command log.
export const operatorRole = Role({
    name: 'x_912401_jamf_pro.operator',
    description: 'Run non-destructive Jamf device actions (blank push, lock mobile, restart, lost mode) and read the command log',
})

// Approves destructive actions (erase, unmanage, macOS firmware lock, deploy package).
export const approverRole = Role({
    name: 'x_912401_jamf_pro.approver',
    description: 'Approve destructive Jamf device actions',
})

// Full control: import-run/command-log records, unlock PINs, destructive
// actions, and configuration properties. Contains the operator role.
export const adminRole = Role({
    name: 'x_912401_jamf_pro.admin',
    description: 'Full control over the Jamf CMDB Connector: records, unlock PINs, destructive actions, and configuration properties',
    containsRoles: [operatorRole],
})
