# LinkHub Integrator - API Endpoints Resume

Documentazione completa degli endpoint HTTP per l'integrazione con LinkHub Integrator.

## 🔐 Autenticazione

Tutti gli endpoint richiedono autenticazione tramite **JWT Token** nell'header `Authorization`:

```bash
Authorization: Bearer <JWT_TOKEN>
```

### Come Ottenere il Token

#### Metodo 1: Token di Test
> ⚠️ **ATTENZIONE**: Questo endpoint è disponibile per facilitare test e sviluppo.  
> **DEVE essere rimosso o disabilitato prima del deploy in produzione** per motivi di sicurezza.
> 
> 🔐 **SICUREZZA**: Ora richiede email E password per maggiore sicurezza anche in ambiente di test.

```bash
POST https://your-deployment.convex.site/test/generate-token
Content-Type: application/json

{
  "email": "user@company.com",
  "password": "your_password"
}
```

**Risposta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "email": "user@company.com",
    "primaryCompanyId": "company_id",
    "isGlobalAdmin": false
  },
  "integratorCompany": {
    "id": "company_id",
    "name": "Company Name",
    "slug": "company-slug",
    "integratorEnabled": true
  }
}
```

#### Metodo 2: Auth0 (Production)
```bash
POST https://your-deployment.convex.site/auth/token
Content-Type: application/json

{
  "jwtToken": "<AUTH0_JWT_TOKEN>"
}
```

---

## 📋 Endpoint Implementati

### 1. Teams

#### **GET /api/teams**
Recupera la lista di tutti i teams della company associata all'utente autenticato.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Risposta di Successo (200):**
```json
{
  "success": true,
  "data": {
    "teams": [
      {
        "id": "team_id_123",
        "name": "Engineering Team",
        "slug": "engineering-team",
        "impact": 100,
        "type": "FUNCTIONAL",
        "teamLeader": {
          "id": "user_id_456",
          "name": "John",
          "surname": "Doe",
          "email": "john.doe@company.com"
        },
        "cluster": {
          "id": "cluster_id_789",
          "name": "Tech Cluster",
          "slug": "tech-cluster"
        },
        "createdAt": 1704067200000
      }
    ]
  },
  "timestamp": 1704067200000
}
```

**Errori Possibili:**
- **401/403/500** - Stessi errori del Teams endpoint

---

### 2. Indicators

#### **GET /api/indicators**
Recupera la lista di tutti gli indicators della company.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Risposta di Successo (200):**
```json
{
  "success": true,
  "data": {
    "indicators": [
      {
        "id": "indicator_id_123",
        "description": "Revenue mensile",
        "symbol": "€",
        "slug": "revenue-mensile",
        "periodicity": "monthly",
        "automationUrl": "https://...",
        "automationDescription": "...",
        "notes": "...",
        "isReverse": false,
        "assignee": {
          "id": "user_id",
          "name": "John",
          "email": "john@company.com",
          "image": "..."
        },
        "values": [{"_id": "...", "value": 50000, "date": 1704067200000}],
        "createdAt": 1704067200000
      }
    ]
  },
  "timestamp": 1704067200000
}
```

#### **GET /api/indicators/:indicatorId**
Dettaglio di un indicator specifico.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Risposta di Successo (200):**
```json
{
  "success": true,
  "data": {
    "indicator": {
      "id": "indicator_id_123",
      "description": "Revenue mensile",
      "symbol": "€",
      "slug": "revenue-mensile",
      "periodicity": "monthly",
      "automationUrl": "https://...",
      "automationDescription": "...",
      "notes": "...",
      "isReverse": false,
      "assigneeId": "user_id",
      "createdAt": 1704067200000
    }
  },
  "timestamp": 1704067200000
}
```

#### **POST /api/indicators**
Crea un nuovo indicator.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "description": "Revenue mensile",
  "symbol": "€",
  "periodicity": "monthly",
  "assigneeId": "user_id_optional",
  "automationUrl": "https://... (optional)",
  "automationDescription": "... (optional)",
  "notes": "... (optional)",
  "isReverse": false
}
```

**Risposta di Successo (201):**
```json
{
  "success": true,
  "data": {
    "indicatorId": "new_indicator_id"
  },
  "timestamp": 1704067200000
}
```

