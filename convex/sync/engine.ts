/**
 * 🔄 SYNC ENGINE
 * 
 * Motore di sincronizzazione leggero e scalabile.
 * Gestisce sync tra app esterne e LinkHub con supporto:
 * - Single entity e Multi-entity
 * - Sync incrementale
 * - Dependency management
 * - Error handling e logging
 */

import { action, ActionCtx } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { getAdapter } from "../adapters/registry";
import { SyncRecord, IntegrationInstance } from "../adapters/types";
import { Id } from "../_generated/dataModel";

// ============================================================================
// EXECUTE SYNC JOB
// ============================================================================

export const executeSyncJob = action({
  args: {
    integrationInstanceId: v.id("integrationInstances"),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();
    let loadedInstance: InstanceWithCompanyId | null = null;
    
    try {
      // 1. Carica integration instance e provider
      const instance = await ctx.runQuery(
        api.integrations.getInstance,
        {
        instanceId: args.integrationInstanceId,
        }
      );

      if (!instance) {
        throw new Error("Integration instance not found");
      }

      loadedInstance = instance;

      const provider = await ctx.runQuery(
        api.integrations.getProvider,
        {
        providerId: instance.providerId,
        }
      );

      if (!provider) {
        throw new Error("Provider not found");
      }

      // 2. Ottieni adapter
      const adapter = getAdapter(provider.slug);

      // 3. Fetch records dall'app esterna
      console.log(`[Sync] Fetching records from ${provider.name}...`);
      
      const fetchResult = await adapter.fetchRecords({
        credentials: instance.credentials || {},
        config: instance.config,
        lastModifiedCursor: instance.lastModifiedCursor,
        batchSize: 100,
      });

      console.log(`[Sync] Fetched ${fetchResult.records.length} records`);

      // 4. Processa ogni record
      let totalSuccess = 0;
      let totalErrors = 0;
      let totalWarnings = 0;

      for (const record of fetchResult.records) {
        const result = await processRecord(ctx, record, instance);
        totalSuccess += result.successCount;
        totalErrors += result.errorCount;
        totalWarnings += result.warningCount;
      }

      // 5. Aggiorna cursor per prossimo sync incrementale
      if (fetchResult.nextCursor) {
        await ctx.runMutation(
          api.integrations.updateCursor,
          {
          instanceId: args.integrationInstanceId,
          cursor: fetchResult.nextCursor,
          }
        );
      }

      // 6. Aggiorna lastSyncAt
      await ctx.runMutation(
        api.integrations.updateLastSync,
        {
        instanceId: args.integrationInstanceId,
        timestamp: Date.now(),
        }
      );

      // 7. Log risultato
      const durationMs = Date.now() - startTime;
      
      await ctx.runMutation(api.integrations.logSyncOperation, {
        integrationInstanceId: args.integrationInstanceId,
        profileId: instance.profileId,
        operation: instance.syncDirection === "export" ? "export" : "import",
        entityType: "mixed", // Multi-entity
        recordsProcessed: fetchResult.records.length,
        recordsSuccess: totalSuccess,
        recordsWarning: totalWarnings,
        recordsError: totalErrors,
        success: totalErrors === 0,
        durationMs,
      });

      console.log(
        `[Sync] Completed in ${durationMs}ms: ${totalSuccess} success, ${totalErrors} errors, ${totalWarnings} warnings`
      );

      return {
        success: totalErrors === 0,
        recordsProcessed: fetchResult.records.length,
        recordsSuccess: totalSuccess,
        recordsError: totalErrors,
        recordsWarning: totalWarnings,
        durationMs,
      };
    } catch (error) {
      console.error("[Sync] Error:", error);

      // Log errore
      const fallbackProfileId = (loadedInstance?.profileId ??
        ("000000000000000000000000" as Id<"integratorProfiles">)) as Id<
        "integratorProfiles"
      >;

      await ctx.runMutation(api.integrations.logSyncOperation, {
        integrationInstanceId: args.integrationInstanceId,
        profileId: fallbackProfileId,
        operation: "import",
        entityType: "unknown",
        recordsProcessed: 0,
        recordsSuccess: 0,
        recordsWarning: 0,
        recordsError: 1,
        success: false,
        errorMessage: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - startTime,
      });

      throw error;
    }
  },
});

