import { httpAction } from "../_generated/server";

export const openidConfiguration = httpAction(async () => {
  return new Response(
    JSON.stringify({
      issuer: process.env.CONVEX_SITE_URL,
      jwks_uri: process.env.CONVEX_SITE_URL + "/.well-known/jwks.json",
      authorization_endpoint:
        process.env.CONVEX_SITE_URL + "/oauth/authorize",
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control":
          "public, max-age=15, stale-while-revalidate=15, stale-if-error=86400",
      },
    },
  );
});

export const jwks = httpAction(async () => {
  if (process.env.JWKS === undefined) {
    throw new Error("Missing JWKS Convex environment variable");
  }
  return new Response(process.env.JWKS, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control":
        "public, max-age=15, stale-while-revalidate=15, stale-if-error=86400",
    },
  });
});

export const authorize = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const responseType = url.searchParams.get("response_type");
  const clientId = url.searchParams.get("client_id");
  const redirectUri = url.searchParams.get("redirect_uri");
  const scope = url.searchParams.get("scope");
  const state = url.searchParams.get("state");

  // Per ora restituiamo un errore - endpoint da implementare completamente
  return new Response(JSON.stringify({
    error: "unsupported_response_type",
    error_description: "OAuth authorize endpoint non ancora implementato completamente"
  }), {
    status: 400,
    headers: { "Content-Type": "application/json" }
  });
});