import '@servicenow/sdk/global'
import { ScheduledScript } from '@servicenow/sdk/core'

// Scheduled Script Execution that drives the daily Jamf -> CMDB sync.
// Decision (PLAN §3.6): inline one-liner string, not a server module — the
// string runs in-scope so package_private script includes resolve. Manual
// runs = "Execute Now" on the job, or a scoped background script calling
// new x_912401_jamf_pro.JamfSyncRunner().run('manual').
// executionTime is a TimeOfDay object ({ hours, minutes, seconds }), NOT a
// string — verified against sys/ScheduledScript.d.ts (TimeOfDay in Duration.d.ts).

ScheduledScript({
    $id: Now.ID['daily-sync-job'],
    name: 'Jamf CMDB Daily Sync',
    frequency: 'daily',
    executionTime: { hours: 2, minutes: 0, seconds: 0 },
    timeZone: 'floating',
    active: true,
    script: "new x_912401_jamf_pro.JamfSyncRunner().run('scheduled');",
})
