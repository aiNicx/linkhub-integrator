import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

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

// Crea o aggiorna profilo integrator
export const createOrUpdateProfile = mutation({
  args: {
    auth0UserId: v.string(),
    companyId: v.string(),
    companySlug: v.string(),
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
        lastLoginAt: now,
        updatedAt: now,
      });
    } else {
      // Crea nuovo profilo
      return await ctx.db.insert("integratorProfiles", {
        auth0UserId: args.auth0UserId,
        companyId: args.companyId,
        companySlug: args.companySlug,
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