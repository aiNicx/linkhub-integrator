### Scopo

Guida pratica e sintetica per aggiungere una nuova integrazione al progetto LinkHub Integrator. È descrittiva e senza codice: indica dove intervenire e in quale ordine.

### Architettura minima coinvolta

- `convex/integrations.ts`: espone API pubbliche per configurazioni e logging; riesporta anche il motore di sync come `sync.executeSyncJob`.
- `convex/sync/engine.ts`: motore di sincronizzazione generico (import/export, single/multi-entity, cursor incrementale, dependency management, logging; include uno stub per il salvataggio verso LinkHub main da collegare agli endpoint reali).
- `convex/adapters/types.ts`: interfacce comuni (`IntegrationAdapter`, `FetchParams`, `SyncRecord`, ecc.).
- `convex/adapters/registry.ts`: registro degli adapter disponibili (mappa `slug → adapter`).
- `convex/adapters/<provider>.ts`: implementazione specifica del provider che rispetta `IntegrationAdapter`.
- `convex/schema.ts`: tabelle chiave usate dal sync (`providers`, `integrationInstances`, `fieldMappings`, `syncLogs`).

### Flusso logico del sync (import)

1. Si seleziona una `integrationInstance` attiva per un provider e profilo.
2. Il motore (`engine.executeSyncJob`) recupera provider e istanza, risolve l’adapter dal `registry`.
3. L’adapter legge dal sistema esterno con filtri incrementali (cursor) e produce `SyncRecord` (single o multi-entity).
4. Il motore processa i record, gestisce dipendenze intra-record (multi-entity) e invia i dati a LinkHub main (endpoint da collegare nello stub `saveToLinkHub`).
5. Il motore aggiorna `lastModifiedCursor`, `lastSyncAt` e scrive un log sintetico in `syncLogs`.

### Passi per aggiungere una nuova integrazione

1) Registrare il provider
- Inserire un documento in `providers` con `slug`, `name`, `authType`, `syncDirections`, ecc. tramite mutation amministrativa o script di migrazione.

2) Creare l’adapter
- Creare `convex/adapters/<slug>.ts` che implementa `IntegrationAdapter`.
- L’adapter deve: autenticare/validare credenziali, leggere record dal provider, trasformarli in `SyncRecord` (preferibilmente con sync incrementale) e, se previsto, gestire l’export (opzionale).

3) Registrare l’adapter nel registro
- Aggiungere l’istanza nel `ADAPTER_REGISTRY` in `convex/adapters/registry.ts` mappando lo `slug` al nuovo adapter.

4) Creare l’istanza di integrazione
- Usare le API in `convex/integrations.ts` per creare/aggiornare documenti in `integrationInstances` con: `profileId`, `providerId`, `credentials`, `syncDirection`, `status`, ed eventuale `config` specifica del provider.
- Le credenziali sensibili dovrebbero vivere nelle env del Convex dashboard; in `integrationInstances` salvare solo ciò che serve in chiaro.

5) Eseguire il job di sync
- Invocare `api.integrations.sync.executeSyncJob` passando l’`integrationInstanceId` da testare.
- Verificare i risultati in `syncLogs` e l’aggiornamento di `lastModifiedCursor` e `lastSyncAt`.

### Considerazioni su ambienti e configurazioni

- Env Convex dashboard: client id/secret OAuth, API keys, endpoint, scope. Queste variabili sono lette dagli adapter lato server.
- `env.local` (frontend) solo per variabili non sensibili legate al flusso UI (es. redirect URL pubbliche), mai per segreti.
- Mapping campi opzionale tramite `fieldMappings` per personalizzazioni senza cambiare l’adapter.

### File chiave toccati in questa implementazione

- `convex/sync/engine.ts`: collegato a `api.integrations.sync.executeSyncJob`, tipizzato e con logging coerente.
- `convex/integrations.ts`: espone `getInstance`, `getProvider`, `updateCursor`, `updateLastSync`, `logSyncOperation` e riesporta `sync`.
- `convex/adapters/hubspot.ts`: esempio reale di adapter multi-entity.

### Checklist di completamento

- Provider registrato in `providers` e logo/documentazione associata.
- Adapter implementato e registrato in `registry`.
- Istanze create in `integrationInstances` con credenziali e config.
- Sync job eseguito con successo con log in `syncLogs`.
- Stub `saveToLinkHub` collegato agli endpoint reali del LinkHub principale.


