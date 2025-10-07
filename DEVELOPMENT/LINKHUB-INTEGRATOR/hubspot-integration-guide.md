### Obiettivo

Guida operativa per rendere pienamente funzionante l’integrazione HubSpot → LinkHub (import). La guida copre: configurazione su HubSpot Developer, variabili ambiente, impostazioni nel progetto e punti di estensione del codice.

Riferimento documentazione ufficiale HubSpot: [developers.hubspot.com/docs](https://developers.hubspot.com/docs)

### Prerequisiti

- Account HubSpot Developer con un’app registrata e un portale (test o produzione).
- Accesso alla Convex dashboard del progetto.
- Possibilità di impostare variabili in `env.local` (solo non sensibili) e nelle env del Convex dashboard (segreti).

### Passi su HubSpot Developer

1) Creare un’App HubSpot
- Accedi al tuo account sviluppatore e crea una nuova app.
- Configura il nome app, logo e descrizione per l’approvazione.

2) Abilitare OAuth 2.0
- Recupera `Client ID` e `Client Secret` dell’app.
- Imposta i redirect URL richiesti dal tuo flusso (per l’onboarding dell’integrazione), es. URL del frontend che avvia l’autorizzazione.
- Seleziona gli scope minimi necessari per leggere i deals (CRM). Consulta la doc HubSpot per i permessi CRM.

3) Ottenere credenziali per test
- Associa l’app a un Portale HubSpot (sandbox o produzione) e autorizza l’app.
- Recupera un `access_token`/`refresh_token` di test per verifiche iniziali.

4) Note utili
- HubSpot applica rate limits: prevedere batch/paginazione e retry nella logica dell’adapter (già supportata a livello di flusso).

### Variabili ambiente

Impostare i seguenti segreti nella Convex dashboard (ambiente server):
- `HUBSPOT_CLIENT_ID`: Client ID dell’app HubSpot.
- `HUBSPOT_CLIENT_SECRET`: Client Secret dell’app HubSpot.

Eventuali variabili opzionali lato server:
- `HUBSPOT_BASE_URL`: base url API se necessario (default: `https://api.hubspot.com`).

Variabili non sensibili in `env.local` (solo se servono alla UI):
- URL pubbliche di redirect per l’OAuth.

Nota: Non inserire mai client secret in `env.local` o nel repository.

### Configurazioni nel progetto

1) Provider in `providers`
- Registrare o verificare che esista il provider `hubspot` con `authType: "oauth2"`, `syncDirections` che includono `import`.

2) Adapter HubSpot
- File: `convex/adapters/hubspot.ts` (già presente).
- Cosa fa: autentica le credenziali, legge i `deals` via API, li trasforma in `SyncRecord` multi-entity (Indicator + Value + Initiative) e supporta il cursore incrementale.

3) Registry
- File: `convex/adapters/registry.ts`.
- Verificare che contenga la voce `hubspot` mappata a `new HubSpotAdapter()`.

4) Motore di sync
- File: `convex/sync/engine.ts`.
- Cosa fa: orchestration del job, chiama l’adapter, salva su LinkHub principale (tramite stub da collegare) e logga l’operazione.

5) API pubbliche
- File: `convex/integrations.ts`.
- Espone utility di supporto (`getInstance`, `getProvider`, `updateCursor`, `updateLastSync`, `logSyncOperation`) e `sync.executeSyncJob`.

### Preparazione credenziali di istanza

Per un profilo integrator attivo, creare o aggiornare una `integrationInstance` con:
- `providerId`: quello del provider `hubspot`.
- `credentials`: almeno `accessToken` iniziale (e `refreshToken` se previsto dal flusso OAuth).
- `config` opzionale: id di pipeline HubSpot o altri filtri.
- `syncDirection`: impostare `import` per il flusso in ingresso.
- `status`: `active`.

Suggerimento: mantenere `accessToken` aggiornato tramite refresh periodico; le funzioni presenti nell’adapter facilitano questo passaggio.

### Esecuzione del job di sync

1) Avvio manuale
- Richiamare `api.integrations.sync.executeSyncJob` passando l’`integrationInstanceId` dell’istanza configurata.

2) Verifica risultato
- Controllare la tabella `syncLogs` (dashboard Convex) per esito, quantità e durata.
- Verificare `integrationInstances.lastModifiedCursor` e `lastSyncAt` aggiornati.

3) Incrementale
- I batch successivi useranno `nextCursor` restituito dall’API HubSpot per riprendere dal punto corretto.

### Collegamento a LinkHub principale

- In `convex/sync/engine.ts` è presente lo stub `saveToLinkHub` che oggi effettua un mock.
- Sostituire lo stub con chiamate agli endpoint del LinkHub principale per creare `indicators`, `values` e `initiatives` usando i dati ricevuti dall’adapter HubSpot.
- Proteggere le chiamate con autenticazione server-to-server e gestire gli eventuali errori/ritenti.

### Troubleshooting

- Token scaduti: utilizzare il `refreshToken` per ottenere nuovi token (l’adapter prevede `refreshToken()`).
- Errori API HubSpot: consultare i log della funzione e la documentazione ufficiale per i codici errore e i limiti: [developers.hubspot.com/docs](https://developers.hubspot.com/docs)
- Record mancanti: verificare pipeline/filtri configurati nel parametro `config` dell’istanza.
- Rate limits: ridurre `batchSize` o introdurre backoff tra i batch.

### Checklist finale

- Credenziali app HubSpot create e autorizzate sul portale desiderato.
- `HUBSPOT_CLIENT_ID` e `HUBSPOT_CLIENT_SECRET` impostati nella Convex dashboard.
- Provider `hubspot` presente e attivo.
- Adapter registrato nel registry.
- `integrationInstance` creata con `accessToken` valido e config corretta.
- Job di sync eseguito con log OK e dati consegnati a LinkHub principale.