#### **PUT /api/indicators/:indicatorId**
Aggiorna un indicator esistente.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "description": "Revenue mensile aggiornato (optional)",
  "symbol": "€ (optional)",
  "periodicity": "quarterly (optional)",
  "assigneeId": "user_id (optional, null per rimuovere)",
  "automationUrl": "... (optional)",
  "automationDescription": "... (optional)",
  "notes": "... (optional)",
  "isReverse": true
}
```

**Risposta di Successo (200):**
```json
{
  "success": true,
  "data": {
    "indicatorId": "indicator_id"
  },
  "timestamp": 1704067200000
}
```

---








---

### 3. Companies

#### **GET /api/companies/:companyId**
Recupera i dettagli di una company specifica.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Risposta di Successo (200):**
```json
{
  "success": true,
  "data": {
    "company": {
      "id": "company_id_123",
      "name": "Company Name",
      "slug": "company-slug",
      "mission": "La nostra missione...",
      "vision": "La nostra visione...",
      "createdAt": 1704067200000,
      "northStarKeyResultId": "key_result_id_456",
      "potentialBonus": 10000,
      "executionQuestion": "Come hai contribuito all'esecuzione?",
      "reportPeriod": "MONTHLY",
      "reportExpirationDays": 7,
      "reviewExpirationDays": 3,
      "notificationAdvanceDays": 2,
      "session360Enabled": true,
      "integratorEnabled": true,
      "integratorAccountId": "user_id_789",
      "integratorAccountEmail": "admin@company.com",
      "integratorConfiguredAt": 1704067200000,
      "northStarKeyResult": {
        "id": "key_result_id_456",
        "slug": "revenue-target",
        "finalForecastValue": 500000,
        "finalTargetValue": 600000,
        "indicator": {
          "id": "indicator_id_101",
          "symbol": "€",
          "description": "Revenue mensile"
        },
        "objective": {
          "id": "objective_id_202",
          "title": "Crescita Revenue",
          "team": {
            "id": "team_id_303",
            "name": "Sales Team"
          }
        }
      },
      "departments": [
        {
          "id": "dept_id_404",
          "name": "Engineering",
          "leader": {
            "id": "user_id_505",
            "name": "John",
            "surname": "Doe",
            "email": "john.doe@company.com"
          }
        }
      ],
      "levels": [
        {
          "id": "level_id_606",
          "description": "Junior",
          "number": 1,
          "maxImpact": 50,
          "minImpact": 0
        }
      ]
    }
  },
  "timestamp": 1704067200000
}
```

**Errori Possibili:**
- **400** - Company ID richiesto
- **401** - Token JWT richiesto nell'header Authorization
- **403** - Accesso negato a questa company / Token valido ma manca integratorCompanyId
- **404** - Company non trovata
- **500** - Errore interno del server

---

### 4. Initiatives

#### **GET /api/initiatives**
Recupera la lista di tutte le initiatives della company associata all'utente autenticato.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Risposta di Successo (200):**
```json
{
  "success": true,
  "data": {
    "initiatives": [
      {
        "id": "initiative_id_123",
        "description": "Migliorare performance API",
        "slug": "migliorare-performance-api",
        "status": "ON_TIME",
        "priority": "high",
        "relativeImpact": 0.8,
        "overallImpact": 75.5,
        "checkInDays": 7,
        "isNew": false,
        "lastCheckInDate": 1704067200000,
        "finishedAt": null,
        "externalUrl": "https://jira.company.com/issue/123",
        "notes": "Focus su ottimizzazione database queries",
        "createdAt": 1704067200000,
        "updatedAt": 1704067200000,
        "assignee": {
          "id": "user_id_456",
          "name": "John",
          "email": "john.doe@company.com",
          "avatar": "https://..."
        },
        "team": {
          "id": "team_id_789",
          "name": "Engineering Team",
          "slug": "engineering-team"
        },
        "risk": {
          "id": "risk_id_101",
          "description": "Performance degradation",
          "slug": "performance-degradation",
          "keyResult": {
            "id": "key_result_id_202",
            "slug": "api-response-time",
            "finalForecastValue": 200,
            "finalTargetValue": 100,
            "indicator": {
              "id": "indicator_id_303",
              "symbol": "ms",
              "description": "Tempo di risposta API"
            }
          }
        }
      }
    ]
  },
  "timestamp": 1704067200000
}
```

#### **GET /api/initiatives/:initiativeId**
Dettaglio di un'iniziativa specifica.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Risposta di Successo (200):**
```json
{
  "success": true,
  "data": {
    "initiative": {
      "id": "initiative_id_123",
      "description": "Migliorare performance API",
      "slug": "migliorare-performance-api",
      "status": "ON_TIME",
      "priority": "high",
      "relativeImpact": 0.8,
      "overallImpact": 75.5,
      "checkInDays": 7,
      "isNew": false,
      "lastCheckInDate": 1704067200000,
      "finishedAt": null,
      "externalUrl": "https://jira.company.com/issue/123",
      "notes": "Focus su ottimizzazione database queries",
      "createdAt": 1704067200000,
      "updatedAt": 1704067200000,
      "assigneeId": "user_id_456",
      "teamId": "team_id_789",
      "riskId": "risk_id_101",
      "createdBy": "user_id_789"
    }
  },
  "timestamp": 1704067200000
}
```

#### **POST /api/initiatives**
Crea una nuova iniziativa.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "description": "Migliorare performance API",
  "teamId": "team_id_789",
  "assigneeId": "user_id_456",
  "checkInDays": 7,
  "priority": "high",
  "status": "ON_TIME",
  "riskId": "risk_id_101",
  "notes": "Focus su ottimizzazione database queries",
  "externalUrl": "https://jira.company.com/issue/123"
}
```

