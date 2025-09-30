import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Ottieni configurazioni provider per un profilo
export const getProviderConfigs = query({
  args: { profileId: v.id("integratorProfiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("providerConfigs")
      .withIndex("by_profile", (q) => q.eq("profileId", args.profileId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Crea o aggiorna configurazione provider
export const createOrUpdateProviderConfig = mutation({
  args: {
    profileId: v.id("integratorProfiles"),
    provider: v.string(),
    config: v.object({
      apiKey: v.optional(v.string()),
      webhookUrl: v.optional(v.string()),
      mappings: v.optional(v.array(v.object({
        sourceField: v.string(),
        targetField: v.string(),
        transformation: v.optional(v.string()),
      }))),
      syncSettings: v.optional(v.object({
        frequency: v.union(
          v.literal("manual"),
          v.literal("hourly"),
          v.literal("daily"),
          v.literal("weekly")
        ),
        enabled: v.boolean(),
      })),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("providerConfigs")
      .withIndex("by_profile_provider", (q) => 
        q.eq("profileId", args.profileId).eq("provider", args.provider)
      )
      .first();

    const now = Date.now();

    if (existing) {
      // Aggiorna configurazione esistente
      return await ctx.db.patch(existing._id, {
        config: args.config,
        updatedAt: now,
      });
    } else {
      // Crea nuova configurazione
      return await ctx.db.insert("providerConfigs", {
        profileId: args.profileId,
        provider: args.provider,
        config: args.config,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Log operazione sincronizzazione
export const logSyncOperation = mutation({
  args: {
    profileId: v.id("integratorProfiles"),
    provider: v.string(),
    operation: v.union(v.literal("import"), v.literal("export")),
    entityType: v.string(),
    recordsProcessed: v.number(),
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
    metadata: v.optional(v.any()),
    durationMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("syncLogs", {
      profileId: args.profileId,
      provider: args.provider,
      operation: args.operation,
      entityType: args.entityType,
      recordsProcessed: args.recordsProcessed,
      success: args.success,
      errorMessage: args.errorMessage,
      metadata: args.metadata,
      durationMs: args.durationMs,
      timestamp: Date.now(),
    });
  },
});

// Ottieni log recenti per un profilo
export const getRecentSyncLogs = query({
  args: { 
    profileId: v.id("integratorProfiles"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    
    return await ctx.db
      .query("syncLogs")
      .withIndex("by_profile_timestamp", (q) => q.eq("profileId", args.profileId))
      .order("desc")
      .take(limit);
  },
});

// Disabilita configurazione provider
export const disableProviderConfig = mutation({
  args: {
    profileId: v.id("integratorProfiles"),
    provider: v.string(),
  },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("providerConfigs")
      .withIndex("by_profile_provider", (q) => 
        q.eq("profileId", args.profileId).eq("provider", args.provider)
      )
      .first();

    if (config) {
      return await ctx.db.patch(config._id, {
        isActive: false,
        updatedAt: Date.now(),
      });
    }
  },
});