If you're using Convex Auth, see the authorization doc.

Within a Convex function, you can access information about the currently logged-in user by using the auth property of the QueryCtx, MutationCtx, or ActionCtx object:

convex/myFunctions.ts
TS
import { mutation } from "./_generated/server";

export const myMutation = mutation({
  args: {
    // ...
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Unauthenticated call to mutation");
    }
    //...
  },
});

User identity fields
The UserIdentity object returned by getUserIdentity is guaranteed to have tokenIdentifier, subject and issuer fields. Which other fields it will include depends on the identity provider used and the configuration of JWT tokens and OpenID scopes.

tokenIdentifier is a combination of subject and issuer to ensure uniqueness even when multiple providers are used.

If you followed one of our integrations with Clerk or Auth0 at least the following fields will be present: familyName, givenName, nickname, pictureUrl, updatedAt, email, emailVerified. See their corresponding standard definition in the OpenID docs.

convex/myFunctions.ts
TS
import { mutation } from "./_generated/server";

export const myMutation = mutation({
  args: {
    // ...
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const { tokenIdentifier, name, email } = identity!;
    //...
  },
});

Clerk claims configuration
If you're using Clerk, the fields returned by getUserIdentity are determined by your JWT template's Claims config. If you've set custom claims, they will be returned by getUserIdentity as well.

Custom JWT Auth
If you're using Custom JWT auth instead of OpenID standard fields you'll find each nested field available at dot-containing-string field names like identity["properties.email"].

HTTP Actions
You can also access the user identity from an HTTP action ctx.auth.getUserIdentity(), by calling your endpoint with an Authorization header including a JWT token:

myPage.ts
TS
const jwtToken = "...";

fetch("https://<deployment name>.convex.site/myAction", {
  headers: {
    Authorization: `Bearer ${jwtToken}`,
  },
});