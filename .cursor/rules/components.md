Convex Components package up code and data in a sandbox that allows you to confidently and quickly add new features to your backend.

Convex Components are like mini self-contained Convex backends, and installing them is always safe. They can't read your app's tables or call your app's functions unless you pass them in explicitly.

You can read about the full vision in Convex: The Software-Defined Database

The Convex team has built a few components that add new features to your backend. You'll eventually be able to author your own components to use within your project and to share with the community, but we haven't stabilized and documented the authoring APIs yet.

Each component is installed as its own independent library from NPM. Check out the component's README for installation and usage instructions. You can see the full directory on the Convex website.

Full Components Directory
Durable Functions
Workflow
Async code flow as durable functions.

Workpool
Async durable function queue.

Crons
Dynamic runtime cron management

Action Retrier
Retry failed external calls automatically

Database
Sharded Counter
High-throughput counter operations

Migrations
Define and run migrations

Aggregate
Efficient sums and counts

Geospatial (Beta)
Store and search locations

Integrations
Cloudflare R2
Store and serve files

Collaborative Text Editor Sync
Real-time collaborative text editing

Expo Push Notifications
Send mobile push notifications

Twilio SMS
Send and receive SMS messages

LaunchDarkly Feature Flags
Sync feature flags with backend

Polar
Add subscriptions and billing

Backend
AI Agent
Define agents with tools and memory

Persistent Text Streaming
Stream and store text data

Rate Limiter
Control resource usage rates

Action Cache
Cache expensive external calls

The component authoring APIs are in Beta
The underlying authoring APIs for components are still in flux. The Convex team authored components listed below will be kept up to date as the APIs change.

Understanding Components
Components can be thought of as a combination of concepts from frontend components, third party APIs, and both monolith and service-oriented architectures.

Data
Similar to frontend components, Convex Components encapsulate state and behavior and allow exposing a clean interface. However, instead of just storing state in memory, these can have internal state machines that can persist between user sessions, span users, and change in response to external inputs, such as webhooks. Components can store data in a few ways:

Database tables with their own schema validation definitions. Since Convex is realtime by default, data reads are automatically reactive, and writes commit transactionally.
File storage, independent of the main app's file storage.
Durable functions via the built-in function scheduler. Components can reliably schedule functions to run in the future and pass along state.
Typically, libraries require configuring a third party service to add stateful off-the-shelf functionality, which lack the transactional guarantees that come from storing state in the same database.

Isolation
Similar to regular npm libraries, Convex Components include functions, type safety, and are called from your code. However, they also provide extra guarantees.

Similar to a third-party API, components can't read data for which you don't provide access. This includes database tables, file storage, environment variables, scheduled functions, etc.
Similar to service-oriented architecture, functions in components are run in an isolated environment, so they can't read or write global variables or patch system behavior.
Similar to a monolith architecture, data changes commit transactionally across calls to components, without having to reason about complicated distributed commit protocols or data inconsistencies. You'll never have a component commit data but have the calling code roll back.
In addition, each mutation call to a component is a sub-mutation isolated from other calls, allowing you to safely catch errors thrown by components. It also allows component authors to easily reason about state changes without races, and trust that a thrown exception will always roll back the Component's sub-mutation. Read more.
Encapsulation
Being able to reason about your code is essential to scaling a codebase. Components allow you to reason about API boundaries and abstractions.

The transactional guarantees discussed above allows authors and users of components to reason locally about data changes.
Components expose an explicit API, not direct database table access. Data invariants can be enforced in code, within the abstraction boundary. For example, the aggregate component can internally denormalize data, the rate limiter component can shard its data, and the push notification component can internally batch API requests, while maintaining simple interfaces.
Runtime validation ensures all data that cross a component boundary are validated: both arguments and return values. As with normal Convex functions, the validators also specify the TypeScript types, providing end-to-end typing with runtime guarantees.

Using Components
Convex components add new features to your backend in their own sandbox with their own functions, schema and data, scheduled functions and all other fundamental Convex features.

You can see the full list of components in the directory. Each component README provides full instructions on how to install and use them.

This doc will go through common patterns on how to install and use Components.

Installing Components
We'll use the Sharded Counter component as an example.

Install from `npm`
Install the relevant package from npm

npm i @convex-dev/sharded-counter

Add the component to your app
Create or update the convex.config.ts file in your app's convex/ folder and install the component by calling use:

// convex/convex.config.ts
import { defineApp } from "convex/server";
import shardedCounter from "@convex-dev/sharded-counter/convex.config";

const app = defineApp();

app.use(shardedCounter);
//... Add other components here

export default app;

Run convex dev
Make sure the convex dev cli is running to ensure the component is registered with your backend and the necessary code is generated.

npx convex dev

Use the provided component API
Each component has its own API. Check out each component's README file for more details on its usage.

Component functions
Though components may expose higher level TypeScript APIs, under the hood they are called via normal Convex functions over the component sandbox boundary.

Queries, mutations, and action rules still apply - queries can only call component queries, mutations can also call component mutations, and actions can also call component actions. As a result, queries into components are reactive by default, and mutations have the same transaction guarantees.

Transactions
Remember that mutation functions in Convex are transactions. Either all the changes in the mutation get written at once or none are written at all.

All writes for a top-level mutation call, including writes performed by calls into other components' mutations, are committed at the same time. If the top-level mutation throws an error, all of the writes are rolled back, and the mutation doesn't change the database at all.

However, if a component mutation call throws an exception, only its writes are rolled back. Then, if the caller catches the exception, it can continue, perform more writes, and return successfully. If the caller doesn't catch the exception, then it's treated as failed and all the writes associated with the caller mutation are rolled back. This means your code can choose a different code path depending on the semantics of your component.

As an example, take the Rate Limiter component. One API of the Rate Limiter throws an error if a rate limit is hit:

// Automatically throw an error if the rate limit is hit.
await rateLimiter.limit(ctx, "failedLogins", { key: userId, throws: true });

If the call to rateLimiter.limit throws an exception, we're over the rate limit. Then, if the calling mutation doesn't catch this exception, the whole transaction is rolled back.

The calling mutation, on the other hand, could also decide to ignore the rate limit by catching the exception and proceeding. For example, an app may want to ignore rate limits if there is a development environment override. In this case, only the component mutation will be rolled back, and the rest of the mutation will continue.

Dashboard
You can see your component’s data, functions, files, and other info using the dropdown in the Dashboard.