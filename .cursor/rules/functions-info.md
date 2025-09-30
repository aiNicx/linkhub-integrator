Functions run on the backend and are written in JavaScript (or TypeScript). They are automatically available as APIs accessed through client libraries. Everything you do in the Convex backend starts from functions.

There are three types of functions:

Queries read data from your Convex database and are automatically cached and subscribable (realtime, reactive).
Mutations write data to the database and run as a transaction.
Actions can call OpenAI, Stripe, Twilio, or any other service or API you need to make your app work.
You can also build HTTP actions when you want to call your functions from a webhook or a custom client.

Here's an overview of the three different types of Convex functions and what they can do:

Queries	Mutations	Actions
Database access	Yes	Yes	No
Transactional	Yes	Yes	No
Cached	Yes	No	No
Real-time Updates	Yes	No	No
External API Calls (fetch)	No	No	Yes