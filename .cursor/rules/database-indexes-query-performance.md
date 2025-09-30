Indexes are a data structure that allow you to speed up your document queries by telling Convex how to organize your documents. Indexes also allow you to change the order of documents in query results.

For a more in-depth introduction to indexing see Indexes and Query Performance.

Defining indexes
Indexes are defined as part of your Convex schema. Each index consists of:

A name.
Must be unique per table.
An ordered list of fields to index.
To specify a field on a nested document, use a dot-separated path like properties.name.
To add an index onto a table, use the index method on your table's schema:

convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Define a messages table with two indexes.
export default defineSchema({
  messages: defineTable({
    channel: v.id("channels"),
    body: v.string(),
    user: v.id("users"),
  })
    .index("by_channel", ["channel"])
    .index("by_channel_user", ["channel", "user"]),
});

The by_channel index is ordered by the channel field defined in the schema. For messages in the same channel, they are ordered by the system-generated _creationTime field which is added to all indexes automatically.

By contrast, the by_channel_user index orders messages in the same channel by the user who sent them, and only then by _creationTime.

Indexes are created in npx convex dev and npx convex deploy.

You may notice that the first deploy that defines an index is a bit slower than normal. This is because Convex needs to backfill your index. The more data in your table, the longer it will take Convex to organize it in index order. If you need to add indexes to large tables, use a staged index.

You can feel free to query an index in the same deploy that defines it. Convex will ensure that the index is backfilled before the new query and mutation functions are registered.

Be careful when removing indexes
In addition to adding new indexes, npx convex deploy will delete indexes that are no longer present in your schema. Make sure that your indexes are completely unused before removing them from your schema!

Querying documents using indexes
A query for "messages in channel created 1-2 minutes ago" over the by_channel index would look like:

const messages = await ctx.db
  .query("messages")
  .withIndex("by_channel", (q) =>
    q
      .eq("channel", channel)
      .gt("_creationTime", Date.now() - 2 * 60000)
      .lt("_creationTime", Date.now() - 60000),
  )
  .collect();

The .withIndex method defines which index to query and how Convex will use that index to select documents. The first argument is the name of the index and the second is an index range expression. An index range expression is a description of which documents Convex should consider when running the query.

The choice of index both affects how you write the index range expression and what order the results are returned in. For instance, by making both a by_channel and by_channel_user index, we can get results within a channel ordered by _creationTime or by user, respectively. If you were to use the by_channel_user index like this:

const messages = await ctx.db
  .query("messages")
  .withIndex("by_channel_user", (q) => q.eq("channel", channel))
  .collect();

The results would be all of the messages in a channel ordered by user, then by _creationTime. If you were to use by_channel_user like this:

const messages = await ctx.db
  .query("messages")
  .withIndex("by_channel_user", (q) =>
    q.eq("channel", channel).eq("user", user),
  )
  .collect();

The results would be the messages in the given channel sent by user, ordered by _creationTime.

An index range expression is always a chained list of:

0 or more equality expressions defined with .eq.
[Optionally] A lower bound expression defined with .gt or .gte.
[Optionally] An upper bound expression defined with .lt or .lte.
You must step through fields in index order.

Each equality expression must compare a different index field, starting from the beginning and in order. The upper and lower bounds must follow the equality expressions and compare the next field.

For example, it is not possible to write a query like:

// DOES NOT COMPILE!
const messages = await ctx.db
  .query("messages")
  .withIndex("by_channel", (q) =>
    q
      .gt("_creationTime", Date.now() - 2 * 60000)
      .lt("_creationTime", Date.now() - 60000),
  )
  .collect();

This query is invalid because the by_channel index is ordered by (channel, _creationTime) and this query range has a comparison on _creationTime without first restricting the range to a single channel. Because the index is sorted first by channel and then by _creationTime, it isn't a useful index for finding messages in all channels created 1-2 minutes ago. The TypeScript types within withIndex will guide you through this.

To better understand what queries can be run over which indexes, see Introduction to Indexes and Query Performance.

The performance of your query is based on the specificity of the range.

For example, if the query is

const messages = await ctx.db
  .query("messages")
  .withIndex("by_channel", (q) =>
    q
      .eq("channel", channel)
      .gt("_creationTime", Date.now() - 2 * 60000)
      .lt("_creationTime", Date.now() - 60000),
  )
  .collect();

then query's performance would be based on the number of messages in channel created 1-2 minutes ago.

If the index range is not specified, all documents in the index will be considered in the query.

