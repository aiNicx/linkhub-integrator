# 🏗️ INTEGRATIONS STRUCTURE - Sistema Modulare e Scalabile

## 📋 INDICE
1. [Architettura del Sistema](#architettura-del-sistema)
2. [Modello Dati Rivisto](#modello-dati-rivisto)
3. [Flusso Implementativo per Sviluppatori](#flusso-implementativo-per-sviluppatori)
4. [Modifiche Database](#modifiche-database)
5. [Considerazioni Tecniche](#considerazioni-tecniche)

---

## 🎯 ARCHITETTURA DEL SISTEMA

### Principi Fondamentali

Il sistema di integrazioni si basa su **4 pilastri**:

1. **Provider Registry** → Catalogo delle integrazioni disponibili (sviluppate da noi)
2. **Integration Instance** → Istanza configurata dall'utente per una specifica integrazione
3. **Field Mapping** → Collegamento tra campi app esterna ↔ entità LinkHub
4. **Sync Engine** → Motore di sincronizzazione dati con scheduling e logging

### Concetti Chiave

#### 1. Provider (Integrazione Disponibile)
Rappresenta un'integrazione **sviluppata dal team LinkHub** e resa disponibile agli utenti.

**Caratteristiche:**
- È **immutabile** per l'utente (modificabile solo da sviluppatori)
- Definisce metadati dell'integrazione (nome, logo, capabilities)
- Specifica quali entità LinkHub può gestire (indicators, initiatives, values)
- Dichiara i campi disponibili nell'app esterna

**Esempio HubSpot:**
```
Provider: "hubspot"
Name: "HubSpot CRM"
Logo: "hubspot-logo.svg"
Categories: ["CRM"]
Capabilities: ["import", "export"]
Entities Supported:
  - Type: "deal"
    LinkHub Target: ["indicators", "initiatives"]
    Fields:
      - name: "amount", type: "number", required: true
      - name: "closedate", type: "date", required: true
      - name: "dealstage", type: "string", required: false
      - name: "hubspot_owner_id", type: "string", required: false
Auth Type: "oauth2"
```

#### 2. Integration Instance (Configurazione Utente)
È l'**istanza configurata da un utente** per un provider specifico.

**Caratteristiche:**
- È **univoca** per coppia (profileId, providerId)
- Memorizza credenziali/token di autenticazione
- Traccia stato configurazione (setup_step: 1-4)
- Mantiene stato operativo (active/paused/error)

**Stati Setup:**
- `step_1_connection`: Autenticazione completata
- `step_2_mapping`: Mapping configurato
- `step_3_sync`: Sincronizzazione configurata
- `step_4_active`: Integrazione attiva

#### 3. Field Mapping (Mappatura Dati)
Definisce **come i dati vengono trasformati** tra app esterna e LinkHub.

**Caratteristiche:**
- Mapping 1:1 tra campo esterno e campo LinkHub
- Supporto trasformazioni (es. "USD" → numero, "Open" → "ON_TIME")
- Validazione tipi dato
- Preview in tempo reale

**Esempio:**
```
External Field: "dealstage"
LinkHub Entity: "initiatives"
LinkHub Field: "status"
Transformation: {
  "Open": "ON_TIME",
  "In Progress": "ON_TIME",
  "Won": "FINISHED",
  "Lost": "FINISHED"
}
```

#### 4. Sync Engine
Gestisce **esecuzione sincronizzazioni** con scheduling e retry logic.

**Caratteristiche:**
- Cron jobs per sincronizzazioni automatiche
- Retry logic con backoff esponenziale
- Logging dettagliato per debug
- Rollback in caso di errori critici

---

## 🗄️ MODELLO DATI RIVISTO

### Schema Database Semplificato

#### ✅ TABELLE DA MANTENERE

**1. `integratorProfiles`** (invariata)
- Profilo utente collegato a LinkHub
- **Conservare così com'è** ✅

---

#### 🔄 TABELLE DA MODIFICARE/ELIMINARE

**2. ~~`providerConfigs`~~ → SOSTITUIRE**

**PROBLEMI ATTUALI:**
- `config` troppo generico e non tipizzato
- Mescola dati di configurazione e credenziali
- Non distingue tra "provider disponibile" e "istanza configurata"
- Campo `mappings` dentro `config` non permette query efficienti

**SOLUZIONE: DIVIDERE IN 3 TABELLE**

---

**3. ~~`apiKeys`~~ → ELIMINARE** ❌

**MOTIVO:**
- Ridondante rispetto a credenziali in `integrationInstances`
- Aggiunge complessità senza benefici
- Le credenziali vanno salvate direttamente nell'istanza

---

**4. `syncLogs`** (mantenere con modifiche minori)
- Aggiungere `integrationInstanceId` per query più efficienti
- **Modificare leggermente** 🔄

---

#### ✨ NUOVE TABELLE PROPOSTE

### **TABELLA 1: `providers`**
*Catalogo integrazioni disponibili (gestito da sviluppatori)*

```typescript
providers: defineTable({
  slug: v.string(),                    // "hubspot", "powerbi", "planner"
  name: v.string(),                    // "HubSpot CRM"
  description: v.string(),
  logoUrl: v.string(),
  categories: v.array(v.string()),     // ["CRM"], ["Data Analysis"]

  // Capabilities - appiattito per semplicità
  syncDirections: v.array(v.union(
    v.literal("import"),
    v.literal("export"),
    v.literal("bidirectional")
  )),

  // Configurazione autenticazione - appiattita per semplicità
  authType: v.union(v.literal("oauth2"), v.literal("apikey"), v.literal("basic")),
  oauthUrl: v.optional(v.string()),
  scopes: v.optional(v.array(v.string())),
  apiKeyLabel: v.optional(v.string()),  // "HubSpot API Key"
  
  // Documentazione
  docsUrl: v.optional(v.string()),
  
  // Stato
  isActive: v.boolean(),               // Visibile agli utenti?
  
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_slug", ["slug"])
.index("by_category", ["categories"])
.index("by_active", ["isActive"])
```

**Note:**
- Una riga per ogni integrazione sviluppata
- Popolata da sviluppatori tramite migration o admin panel
- Immutabile per gli utenti finali

---

### **TABELLA 2: `integrationInstances`**
*Istanze configurate dagli utenti*

```typescript
integrationInstances: defineTable({
  profileId: v.id("integratorProfiles"),
  providerId: v.id("providers"),
  
  // Setup Wizard Progress
  setupStep: v.union(
    v.literal("not_started"),
    v.literal("connection"),         // Step 1 completato
    v.literal("mapping"),            // Step 2 completato
    v.literal("sync_config"),        // Step 3 completato
    v.literal("completed")           // Step 4 completato
  ),
  
  // Credenziali (encrypted)
  credentials: v.optional(v.object({
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  })),
  
  // Configurazione sincronizzazione
  syncDirection: v.union(
    v.literal("import"),             // External → LinkHub
    v.literal("export"),             // LinkHub → External
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
  
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_profile", ["profileId"])
.index("by_provider", ["providerId"])
.index("by_profile_provider", ["profileId", "providerId"])
.index("by_status", ["status"])
.index("by_next_sync", ["nextSyncAt"])
```

**Note:**
- Una riga per ogni integrazione configurata dall'utente
- `setupStep` traccia progressione wizard
- `credentials` criptate con Convex encryption
- Unique constraint logico su `(profileId, providerId)` tramite applicazione

---

### **TABELLA 3: `fieldMappings`**
*Mappatura campi semplificata e efficiente*

```typescript
fieldMappings: defineTable({
  integrationInstanceId: v.id("integrationInstances"),

  // Campo esterno da mappare
  externalField: v.string(),           // "dealstage"

  // Target LinkHub
  linkhubEntity: v.string(),           // "initiatives", "indicators", "values"
  linkhubField: v.string(),            // "status", "value", "date"

  createdAt: v.number(),
})
.index("by_instance", ["integrationInstanceId"])
.index("by_linkhub_entity", ["linkhubEntity"])
```

**Note:**
- Mapping 1:1 semplificato per MVP
- Trasformazioni gestite negli adapter specifici
- Schema essenziale per massima manutenibilità

---

### **TABELLA 4: `syncLogs` (MODIFICATA)**
*Log operazioni sincronizzazione*

```typescript
syncLogs: defineTable({
  integrationInstanceId: v.id("integrationInstances"),
  profileId: v.id("integratorProfiles"),
  
  // Metadati operazione
  operation: v.union(v.literal("import"), v.literal("export")),
  entityType: v.string(),              // "indicators", "values", "initiatives"
  
  // Risultati
  recordsProcessed: v.number(),
  recordsSuccess: v.number(),          // NUOVO
  recordsWarning: v.number(),          // NUOVO
  recordsError: v.number(),            // NUOVO
  
  success: v.boolean(),
  errorMessage: v.optional(v.string()),
  errorStackTrace: v.optional(v.string()),  // NUOVO per debug
  
  // Performance
  durationMs: v.optional(v.number()),
  
  // Dettagli (opzionale, per record con problemi)
  failedRecords: v.optional(v.array(v.object({
    externalId: v.string(),
    error: v.string(),
  }))),
  
  timestamp: v.number(),
})
.index("by_instance", ["integrationInstanceId"])
.index("by_profile", ["profileId"])
.index("by_timestamp", ["timestamp"])
.index("by_instance_timestamp", ["integrationInstanceId", "timestamp"])
```

---

## 👨‍💻 FLUSSO IMPLEMENTATIVO PER SVILUPPATORI

### Step 1: Registrare Provider (Una Tantum)

**File:** `convex/migrations/registerProvider_hubspot.ts`

```typescript
// Esempio registrazione HubSpot
export default defineScript(async ({ db }) => {
  await db.insert("providers", {
    slug: "hubspot",
    name: "HubSpot CRM",
    description: "Integra deals, contatti e pipeline HubSpot",
    logoUrl: "/logos/hubspot.svg",
    categories: ["CRM"],
    syncDirections: ["import", "export"],
    authType: "oauth2",
    oauthUrl: "https://app.hubspot.com/oauth/authorize",
    scopes: ["crm.objects.deals.read", "crm.objects.companies.read"],
    docsUrl: "https://docs.linkhub.io/integrations/hubspot",
    isActive: true,
    isPublic: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
});
```

---

### Step 2: Implementare Adapter Pattern

**File:** `convex/adapters/hubspot.ts`

```typescript
// Interface standard per tutti gli adapter
interface IntegrationAdapter {
  // Autenticazione
  authenticate(credentials: unknown): Promise<boolean>;
  refreshToken(refreshToken: string): Promise<Credentials>;
  
  // Fetch dati da app esterna
  fetchRecords(params: FetchParams): Promise<ExternalRecord[]>;
  
  // Push dati verso app esterna
  pushRecords(records: LinkHubRecord[]): Promise<PushResult>;
  
  // Validazione mapping
  validateMapping(mapping: FieldMapping): boolean;
  
  // Trasformazione dati
  transform(
    data: unknown,
    mapping: FieldMapping,
    direction: "import" | "export"
  ): unknown;
}

// Implementazione HubSpot
export class HubSpotAdapter implements IntegrationAdapter {
  async fetchRecords(params: FetchParams) {
    // Chiamata API HubSpot per recuperare deals
    const response = await fetch(
      `https://api.hubspot.com/crm/v3/objects/deals`,
      {
        headers: {
          Authorization: `Bearer ${params.accessToken}`,
        },
      }
    );
    
    const data = await response.json();
    
    return data.results.map(deal => ({
      id: deal.id,
      fields: {
        amount: deal.properties.amount,
        closedate: deal.properties.closedate,
        dealstage: deal.properties.dealstage,
        hubspot_owner_id: deal.properties.hubspot_owner_id,
      },
    }));
  }
  
  transform(data: unknown, mapping: FieldMapping, direction: "import") {
    // Logica di trasformazione specifica per HubSpot
    if (mapping.externalField === "dealstage") {
      // Mappatura stati deal HubSpot → stati LinkHub
      const statusMap = {
        "appointmentscheduled": "ON_TIME",
        "qualifiedtobuy": "ON_TIME",
        "presentationscheduled": "ON_TIME",
        "decisionmakerboughtin": "ON_TIME",
        "contractsent": "ON_TIME",
        "closedwon": "FINISHED",
        "closedlost": "FINISHED"
      };
      return statusMap[data as string] || "ON_TIME";
    }

    if (mapping.externalField === "closedate") {
      // Conversione formato data HubSpot → formato LinkHub
      return new Date(data as string).toISOString();
    }

    // Direct mapping per altri campi
    return data;
  }
  
  // ... altri metodi
}
```

---

### Step 3: Registrare Adapter

**File:** `convex/adapters/registry.ts`

```typescript
// Esempio adapter PowerBI
export class PowerBIAdapter implements IntegrationAdapter {
  async fetchRecords(params: FetchParams) {
    // Chiamata API PowerBI per dataset
    const response = await fetch(
      `https://api.powerbi.com/v1.0/myorg/datasets/${params.datasetId}/executeQueries`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${params.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          queries: [{ query: "EVALUATE TOPN(1000, YourTable)" }]
        })
      }
    );

    const data = await response.json();
    return data.results[0].tables[0].rows.map(row => ({
      id: row.id,
      fields: row // PowerBI ha struttura diversa da HubSpot
    }));
  }

  transform(data: unknown, mapping: FieldMapping, direction: "import") {
    // Trasformazioni specifiche PowerBI
    if (mapping.externalField === "sales_amount") {
      // PowerBI usa decimali, LinkHub vuole numeri interi
      return Math.round(data as number);
    }

    if (mapping.externalField === "status_code") {
      // Mappatura codici numerici PowerBI → stati LinkHub
      const statusMap = {
        1: "ON_TIME",
        2: "AT_RISK",
        3: "FINISHED"
      };
      return statusMap[data as number] || "ON_TIME";
    }

    return data;
  }
}

