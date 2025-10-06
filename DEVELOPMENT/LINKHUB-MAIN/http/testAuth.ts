import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";

export const generateTestToken = httpAction(async (ctx, request) => {
  // ⚠️ ATTENZIONE: Questo endpoint dovrebbe essere rimosso in produzione
  // Genera token di test per facilitare lo sviluppo e il testing
  // 🔐 SICUREZZA: Ora richiede email E password per maggiore sicurezza
  
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validazione input
    if (!email || !password) {
      return new Response(JSON.stringify({
        error: "Email e password sono richieste per la sicurezza"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 🔍 Trova utente per email (solo attivi, non eliminati) con password
    const user = await ctx.runQuery(internal.authAdapter.getActiveUserByEmailWithPassword, {
      email: email
    });

    if (!user || !user.password) {
      return new Response(JSON.stringify({
        error: "Credenziali non valide o utente non trovato"
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 🔐 Verifica password con bcrypt (stessa logica di auth.ts)
    const bcrypt = require("bcryptjs");
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return new Response(JSON.stringify({
        error: "Credenziali non valide"
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Trova la company collegata all'utente (se esiste)
    const company = await ctx.runQuery(internal.companies.findCompanyByIntegratorEmail, {
      email: user.email
    });

    // Genera JWT di test con dati reali
    const jwt = require("jose");
    const secret = new TextEncoder().encode(process.env.CONVEX_AUTH_ADAPTER_SECRET);

    // Se non c'è integrator company, usa la primary company dell'utente
    let companyToUse: any = company;
    if (!companyToUse && user.primaryCompanyId) {
      // Ottieni la primary company direttamente dal database
      const primaryCompany = await ctx.runQuery(internal.companies.getCompanyById, {
        companyId: user.primaryCompanyId,
        callerContext: 'test' // ✅ SICUREZZA: Indica che la chiamata proviene da test
      });
      if (primaryCompany) {
        companyToUse = primaryCompany;
      }
    }

    if (!companyToUse) {
      return new Response(JSON.stringify({
        error: "Utente non ha una company associata. Configura primaryCompanyId o integratorAccountEmail."
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const tokenPayload = {
      sub: user._id,
      email: user.email,
      primaryCompanyId: user.primaryCompanyId,
      // Usa la company trovata (integrator o primary)
      integratorCompanyId: companyToUse._id,
      integratorCompanyName: companyToUse.name,
      integratorCompanySlug: companyToUse.slug,
    };

    const token = await new jwt.SignJWT(tokenPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(secret);

    return new Response(JSON.stringify({
      token,
      user: {
        id: user._id,
        email: user.email,
        primaryCompanyId: user.primaryCompanyId,
        isGlobalAdmin: user.isGlobalAdmin,
      },
      integratorCompany: {
        id: companyToUse._id,
        name: companyToUse.name,
        slug: companyToUse.slug,
        integratorEnabled: companyToUse.integratorEnabled || false,
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Errore in /test/generate-token:", error);
    return new Response(JSON.stringify({
      error: "Errore interno del server"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});