Picking a good index range
For performance, define index ranges that are as specific as possible! If you are querying a large table and you're unable to add any equality conditions with .eq, you should consider defining a new index.

.withIndex is designed to only allow you to specify ranges that Convex can efficiently use your index to find. For all other filtering you can use the .filter method.

For example to query for "messages in channel not created by me" you could do:

const messages = await ctx.db
  .query("messages")
  .withIndex("by_channel", q => q.eq("channel", channel))
  .filter(q => q.neq(q.field("user"), myUserId)
  .collect();

In this case the performance of this query will be based on how many messages are in the channel. Convex will consider each message in the channel and only return the messages where the user field matches myUserId.

Sorting with indexes
Queries that use withIndex are ordered by the columns specified in the index.

The order of the columns in the index dictates the priority for sorting. The values of the columns listed first in the index are compared first. Subsequent columns are only compared as tie breakers only if all earlier columns match.

Since Convex automatically includes _creationTime as the last column in all indexes, _creationTime will always be the final tie breaker if all other columns in the index are equal.

For example, by_channel_user includes channel, user, and \_creationTime. So queries on messages that use .withIndex("by_channel_user") will be sorted first by channel, then by user within each channel, and finally by the creation time.

Sorting with indexes allows you to satisfy use cases like displaying the top N scoring users, the most recent N transactions, or the most N liked messages.

For example, to get the top 10 highest scoring players in your game, you might define an index on the player's highest score:

export default defineSchema({
  players: defineTable({
    username: v.string(),
    highestScore: v.number(),
  }).index("by_highest_score", ["highestScore"]),
});

You can then efficiently find the top 10 highest scoring players using your index and take(10):

const topScoringPlayers = await ctx.db
  .query("users")
  .withIndex("by_highest_score")
  .order("desc")
  .take(10);

In this example, the range expression is omitted because we're looking for the highest scoring players of all time. This particular query is reasonably efficient for large data sets only because we're using take().

If you use an index without a range expression, you should always use one of the following in conjunction with withIndex:

.first()
.unique()
.take(n)
.paginate(ops)
These APIs allow you to efficiently limit your query to a reasonable size without performing a full table scan.

Full Table Scans
When your query fetches documents from the database, it will scan the rows in the range you specify. If you are using .collect(), for instance, it will scan all of the rows in the range. So if you use withIndex without a range expression, you will be scanning the whole table, which can be slow when your table has thousands of rows. .filter() doesn't affect which documents are scanned. Using .first() or .unique() or .take(n) will only scan rows until it has enough documents.

You can include a range expression to satisfy more targeted queries. For example, to get the top scoring players in Canada, you might use both take() and a range expression:

// query the top 10 highest scoring players in Canada.
const topScoringPlayers = await ctx.db
  .query("users")
  .withIndex("by_country_highest_score", (q) => q.eq("country", "CA"))
  .order("desc")
  .take(10);

Staged indexes
By default, index creation happens synchronously when you deploy code. For large tables, the process of backfilling the index for the existing table can be slow. Staged indexes are a way to create an index on a large table asynchronously without blocking deploy. This can be useful if you are working on multiple features at once.

To create a staged index, use the following syntax in your schema.ts.

export default defineSchema({
  messages: defineTable({
    channel: v.id("channels"),
  }).index("by_channel", { fields: ["channel"], staged: true }),
});

Staged indexes cannot be used until enabled
Staged indexes cannot be used in queries until you enable them. To enable them, they must first finish backfilling.

You can check the backfill progress via the Indexes pane on the dashboard data page. Once it is complete, you can enable the index and use it by removing the staged option.

export default defineSchema({
  messages: defineTable({
    channel: v.id("channels"),
  }).index("by_channel", { fields: ["channel"] }),
});

Introduction to Indexes and Query Performance
How do I ensure my Convex database queries are fast and efficient? When should I define an index? What is an index?

This document explains how you should think about query performance in Convex by describing a simplified model of how queries and indexes function.

If you already have a strong understanding of database queries and indexes you can jump straight to the reference documentation instead:

Reading Data
Indexes
A Library of Documents
You can imagine that Convex is a physical library storing documents as physical books. In this world, every time you add a document to Convex with db.insert("books", {...}) a librarian places the book on a shelf.

By default, Convex organizes your documents in the order they were inserted. You can imagine the librarian inserting documents left to right on a shelf.

If you run a query to find the first book like:

const firstBook = await ctx.db.query("books").first();

then the librarian could start at the left edge of the shelf and find the first book. This is an extremely fast query because the librarian only has to look at a single book to get the result.

Similarly, if we want to retrieve the last book that was inserted we could instead do:

const lastBook = await ctx.db.query("books").order("desc").first();

This is the same query but we've swapped the order to descending. In the library, this means that the librarian will start on the right edge of the shelf and scan right-to-left. The librarian still only needs to look at a single book to determine the result so this query is also extremely fast.

Full Table Scans
Now imagine that someone shows up at the library and asks "what books do you have by Jane Austen?"

This could be expressed as:

const books = await ctx.db
  .query("books")
  .filter((q) => q.eq(q.field("author"), "Jane Austen"))
  .collect();

This query is saying "look through all of the books, left-to-right, and collect the ones where the author field is Jane Austen." To do this the librarian will need to look through the entire shelf and check the author of every book.

This query is a full table scan because it requires Convex to look at every document in the table. The performance of this query is based on the number of books in the library.

If your Convex table has a small number of documents, this is fine! Full table scans should still be fast if there are a few hundred documents, but if the table has many thousands of documents these queries will become slow.

In the library analogy, this kind of query is fine if the library has a single shelf. As the library expands into a bookcase with many shelves or many bookcases, this approach becomes infeasible.

Card Catalogs
How can we more efficiently find books given an author?

One option is to re-sort the entire library by author. This will solve our immediate problem but now our original queries for firstBook and lastBook would become full table scans because we'd need to examine every book to see which was inserted first/last.

Another option is to duplicate the entire library. We could purchase 2 copies of every book and put them on 2 separate shelves: one shelf sorted by insertion time and another sorted by author. This would work, but it's expensive. We now need twice as much space for our library.

A better option is to build an index on author. In the library, we could use an old-school card catalog to organize the books by author. The idea here is that the librarian will write an index card for each book that contains:

The book's author
The location of the book on the shelves
These index cards will be sorted by author and live in a separate organizer from the shelves that hold the books. The card catalog should stay small because it only has an index card per book (not the entire text of the book).

Card Catalog

When a patron asks for "books by Jane Austen", the librarian can now:

Go to the card catalog and quickly find all of the cards for "Jane Austen".
For each card, go and find the book on the shelf.
This is quite fast because the librarian can quickly find the index cards for Jane Austen. It's still a little bit of work to find the book for each card but the number of index cards is small so this is quite fast.

Indexes
Database indexes work based on the same concept! With Convex you can define an index with:

convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  books: defineTable({
    author: v.string(),
    title: v.string(),
    text: v.string(),
  }).index("by_author", ["author"]),
});

