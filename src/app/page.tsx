import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SignInButtonClient } from "./SignInButtonClient";

export default async function Home() {
  const session = await auth();

  // Se l'utente è autenticato, reindirizza al dashboard
  if (session?.user) {
    redirect("/dashboard");
  }

  // Se non autenticato, mostra pagina di benvenuto
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            LinkHub Integrator
          </h1>
          <p className="text-muted-foreground text-lg">
            Bridge sicuro tra LinkHub e i tuoi tool esterni
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-card border rounded-lg p-6 text-left">
            <h3 className="font-semibold text-card-foreground mb-2">
              🔗 Integrazione Completa
            </h3>
            <p className="text-sm text-muted-foreground">
              Collega HubSpot, PowerBI, Microsoft Planner e altri tool direttamente al tuo workspace LinkHub.
            </p>
          </div>

          <div className="bg-card border rounded-lg p-6 text-left">
            <h3 className="font-semibold text-card-foreground mb-2">
              🔐 Autenticazione Sicura
            </h3>
            <p className="text-sm text-muted-foreground">
              Usa le stesse credenziali Auth0 di LinkHub per un accesso sicuro e centralizzato.
            </p>
          </div>

          <div className="bg-card border rounded-lg p-6 text-left">
            <h3 className="font-semibold text-card-foreground mb-2">
              📊 Sincronizzazione Intelligente
            </h3>
            <p className="text-sm text-muted-foreground">
              Importa ed esporta dati automaticamente con mapping personalizzato e log dettagliati.
            </p>
          </div>
        </div>

        <div className="pt-4">
          <SignInButtonClient />
        </div>

        <p className="text-xs text-muted-foreground">
          LinkHub Integrator funziona solo con account LinkHub esistenti
        </p>
      </div>
    </div>
  );
}
