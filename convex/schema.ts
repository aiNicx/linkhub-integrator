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

  // Catalogo integrazioni disponibili (gestito da sviluppatori)
  providers: defineTable({
    slug: v.string(),
    name: v.string(),
    description: v.string(),
    logoUrl: v.string(),
    categories: v.array(v.string()),

    // Capabilities
    syncDirections: v.array(
      v.union(v.literal("import"), v.literal("export"), v.literal("bidirectional"))
    ),

    // Configurazione autenticazione
    authType: v.union(v.literal("oauth2"), v.literal("apikey"), v.literal("basic")),
    oauthUrl: v.optional(v.string()),
    scopes: v.optional(v.array(v.string())),
    apiKeyLabel: v.optional(v.string()),

    // Documentazione
    docsUrl: v.optional(v.string()),

    // Stato
    isActive: v.boolean(),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_category", ["categories"])
    .index("by_active", ["isActive"]),

  // Istanze configurate dagli utenti
  integrationInstances: defineTable({
    profileId: v.id("integratorProfiles"),
    providerId: v.id("providers"),

    // Setup Wizard Progress
    setupStep: v.union(
      v.literal("not_started"),
      v.literal("connection"),
      v.literal("mapping"),
      v.literal("sync_config"),
      v.literal("completed")
    ),

    // Credenziali (encrypted)
    credentials: v.optional(
      v.object({
        accessToken: v.optional(v.string()),
        refreshToken: v.optional(v.string()),
        apiKey: v.optional(v.string()),
        expiresAt: v.optional(v.number()),
      })
    ),

    // Configurazione sincronizzazione
    syncDirection: v.union(
      v.literal("import"),
      v.literal("export"),
      v.literal("bidirectional")
    ),

    syncFrequency: v.union(
      v.literal("manual"),
      v.literal("hourly"),
      v.literal("daily"),
      v.literal("weekly")
    ),

    // Stato operativo
    status: v.union(
      v.literal("active"),
      v.literal("paused"),
      v.literal("error"),
      v.literal("setup_incomplete")
    ),

    lastSyncAt: v.optional(v.number()),
    nextSyncAt: v.optional(v.number()),
    lastError: v.optional(v.string()),

    // 🆕 SYNC ENGINE SUPPORT
    lastModifiedCursor: v.optional(v.string()), // Cursor per sync incrementale
    config: v.optional(v.any()),                 // Provider-specific config

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_profile", ["profileId"])
    .index("by_provider", ["providerId"])
    .index("by_profile_provider", ["profileId", "providerId"])
    .index("by_status", ["status"])
    .index("by_next_sync", ["nextSyncAt"]),

  // Mappatura campi semplificata ed efficiente
  fieldMappings: defineTable({
    integrationInstanceId: v.id("integrationInstances"),

    // Campo esterno da mappare
    externalField: v.string(),

    // Target LinkHub
    linkhubEntity: v.string(),
    linkhubField: v.string(),

    createdAt: v.number(),
  })
    .index("by_instance", ["integrationInstanceId"])
    .index("by_linkhub_entity", ["linkhubEntity"]),

  // Log operazioni sincronizzazione
  syncLogs: defineTable({
    integrationInstanceId: v.id("integrationInstances"),
    profileId: v.id("integratorProfiles"),

    // Metadati operazione
    operation: v.union(v.literal("import"), v.literal("export")),
    entityType: v.string(),

    // Risultati
    recordsProcessed: v.number(),
    recordsSuccess: v.number(),
    recordsWarning: v.number(),
    recordsError: v.number(),

    success: v.boolean(),
    errorMessage: v.optional(v.string()),
    errorStackTrace: v.optional(v.string()),

    // Performance
    durationMs: v.optional(v.number()),

    // Dettagli opzionali per record falliti
    failedRecords: v.optional(
      v.array(
        v.object({
          externalId: v.string(),
          error: v.string(),
        })
      )
    ),

    timestamp: v.number(),
  })
    .index("by_instance", ["integrationInstanceId"])
    .index("by_profile", ["profileId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_instance_timestamp", ["integrationInstanceId", "timestamp"]),
});