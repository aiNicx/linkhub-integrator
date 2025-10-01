import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Profili utenti integrator collegati a LinkHub
  integratorProfiles: defineTable({
    auth0UserId: v.string(),              // Subject JWT Auth0
    companyId: v.string(),                // Company ID da LinkHub principale
    companySlug: v.string(),              // Per query ottimizzate
    companyName: v.string(),              // Nome della company per display
    isActive: v.boolean(),
    lastLoginAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_auth0_user", ["auth0UserId"])
    .index("by_company", ["companyId"])
    .index("by_company_slug", ["companySlug"])
    .index("by_company_name", ["companyName"]),

  // Configurazioni provider (HubSpot, PowerBI, etc.)
  providerConfigs: defineTable({
    profileId: v.id("integratorProfiles"),
    provider: v.string(),
    config: v.object({
      // Provider-specific configuration (encrypted)
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
    isActive: v.boolean(),
    lastSyncAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_profile", ["profileId"])
    .index("by_provider", ["provider"])
    .index("by_profile_provider", ["profileId", "provider"]),

  // Log operazioni sincronizzazione
  syncLogs: defineTable({
    profileId: v.id("integratorProfiles"),
    provider: v.string(),
    operation: v.union(v.literal("import"), v.literal("export")),
    entityType: v.string(),              // "indicators", "values", "initiatives"
    recordsProcessed: v.number(),
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
    metadata: v.optional(v.any()),       // Dettagli operazione
    durationMs: v.optional(v.number()),  // Performance tracking
    timestamp: v.number(),
  })
    .index("by_profile", ["profileId"])
    .index("by_provider", ["provider"])
    .index("by_timestamp", ["timestamp"])
    .index("by_profile_timestamp", ["profileId", "timestamp"]),

  // Chiavi API esterne (encrypted storage)
  apiKeys: defineTable({
    profileId: v.id("integratorProfiles"),
    provider: v.string(),
    name: v.string(),                    // Nome descrittivo
    encryptedKey: v.string(),           // Convex encrypted
    permissions: v.array(v.string()),   // Scopo chiave API
    isActive: v.boolean(),
    lastUsedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_profile", ["profileId"])
    .index("by_provider", ["provider"])
    .index("by_profile_provider", ["profileId", "provider"]),
});