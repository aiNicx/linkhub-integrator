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
 * GET /api/initiatives
 * Lista tutte le initiatives della company
 */
export const listInitiatives = httpAction(async (ctx, request) => {
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

    // Ottieni tutti i team della company per filtrare le initiatives
    const teams = await ctx.runQuery(internal.companies.listTeamsInternal, {
      companyId: auth.companyId as any,
      callerContext: 'integrator'
    });

    const teamIds = teams.map((team: any) => team._id);

    // Query initiatives per tutti i team della company
    const initiatives = await ctx.runQuery(api.initiatives.getAllByTeamInclusive, {
      teamIds: teamIds as any[],
      statusFilter: "all",
      orderBy: "createdAt",
      orderDirection: "desc"
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        initiatives: initiatives.map((init: any) => ({
          id: init._id,
          description: init.description,
          slug: init.slug,
          status: init.status,
          priority: init.priority,
          relativeImpact: init.relativeImpact,
          overallImpact: init.overallImpact,
          checkInDays: init.checkInDays,
          isNew: init.isNew,
          lastCheckInDate: init.lastCheckInDate,
          finishedAt: init.finishedAt,
          externalUrl: init.externalUrl,
          notes: init.notes,
          createdAt: init.createdAt,
          updatedAt: init.updatedAt,
          assignee: init.assignee ? {
            id: init.assignee._id,
            name: init.assignee.name,
            email: init.assignee.email,
            avatar: init.assignee.avatar
          } : null,
          team: init.team ? {
            id: init.team._id,
            name: init.team.name,
            slug: init.team.slug
          } : null,
          risk: init.risk ? {
            id: init.risk._id,
            description: init.risk.description,
            slug: init.risk.slug,
            keyResult: init.risk.keyResult ? {
              id: init.risk.keyResult._id,
              slug: init.risk.keyResult.slug,
              finalForecastValue: init.risk.keyResult.finalForecastValue,
              finalTargetValue: init.risk.keyResult.finalTargetValue,
              indicator: init.risk.keyResult.indicator ? {
                id: init.risk.keyResult.indicator._id,
                symbol: init.risk.keyResult.indicator.symbol,
                description: init.risk.keyResult.indicator.description
              } : null
            } : null
          } : null
        }))
      },
      timestamp: Date.now()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Errore in /api/initiatives:", error);
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
 * GET /api/initiatives/:initiativeId
 * Dettaglio di un'iniziativa specifica
 */
export const getInitiative = httpAction(async (ctx, request) => {
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

    // Estrai initiativeId dall'URL
    const url = new URL(request.url);
    const initiativeId = url.pathname.split('/').pop();

    if (!initiativeId) {
      return new Response(JSON.stringify({
        success: false,
        error: "ID iniziativa mancante"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const initiative = await ctx.runQuery(api.initiatives.getById, {
      id: initiativeId as any
    });

    if (!initiative) {
      return new Response(JSON.stringify({
        success: false,
        error: "Iniziativa non trovata"
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Verifica che l'iniziativa appartenga a un team della company dell'utente
    const teams = await ctx.runQuery(internal.companies.listTeamsInternal, {
      companyId: auth.companyId as any,
      callerContext: 'integrator'
    });

    const teamIds = teams.map((team: any) => team._id);
    if (!teamIds.includes(initiative.teamId)) {
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
        initiative: {
          id: initiative._id,
          description: initiative.description,
          slug: initiative.slug,
          status: initiative.status,
          priority: initiative.priority,
          relativeImpact: initiative.relativeImpact,
          overallImpact: initiative.overallImpact,
          checkInDays: initiative.checkInDays,
          isNew: initiative.isNew,
          lastCheckInDate: initiative.lastCheckInDate,
          finishedAt: initiative.finishedAt,
          externalUrl: initiative.externalUrl,
          notes: initiative.notes,
          createdAt: initiative.createdAt,
          updatedAt: initiative.updatedAt,
          assigneeId: initiative.assigneeId,
          teamId: initiative.teamId,
          riskId: initiative.riskId,
          createdBy: initiative.createdBy
        }
      },
      timestamp: Date.now()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Errore in /api/initiatives/:id:", error);
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
 * POST /api/initiatives
 * Crea una nuova iniziativa
 */
export const createInitiative = httpAction(async (ctx, request) => {
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
    const { 
      description, 
      teamId, 
      assigneeId, 
      checkInDays, 
      priority, 
      status, 
      riskId, 
      notes, 
      externalUrl 
    } = body;

    // Validazione campi obbligatori
    if (!description || !teamId || !assigneeId || !checkInDays || !status) {
      return new Response(JSON.stringify({
        success: false,
        error: "Campi obbligatori mancanti: description, teamId, assigneeId, checkInDays, status"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Verifica che il team appartenga alla company dell'utente
    const teams = await ctx.runQuery(internal.companies.listTeamsInternal, {
      companyId: auth.companyId as any,
      callerContext: 'integrator'
    });

    const teamIds = teams.map((team: any) => team._id);
    if (!teamIds.includes(teamId)) {
      return new Response(JSON.stringify({
        success: false,
        error: "Team non valido o non autorizzato"
      }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    const result = await ctx.runMutation(api.initiatives.create, {
      description,
      teamId: teamId as any,
      assigneeId: assigneeId as any,
      createdBy: auth.userId as any,
      checkInDays,
      priority: priority || "medium",
      status: status as any,
      riskId: riskId ? (riskId as any) : undefined,
      notes: notes || undefined,
      externalUrl: externalUrl || undefined
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        initiativeId: result._id,
        slug: result.slug
      },
      timestamp: Date.now()
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Errore in POST /api/initiatives:", error);
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
 * PUT /api/initiatives/:initiativeId
 * Aggiorna un'iniziativa esistente
 */
export const updateInitiative = httpAction(async (ctx, request) => {
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

    // Estrai initiativeId dall'URL
    const url = new URL(request.url);
    const initiativeId = url.pathname.split('/').pop();

    if (!initiativeId) {
      return new Response(JSON.stringify({
        success: false,
        error: "ID iniziativa mancante"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Verifica che l'iniziativa esista e appartenga a un team della company
    const existing = await ctx.runQuery(api.initiatives.getById, {
      id: initiativeId as any
    });

    if (!existing) {
      return new Response(JSON.stringify({
        success: false,
        error: "Iniziativa non trovata"
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    const teams = await ctx.runQuery(internal.companies.listTeamsInternal, {
      companyId: auth.companyId as any,
      callerContext: 'integrator'
    });

    const teamIds = teams.map((team: any) => team._id);
    if (!teamIds.includes(existing.teamId)) {
      return new Response(JSON.stringify({
        success: false,
        error: "Non autorizzato"
      }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    const body = await request.json();
    const { 
      description, 
      assigneeId, 
      checkInDays, 
      priority, 
      status, 
      riskId, 
      notes, 
      externalUrl 
    } = body;

    const result = await ctx.runMutation(api.initiatives.update, {
      id: initiativeId as any,
      description: description !== undefined ? description : undefined,
      assigneeId: assigneeId !== undefined ? (assigneeId as any) : undefined,
      checkInDays: checkInDays !== undefined ? checkInDays : undefined,
      priority: priority !== undefined ? priority : undefined,
      status: status !== undefined ? (status as any) : undefined,
      riskId: riskId !== undefined ? (riskId ? (riskId as any) : null) : undefined,
      notes: notes !== undefined ? notes : undefined,
      externalUrl: externalUrl !== undefined ? externalUrl : undefined
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        initiativeId: result._id
      },
      timestamp: Date.now()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Errore in PUT /api/initiatives/:id:", error);
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
 * PATCH /api/initiatives/:initiativeId/status
 * Aggiorna solo lo status di un'iniziativa
 */
export const updateInitiativeStatus = httpAction(async (ctx, request) => {
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

    // Estrai initiativeId dall'URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const initiativeId = pathParts[pathParts.length - 2]; // -2 perché l'ultimo è "status"

    if (!initiativeId) {
      return new Response(JSON.stringify({
        success: false,
        error: "ID iniziativa mancante"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Verifica che l'iniziativa esista e appartenga a un team della company
    const existing = await ctx.runQuery(api.initiatives.getById, {
      id: initiativeId as any
    });

    if (!existing) {
      return new Response(JSON.stringify({
        success: false,
        error: "Iniziativa non trovata"
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    const teams = await ctx.runQuery(internal.companies.listTeamsInternal, {
      companyId: auth.companyId as any,
      callerContext: 'integrator'
    });

    const teamIds = teams.map((team: any) => team._id);
    if (!teamIds.includes(existing.teamId)) {
      return new Response(JSON.stringify({
        success: false,
        error: "Non autorizzato"
      }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return new Response(JSON.stringify({
        success: false,
        error: "Status mancante"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const result = await ctx.runMutation(api.initiatives.update, {
      id: initiativeId as any,
      status: status as any
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        initiativeId: result._id,
        status: result.status
      },
      timestamp: Date.now()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Errore in PATCH /api/initiatives/:id/status:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Errore interno del server"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