// Registry di tutti gli adapter disponibili
import { HubSpotAdapter } from "./hubspot";
import { PowerBIAdapter } from "./powerbi";
import { PlannerAdapter } from "./planner";

export const ADAPTER_REGISTRY: Record<string, IntegrationAdapter> = {
  hubspot: new HubSpotAdapter(),
  powerbi: new PowerBIAdapter(),
  planner: new PlannerAdapter(),
};

export function getAdapter(providerSlug: string): IntegrationAdapter {
  const adapter = ADAPTER_REGISTRY[providerSlug];
  if (!adapter) {
    throw new Error(`Adapter not found for provider: ${providerSlug}`);
  }
  return adapter;
}
```

---

### Step 4: Sync Engine (Shared)

**File:** `convex/sync/engine.ts`

```typescript
// Sync Engine riutilizzabile per tutte le integrazioni
export async function executeSyncJob(
  integrationInstanceId: Id<"integrationInstances">
) {
  const instance = await db.get(integrationInstanceId);
  const provider = await db.get(instance.providerId);
  const mappings = await db
    .query("fieldMappings")
    .withIndex("by_instance", q => q.eq("integrationInstanceId", integrationInstanceId))
    .collect();
  
  // 1. Ottieni adapter
  const adapter = getAdapter(provider.slug);
  
  // 2. Fetch dati da app esterna
  const externalRecords = await adapter.fetchRecords({
    accessToken: instance.credentials.accessToken,
  });
  
  // 3. Trasforma dati usando mappings
  const transformedRecords = externalRecords.map(record => {
    return mappings.reduce((acc, mapping) => {
      const value = adapter.transform(
        record.fields[mapping.externalField],
        mapping,
        instance.syncDirection
      );
      acc[mapping.linkhubField] = value;
      return acc;
    }, {});
  });
  
  // 4. Salva in LinkHub (chiamata API)
  const result = await saveToLinkHub(transformedRecords, instance);
  
  // 5. Log risultato
  await db.insert("syncLogs", {
    integrationInstanceId,
    profileId: instance.profileId,
    operation: instance.syncDirection,
    entityType: mappings[0].linkhubEntity,
    recordsProcessed: externalRecords.length,
    recordsSuccess: result.successCount,
    recordsError: result.errorCount,
    success: result.errorCount === 0,
    durationMs: Date.now() - startTime,
    timestamp: Date.now(),
  });
}
```

---

## 🔄 MODIFICHE DATABASE - SUMMARY

### ❌ DA ELIMINARE
1. **`providerConfigs`** → Sostituita da `providers` + `integrationInstances` + `fieldMappings`
2. **`apiKeys`** → Credenziali salvate direttamente in `integrationInstances.credentials`

### ✅ DA MANTENERE
1. **`integratorProfiles`** → Invariata

### 🆕 DA AGGIUNGERE
1. **`providers`** → Catalogo integrazioni disponibili
2. **`integrationInstances`** → Istanze configurate dagli utenti
3. **`fieldMappings`** → Mappatura campi

### 🔄 DA MODIFICARE
1. **`syncLogs`** → Aggiungere `integrationInstanceId` e campi dettagliati

---

## 💡 CONSIDERAZIONI TECNICHE

### 1. **Sicurezza Credenziali**
- **Problema:** Salvare access token e API key
- **Soluzione:** Usare Convex built-in encryption per campo `credentials`
- **Alternativa:** Vault esterno (AWS Secrets Manager) se necessario compliance

### 2. **Scalabilità Adapter**
- **Pattern Registry** permette aggiungere nuovi adapter senza modificare sync engine
- Ogni adapter è **indipendente** e testabile
- Adapter condividono interface comune → consistenza

### 3. **Performance Sync**
- Sync grandi volumi → usare **pagination** in adapter
- Background jobs con **Convex Scheduled Actions**
- Retry logic con **exponential backoff** (1s, 2s, 4s, 8s, 16s)

### 4. **Gestione Errori**
- Errori **transitori** (rate limit) → retry automatico
- Errori **permanenti** (auth scaduta) → notifica utente + pause integration
- **Rollback parziale** se sincronizzazione fallisce a metà

### 5. **Preview Mapping (Step 2 Wizard)**
- Fetch **sample data** (max 10 record) da app esterna
- Mostra preview trasformazione in real-time
- Validazione lato client + server

### 6. **OAuth Flow**
- Redirect URL: `https://integrator.linkhub.io/oauth/callback/{provider}`
- State parameter per CSRF protection
- Refresh token automatico in background

