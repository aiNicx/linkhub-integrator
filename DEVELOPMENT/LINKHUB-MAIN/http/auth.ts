import { httpAction } from "../_generated/server";
import { internal, api } from "../_generated/api";

export const token = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const { email, password, jwtToken } = body;

    let user;
    let userEmail;

    // 📋 Validazione input: almeno una modalità di autenticazione richiesta
    if (jwtToken) {
      // 🔐 Modalità JWT Auth0
      if (!process.env.AUTH0_ISSUER || !process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID) {
        return new Response(JSON.stringify({
          error: "Configurazione Auth0 mancante"
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Verifica JWT Auth0
      const jwt = require("jose");
      const auth0Domain = process.env.AUTH0_ISSUER.replace('https://', '').replace(/\/$/, '');
      const jwksUrl = `https://${auth0Domain}/.well-known/jwks.json`;

      const JWKS = jwt.createRemoteJWKSet(new URL(jwksUrl), {
        timeoutDuration: 10000,
        cooldownDuration: 30000,
        cacheMaxAge: 600000,
      });

      let payload;
      try {
        const { payload: verifiedPayload } = await jwt.jwtVerify(jwtToken, JWKS, {
          issuer: process.env.AUTH0_ISSUER,
          audience: "https://linkhub-api",
        });
        payload = verifiedPayload;
      } catch (error) {
        return new Response(JSON.stringify({
          error: "Token JWT Auth0 non valido"
        }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Se l'email non è nel JWT, recuperala dall'endpoint userinfo di Auth0
      userEmail = payload.email;
      if (!userEmail) {
        try {
          const userInfoUrl = `https://${auth0Domain}/userinfo`;
          const userInfoResponse = await fetch(userInfoUrl, {
            headers: {
              'Authorization': `Bearer ${jwtToken}`
            }
          });
          
          if (!userInfoResponse.ok) {
            throw new Error(`UserInfo fetch failed: ${userInfoResponse.status}`);
          }
          
          const userInfo = await userInfoResponse.json();
          userEmail = userInfo.email;
          
          if (!userEmail) {
            return new Response(JSON.stringify({
              error: "Email non disponibile"
            }), {
              status: 401,
              headers: { "Content-Type": "application/json" }
            });
          }
        } catch (error) {
          return new Response(JSON.stringify({
            error: "Impossibile recuperare email utente"
          }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }

      // 🔍 Trova utente per email (per JWT auth)
      user = await ctx.runQuery(internal.authAdapter.getActiveUserByEmail, {
        email: userEmail
      });

    } else if (email && password) {
      // 🔐 Modalità tradizionale email + password
      // 🔍 Trova utente per email (solo attivi, non eliminati)
      user = await ctx.runQuery(internal.authAdapter.getActiveUserByEmailWithPassword, {
        email
      });

      if (!user || !user.password) {
        return new Response(JSON.stringify({
          error: "Credenziali non valide"
        }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }

      // 🔐 Verifica password
      const bcrypt = require("bcryptjs");
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return new Response(JSON.stringify({
          error: "Credenziali non valide"
        }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }

      userEmail = email;
    } else {
      return new Response(JSON.stringify({
        error: "Email+password oppure jwtToken sono richiesti"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Verifica che l'utente sia stato trovato
    if (!user) {
      return new Response(JSON.stringify({
        error: "Utente non trovato"
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 🔍 Trova la company collegata all'utente (se esiste)
    const company = await ctx.runQuery(internal.companies.findCompanyByIntegratorEmail, {
      email: userEmail
    });

    // ✅ Autenticazione riuscita - genera JWT Convex
    const jwt = require("jose");
    const secret = new TextEncoder().encode(process.env.CONVEX_AUTH_ADAPTER_SECRET);

    const tokenPayload = {
      sub: user._id,
      email: userEmail,
      primaryCompanyId: user.primaryCompanyId,
      // 🔗 Se l'utente ha una company collegata via Auth0, aggiungila al token
      integratorCompanyId: company?._id,
      integratorCompanyName: company?.name,
      integratorCompanySlug: company?.slug,
    };

    const token = await new jwt.SignJWT(tokenPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(secret);

    return new Response(JSON.stringify({
      token,
      user: {
        id: user._id,
        email: user.email,
        primaryCompanyId: user.primaryCompanyId,
        isGlobalAdmin: user.isGlobalAdmin,
      },
      integratorCompany: company ? {
        id: company._id,
        name: company.name,
        slug: company.slug,
        integratorEnabled: company.integratorEnabled,
      } : null
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Errore in /auth/token:", error);
    return new Response(JSON.stringify({
      error: "Errore interno del server"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});