**Risposta di Successo (201):**
```json
{
  "success": true,
  "data": {
    "initiativeId": "new_initiative_id",
    "slug": "migliorare-performance-api"
  },
  "timestamp": 1704067200000
}
```

#### **PUT /api/initiatives/:initiativeId**
Aggiorna un'iniziativa esistente.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "description": "Migliorare performance API - Aggiornato",
  "assigneeId": "user_id_456",
  "checkInDays": 14,
  "priority": "highest",
  "status": "ON_TIME",
  "riskId": "risk_id_101",
  "notes": "Priorità aumentata per criticità",
  "externalUrl": "https://jira.company.com/issue/123"
}
```

**Risposta di Successo (200):**
```json
{
  "success": true,
  "data": {
    "initiativeId": "initiative_id_123"
  },
  "timestamp": 1704067200000
}
```

#### **PATCH /api/initiatives/:initiativeId/status**
Aggiorna solo lo status di un'iniziativa.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "status": "FINISHED"
}
```

**Risposta di Successo (200):**
```json
{
  "success": true,
  "data": {
    "initiativeId": "initiative_id_123",
    "status": "FINISHED"
  },
  "timestamp": 1704067200000
}
```

**Errori Possibili:**
- **400** - Campi obbligatori mancanti / ID iniziativa mancante
- **401** - Token JWT richiesto nell'header Authorization
- **403** - Accesso negato / Team non valido o non autorizzato
- **404** - Iniziativa non trovata
- **500** - Errore interno del server

---

## 🚀 Prossimi Endpoint da Implementare

### 5. Values (In Sviluppo)
- `GET /api/values/:indicatorId` - Lista values per indicatore
- `POST /api/values` - Crea nuovo value
- `PUT /api/values/:valueId` - Aggiorna value
- `DELETE /api/values/:valueId` - Soft delete value


---

## ⚠️ Note di Sicurezza per Produzione

### Endpoint da Rimuovere Prima del Deploy in Produzione

- **`POST /test/generate-token`** - Endpoint di test che genera JWT senza autenticazione Auth0
  - **Rischio**: Chiunque con un'email valida nel database può generare un token
  - **Azione richiesta**: Commentare o rimuovere la route in `convex/http.ts` prima del deploy in produzione

```typescript
// DA RIMUOVERE IN PRODUZIONE:
// http.route({
//   path: "/test/generate-token",
//   method: "POST",
//   handler: generateTestToken,
// });
```

---

## 🔧 Note Tecniche

### Formato Risposta Standard

