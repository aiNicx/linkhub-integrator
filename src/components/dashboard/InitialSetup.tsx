"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface User {
  name?: string | null
  email?: string | null
  image?: string | null
  id?: string | null
  sub?: string | null
}

interface Company {
  id: string
  name: string
  slug: string
}

interface InitialSetupProps {
  user: User
}

export function InitialSetup({ user }: InitialSetupProps) {
  const { data: session } = useSession()
  const [selectedCompany, setSelectedCompany] = useState("")
  const [availableCompanies, setAvailableCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true)

  // Carica le companies disponibili dall'utente
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        if (!session?.accessToken) {
          throw new Error("Sessione non disponibile")
        }

        const { ConvexReactClient } = await import("convex/react")
        const { api } = await import("../../../convex/_generated/api")

        const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
        const companies = await convex.query(api.auth.getUserCompanies, {
          accessToken: session.accessToken as string,
        })

        setAvailableCompanies(companies)
      } catch (err) {
        console.error("Errore caricamento companies:", err)
        setError("Errore nel caricamento delle companies disponibili")
      } finally {
        setIsLoadingCompanies(false)
      }
    }

    if (session?.accessToken) {
      loadCompanies()
    }
  }, [session?.accessToken])

  const handleSetup = async () => {
    if (!selectedCompany.trim()) {
      setError("Seleziona una company")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Trova la company selezionata
      const company = availableCompanies.find(c => c.id === selectedCompany)
      if (!company) {
        throw new Error("Company non trovata")
      }

      // Chiama Convex per aggiornare il profilo integrator
      const { ConvexReactClient } = await import("convex/react")
      const { api } = await import("../../../convex/_generated/api")

      const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

      // Per Auth0, l'user ID è nel sub claim del token JWT
      // Se abbiamo un access token, estraiamo il sub da lì
      let auth0UserId = user.id;
      if (user && typeof window !== 'undefined') {
        // In questo contesto client-side, l'access token dovrebbe essere nella sessione
        const token = localStorage.getItem('next-auth.session-token');
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            auth0UserId = payload.sub || user.id;
          } catch (e) {
            console.warn('Could not decode JWT token:', e);
          }
        }
      }

      await convex.mutation(api.auth.createOrUpdateProfile, {
        auth0UserId: auth0UserId || "",
        companyId: company.id,
        companySlug: company.slug,
        companyName: company.name,
      })

      console.log("Profilo integrator configurato per company:", company.name)

      // Ricarica la pagina per mostrare la dashboard normale
      window.location.reload()
    } catch (err) {
      setError("Errore durante la configurazione")
      console.error("Errore setup:", err)
    } finally {
      setIsLoading(false)
    }
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
              <Badge variant="secondary">Setup Iniziale</Badge>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-foreground">
              Configurazione Iniziale
            </h2>
            <p className="text-muted-foreground text-lg">
              Benvenuto {user.name || "Utente"}! Prima di iniziare, dobbiamo associare il tuo account alla company LinkHub corretta.
            </p>
          </div>

          {/* Setup Form */}
          <Card>
            <CardHeader>
              <CardTitle>Associa Account LinkHub</CardTitle>
              <CardDescription>
                Seleziona la company LinkHub a cui appartieni per completare la configurazione
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="company" className="text-sm font-medium">
                  Company LinkHub
                </label>

                {isLoadingCompanies ? (
                  <div className="flex items-center justify-center p-4 border rounded-lg bg-muted">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    Caricamento companies...
                  </div>
                ) : (
                  <select
                    id="company"
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                    className="w-full p-3 border rounded-lg bg-background"
                    disabled={isLoading}
                  >
                    <option value="">Seleziona la tua company...</option>
                    {availableCompanies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button
                onClick={handleSetup}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Configurazione in corso..." : "Completa Configurazione"}
              </Button>
            </CardContent>
          </Card>

          {/* Info Section */}
          <Card>
            <CardHeader>
              <CardTitle>ℹ️ Informazioni</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong>Perché questa configurazione?</strong><br />
                  LinkHub Integrator deve sapere quale company di LinkHub gestire per mantenere
                  l&apos;isolamento e la sicurezza dei dati tra le diverse aziende.
                </p>
                <p>
                  <strong>Cosa succede dopo?</strong><br />
                  Una volta completata la configurazione, potrai gestire le integrazioni,
                  configurare provider esterni e sincronizzare i dati con la tua company.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}