// ============================================================================
// PROCESS SINGLE RECORD
// ============================================================================

type InstanceWithCompanyId = IntegrationInstance & { companyId?: string };

async function processRecord(
  ctx: ActionCtx,
  record: SyncRecord,
  instance: InstanceWithCompanyId
): Promise<{ successCount: number; errorCount: number; warningCount: number }> {
  if (record.type === "single") {
    // Single entity: salva direttamente
    return processSingleEntity(ctx, record, instance);
  } else {
    // Multi entity: salva con dependency management
    return processMultiEntity(ctx, record, instance);
  }
}

// ============================================================================
// PROCESS SINGLE ENTITY
// ============================================================================

async function processSingleEntity(
  ctx: ActionCtx,
  record: SyncRecord & { type: "single" },
  instance: InstanceWithCompanyId
): Promise<{ successCount: number; errorCount: number; warningCount: number }> {
  try {
    // Verifica companyId presente
    if (!instance.companyId) {
      throw new Error("Missing companyId on integration instance profile");
    }

    await saveToLinkHub(ctx, {
      entityType: record.linkhubEntity,
      data: record.data,
      companyId: instance.companyId,
    });

    return { successCount: 1, errorCount: 0, warningCount: 0 };
  } catch (error) {
    console.error(`[Sync] Error saving ${record.linkhubEntity}:`, error);
    return { successCount: 0, errorCount: 1, warningCount: 0 };
  }
}

// ============================================================================
// PROCESS MULTI ENTITY (con dependency management)
// ============================================================================

async function processMultiEntity(
  ctx: ActionCtx,
  record: SyncRecord & { type: "multi" },
  instance: InstanceWithCompanyId
): Promise<{ successCount: number; errorCount: number; warningCount: number }> {
  let successCount = 0;
  let errorCount = 0;
  const createdIds: Record<string, string> = {};

  for (let i = 0; i < record.entities.length; i++) {
    const entity = record.entities[i];

    try {
      // Risolvi dependency (se necessario)
      if (entity.dependsOn) {
        const depKey = `${entity.dependsOn.entity}_${entity.dependsOn.index}`;
        const depId = createdIds[depKey];

        if (!depId) {
          console.warn(
            `[Sync] Dependency not found: ${depKey}. Skipping entity.`
          );
          errorCount++;
          continue;
        }

        // Inietta ID della dependency
        const fieldName = entity.dependsOn.fieldName || `${entity.dependsOn.entity}Id`;
        entity.data[fieldName] = depId;
      }

      // Salva entity
      if (!instance.companyId) {
        throw new Error("Missing companyId on integration instance profile");
      }

      const entityId = await saveToLinkHub(ctx, {
        entityType: entity.linkhubEntity,
        data: entity.data,
        companyId: instance.companyId,
      });

      // Traccia ID creato (per dependency successive)
      createdIds[`${entity.linkhubEntity}_${i}`] = entityId;
      successCount++;
    } catch (error) {
      console.error(
        `[Sync] Error saving ${entity.linkhubEntity} (index ${i}):`,
        error
      );
      errorCount++;
    }
  }

  return { successCount, errorCount, warningCount: 0 };
}

// ============================================================================
// SAVE TO LINKHUB (chiamata API LinkHub main)
// ============================================================================

async function saveToLinkHub(
  ctx: ActionCtx,
  params: {
    entityType: "indicators" | "initiatives" | "values";
    data: Record<string, unknown>;
    companyId: string;
  }
): Promise<string> {
  // TODO: Implementare chiamata API a LinkHub main
  // Per ora, mock che restituisce ID fittizio
  
  console.log(`[Sync] Saving ${params.entityType} to LinkHub:`, params.data);
  
  // In produzione, qui farai:
  // const response = await fetch(`${LINKHUB_API_URL}/api/${params.entityType}`, {
  //   method: "POST",
  //   headers: {
  //     "Authorization": `Bearer ${JWT_TOKEN}`,
  //     "Content-Type": "application/json"
  //   },
  //   body: JSON.stringify(params.data)
  // });
  //
  // const result = await response.json();
  // return result.data.id;

  // Mock ID
  return `mock_${params.entityType}_${Date.now()}`;
}

