import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    return null; // Middleware dovrebbe gestire questo caso
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-card-foreground">
                LinkHub Integrator
              </h1>
              <Badge variant="secondary">Beta</Badge>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                {session.user.email}
              </span>
              <Button variant="outline" asChild>
                <a href="/api/auth/signout">Esci</a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-foreground">
              Benvenuto, {session.user.name || "Utente"}!
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Gestisci le integrazioni tra LinkHub e i tuoi tool esterni.
              Configura provider, sincronizza dati e monitora l'attività.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>🔗</span>
                  <span>Provider Disponibili</span>
                </CardTitle>
                <CardDescription>
                  Configura integrazioni con tool esterni
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">HubSpot</span>
                    <Badge variant="outline">Non configurato</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">PowerBI</span>
                    <Badge variant="outline">Non configurato</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Microsoft Planner</span>
                    <Badge variant="outline">Non configurato</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>📊</span>
                  <span>Sincronizzazioni</span>
                </CardTitle>
                <CardDescription>
                  Stato delle sincronizzazioni attive
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Nessuna sincronizzazione configurata
                  </p>
                  <Button className="mt-4" variant="outline">
                    Configura Prima Sincronizzazione
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>📈</span>
                  <span>Attività Recente</span>
                </CardTitle>
                <CardDescription>
                  Log delle operazioni recenti
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Nessuna attività recente
                  </p>
                  <Button className="mt-4" variant="outline">
                    Visualizza Log Completo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Getting Started */}
          <Card>
            <CardHeader>
              <CardTitle>🚀 Per Iniziare</CardTitle>
              <CardDescription>
                Segui questi passaggi per configurare le tue prime integrazioni
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl mb-2">1️⃣</div>
                  <h3 className="font-semibold mb-1">Collega Account</h3>
                  <p className="text-sm text-muted-foreground">
                    Verifica che il tuo account LinkHub sia collegato
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl mb-2">2️⃣</div>
                  <h3 className="font-semibold mb-1">Configura Provider</h3>
                  <p className="text-sm text-muted-foreground">
                    Aggiungi chiavi API per i tool che vuoi integrare
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl mb-2">3️⃣</div>
                  <h3 className="font-semibold mb-1">Imposta Mapping</h3>
                  <p className="text-sm text-muted-foreground">
                    Definisci come i dati devono essere sincronizzati
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl mb-2">4️⃣</div>
                  <h3 className="font-semibold mb-1">Attiva Sync</h3>
                  <p className="text-sm text-muted-foreground">
                    Avvia la sincronizzazione automatica dei dati
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}