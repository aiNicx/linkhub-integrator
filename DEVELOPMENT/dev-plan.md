# 🚀 LinkHub Integrator - Guida Setup Completa

## 📋 Panoramica
Questa guida ti accompagna passo-passo nella creazione e configurazione di LinkHub Integrator, l'applicazione standalone che si connette a LinkHub principale tramite Auth0.

---

## 🎯 FASE 1: Creazione Progetto Base

### 1.1 Inizializzazione NextJS
```bash
# Crea nuovo progetto NextJS 15 con TypeScript
npx create-next-app@latest linkhub-integrator --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --yes

# Entra nella directory
cd linkhub-integrator
```

### 1.2 Installazione Dipendenze Core
```bash
# NextAuth per autenticazione server-side
npm install next-auth@beta

# Convex per database separato
npm install convex

# Shadcn/UI per componenti
npx shadcn@latest init --yes

# Utilities aggiuntive
npm install lucide-react sonner tailwind-merge clsx
```

---

## 🎯 FASE 2: Configurazione Auth0

### 2.1 Dashboard Auth0 - Usa Applicazione Esistente
1. Vai su [Auth0 Dashboard](https://manage.auth0.com)
2. **Applications** → Seleziona applicazione `LinkHub` esistente
3. **Settings** → Aggiungi agli URL esistenti:
   - **Allowed Callback URLs**:
     - `http://localhost:3000/api/auth/callback/auth0` (LinkHub esistente)
     - `http://localhost:5173/api/auth/callback/auth0` (Integrator dev)
     - `https://integrator.yourdomain.com/api/auth/callback/auth0` (Integrator prod)
   - **Allowed Logout URLs**:
     - `http://localhost:3000` (LinkHub esistente)
     - `http://localhost:5173` (Integrator dev)
     - `https://integrator.yourdomain.com` (Integrator prod)

### 2.2 Usa Credenziali Esistenti
- **Domain**: `your-tenant.auth0.com` (stesso di LinkHub)
- **Client ID**: `stesso_client_id_di_linkhub`
- **Client Secret**: `stesso_client_secret_di_linkhub`

⚠️ **IMPORTANTE**: Usa la **stessa applicazione Auth0** di LinkHub principale!

---

## 🎯 FASE 3: Setup Convex Separato

### 3.1 Crea Progetto Convex
```bash
# Installa CLI Convex globalmente
npm install -g convex

# Crea nuovo progetto Convex
npx convex dev --init --yes
```

### 3.2 Configura Schema Base
Crea `convex/schema.ts`:
```typescript
import { v } from "convex/values";

// Profili utenti integrator
export const integratorProfiles = {
  tableName: "integratorProfiles",
  schema: v.object({
    auth0UserId: v.string(),
    companyId: v.id("companies"),
    companySlug: v.string(),
    permissions: v.object({...}),
    isActive: v.boolean(),
    lastLoginAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
};

// Configurazioni provider
export const providerConfigs = {
  tableName: "providerConfigs",
  schema: v.object({...}),
};

// Log sincronizzazioni
export const syncLogs = {
  tableName: "syncLogs",
  schema: v.object({...}),
};

// Chiavi API esterne
export const apiKeys = {
  tableName: "apiKeys",
  schema: v.object({...}),
};
```

### 3.3 Deploy Schema
```bash
# Deploy schema iniziale
npx convex deploy
```

---

## 🎯 FASE 4: Environment Variables

### 4.1 File .env.local
```bash
# Auth0 (stesse credenziali di LinkHub)
AUTH0_CLIENT_ID="stesso_client_id_di_linkhub"
AUTH0_CLIENT_SECRET="stesso_client_secret_di_linkhub"
AUTH0_ISSUER="https://your-tenant.auth0.com"

# Convex Integrator
NEXT_PUBLIC_CONVEX_URL="https://your-integrator-project.convex.site"
CONVEX_URL="https://your-integrator-project.convex.cloud"

# LinkHub Main API
NEXT_PUBLIC_LINKHUB_API_URL="https://your-linkhub-domain.com/api"

# NextAuth secret
AUTH_SECRET="your_random_secret_here"

# Modalità integrator (per UI differenti)
NEXT_PUBLIC_INTEGRATOR_MODE="true"
```

---

## 🎯 FASE 5: Implementazione Autenticazione

### 5.1 Configurazione NextAuth
Crea `src/lib/auth.ts`:
```typescript
// Configurazione NextAuth con Auth0 provider
// Usa stesse credenziali di LinkHub
// Gestisce JWT e session server-side
```

### 5.2 Auth Provider
Crea `src/app/auth-provider.tsx`:
```typescript
// Provider React per NextAuth
// Gestisce session state in tutta l'app
// Wrapper per componenti autenticati
```

### 5.3 Middleware di Protezione
Crea `src/middleware.ts`:
```typescript
// Middleware che verifica:
// 1. Utente autenticato NextAuth
// 2. Session valida con JWT LinkHub
// 3. Company abilitata per integrator
// 4. Redirect automatico se condizioni non rispettate
```

---

## 🎯 FASE 6: Flusso Login Completo

### 6.1 Flusso Utente
1. **Accesso**: Utente va su `integrator.yourdomain.com`
2. **NextAuth Redirect**: Automatico a `/api/auth/signin/auth0`
3. **Auth0 Login**: Redirect a Auth0 con credenziali LinkHub
4. **JWT + Session**: NextAuth crea session server-side
5. **Middleware Check**: Verifica company `integratorEnabled: true`
6. **Profile Creation**: Auto-crea profilo integrator se necessario
7. **Dashboard Access**: Accesso completo al dashboard

### 6.2 Error Handling
- **Utente non esiste**: "Accedi prima a LinkHub principale"
- **Company non abilitata**: "Contatta admin company"
- **Session invalida**: Redirect automatico al login
- **Middleware block**: Redirect con messaggio errore

---

## 🎯 FASE 7: Dashboard Base

### 7.1 Layout Principale
```typescript
// Sidebar con navigation
// Header con user info e logout
// Main content area
```

### 7.2 Pagina Home
```typescript
// Welcome message
// Provider status cards
// Quick actions
// Recent sync logs
```

---

## 🎯 FASE 8: Deploy e Testing

### 8.1 Deploy Development
```bash
# Deploy Convex
npx convex deploy

# Build e start locale
npm run build
npm run start

# Test su http://localhost:3000
```

### 8.2 Configurazione Produzione
1. **Vercel/Netlify**: Deploy con environment variables
2. **Domain**: `integrator.yourdomain.com`
3. **SSL**: Configura automaticamente
4. **Auth0**: Aggiorna callback URLs produzione

### 8.3 Testing End-to-End
1. **Login Flow**: Test completo da LinkHub a Integrator
2. **Company Switch**: Test con utenti multi-company
3. **Error Cases**: Test tutti gli scenari di errore
4. **Performance**: Test con dati reali

---

## ⚠️ Note Importanti

### 🔐 Sicurezza
- **Stesso Tenant Auth0**: Obbligatorio per JWT compatibility
- **Audience Corretta**: `https://linkhub-api` per entrambe le app
- **Company Isolation**: Ogni integrator legato a company specifica

### 🔄 Integrazione
- **Convex Separato**: Progetto indipendente per isolamento
- **API LinkHub**: Chiama solo endpoints necessari
- **No Direct DB**: Mai accedere direttamente al DB LinkHub

### 🚀 Scalabilità
- **Provider Framework**: Pronto per nuovi provider
- **Webhook Support**: Eventi real-time
- **Monitoring**: Log centralizzato

---

## 📞 Troubleshooting

### Problemi Comuni
- **CORS Errors**: Verifica Auth0 application settings
- **JWT Invalid**: Controlla audience e issuer
- **Company Not Found**: Verifica user esiste in LinkHub
- **Profile Creation Failed**: Controlla permessi Convex

### Debug Steps
1. Controlla browser network tab
2. Verifica environment variables
3. Test Auth0 configuration
4. Controlla Convex logs

---

**🎉 Setup Completato!** Il tuo LinkHub Integrator è pronto per lo sviluppo di provider specifici (HubSpot, PowerBI, etc.).