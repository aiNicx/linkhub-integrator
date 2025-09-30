Vector search allows you to find Convex documents similar to a provided vector. Typically, vectors will be embeddings which are numerical representations of text, images, or audio.

Embeddings and vector search enable you to provide useful context to LLMs for AI powered applications, recommendations for similar content and more.

Vector search is consistent and fully up-to-date. You can write a vector and immediately read it from a vector search. Unlike full text search, however, vector search is only available in Convex actions.

Example: Vector Search App

To use vector search you need to:

Define a vector index.
Run a vector search from within an action.
Defining vector indexes
Like database indexes, vector indexes are a data structure that is built in advance to enable efficient querying. Vector indexes are defined as part of your Convex schema.

To add a vector index onto a table, use the vectorIndex method on your table's schema. Every vector index has a unique name and a definition with:

vectorField string
The name of the field indexed for vector search.
dimensions number
The fixed size of the vectors index. If you're using embeddings, this dimension should match the size of your embeddings (e.g. 1536 for OpenAI).
[Optional] filterFields array
The names of additional fields that are indexed for fast filtering within your vector index.
[Optional] staged boolean
If set to true, the index will be backfilled asynchronously from the deploy similar to staged database indexes. This is useful for large tables where the index backfill time is significant. Defaults to false.
For example, if you want an index that can search for similar foods within a given cuisine, your table definition could look like:

convex/schema.ts
foods: defineTable({
  description: v.string(),
  cuisine: v.string(),
  embedding: v.array(v.float64()),
}).vectorIndex("by_embedding", {
  vectorField: "embedding",
  dimensions: 1536,
  filterFields: ["cuisine"],
}),

You can specify vector and filter fields on nested documents by using a dot-separated path like properties.name.

Running vector searches
Unlike database queries or full text search, vector searches can only be performed in a Convex action.

They generally involve three steps:

Generate a vector from provided input (e.g. using OpenAI)
Use ctx.vectorSearch to fetch the IDs of similar documents
Load the desired information for the documents
Here's an example of the first two steps for searching for similar French foods based on a description:

convex/foods.ts
TS
import { v } from "convex/values";
import { action } from "./_generated/server";

export const similarFoods = action({
  args: {
    descriptionQuery: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Generate an embedding from you favorite third party API:
    const embedding = await embed(args.descriptionQuery);
    // 2. Then search for similar foods!
    const results = await ctx.vectorSearch("foods", "by_embedding", {
      vector: embedding,
      limit: 16,
      filter: (q) => q.eq("cuisine", "French"),
    });
    // ...
  },
});

An example of the first step can be found here in the vector search demo app.

Focusing on the second step, the vectorSearch API takes in the table name, the index name, and finally a VectorSearchQuery object describing the search. This object has the following fields:

vector array
An array of numbers (e.g. embedding) to use in the search.
The search will return the document IDs of the documents with the most similar stored vectors.
It must have the same length as the dimensions of the index.
[Optional] limit number
The number of results to get back. If specified, this value must be between 1 and 256.
[Optional] filter
An expression that restricts the set of results based on the filterFields in the vectorIndex in your schema. See Filter expressions for details.
It returns an Array of objects containing exactly two fields:

_id
The Document ID for the matching document in the table
_score
An indicator of how similar the result is to the vector you were searching for, ranging from -1 (least similar) to 1 (most similar)
Neither the underlying document nor the vector are included in results, so once you have the list of results, you will want to load the desired information about the results.

There are a few strategies for loading this information documented in the Advanced Patterns section.

For now, let's load the documents and return them from the action. To do so, we'll pass the list of results to a Convex query and run it inside of our action, returning the result:

convex/foods.ts
TS
export const fetchResults = internalQuery({
  args: { ids: v.array(v.id("foods")) },
  handler: async (ctx, args) => {
    const results = [];
    for (const id of args.ids) {
      const doc = await ctx.db.get(id);
      if (doc === null) {
        continue;
      }
      results.push(doc);
    }
    return results;
  },
});

convex/foods.ts
TS
export const similarFoods = action({
  args: {
    descriptionQuery: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Generate an embedding from you favorite third party API:
    const embedding = await embed(args.descriptionQuery);
    // 2. Then search for similar foods!
    const results = await ctx.vectorSearch("foods", "by_embedding", {
      vector: embedding,
      limit: 16,
      filter: (q) => q.eq("cuisine", "French"),
    });
    // 3. Fetch the results
    const foods: Array<Doc<"foods">> = await ctx.runQuery(
      internal.foods.fetchResults,
      { ids: results.map((result) => result._id) },
    );
    return foods;
  },
});

Filter expressions
As mentioned above, vector searches support efficiently filtering results by additional fields on your document using either exact equality on a single field, or an OR of expressions.