then Convex will create a new index called by_author on author. This means that your books table will now have an additional data structure that is sorted by the author field.

You can query this index with:

const austenBooks = await ctx.db
  .query("books")
  .withIndex("by_author", (q) => q.eq("author", "Jane Austen"))
  .collect();

This query instructs Convex to go to the by_author index and find all the entries where doc.author === "Jane Austen". Because the index is sorted by author, this is a very efficient operation. This means that Convex can execute this query in the same manner that the librarian can:

Find the range of the index with entries for Jane Austen.
For each entry in that range, get the corresponding document.
The performance of this query is based on the number of documents where doc.author === "Jane Austen" which should be quite small. We've dramatically sped up the query!

Backfilling and Maintaining Indexes
One interesting detail to think about is the work needed to create this new structure. In the library, the librarian must go through every book on the shelf and put a new index card for each one in the card catalog sorted by author. Only after that can the librarian trust that the card catalog will give it correct results.

The same is true for Convex indexes! When you define a new index, the first time you run npx convex deploy Convex will need to loop through all of your documents and index each one. This is why the first deploy after the creation of a new index will be slightly slower than normal; Convex has to do a bit of work for each document in your table. If the table is particularly large, consider using a staged index to complete the backfill asynchronously from the deploy.

Similarly, even after an index is defined, Convex will have to do a bit of extra work to keep this index up to date as the data changes. Every time a document is inserted, updated, or deleted in an indexed table, Convex will also update its index entry. This is analogous to a librarian creating new index cards for new books as they add them to the library.

If you are defining a few indexes there is no need to worry about the maintenance cost. As you define more indexes, the cost to maintain them grows because every insert needs to update every index. This is why Convex has a limit of 32 indexes per table. In practice most applications define a handful of indexes per table to make their important queries efficient.

