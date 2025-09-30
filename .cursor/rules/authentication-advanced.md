Custom OIDC Provider
Note: This is an advanced feature! We recommend sticking with the supported third-party authentication providers.

Convex can be integrated with any identity provider supporting the OpenID Connect protocol. At minimum this means that the provider can issue ID tokens and exposes the corresponding JWKS. The ID token is passed from the client to your Convex backend which ensures that the token is valid and enables you to query the user information embedded in the token, as described in Auth in Functions.

Server-side integration
Just like with Clerk and Auth0, the backend needs to be aware of the domain of the Issuer and your application's specific applicationID for a given identity provider.

Add these to your convex/auth.config.js file:

convex/auth.config.js
export default {
  providers: [
    {
      domain: "https://your.issuer.url.com",
      applicationID: "your-application-id",
    },
  ],
};

The applicationID property must exactly match the aud field of your JWT and the domain property must exactly match the iss field of the JWT. Use a tool like jwt.io to view an JWT and confirm these fields match exactly.

If multiple providers are provided, the first one fulfilling the above criteria will be used.

If you're not able to obtain tokens with an aud field, you'll need to instead configure a Custom JWT. If you're not sure if your token is an OIDC ID token, check the spec for a list of all required fields.

OIDC requires the routes ${domain}/.well-known/jwks.json and ${domain}/.well-known/openid-configuration. domain may include a path like https://your.issuer.url.com/api/auth. This isn't common for third party auth providers but may be useful if you're implementing OIDC on your own server.

Client-side integration
Integrating a new identity provider
The ConvexProviderWithAuth component provides a convenient abstraction for building an auth integration similar to the ones Convex provides for Clerk and Auth0.

In the following example we build an integration with an imaginary "ProviderX", whose React integration includes AuthProviderXReactProvider and useProviderXAuth hook.

First we replace ConvexProvider with AuthProviderXReactProvider wrapping ConvexProviderWithAuth at the root of our app:

src/index.js
import { AuthProviderXReactProvider } from "providerX";
import { ConvexProviderWithAuth } from "convex/react";

root.render(
  <StrictMode>
    <AuthProviderXReactProvider>
      <ConvexProviderWithAuth client={convex} useAuth={useAuthFromProviderX}>
        <App />
      </ConvexProviderWithAuth>
    </AuthProviderXReactProvider>
  </StrictMode>,
);

All we really need is to implement the useAuthFromProviderX hook which gets passed to the ConvexProviderWithAuth component.

This useAuthFromProviderX hook provides a translation between the auth provider API and the ConvexReactClient API, which is ultimately responsible for making sure that the ID token is passed down to your Convex backend.

src/ConvexProviderWithProviderX.js
function useAuthFromProviderX() {
  const { isLoading, isAuthenticated, getToken } = useProviderXAuth();
  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }) => {
      // Here you can do whatever transformation to get the ID Token
      // or null
      // Make sure to fetch a new token when `forceRefreshToken` is true
      return await getToken({ ignoreCache: forceRefreshToken });
    },
    // If `getToken` isn't correctly memoized
    // remove it from this dependency array
    [getToken],
  );
  return useMemo(
    () => ({
      // Whether the auth provider is in a loading state
      isLoading: isLoading,
      // Whether the auth provider has the user signed in
      isAuthenticated: isAuthenticated ?? false,
      // The async function to fetch the ID token
      fetchAccessToken,
    }),
    [isLoading, isAuthenticated, fetchAccessToken],
  );
}

Using the new provider
If you successfully follow the steps above you can now use the standard Convex utilities for checking the authentication state: the useConvexAuth() hook and the Authenticated, Unauthenticated and AuthLoading helper components.

Debugging
See authentication/debbugging.mdx.

Custom JWT Provider
Note: This is an advanced feature! We recommend sticking with the supported third-party authentication providers.

A JWT is a string combining three base64-encoded JSON objects containing claims about who a user is valid for a limited period of time like an hour. You can create them with a library like jose after receiving some evidence (typically a cookie) of a user's identity or get them from a third party authentication service like Clerk. The information in a JWT is signed (the Convex deployment can tell the information is really from the issuer and hasn't been modified) but generally not encrypted (you can read it by base64-decoding the token or pasting it into jwt.io.

If the JWTs issued to your users by an authentication service contain the right fields to implement the OpenID Connect (OIDC) protocol, the easiest way to configure accepting these JWTs is adding an OIDC Provider entry in convex/auth.config.ts. If the authentication service or library you're using to issue JWTs doesn't support these fields (for example OpenAuth JWTs missing an aud field because they implement the OAuth 2.0 spec but not OIDC) you'll need to configure a Custom JWT provider in the convex/auth.config.ts file.

Custom JWTs are required only to have header fields kid, alg and typ, and payload fields sub, iss, and exp. An iat field is also expected by Convex clients to implement token refreshing.

Server-side integration
Use type: "customJwt" to configure a Custom JWT auth provider:

convex/auth.config.js
export default {
  providers: [
    {
      type: "customJwt",
      applicationID: "your-application-id",
      issuer: "https://your.issuer.url.com",
      jwks: "https://your.issuer.url.com/.well-known/jwks.json",
      algorithm: "RS256",
    },
  ],
};

applicationID: Convex will verify that JWTs have this value in the aud claim. See below for important information regarding leaving this field out. The applicationID field is not required, but necessary to use with many authentication providers for security. Read more below before omitting it.
issuer: The issuer URL of the JWT.
jwks: The URL for fetching the JWKS (JSON Web Key Set) from the auth provider. If you'd like to avoid hitting an external service you may use a data URI, e.g. "data:text/plain;charset=utf-8;base64,ey..."
algorithm: The algorithm used to sign the JWT. Only RS256 and ES256 are currently supported. See RFC 7518 for more details.
The issuer property must exactly match the iss field of the JWT used and if specified the applicationID property must exactly match the aud field. If your JWT doesn't match, use a tool like jwt.io to view an JWT and confirm these fields match exactly.

Warning: omitting applicationID is often insecure
Leaving out applicationID from an auth configuration means the aud (audience) field of your users' JWTs will not be verified. In many cases this is insecure because a JWT intended for another service can be used to impersonate them in your service.

Say a user has accounts with https://todos.com and https://banking.com, two services which use the same third-party authentication service, accounts.google.com. A JWT accepted by todos.com could be reused to authenticate with banking.com by either todos.com or an attacker that obtained access to that JWT.

The aud (audience) field of the JWT prevents this: if the JWT was generated for a specific audience of https://todos.com then banking.com can enforce the aud field and know not to accept it.

If the JWTs issued to your users have an iss (issuer) URL like https://accounts.google.com that is not specific to your application, it is not secure to trust these tokens without an ApplicationID because that JWT could have been collected by a malicious application.

If the JWTs issued to your users have a more specific iss field like https://api.3rd-party-auth.com/client_0123... then it may be secure to use no aud field if you control all the services the issuer url grants then access to and intend for access to any one of these services to grants access to all of them.

Custom claims
In addition to top-level fields like subject, issuer, and tokenIdentifier, subfields of the nested fields of the JWT will be accessible in the auth data returned from const authInfo = await ctx.auth.getUserIdentity() like authInfo["properties.id"] and authInfo["properties.favoriteColor"] for a JWT structured like this:

{
  "properties": {
    "id": "123",
    "favoriteColor": "red"
  },
  "iss": "http://localhost:3000",
  "sub": "user:8fa2be73c2229e85",
  "exp": 1750968478
}

Client-side integration
Your users' browsers need a way to obtain an initial JWT and to request updated JWTs, ideally before the previous one expires.