For example, here's a filter for foods with cuisine exactly equal to "French":

filter: (q) => q.eq("cuisine", "French"),

You can also filter documents by a single field that contains several different values using an or expression. Here's a filter for French or Indonesian dishes:

filter: (q) =>
  q.or(q.eq("cuisine", "French"), q.eq("cuisine", "Indonesian")),

For indexes with multiple filter fields, you can also use .or() filters on different fields. Here's a filter for dishes whose cuisine is French or whose main ingredient is butter:

filter: (q) =>
  q.or(q.eq("cuisine", "French"), q.eq("mainIngredient", "butter")),

Both cuisine and mainIngredient would need to be included in the filterFields in the .vectorIndex definition.

Other filtering
Results can be filtered based on how similar they are to the provided vector using the _score field in your action:

const results = await ctx.vectorSearch("foods", "by_embedding", {
  vector: embedding,
});
const filteredResults = results.filter((result) => result._score >= 0.9);

Additional filtering can always be done by passing the vector search results to a query or mutation function that loads the documents and performs filtering using any of the fields on the document.

For performance, always put as many of your filters as possible into .vectorSearch.

Ordering
Vector queries always return results in relevance order.

Currently Convex searches vectors using an approximate nearest neighbor search based on cosine similarity. Support for more similarity metrics will come in the future.

If multiple documents have the same score, ties are broken by the document ID.

Advanced patterns
Using a separate table to store vectors
There are two main options for setting up a vector index:

Storing vectors in the same table as other metadata
Storing vectors in a separate table, with a reference
The examples above show the first option, which is simpler and works well for reading small amounts of documents. The second option is more complex, but better supports reading or returning large amounts of documents.

Since vectors are typically large and not useful beyond performing vector searches, it's nice to avoid loading them from the database when reading other data (e.g. db.get()) or returning them from functions by storing them in a separate table.

A table definition for movies, and a vector index supporting search for similar movies filtering by genre would look like this:

convex/schema.ts
movieEmbeddings: defineTable({
  embedding: v.array(v.float64()),
  genre: v.string(),
}).vectorIndex("by_embedding", {
  vectorField: "embedding",
  dimensions: 1536,
  filterFields: ["genre"],
}),
movies: defineTable({
  title: v.string(),
  genre: v.string(),
  description: v.string(),
  votes: v.number(),
  embeddingId: v.optional(v.id("movieEmbeddings")),
}).index("by_embedding", ["embeddingId"]),

Generating an embedding and running a vector search are the same as using a single table. Loading the relevant documents given the vector search result is different since we have an ID for movieEmbeddings but want to load a movies document. We can do this using the by_embedding database index on the movies table:

convex/movies.ts
TS
export const fetchMovies = query({
  args: {
    ids: v.array(v.id("movieEmbeddings")),
  },
  handler: async (ctx, args) => {
    const results = [];
    for (const id of args.ids) {
      const doc = await ctx.db
        .query("movies")
        .withIndex("by_embedding", (q) => q.eq("embeddingId", id))
        .unique();
      if (doc === null) {
        continue;
      }
      results.push(doc);
    }
    return results;
  },
});

Fetching results and adding new documents
Returning information from a vector search involves an action (since vector search is only available in actions) and a query or mutation to load the data.

The example above used a query to load data and return it from an action. Since this is an action, the data returned is not reactive. An alternative would be to return the results of the vector search in the action, and have a separate query that reactively loads the data. The search results will not update reactively, but the data about each result would be reactive.

The Vector Search Demo App uses this strategy to show similar movies with a reactive "Votes" count.

Limits
Convex supports millions of vectors today. This is an ongoing project and we will continue to scale this offering out with the rest of Convex.

Vector indexes must have:

Exactly 1 vector index field.
The field must be of type v.array(v.float64()) (or a union in which one of the possible types is v.array(v.float64()))
Exactly 1 dimension field with a value between 2 and 4096.
Up to 16 filter fields.
Vector indexes count towards the limit of 32 indexes per table. In addition you can have up to 4 vector indexes per table.

Vector searches can have:

Exactly 1 vector to search by in the vector field
Up to 64 filter expressions
Up to 256 requested results (defaulting to 10).
If your action performs a vector search then passes the results to a query or mutation function, you may find that one or more results from the vector search have been deleted or mutated. Because vector search is only available in actions, you cannot perform additional transactional queries or mutations based on the results. If this is important for your use case, please let us know on Discord!

Only documents that contain a vector of the size and in the field specified by a vector index will be included in the index and returned by the vector search.

For information on limits, see here.

Future development
We're always open to customer feedback and requests. Some ideas we've considered for improving vector search in Convex include:

More sophisticated filters and filter syntax
Filtering by score in the vectorSearch API
Better support for generating embeddings
If any of these features is important for your app, let us know on Discord!