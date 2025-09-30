The Convex database provides a relational data model, stores JSON-like documents, and can be used with or without a schema. It "just works," giving you predictable query performance in an easy-to-use interface.

Query and mutation functions read and write data through a lightweight JavaScript API. There is nothing to set up and no need to write any SQL. Just use JavaScript to express your app's needs.

Start by learning about the basics of tables, documents and schemas below, then move on to Reading Data and Writing Data.

As your app grows more complex you'll need more from your database:

Relational data modeling with Document IDs
Fast querying with Indexes
Exposing large datasets with Paginated Queries
Type safety by Defining a Schema
Interoperability with data Import & Export
Tables
Your Convex deployment contains tables that hold your app's data. Initially, your deployment contains no tables or documents.

Each table springs into existence as soon as you add the first document to it.

// `friends` table doesn't exist.
await ctx.db.insert("friends", { name: "Jamie" });
// Now it does, and it has one document.

You do not have to specify a schema upfront or create tables explicitly.

Documents
Tables contain documents. Documents are very similar to JavaScript objects. They have fields and values, and you can nest arrays or objects within them.

These are all valid Convex documents:

{}
{"name": "Jamie"}
{"name": {"first": "Ari", "second": "Cole"}, "age": 60}

They can also contain references to other documents in other tables. See Data Types to learn more about the types supported in Convex and Document IDs to learn about how to use those types to model your data.

Schemas
Though optional, schemas ensure that your data looks exactly how you want. For a simple chat app, the schema will look like this:

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// @snippet start schema
export default defineSchema({
  messages: defineTable({
    author: v.id("users"),
    body: v.string(),
  }),
});

You can choose to be as flexible as you want by using types such as v.any() or as specific as you want by precisely describing a v.object().