"use client";

import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import {
  FileText,
  Database,
  BarChart3,
  CheckSquare,
  Zap,
  ExternalLink
} from "lucide-react";

export function DashboardContent() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) return null;

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />

      {/* Main Content */}
      <div className="ml-64 flex flex-col min-h-screen">
        <AppHeader title="LinkHub Integrator" subtitle="Gestisci le integrazioni con i tuoi software enterprise" />

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          <div className="space-y-8">
            {/* Dashboard Title */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-[hsl(221,83%,53%)] rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-foreground">LinkHub Integrator</h2>
                  <p className="text-lg text-muted-foreground">Dashboard delle Integrazioni</p>
                </div>
              </div>
              <p className="text-muted-foreground max-w-3xl">
                Connetti facilmente i tuoi software enterprise con LinkHub. Gestisci indicatori e iniziative 
                in modo centralizzato attraverso integrazioni sicure e performanti.
              </p>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Documentazione API</span>
                  </CardTitle>
                  <CardDescription>
                    Consulta la documentazione completa delle API LinkHub con esempi pratici
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <a href="/api-docs" className="flex items-center justify-center">
                      Visualizza Documentazione
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-[hsl(221,83%,53%)]" />
                    <span>Stato Integrazioni</span>
                  </CardTitle>
                  <CardDescription>
                    Monitora lo stato delle tue integrazioni attive
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Integrazioni Attive</span>
                      <span className="font-medium">0/3</span>
                    </div>
                    <div className="h-2 w-full rounded-md bg-muted">
                      <div className="h-2 rounded-md bg-[hsl(221,83%,53%)]" style={{ width: "0%" }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Categorie di Integrazione */}
            <section className="space-y-6">
              <h3 className="text-2xl font-bold text-foreground">Categorie di Integrazione</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Database className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div>CRM</div>
                        <div className="text-sm font-normal text-muted-foreground">1 software disponibili</div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Integra i tuoi dati CRM con LinkHub per una gestione unificata di clienti e opportunità
                    </p>
                    <Button variant="outline" className="w-full justify-between">
                      HubSpot
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div>Data Analysis</div>
                        <div className="text-sm font-normal text-muted-foreground">1 software disponibili</div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Connetti i tuoi strumenti di analisi per visualizzare metriche e KPI in tempo reale
                    </p>
                    <Button variant="outline" className="w-full justify-between">
                      Power BI
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <CheckSquare className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <div>Task Manager</div>
                        <div className="text-sm font-normal text-muted-foreground">1 software disponibili</div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Sincronizza task e progetti per un workflow perfettamente integrato
                    </p>
                    <Button variant="outline" className="w-full justify-between">
                      Microsoft Planner
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}