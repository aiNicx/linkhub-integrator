import { httpAction } from "../_generated/server";
import { api, internal } from "../_generated/api";

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
 * GET /api/indicators
 * Lista tutti gli indicators della company
 */
export const listIndicators = httpAction(async (ctx, request) => {
  try {
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

    const indicators = await ctx.runQuery(api.indicators.listByCompany, {
      companyId: auth.companyId as any,
      includeDeleted: false
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        indicators: indicators.map((ind: any) => ({
          id: ind._id,
          description: ind.description,
          symbol: ind.symbol,
          slug: ind.slug,
          periodicity: ind.periodicity,
          automationUrl: ind.automationUrl,
          automationDescription: ind.automationDescription,
          notes: ind.notes,
          isReverse: ind.isReverse,
          assignee: ind.assignee ? {
            id: ind.assignee._id,
            name: ind.assignee.name,
            email: ind.assignee.email,
            image: ind.assignee.image
          } : null,
          values: ind.values || [],
          createdAt: ind.createdAt
        }))
      },
      timestamp: Date.now()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Errore in /api/indicators:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "Errore interno del server"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});

/**
 * GET /api/indicators/:indicatorId
 * Dettaglio di un indicator specifico
 */
export const getIndicator = httpAction(async (ctx, request) => {
  try {
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

    // Estrai indicatorId dall'URL
    const url = new URL(request.url);
    const indicatorId = url.pathname.split('/').pop();

    if (!indicatorId) {
      return new Response(JSON.stringify({
        success: false,
        error: "ID indicatore mancante"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const indicator = await ctx.runQuery(api.indicators.getById, {
      id: indicatorId as any
    });

    if (!indicator) {
      return new Response(JSON.stringify({
        success: false,
        error: "Indicatore non trovato"
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Verifica che l'indicator appartenga alla company dell'utente
    if (indicator.companyId !== auth.companyId) {
      return new Response(JSON.stringify({
        success: false,
        error: "Non autorizzato"
      }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        indicator: {
          id: indicator._id,
          description: indicator.description,
          symbol: indicator.symbol,
          slug: indicator.slug,
          periodicity: indicator.periodicity,
          automationUrl: indicator.automationUrl,
          automationDescription: indicator.automationDescription,
          notes: indicator.notes,
          isReverse: indicator.isReverse,
          assigneeId: indicator.assigneeId,
          createdAt: indicator.createdAt
        }
      },
      timestamp: Date.now()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Errore in /api/indicators/:id:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "Errore interno del server"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});

/**
 * POST /api/indicators
 * Crea un nuovo indicator
 */
export const createIndicator = httpAction(async (ctx, request) => {
  try {
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

    const body = await request.json();
    const { description, symbol, periodicity, assigneeId, automationUrl, automationDescription, notes, isReverse } = body;

    // Validazione campi obbligatori
    if (!description || !symbol || !periodicity) {
      return new Response(JSON.stringify({
        success: false,
        error: "Campi obbligatori mancanti: description, symbol, periodicity"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const result = await ctx.runMutation(api.indicators.create, {
      description,
      symbol,
      periodicity,
      assigneeId: assigneeId || undefined,
      companyId: auth.companyId as any,
      automationUrl: automationUrl || undefined,
      automationDescription: automationDescription || undefined,
      notes: notes || undefined,
      isReverse: isReverse || undefined
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        indicatorId: result._id
      },
      timestamp: Date.now()
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Errore in POST /api/indicators:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Errore interno del server"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});

/**
 * PUT /api/indicators/:indicatorId
 * Aggiorna un indicator esistente
 */
export const updateIndicator = httpAction(async (ctx, request) => {
  try {
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

    // Estrai indicatorId dall'URL
    const url = new URL(request.url);
    const indicatorId = url.pathname.split('/').pop();

    if (!indicatorId) {
      return new Response(JSON.stringify({
        success: false,
        error: "ID indicatore mancante"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Verifica che l'indicator esista e appartenga alla company
    const existing = await ctx.runQuery(api.indicators.getById, {
      id: indicatorId as any
    });

    if (!existing) {
      return new Response(JSON.stringify({
        success: false,
        error: "Indicatore non trovato"
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (existing.companyId !== auth.companyId) {
      return new Response(JSON.stringify({
        success: false,
        error: "Non autorizzato"
      }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    const body = await request.json();
    const { description, symbol, periodicity, assigneeId, automationUrl, automationDescription, notes, isReverse } = body;

    const result = await ctx.runMutation(api.indicators.update, {
      id: indicatorId as any,
      description: description !== undefined ? description : undefined,
      symbol: symbol !== undefined ? symbol : undefined,
      periodicity: periodicity !== undefined ? periodicity : undefined,
      assigneeId: assigneeId !== undefined ? (assigneeId || null) : undefined,
      automationUrl: automationUrl !== undefined ? automationUrl : undefined,
      automationDescription: automationDescription !== undefined ? automationDescription : undefined,
      notes: notes !== undefined ? notes : undefined,
      isReverse: isReverse !== undefined ? isReverse : undefined
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        indicatorId: result._id
      },
      timestamp: Date.now()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Errore in PUT /api/indicators/:id:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Errore interno del server"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
