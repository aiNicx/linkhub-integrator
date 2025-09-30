There are four reasons why your Convex queries and mutations may hit errors:

Application Errors: The function code hits a logical condition that should stop further processing, and your code throws a ConvexError
Developer Errors: There is a bug in the function (like calling db.get(null) instead of db.get(id)).
Read/Write Limit Errors: The function is retrieving or writing too much data.
Internal Convex Errors: There is a problem within Convex (like a network blip).
Convex will automatically handle internal Convex errors. If there are problems on our end, we'll automatically retry your queries and mutations until the problem is resolved and your queries and mutations succeed.

On the other hand, you must decide how to handle application, developer and read/write limit errors. When one of these errors happens, the best practices are to:

Show the user some appropriate UI.
Send the error to an exception reporting service using the Exception Reporting Integration.
Log the incident using console.* and set up reporting with Log Streaming. This can be done in addition to the above options, and doesn't require an exception to be thrown.
Additionally, you might also want to send client-side errors to a service like Sentry to capture additional information for debugging and observability.

Errors in queries
If your query function hits an error, the error will be sent to the client and thrown from your useQuery call site. The best way to handle these errors is with a React error boundary component.

Error boundaries allow you to catch errors thrown in their child component tree, render fallback UI, and send information about the error to your exception handling service. Adding error boundaries to your app is a great way to handle errors in Convex query functions as well as other errors in your React components. If you are using Sentry, you can use their Sentry.ErrorBoundary component.

With error boundaries, you can decide how granular you'd like your fallback UI to be. One simple option is to wrap your entire application in a single error boundary like:

<StrictMode>
  <ErrorBoundary>
    <ConvexProvider client={convex}>
      <App />
    </ConvexProvider>
  </ErrorBoundary>
</StrictMode>,

Then any error in any of your components will be caught by the boundary and render the same fallback UI.

On the other hand, if you'd like to enable some portions of your app to continue functioning even if other parts hit errors, you can instead wrap different parts of your app in separate error boundaries.

Retrying
Unlike other frameworks, there is no concept of "retrying" if your query function hits an error. Because Convex functions are deterministic, if the query function hits an error, retrying will always produce the same error. There is no point in running the query function with the same arguments again.

Errors in mutations
If a mutation hits an error, this will

Cause the promise returned from your mutation call to be rejected.
Cause your optimistic update to be rolled back.
If you have an exception service like Sentry configured, it should report "unhandled promise rejections" like this automatically. That means that with no additional work your mutation errors should be reported.

Note that errors in mutations won't be caught by your error boundaries because the error doesn't happen as part of rendering your components.

If you would like to render UI specifically in response to a mutation failure, you can use .catch on your mutation call. For example:

sendMessage(newMessageText).catch((error) => {
  // Do something with `error` here
});

If you're using an async handled function you can also use try...catch:

try {
  await sendMessage(newMessageText);
} catch (error) {
  // Do something with `error` here
}

Reporting caught errors
If you handle your mutation error, it will no longer become an unhandled promise rejection. You may need to report this error to your exception handling service manually.

Errors in action functions
Unlike queries and mutations, actions may have side-effects and therefore can't be automatically retried by Convex when errors occur. For example, say your action sends a email. If it fails part-way through, Convex has no way of knowing if the email was already sent and can't safely retry the action. It is responsibility of the caller to handle errors raised by actions and retry if appropriate.

Differences in error reporting between dev and prod
Using a dev deployment any server error thrown on the client will include the original error message and a server-side stack trace to ease debugging.

Using a production deployment any server error will be redacted to only include the name of the function and a generic "Server Error" message, with no stack trace. Server application errors will still include their custom data.

Both development and production deployments log full errors with stack traces which can be found on the Logs page of a given deployment.

Application errors, expected failures
If you have expected ways your functions might fail, you can either return different values or throw ConvexErrors.

See Application Errors.

Read/write limit errors
To ensure uptime and guarantee performance, Convex will catch queries and mutations that try to read or write too much data. These limits are enforced at the level of a single query or mutation function execution. The limits are:

Queries and mutations error out when:

More than 16384 documents are scanned
More than 8MiB worth of data is scanned
More than 4096 queries calls to db.get or db.query are made
The function spends more than 1 second executing Javascript
In addition, mutations error out when:

More than 8192 documents are written
More than 8MiB worth of data is written
Documents are "scanned" by the database to figure out which documents should be returned from db.query. So for example db.query("table").take(5).collect() will only need to scan 5 documents, but db.query("table").filter(...).first() might scan up to as many documents as there are in "table", to find the first one that matches the given filter.

Number of calls to db.get and db.query has a limit to prevent a single query from subscribing to too many index ranges.

In general, if you're running into these limits frequently, we recommend indexing your queries to reduce the number of documents scanned, allowing you to avoid unnecessary reads. Queries that scan large swaths of your data may look innocent at first, but can easily blow up at any production scale. If your functions are close to hitting these limits they will log a warning.

For information on other limits, see here.

Debugging Errors
See Debugging and specifically Finding relevant logs by Request ID.