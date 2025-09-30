Convex lets you easily schedule a function to run once or repeatedly in the future. This allows you to build durable workflows like sending a welcome email a day after someone joins or regularly reconciling your accounts with Stripe. Convex provides two different features for scheduling:

Scheduled Functions can be scheduled durably by any other function to run at a later point in time. You can schedule functions minutes, days, and even months in the future.
Cron Jobs schedule functions to run on a recurring basis, such as daily.
Durable function components
Built-in scheduled functions and crons work well for simpler apps and workflows. If you're operating at high scale or need more specific guarantees, use the following higher-level components for durable functions.

Convex component
Workpool
Workpool give critical tasks priority by organizing async operations into separate, customizable queues.

Convex component
Workflow
Simplify programming long running code flows. Workflows execute durably with configurable retries and delays.

Convex component
Action Retrier
Add reliability to an unreliable external service. Retry idempotent calls a set number of times.

Convex component
Crons
Use cronspec to run functions on a repeated schedule at runtime.