Tutte le risposte seguono questo formato:

**Successo:**
```json
{
  "success": true,
  "data": { ... },
  "timestamp": 1704067200000
}
```

**Errore:**
```json
{
  "success": false,
  "error": "Messaggio di errore",
  "timestamp": 1704067200000
}
```

### Autenticazione JWT

Il sistema supporta due tipi di JWT:
1. **Auth0 JWT** - Per produzione (LinkHub Integrator)
2. **Convex Internal JWT** - Per test e development

Il token JWT deve contenere:
- `sub` - User ID
- `email` - Email utente
- `integratorCompanyId` - ID della company per l'integrazione
- `integratorCompanyName` - Nome della company
- `integratorCompanySlug` - Slug della company

### Company Isolation

Tutti gli endpoint filtrano automaticamente i dati per la company associata al token JWT (`integratorCompanyId`). Non è possibile accedere a dati di altre companies.

### Rate Limiting

_Da implementare: rate limiting per prevenire abusi_

### Versioning

Attualmente: **v1** (implicito)
Future versioni saranno accessibili tramite prefisso `/api/v2/...`

---

## 📊 Testing

### Esempio Completo con Postman

1. **Genera Token di Test**
```bash
POST https://admired-starling-315.convex.site/test/generate-token
Content-Type: application/json

{
  "email": "admin@yourcompany.com",
  "password": "your_password"
}
```

2. **Copia il Token dalla Risposta**

3. **Usa il Token per Chiamare l'API**
```bash
GET https://admired-starling-315.convex.site/api/teams
Authorization: Bearer <token_copiato>
```

### Esempio con cURL

```bash
# 1. Ottieni token
curl -X POST https://admired-starling-315.convex.site/test/generate-token \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yourcompany.com","password":"your_password"}'

# 2. Usa token
curl -X GET https://admired-starling-315.convex.site/api/teams \
  -H "Authorization: Bearer <your_token>"
```

---

## 📝 Changelog

### v1.3.0 (2025-01-03)
- ✅ Implementati endpoint Initiatives:
  - `GET /api/initiatives` - Lista initiatives con relazioni complete
  - `GET /api/initiatives/:initiativeId` - Dettaglio iniziativa
  - `POST /api/initiatives` - Crea nuova iniziativa
  - `PUT /api/initiatives/:initiativeId` - Aggiorna iniziativa
  - `PATCH /api/initiatives/:initiativeId/status` - Aggiorna solo status
- 🔐 **SICUREZZA**: Verifica accesso solo alle initiatives dei team della company
- 📊 Include dati completi: assignee, team, risk con keyResult e indicator
- 🎯 Supporto per priority, impact calculation e status management

### v1.2.0 (2025-01-03)
- ✅ Implementato endpoint Companies:
  - `GET /api/companies/:companyId` - Dettagli company con relazioni complete
- 🔐 **SICUREZZA**: Verifica che l'utente abbia accesso solo alla propria company
- 📊 Include dati completi: mission, vision, northStarKeyResult, departments, levels
- 🔗 Supporto per configurazione integrator e moduli opzionali

### v1.1.1 (2025-01-03)
- 🔐 **SICUREZZA**: Endpoint di test ora richiede email E password per maggiore sicurezza
- ✅ Migliorata sicurezza dell'endpoint `/test/generate-token` con validazione password bcrypt
- 📚 Aggiornata documentazione con nuovi parametri richiesti

### v1.1.0 (2025-01-03)
- ✅ Implementati endpoint Indicators:
  - `GET /api/indicators` - Lista indicators
  - `GET /api/indicators/:indicatorId` - Dettaglio indicator
  - `POST /api/indicators` - Crea indicator
  - `PUT /api/indicators/:indicatorId` - Aggiorna indicator

### v1.0.0 (2025-01-03)
- ✅ Implementato endpoint `GET /api/teams`
- ✅ Implementato endpoint di test `POST /test/generate-token`
- ✅ Sistema di autenticazione JWT (Auth0 + Convex)
- ✅ Company-level authorization

---

## 🆘 Support

Per supporto o segnalazione bug, contattare il team di sviluppo LinkHub.

**Deployment URL:** https://admired-starling-315.convex.site
