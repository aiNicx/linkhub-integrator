import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// 🔄 Export sync engine
export * as sync from "./sync/engine";
// NOTA: Le funzioni Convex incluse in `api` devono essere esportate direttamente
// dal modulo. Riesportiamo qui le utility di sync come funzioni first-class,
// così `api.integrations.*` le espone correttamente.

// === Sync Queries ===
export const getInstance = query({
  args: { instanceId: v.id("integrationInstances") },
  handler: async (ctx, args) => {
    const instance = await ctx.db.get(args.instanceId);
    if (!instance) return null;
    const profile = await ctx.db.get(instance.profileId);
    return { ...instance, companyId: profile?.companyId };
  },
});

export const getProvider = query({
  args: { providerId: v.id("providers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.providerId);
  },
});

// === Sync Mutations ===
export const updateCursor = mutation({
  args: {
    instanceId: v.id("integrationInstances"),
    cursor: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.instanceId, {
      lastModifiedCursor: args.cursor,
      updatedAt: Date.now(),
    });
  },
});

export const updateLastSync = mutation({
  args: {
    instanceId: v.id("integrationInstances"),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.instanceId, {
      lastSyncAt: args.timestamp,
      updatedAt: args.timestamp,
    });
  },
});

// Ottieni istanze integrazione (configurazioni attive) per un profilo
export const getProviderConfigs = query({
  args: { profileId: v.id("integratorProfiles") },
  handler: async (ctx, args) => {
    // Le configurazioni sono memorizzate in `integrationInstances`
    return await ctx.db
      .query("integrationInstances")
      .withIndex("by_profile", (q) => q.eq("profileId", args.profileId))
      .filter((q) => q.neq(q.field("status"), "paused"))
      .collect();
  },
});

// Crea o aggiorna configurazione provider (istanza integrazione)
export const createOrUpdateProviderConfig = mutation({
  args: {
    profileId: v.id("integratorProfiles"),
    // si passa lo slug del provider per identificarlo
    providerSlug: v.string(),
    config: v.object({
      // credenziali semplici
      apiKey: v.optional(v.string()),
      accessToken: v.optional(v.string()),
      refreshToken: v.optional(v.string()),
      expiresAt: v.optional(v.number()),

      // mapping campi
      mappings: v.optional(
        v.array(
          v.object({
            externalField: v.string(),
            linkhubEntity: v.string(),
            linkhubField: v.string(),
          })
        )
      ),

      // impostazioni di sync
      syncDirection: v.optional(
        v.union(v.literal("import"), v.literal("export"), v.literal("bidirectional"))
      ),
      syncFrequency: v.optional(
        v.union(v.literal("manual"), v.literal("hourly"), v.literal("daily"), v.literal("weekly"))
      ),
      status: v.optional(
        v.union(v.literal("active"), v.literal("paused"), v.literal("error"), v.literal("setup_incomplete"))
      ),
    }),
  },
  handler: async (ctx, args) => {
    // Ricava l'id del provider a partire dallo slug
    const provider = await ctx.db
      .query("providers")
      .withIndex("by_slug", (q) => q.eq("slug", args.providerSlug))
      .first();

    if (!provider) {
      throw new Error(`Provider con slug ${args.providerSlug} non trovato`);
    }

    const existing = await ctx.db
      .query("integrationInstances")
      .withIndex("by_profile_provider", (q) =>
        q.eq("profileId", args.profileId).eq("providerId", provider._id)
      )
      .first();

    const now = Date.now();

    const credentials =
      args.config.apiKey || args.config.accessToken || args.config.refreshToken
        ? {
            accessToken: args.config.accessToken,
            refreshToken: args.config.refreshToken,
            apiKey: args.config.apiKey,
            expiresAt: args.config.expiresAt,
          }
        : undefined;

    if (existing) {
      await ctx.db.patch(existing._id, {
        credentials,
        syncDirection: args.config.syncDirection ?? existing.syncDirection,
        syncFrequency: args.config.syncFrequency ?? existing.syncFrequency,
        status: args.config.status ?? existing.status,
        updatedAt: now,
      });

      // Gestione mapping: opzionale, semplice replace totale
      if (args.config.mappings) {
        // elimina i mapping esistenti per l'istanza
        const existingMappings = await ctx.db
          .query("fieldMappings")
          .withIndex("by_instance", (q) => q.eq("integrationInstanceId", existing._id))
          .collect();
        for (const m of existingMappings) {
          await ctx.db.delete(m._id);
        }
        // inserisci i nuovi mapping
        for (const m of args.config.mappings) {
          await ctx.db.insert("fieldMappings", {
            integrationInstanceId: existing._id,
            externalField: m.externalField,
            linkhubEntity: m.linkhubEntity,
            linkhubField: m.linkhubField,
            createdAt: now,
          });
        }
      }

      return existing._id;
    } else {
      const instanceId = await ctx.db.insert("integrationInstances", {
        profileId: args.profileId,
        providerId: provider._id,
        setupStep: "completed",
        credentials,
        syncDirection: args.config.syncDirection ?? "import",
        syncFrequency: args.config.syncFrequency ?? "manual",
        status: args.config.status ?? "active",
        createdAt: now,
        updatedAt: now,
      });

      if (args.config.mappings) {
        for (const m of args.config.mappings) {
          await ctx.db.insert("fieldMappings", {
            integrationInstanceId: instanceId,
            externalField: m.externalField,
            linkhubEntity: m.linkhubEntity,
            linkhubField: m.linkhubField,
            createdAt: now,
          });
        }
      }

      return instanceId;
    }
  },
});