### 7. **Rate Limiting**
- Rispettare limiti API esterne (HubSpot: 100 req/10s)
- Implementare **circuit breaker** pattern
- Queue con priorità per sync manuali vs automatiche

### 8. **Monitoring**
- Dashboard admin per monitorare:
  - Numero sync attive per provider
  - Tasso errore per provider
  - Performance media sync
  - Utilizzo quote API

---

## 🚀 VANTAGGI ARCHITETTURA PROPOSTA

### Per Sviluppatori
✅ **Aggiungere nuova integrazione = Creare nuovo Adapter**
- No modifiche a sync engine
- No modifiche a schema DB (già generico)
- Sviluppo isolato e testabile

### Per Utenti
✅ **Setup intuitivo con wizard guidato**
- Processo lineare 4 step
- Preview in tempo reale
- Test prima dell'attivazione

### Per Sistema
✅ **Scalabile e Manutenibile**
- Separazione concerns (auth, mapping, sync)
- Schema DB normalizzato
- Logging dettagliato per debug

---

## 📊 MIGRATION PLAN

### Fase 1: Schema Migration
```typescript
// 1. Creare nuove tabelle (providers, integrationInstances, fieldMappings)
// 2. Migrare dati da providerConfigs → integrationInstances + fieldMappings
// 3. Eliminare providerConfigs e apiKeys
```

### Fase 2: Codice
```typescript
// 1. Implementare adapter pattern
// 2. Creare sync engine generico
// 3. Aggiornare UI per wizard multi-step
```

### Fase 3: Testing
```typescript
// 1. Test adapter HubSpot (primo MVP)
// 2. Test sync engine con dati mock
// 3. Test E2E wizard utente
```

---

## 🎯 CONCLUSIONI

Questa architettura offre:
- **Modularità:** Ogni componente è indipendente
- **Scalabilità:** Aggiungere nuove integrazioni richiede minimo sforzo
- **Semplicità:** Schema DB essenziale senza ridondanze
- **UX Superiore:** Wizard guidato intuitivo per utenti

Il sistema attuale ha **troppa genericità** (campo `config`) e **ridondanze** (apiKeys separato). La soluzione proposta normalizza il database e introduce pattern chiari per sviluppo future integrazioni.

