Debugging is the process of figuring out why your code isn't behaving as you expect.

Debugging during development
During development the built-in console API allows you to understand what's going on inside your functions:

convex/myFunctions.ts
TS
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const mutateSomething = mutation({
  args: { a: v.number(), b: v.number() },
  handler: (_, args) => {
    console.log("Received args", args);
    // ...
  },
});

The following methods are available in the default Convex runtime:

Logging values, with a specified severity level:
console.log
console.info
console.warn
console.error
console.debug
Logging with a stack trace:
console.trace
Measuring execution time:
console.time
console.timeLog
console.timeEnd
The Convex backend also automatically logs all successful function executions and all errors thrown by your functions.

You can view these logs:

When using the ConvexReactClient, in your browser developer tools console pane. The logs are sent from your dev deployment to your client, and the client logs them to the browser. Production deployments do not send logs to the client.
In your Convex dashboard on the Logs page.
In your terminal with npx convex dev during development or npx convex logs, which only prints logs.
Using a debugger
You can exercise your functions from tests, in which case you can add debugger; statements and step through your code. See Testing.

Debugging in production
When debugging an issue in production your options are:

Leverage existing logging
Add more logging and deploy a new version of your backend to production
Convex backend currently only preserves a limited number of logs, and logs can be erased at any time when the Convex team performs internal maintenance and upgrades. You should therefore set up log streaming and error reporting integrations to enable your team easy access to historical logs and additional information logged by your client.

Finding relevant logs by Request ID
To find the appropriate logs for an error you or your users experience, Convex includes a Request ID in all exception messages in both dev and prod in this format: [Request ID: <request_id>].

You can copy and paste a Request ID into your Convex dashboard to view the logs for functions started by that request. See the Dashboard logs page for details.