# 🏗️ INTEGRATIONS STRUCTURE - Sistema Modulare e Scalabile


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

## 🗄️ MODELLO DATI

Questa sezione riflette lo schema attuale già implementato in Convex. Le tabelle disponibili sono `integratorProfiles`, `providers`, `integrationInstances`, `fieldMappings`, `syncLogs`.

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

## 🔄 NOTE SUL DATABASE

Le modifiche al database sono state applicate. Eventuali riferimenti a "proposte" o "migrazioni future" sono stati rimossi per evitare ambiguità.

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


## 🎯 CONCLUSIONI

Questa architettura offre:
- **Modularità:** Ogni componente è indipendente
- **Scalabilità:** Aggiungere nuove integrazioni richiede minimo sforzo
- **Semplicità:** Schema DB essenziale senza ridondanze
- **UX Superiore:** Wizard guidato intuitivo per utenti

Il sistema attuale ha **troppa genericità** (campo `config`) e **ridondanze** (apiKeys separato). La soluzione proposta normalizza il database e introduce pattern chiari per sviluppo future integrazioni.

