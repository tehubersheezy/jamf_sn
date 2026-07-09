import '@servicenow/sdk/global'
import { ScheduledScript } from '@servicenow/sdk/core'

// OUTBOUND_PLAN §6. Runs the outbound command reconciler on a fixed interval.
// frequency 'periodically' + executionInterval (a Duration) — NOT daily/
// executionTime. Inline one-liner runs in-scope so package_private script
// includes resolve. Cadence mirrors x_912401_jamf_pro.command.reconcile_interval_min.
ScheduledScript({
    $id: Now.ID['command-reconciler-job'],
    name: 'Jamf Command Reconciler',
    frequency: 'periodically',
    executionInterval: { minutes: 10 },
    timeZone: 'floating',
    active: true,
    script: 'new x_912401_jamf_pro.JamfCommandReconciler().run();',
})
