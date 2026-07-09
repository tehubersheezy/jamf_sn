import '@servicenow/sdk/global'
import { ApplicationMenu, Record } from '@servicenow/sdk/core'
import { adminRole } from '../roles/roles.now'

// Navigator entry (PLAN §3.7). The ApplicationMenu is the top-level section;
// sys_app_module Records are the clickable items. Modules default to
// active: false — always set active: true.

export const appMenu = ApplicationMenu({
    $id: Now.ID['app-menu'],
    title: 'Jamf CMDB Connector',
    description: 'Inbound Jamf Pro to CMDB synchronization',
    roles: [adminRole],
    active: true,
})

Record({
    $id: Now.ID['app-menu-import-runs'],
    table: 'sys_app_module',
    data: {
        title: 'Import Runs',
        application: appMenu,
        link_type: 'LIST',
        name: 'x_912401_jamf_pro_import_run',
        active: true,
        order: 100,
    },
})

Record({
    $id: Now.ID['app-menu-properties'],
    table: 'sys_app_module',
    data: {
        title: 'Properties',
        application: appMenu,
        link_type: 'LIST',
        name: 'sys_properties',
        filter: 'nameSTARTSWITHx_912401_jamf_pro.',
        active: true,
        order: 200,
    },
})

Record({
    $id: Now.ID['app-menu-scheduled-sync'],
    table: 'sys_app_module',
    data: {
        title: 'Scheduled Sync',
        application: appMenu,
        link_type: 'LIST',
        name: 'sysauto_script',
        filter: 'nameSTARTSWITHJamf CMDB',
        active: true,
        order: 300,
    },
})

// Outbound device-action modules (OUTBOUND_PLAN §7).
Record({
    $id: Now.ID['app-menu-mdm-commands'],
    table: 'sys_app_module',
    data: {
        title: 'MDM Commands',
        application: appMenu,
        link_type: 'LIST',
        name: 'x_912401_jamf_pro_command_log',
        active: true,
        order: 150,
    },
})

Record({
    $id: Now.ID['app-menu-devices'],
    table: 'sys_app_module',
    data: {
        title: 'Devices',
        application: appMenu,
        link_type: 'LIST',
        name: 'x_912401_jamf_pro_device',
        active: true,
        order: 175,
    },
})
