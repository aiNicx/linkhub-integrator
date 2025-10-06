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
 * GET /api/companies/:companyId
 * Recupera i dettagli di una company specifica
 */
export const getCompany = httpAction(async (ctx, request) => {
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

    // Estrai companyId dall'URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const companyId = pathParts[pathParts.length - 1];

    if (!companyId) {
      return new Response(JSON.stringify({
        success: false,
        error: "Company ID richiesto"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Verifica che l'utente abbia accesso a questa company
    if (companyId !== auth.companyId) {
      return new Response(JSON.stringify({
        success: false,
        error: "Accesso negato a questa company"
      }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Query company details
    const company = await ctx.runQuery(internal.companies.getCompanyInternal, {
      companyId: companyId as any,
      callerContext: 'integrator' // ✅ SICUREZZA: Indica che la chiamata proviene da integrator
    });

    if (!company) {
      return new Response(JSON.stringify({
        success: false,
        error: "Company non trovata"
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        company: {
          id: company._id,
          name: company.name,
          slug: company.slug,
          mission: company.mission,
          vision: company.vision,
          createdAt: company.createdAt,
          northStarKeyResultId: company.northStarKeyResultId,
          potentialBonus: company.potentialBonus,
          executionQuestion: company.executionQuestion,
          reportPeriod: company.reportPeriod,
          reportExpirationDays: company.reportExpirationDays,
          reviewExpirationDays: company.reviewExpirationDays,
          notificationAdvanceDays: company.notificationAdvanceDays,
          session360Enabled: company.session360Enabled,
          integratorEnabled: company.integratorEnabled,
          integratorAccountId: company.integratorAccountId,
          integratorAccountEmail: company.integratorAccountEmail,
          integratorConfiguredAt: company.integratorConfiguredAt,
          northStarKeyResult: company.northStarKeyResult ? {
            id: company.northStarKeyResult._id,
            slug: company.northStarKeyResult.slug,
            finalForecastValue: company.northStarKeyResult.finalForecastValue,
            finalTargetValue: company.northStarKeyResult.finalTargetValue,
            indicator: company.northStarKeyResult.indicator ? {
              id: company.northStarKeyResult.indicator._id,
              symbol: company.northStarKeyResult.indicator.symbol,
              description: company.northStarKeyResult.indicator.description
            } : null,
            objective: company.northStarKeyResult.objective ? {
              id: company.northStarKeyResult.objective._id,
              title: company.northStarKeyResult.objective.title,
              team: company.northStarKeyResult.objective.team ? {
                id: company.northStarKeyResult.objective.team._id,
                name: company.northStarKeyResult.objective.team.name
              } : null
            } : null
          } : null,
          departments: company.departments?.map((dept: any) => ({
            id: dept._id,
            name: dept.name,
            leader: dept.leader ? {
              id: dept.leader._id,
              name: dept.leader.name,
              surname: dept.leader.surname,
              email: dept.leader.email
            } : null
          })) || [],
          levels: company.levels?.map((level: any) => ({
            id: level._id,
            description: level.description,
            number: level.number,
            maxImpact: level.maxImpact,
            minImpact: level.minImpact
          })) || []
        }
      },
      timestamp: Date.now()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Errore in /api/companies/:companyId:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "Errore interno del server"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
