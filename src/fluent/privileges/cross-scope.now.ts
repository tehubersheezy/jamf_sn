import '@servicenow/sdk/global'
import { CrossScopePrivilege } from '@servicenow/sdk/core'

// Cross-scope privilege (PLAN §3.5). The only privilege required up front:
// permission to execute sn_cmdb.IdentificationEngine (the IRE) from this
// scope — JamfIreGateway calls createOrUpdateCIEnhanced on it.
// operation:'execute' pairs with targetType:'scriptable' per the discriminated
// union in app/CrossScopePrivilege.d.ts.
// Not needed: sn_ws.RESTMessageV2, gs.getProperty, GlideDateTime, sys_user
// reads — all default-available to scoped scripts. After the first live run,
// check sys_scope_privilege for any auto-created 'requested' rows and
// `pnpm run transform` to pull them into source.

CrossScopePrivilege({
    $id: Now.ID['xsp-ire-execute'],
    operation: 'execute',
    status: 'allowed',
    targetName: 'sn_cmdb.IdentificationEngine',
    targetScope: 'sn_cmdb',
    targetType: 'scriptable',
})
