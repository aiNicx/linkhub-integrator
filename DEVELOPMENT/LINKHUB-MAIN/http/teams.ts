import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";

/**
 * Helper per verificare JWT e estrarre integratorCompanyId
 */
async function verifyJWTAndGetCompany(request: Request): Promise<{
  companyId: string;
  userId: string;
  email: string;
} | { error: string; status: number }> {
  const authHeader = request.headers.get("Authorization");
  const jwtToken = authHeader?.replace("Bearer ", "");

  if (!jwtToken) {
    return {
      error: "Token JWT richiesto nell'header Authorization",
      status: 401
    };
  }

  const jwt = require("jose");
  
  // Prova prima con Auth0
  if (process.env.AUTH0_ISSUER && process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID) {
    try {
      const auth0Domain = process.env.AUTH0_ISSUER.replace('https://', '').replace(/\/$/, '');
      const jwksUrl = `https://${auth0Domain}/.well-known/jwks.json`;

      const JWKS = jwt.createRemoteJWKSet(new URL(jwksUrl), {
        timeoutDuration: 10000,
        cooldownDuration: 30000,
        cacheMaxAge: 600000,
      });

      const { payload } = await jwt.jwtVerify(jwtToken, JWKS, {
        issuer: process.env.AUTH0_ISSUER,
        audience: "https://linkhub-api",
      });

      if (payload.integratorCompanyId && payload.email) {
        return {
          companyId: payload.integratorCompanyId as string,
          userId: payload.sub as string,
          email: payload.email as string
        };
      }
      } catch (authError) {
        // Se fallisce Auth0, prova con Convex
      }
    }

  // Prova con token Convex interno (per test)
  try {
    const secret = new TextEncoder().encode(process.env.CONVEX_AUTH_ADAPTER_SECRET);
    const { payload } = await jwt.jwtVerify(jwtToken, secret, {
      algorithms: ['HS256']
    });

    if (payload.integratorCompanyId && payload.email) {
      return {
        companyId: payload.integratorCompanyId as string,
        userId: payload.sub as string,
        email: payload.email as string
      };
    }

    return {
      error: "Token valido ma manca integratorCompanyId",
      status: 403
    };

  } catch (error) {
    return {
      error: "Token JWT non valido",
      status: 401
    };
  }
}

/**
 * GET /api/teams
 * Lista tutti i teams della company dell'integrator
 */
export const listTeams = httpAction(async (ctx, request) => {
  try {
    // Verifica JWT e ottieni company
    const auth = await verifyJWTAndGetCompany(request);
    if ('error' in auth) {
      return new Response(JSON.stringify({
        success: false,
        error: auth.error
      }), {
        status: auth.status,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Query teams della company
    const teams = await ctx.runQuery(internal.companies.listTeamsInternal, {
      companyId: auth.companyId as any,
      callerContext: 'integrator' // ✅ SICUREZZA: Indica che la chiamata proviene da integrator
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        teams: teams.map((team: any) => ({
          id: team._id,
          name: team.name,
          slug: team.slug,
          impact: team.impact,
          type: team.type,
          teamLeader: team.teamLeader ? {
            id: team.teamLeader._id,
            name: team.teamLeader.name,
            surname: team.teamLeader.surname,
            email: team.teamLeader.email
          } : null,
          cluster: team.cluster ? {
            id: team.cluster._id,
            name: team.cluster.name,
            slug: team.cluster.slug
          } : null,
          createdAt: team.createdAt
        }))
      },
      timestamp: Date.now()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Errore in /api/teams:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "Errore interno del server"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