Indexing Multiple Fields
Now imagine that a patron shows up at the library and would like to check out Foundation by Isaac Asimov. Given our index on author, we can write a query that uses the index to find all the books by Isaac Asimov and then examines the title of each book to see if it's Foundation.

const foundation = await ctx.db
  .query("books")
  .withIndex("by_author", (q) => q.eq("author", "Isaac Asimov"))
  .filter((q) => q.eq(q.field("title"), "Foundation"))
  .unique();

This query describes how a librarian might execute the query. The librarian will use the card catalog to find all of the index cards for Isaac Asimov's books. The cards themselves don't have the title of the book so the librarian will need to find every Asimov book on the shelves and look at its title to find the one named Foundation. Lastly, this query ends with .unique because we expect there to be at most one result.

This query demonstrates the difference between filtering using withIndex and filter. withIndex only allows you to restrict your query based on the index. You can only do operations that the index can do efficiently like finding all documents with a given author.

filter on the other hand allows you to write arbitrary, complex expressions but it won't be run using the index. Instead, filter expressions will be evaluated on every document in the range.

Given all of this, we can conclude that the performance of indexed queries is based on how many documents are in the index range. In this case, the performance is based on the number of Isaac Asimov books because the librarian will need to look at each one to examine its title.

Unfortunately, Isaac Asimov wrote a lot of books. Realistically even with 500+ books, this will be fast enough on Convex with the existing index, but let's consider how we could improve it anyway.

One approach is to build a separate by_title index on title. This could let us swap the work we do in .filter and .withIndex to instead be:

const foundation = await ctx.db
  .query("books")
  .withIndex("by_title", (q) => q.eq("title", "Foundation"))
  .filter((q) => q.eq(q.field("author"), "Isaac Asimov"))
  .unique();

In this query, we're efficiently using the index to find all the books called Foundation and then filtering through to find the one by Isaac Asimov.

This is okay, but we're still at risk of having a slow query because too many books have a title of Foundation. An even better approach could be to build a compound index that indexes both author and title. Compound indexes are indexes on an ordered list of fields.

convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  books: defineTable({
    author: v.string(),
    title: v.string(),
    text: v.string(),
  }).index("by_author_title", ["author", "title"]),
});

In this index, books are sorted first by the author and then within each author by title. This means that a librarian can use the index to jump to the Isaac Asimov section and quickly find Foundation within it.

Expressing this as a Convex query this looks like:

const foundation = await ctx.db
  .query("books")
  .withIndex("by_author_title", (q) =>
    q.eq("author", "Isaac Asimov").eq("title", "Foundation"),
  )
  .unique();

Here the index range expression tells Convex to only consider documents where the author is Isaac Asimov and the title is Foundation. This is only a single document so this query will be quite fast!

Because this index sorts by author and then by title, it also efficiently supports queries like "All books by Isaac Asimov that start with F." We could express this as:

const asimovBooksStartingWithF = await ctx.db
  .query("books")
  .withIndex("by_author_title", (q) =>
    q.eq("author", "Isaac Asimov").gte("title", "F").lt("title", "G"),
  )
  .collect();

This query uses the index to find books where author === "Isaac Asimov" && "F" <= title < "G". Once again, the performance of this query is based on how many documents are in the index range. In this case, that's just the Asimov books that begin with "F" which is quite small.

Also note that this index also supports our original query for "books by Jane Austen." It's okay to only use the author field in an index range expression and not restrict by title at all.

Lastly, imagine that a library patron asks for the book The Three-Body Problem but they don't know the author's name. Our by_author_title index won't help us here because it's sorted first by author, and then by title. The title, The Three-Body Problem, could appear anywhere in the index!

The Convex TypeScript types in the withIndex make this clear because they require that you compare index fields in order. Because the index is defined on ["author", "title"], you must first compare the author with .eq before the title.

In this case, the best option is probably to create the separate by_title index to facilitate this query.

Conclusions
Congrats! You now understand how queries and indexes work within Convex!

Here are the main points we've covered:

By default Convex queries are full table scans. This is appropriate for prototyping and querying small tables.
As your tables grow larger, you can improve your query performance by adding indexes. Indexes are separate data structures that order your documents for fast querying.
In Convex, queries use the withIndex method to express the portion of the query that uses the index. The performance of a query is based on how many documents are in the index range expression.
Convex also supports compound indexes that index multiple fields.
To learn more about queries and indexes, check out our reference documentation:

Reading Data
Indexes