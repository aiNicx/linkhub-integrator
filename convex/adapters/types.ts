/**
 * 🔌 INTEGRATION ADAPTER TYPES
 * 
 * Interface standard che ogni provider deve implementare.
 * Mantiene semplice e scalabile l'aggiunta di nuove integrazioni.
 */

import { Id } from "../_generated/dataModel";

// ============================================================================
// CREDENTIALS
// ============================================================================

export interface Credentials {
  accessToken?: string;
  refreshToken?: string;
  apiKey?: string;
  expiresAt?: number;
}

// ============================================================================
// FETCH PARAMS
// ============================================================================

export interface FetchParams {
  credentials: Credentials;
  config?: unknown;              // Provider-specific config (es. portalId, datasetId)
  lastModifiedCursor?: string;   // Per sync incrementale
  batchSize?: number;            // Numero record per batch (default: 100)
}

// ============================================================================
// SYNC RECORD (supporta single e multi-entity)
// ============================================================================

export type SyncRecord = SingleEntityRecord | MultiEntityRecord;

export interface SingleEntityRecord {
  type: "single";
  linkhubEntity: "indicators" | "initiatives" | "values";
  data: Record<string, unknown>;
  externalId?: string;           // ID nell'app esterna (per tracking)
}

export interface MultiEntityRecord {
  type: "multi";
  entities: Array<{
    linkhubEntity: "indicators" | "initiatives" | "values";
    data: Record<string, unknown>;
    externalId?: string;
    dependsOn?: {                // Per dependency tra entità
      entity: "indicators" | "initiatives" | "values";
      index: number;             // Indice nell'array entities
      fieldName?: string;        // Campo dove iniettare l'ID (default: "{entity}Id")
    };
  }>;
}

// ============================================================================
// FETCH RESULT
// ============================================================================

export interface FetchResult {
  records: SyncRecord[];
  nextCursor?: string;           // Cursor per prossimo sync incrementale
  hasMore: boolean;              // Ci sono altri record da fetchare?
}

// ============================================================================
// PUSH RESULT (per export)
// ============================================================================

export interface PushResult {
  successCount: number;
  errorCount: number;
  errors?: Array<{
    recordId: string;
    error: string;
  }>;
}

// ============================================================================
// LINKHUB RECORD (per export)
// ============================================================================

export interface LinkHubRecord {
  entityType: "indicators" | "initiatives" | "values";
  data: Record<string, unknown>;
}

// ============================================================================
// INTEGRATION ADAPTER INTERFACE
// ============================================================================

export interface IntegrationAdapter {
  /**
   * Verifica validità credenziali
   */
  authenticate(credentials: Credentials): Promise<boolean>;

  /**
   * Refresh access token se necessario (opzionale, per OAuth2)
   */
  refreshToken?(refreshToken: string): Promise<Credentials>;

  /**
   * Fetch records dall'app esterna
   * Supporta sync incrementale tramite lastModifiedCursor
   */
  fetchRecords(params: FetchParams): Promise<FetchResult>;

  /**
   * Push records verso app esterna (per export)
   */
  pushRecords?(records: LinkHubRecord[]): Promise<PushResult>;

  /**
   * Validazione config provider-specific
   * Ritorna true se config è valido, altrimenti errore
   */
  validateConfig?(config: unknown): { valid: boolean; error?: string };
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface SaveToLinkHubResult {
  successCount: number;
  errorCount: number;
  warningCount: number;
  createdIds: string[];          // ID delle entità create
  errors?: Array<{
    externalId: string;
    error: string;
  }>;
}

export interface IntegrationInstance {
  _id: Id<"integrationInstances">;
  profileId: Id<"integratorProfiles">;
  providerId: Id<"providers">;
  credentials?: Credentials;
  config?: unknown;
  syncDirection: "import" | "export" | "bidirectional";
  lastModifiedCursor?: string;
}

export interface Provider {
  _id: Id<"providers">;
  slug: string;
  name: string;
  authType: "oauth2" | "apikey" | "basic";
}

