# 🔗 LINKHUB INTEGRATOR - DESCRIPTION

## 📋 SOMMARIO

**LinkHub Integrator** è un'applicazione standalone che funge da ponte sicuro tra LinkHub e tool esterni (CRM, Data Analysis, Task Management). Utilizza **NextJS + NextAuth + Auth0 Provider** per consistenza architetturale e **Convex separato** per isolamento dei dati.

**Architettura**: NextJS + NextAuth + Auth0 Provider + Convex Project Separato
**Autenticazione**: Auth0 (stessa applicazione di LinkHub main)
**Database**: Convex isolato per configurazioni e log integrazioni
**Deployment**: Dominio separato con environment staging/production

---

## 🎯 1. CONTESTO E OBIETTIVI

### 📝 Background
LinkHub è un'applicazione OKR completa con autenticazione multi-provider (Discord, Credentials, Auth0). LinkHub Integrator semplifica le integrazioni con LinkHub main fornendo:

- **Import/Export semplificato** di Initiatives, Indicators e Values
- **API unificate** per connessione con tool esterni (CRM, Data Analysis, Task Management)
- **Dashboard centralizzata** per configurazione e monitoraggio integrazioni e consultazione api docs per integrazioni custom
- **Autenticazione trasparente** tramite stesso sistema Auth0 di LinkHub

### 🎯 Obiettivi Principali
1. **Semplificare integrazioni** con LinkHub main (Initiatives, Indicators, Values, altri)
2. **Standardizzare API** per tool esterni senza modifiche a LinkHub core
3. **Isolamento sicuro** dei dati per company con autenticazione unificata
4. **Scalabilità** per nuovi provider di integrazione
5. **Basso impatto** sull'architettura esistente di LinkHub

---

## 👤 2. ESPERIENZA UTENTE

### 🔌 Configurazione Integrazione (Wizard Multi-Step)

Ogni integrazione sviluppata dal team LinkHub viene presentata all'utente come un **processo guidato semplice e intuitivo** diviso in fasi chiare:

#### **Fase 1: Connessione**
L'utente si autentica con il proprio account dell'app esterna (es. HubSpot, Power BI, Microsoft Planner).

**Esperienza utente:**
- Visualizzazione card dell'integrazione con logo e descrizione
- Click su "Connetti" che avvia il flusso OAuth/API Key
- Autenticazione diretta con l'app esterna
- Conferma connessione avvenuta con successo

**Cosa vede l'utente:**
- Stato: "Non connesso" → "Connesso"
- Badge verde con data ultima connessione
- Possibilità di disconnettere e riconnettere

#### **Fase 2: Configurazione Direzione e Mapping**
L'utente sceglie la direzione dell'integrazione e mappa i dati tra le due piattaforme.

**Esperienza utente:**
- **Selezione direzione:**
  - `App Esterna → LinkHub` (Importa dati da app esterna)
  - `LinkHub → App Esterna` (Esporta dati verso app esterna)
  - `Bidirezionale` (Sincronizzazione completa)

- **Mapping dei dati:**
  - Interfaccia drag-and-drop o selettori visuali
  - Suggerimenti automatici basati su nomi campi simili
  - Preview dei dati in tempo reale
  - Validazione immediata della compatibilità dei tipi

**Esempio pratico (HubSpot → LinkHub):**
```
[Campo HubSpot]              →  [Campo LinkHub]
Deal Amount                  →  Indicator: Revenue
Deal Close Date              →  Value Date
Deal Stage                   →  Initiative Status
Deal Owner                   →  Initiative Assignee
```

**Cosa vede l'utente:**
- Lista campi disponibili dall'app esterna (colonna sinistra)
- Lista entità LinkHub disponibili (colonna destra)
- Preview mapping configurato
- Avvisi su campi obbligatori mancanti

#### **Fase 3: Configurazione Sincronizzazione**
L'utente definisce quando e come sincronizzare i dati.

**Opzioni disponibili:**
- **Frequenza:**
  - Manuale (on-demand)
  - Oraria
  - Giornaliera
  - Settimanale

**Cosa vede l'utente:**
- Selettori per frequenza
- Stima del numero di record che verranno sincronizzati

#### **Fase 4: Test e Attivazione**
Prima di attivare, l'utente può testare l'integrazione con un subset di dati.

**Esperienza utente:**
- Click su "Esegui Test"
- Progress bar durante il test
- Risultato del test:
  - ✅ Successo: X record sincronizzati correttamente
  - ⚠️ Warning: Y record con problemi minori (dettagli espandibili)
  - ❌ Errore: Dettagli tecnici e suggerimenti per risolvere

- Una volta superato il test:
  - Click su "Attiva Integrazione"
  - Conferma attivazione
  - Dashboard aggiornata con integrazione attiva

### 📊 Dashboard Integrazioni

**Cosa vede l'utente:**
- **Panoramica generale:**
  - Numero integrazioni attive / totali disponibili
  - Stato health generale (verde/giallo/rosso)
  - Ultima sincronizzazione per integrazione

- **Card per ogni integrazione attiva:**
  - Logo e nome app esterna
  - Badge stato: Attiva / Paused / Errore
  - Metriche chiave:
    - Record sincronizzati nell'ultimo periodo
    - Ultima sincronizzazione (timestamp)
    - Prossima sincronizzazione programmata
  - Azioni rapide:
    - Sincronizza ora (manuale)
    - Modifica configurazione
    - Pausa integrazione
    - Visualizza log

- **Log e Monitoring:**
  - Cronologia operazioni (ultimi 30 giorni)
  - Filtri per: integrazione, tipo operazione, stato (successo/errore)
  - Dettagli per ogni operazione:
    - Timestamp
    - Record processati
    - Durata operazione
    - Eventuali errori con stacktrace

### 🔔 Alert

L'utente riceve alert per:
- ✅ Sincronizzazione completata con successo
- ⚠️ Warning durante sincronizzazione (es. alcuni record saltati)
- ❌ Errore critico (es. autenticazione scaduta)

---