// Log operazione sincronizzazione
export const logSyncOperation = mutation({
  args: {
    profileId: v.id("integratorProfiles"),
    integrationInstanceId: v.id("integrationInstances"),
    operation: v.union(v.literal("import"), v.literal("export")),
    entityType: v.string(),
    recordsProcessed: v.number(),
    recordsSuccess: v.optional(v.number()),
    recordsWarning: v.optional(v.number()),
    recordsError: v.optional(v.number()),
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
    errorStackTrace: v.optional(v.string()),
    metadata: v.optional(v.any()),
    durationMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("syncLogs", {
      integrationInstanceId: args.integrationInstanceId,
      profileId: args.profileId,
      operation: args.operation,
      entityType: args.entityType,
      recordsProcessed: args.recordsProcessed,
      recordsSuccess: args.recordsSuccess ?? 0,
      recordsWarning: args.recordsWarning ?? 0,
      recordsError: args.recordsError ?? 0,
      success: args.success,
      errorMessage: args.errorMessage,
      errorStackTrace: args.errorStackTrace,
      durationMs: args.durationMs,
      failedRecords: undefined,
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
    
    // Usa indici disponibili: per profilo -> "by_profile" quindi ordina desc lato client
    const logs = await ctx.db
      .query("syncLogs")
      .withIndex("by_profile", (q) => q.eq("profileId", args.profileId))
      .collect();

    // Ordina per timestamp decrescente e limita i risultati
    logs.sort((a, b) => b.timestamp - a.timestamp);
    return logs.slice(0, limit);
  },
});

// Disabilita configurazione provider
export const disableProviderConfig = mutation({
  args: {
    profileId: v.id("integratorProfiles"),
    providerSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const provider = await ctx.db
      .query("providers")
      .withIndex("by_slug", (q) => q.eq("slug", args.providerSlug))
      .first();

    if (!provider) return;

    const instance = await ctx.db
      .query("integrationInstances")
      .withIndex("by_profile_provider", (q) =>
        q.eq("profileId", args.profileId).eq("providerId", provider._id)
      )
      .first();

    if (instance) {
      return await ctx.db.patch(instance._id, {
        status: "paused",
        updatedAt: Date.now(),
      });
    }
  },
});