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
        console.log("LINKHUB_API_URL:", linkhubApiUrl ? "configured" : "NOT CONFIGURED");
        if (!linkhubApiUrl) {
          throw new Error("LINKHUB_API_URL not configured");
        }

        console.log("Chiamando LinkHub API con token:", args.accessToken ? "presente" : "mancante");
        console.log("Token JWT completo:", args.accessToken);
        console.log("Token JWT header:", args.accessToken ? JSON.parse(atob(args.accessToken.split('.')[0])) : "N/A");
        console.log("Token JWT payload:", args.accessToken ? JSON.parse(atob(args.accessToken.split('.')[1])) : "N/A");
        
        const response = await fetch(`${linkhubApiUrl}/auth/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jwtToken: args.accessToken,
          }),
        });

        console.log("LinkHub API response status:", response.status);
        
        // Converti headers in oggetto per logging
        const headersObj: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headersObj[key] = value;
        });
        console.log("LinkHub API response headers:", headersObj);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("LinkHub API error response:", errorText);
          console.error("LinkHub API full error details:", {
            status: response.status,
            statusText: response.statusText,
            headers: headersObj,
            body: errorText
          });
          throw new Error(`LinkHub API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log("LinkHub API response data:", JSON.stringify(data, null, 2));

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
        // Fallback: crea profilo con dati mock se l'API non è disponibile
        return await ctx.runMutation(api.auth.createProfile, {
          auth0UserId: args.auth0UserId,
          companyId: "default-company",
          companySlug: "default-company",
          companyName: "Default Company",
          lastLoginAt: now,
          createdAt: now,
          updatedAt: now,
        });
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