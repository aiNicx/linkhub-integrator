import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";

// Ottieni profilo integrator da Auth0 userId
export const getProfileByAuth0UserId = query({
  args: { auth0UserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("integratorProfiles")
      .withIndex("by_auth0_user", (q) => q.eq("auth0UserId", args.auth0UserId))
      .first();
  },
});

// Action per chiamare API LinkHub e creare profilo
export const ensureProfileExistsAction = action({
  args: {
    auth0UserId: v.string(),
    userEmail: v.string(),
    userName: v.optional(v.string()),
    accessToken: v.string(),
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: async (ctx, args): Promise<any> => {
    // Prima controlla se esiste già
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing: any = await ctx.runQuery(api.auth.getProfileByAuth0UserId, {
      auth0UserId: args.auth0UserId,
    });

    const now = Date.now();

    if (existing) {
      // Aggiorna ultimo accesso
      await ctx.runMutation(api.auth.updateLastLogin, {
        profileId: existing._id,
        lastLoginAt: now,
      });
      return existing;
    } else {
      // Chiama API LinkHub per ottenere dati reali dell'utente
      try {
        const linkhubApiUrl = process.env.LINKHUB_API_URL;
        if (!linkhubApiUrl) {
          throw new Error("LINKHUB_API_URL not configured");
        }

        const response = await fetch(`${linkhubApiUrl}/auth/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jwtToken: args.accessToken,
          }),
        });

        if (!response.ok) {
          throw new Error(`LinkHub API error: ${response.status}`);
        }

        const data = await response.json();

        // Verifica che l'utente abbia una company integrator abilitata
        if (!data.integratorCompany || !data.integratorCompany.integratorEnabled) {
          throw new Error("User does not have an enabled integrator company");
        }

        const company = data.integratorCompany;

        return await ctx.runMutation(api.auth.createProfile, {
          auth0UserId: args.auth0UserId,
          companyId: company.id,
          companySlug: company.slug,
          companyName: company.name,
          lastLoginAt: now,
          createdAt: now,
          updatedAt: now,
        });
      } catch (error) {
        console.error("Errore chiamata API LinkHub:", error);
        // NO FALLBACK: se l'API non risponde o non ha dati validi, l'utente non ha accesso
        throw new Error("User not authorized as integrator");
      }
    }
  },
});

// Mutation per aggiornare ultimo accesso
export const updateLastLogin = mutation({
  args: {
    profileId: v.id("integratorProfiles"),
    lastLoginAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.profileId, {
      lastLoginAt: args.lastLoginAt,
      updatedAt: args.lastLoginAt,
    });
  },
});

// Mutation per creare profilo
export const createProfile = mutation({
  args: {
    auth0UserId: v.string(),
    companyId: v.string(),
    companySlug: v.string(),
    companyName: v.string(),
    lastLoginAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("integratorProfiles", {
      auth0UserId: args.auth0UserId,
      companyId: args.companyId,
      companySlug: args.companySlug,
      companyName: args.companyName,
      isActive: true,
      lastLoginAt: args.lastLoginAt,
      createdAt: args.createdAt,
      updatedAt: args.updatedAt,
    });
  },
});

// Crea o aggiorna profilo integrator (per configurazione manuale)
export const createOrUpdateProfile = mutation({
  args: {
    auth0UserId: v.string(),
    companyId: v.string(),
    companySlug: v.string(),
    companyName: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("integratorProfiles")
      .withIndex("by_auth0_user", (q) => q.eq("auth0UserId", args.auth0UserId))
      .first();

    const now = Date.now();

    if (existing) {
      // Aggiorna profilo esistente
      return await ctx.db.patch(existing._id, {
        companyId: args.companyId,
        companySlug: args.companySlug,
        companyName: args.companyName,
        lastLoginAt: now,
        updatedAt: now,
      });
    } else {
      // Crea nuovo profilo
      return await ctx.db.insert("integratorProfiles", {
        auth0UserId: args.auth0UserId,
        companyId: args.companyId,
        companySlug: args.companySlug,
        companyName: args.companyName,
        isActive: true,
        lastLoginAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Verifica se utente ha accesso a company specifica
export const hasCompanyAccess = query({
  args: { 
    auth0UserId: v.string(),
    companyId: v.string() 
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("integratorProfiles")
      .withIndex("by_auth0_user", (q) => q.eq("auth0UserId", args.auth0UserId))
      .first();

    if (!profile || !profile.isActive) {
      return false;
    }

    return profile.companyId === args.companyId;
  },
});

// Ottieni tutti i profili di una company
export const getCompanyProfiles = query({
  args: { companyId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("integratorProfiles")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Ottieni companies disponibili per un utente da LinkHub
export const getUserCompanies = query({
  args: { accessToken: v.string() },
  handler: async (ctx, args) => {
    try {
      const linkhubApiUrl = process.env.LINKHUB_API_URL;
      if (!linkhubApiUrl) {
        throw new Error("LINKHUB_API_URL not configured");
      }

      const response = await fetch(`${linkhubApiUrl}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jwtToken: args.accessToken,
        }),
      });

      if (!response.ok) {
        throw new Error(`LinkHub API error: ${response.status}`);
      }

      const data = await response.json();

      // Ritorna solo se l'utente ha una company integrator abilitata
      if (data.integratorCompany && data.integratorCompany.integratorEnabled) {
        return [data.integratorCompany];
      }

      return [];
    } catch (error) {
      console.error("Errore chiamata API LinkHub per companies:", error);
      return [];
    }
  },
});