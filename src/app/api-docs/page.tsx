"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiReference } from "@/data/apiReference";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { 
  ChevronDown, 
  ChevronRight, 
  Copy, 
  ExternalLink, 
  Code2, 
  Eye,
  EyeOff
} from "lucide-react";

function CodeBlock({ code, language = "json" }: { code: unknown; language?: string }) {
  const content = typeof code === "string" ? code : JSON.stringify(code, null, 2);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <div className="flex items-center justify-between mb-2">
        <Badge variant="secondary" className="text-xs">
          {language.toUpperCase()}
        </Badge>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? "Copiato!" : <Copy className="w-3 h-3" />}
        </Button>
      </div>
      <pre className="rounded-lg bg-slate-900 text-slate-100 p-4 text-sm overflow-auto border">
        <code>{content}</code>
      </pre>
    </div>
  );
}

function CollapsibleSection({ 
  title, 
  children, 
  defaultOpen = false 
}: { 
  title: string; 
  children: React.ReactNode; 
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border rounded-lg">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between p-4 h-auto hover:bg-muted/50"
      >
        <span className="font-medium">{title}</span>
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </Button>
      {isOpen && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  );
}

export default function ApiDocsPage() {
  const [showAllSections, setShowAllSections] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="ml-64 flex flex-col min-h-screen">
        <AppHeader title="API Reference" subtitle={`Versione ${apiReference.version}`} />
        
        {/* Controls */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
          <div className="flex items-center justify-end px-6 py-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllSections(!showAllSections)}
              className="h-8"
            >
              {showAllSections ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showAllSections ? 'Nascondi tutto' : 'Mostra tutto'}
            </Button>
          </div>
        </div>

        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Introduction Section */}
            <section className="space-y-4">
              <div className="flex items-center space-x-2">
                <Code2 className="w-6 h-6 text-[hsl(221,83%,53%)]" />
                <h2 className="text-3xl font-bold">Introduzione</h2>
              </div>
              <p className="text-muted-foreground text-lg">
                {apiReference.auth.description}
              </p>
              <CollapsibleSection title="Autenticazione" defaultOpen={true}>
                <CodeBlock code={apiReference.auth.header} language="bash" />
              </CollapsibleSection>
            </section>

            {/* API Sections */}
            {apiReference.sections.map((section) => (
              <section key={section.id} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-semibold flex items-center space-x-2">
                      <Badge variant="outline" className="text-[hsl(221,83%,53%)] border-[hsl(221,83%,53%)]">
                        {section.endpoints.length}
                      </Badge>
                      <span>{section.title}</span>
                    </h3>
                    {section.description && (
                      <p className="text-muted-foreground mt-1">{section.description}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4">
                  {section.endpoints.map((ep) => (
                    <Card key={ep.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Badge 
                              className={`px-3 py-1 text-xs font-mono ${
                                ep.method === 'GET' ? 'bg-green-100 text-green-800' :
                                ep.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                                ep.method === 'PUT' ? 'bg-orange-100 text-orange-800' :
                                ep.method === 'PATCH' ? 'bg-purple-100 text-purple-800' :
                                'bg-red-100 text-red-800'
                              }`}
                            >
                              {ep.method}
                            </Badge>
                            <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                              {ep.path}
                            </code>
                          </div>
                          <Button asChild variant="ghost" size="sm">
                            <a
                              href={`https://admired-starling-315.convex.site${ep.path.replace(":indicatorId", "").replace(":companyId", "").replace(":initiativeId", "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center space-x-1"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span>Testa</span>
                            </a>
                          </Button>
                        </div>
                        <CardTitle className="text-lg mt-2">{ep.title}</CardTitle>
                        {ep.description && (
                          <p className="text-sm text-muted-foreground">{ep.description}</p>
                        )}
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {/* Headers */}
                        {ep.headers && ep.headers.length > 0 && (
                          <CollapsibleSection title="Headers" defaultOpen={showAllSections}>
                            <CodeBlock
                              code={Object.fromEntries(
                                ep.headers.map((h) => [h.name, String(h.example ?? "")])
                              )}
                              language="json"
                            />
                          </CollapsibleSection>
                        )}

                        {/* Request Body */}
                        {ep.requestBodyExample && (
                          <CollapsibleSection title="Request Body" defaultOpen={showAllSections}>
                            <CodeBlock code={ep.requestBodyExample} language="json" />
                          </CollapsibleSection>
                        )}

                        {/* Responses */}
                        {ep.responses && ep.responses.length > 0 && (
                          <CollapsibleSection title="Esempi di Risposta" defaultOpen={showAllSections}>
                            <div className="space-y-4">
                              {ep.responses.map((r) => (
                                <div key={r.status} className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <Badge 
                                      variant={r.status >= 200 && r.status < 300 ? "default" : "destructive"}
                                      className="text-xs"
                                    >
                                      HTTP {r.status}
                                    </Badge>
                                    {r.description && (
                                      <span className="text-sm text-muted-foreground">{r.description}</span>
                                    )}
                                  </div>
                                  <CodeBlock code={r.body} language="json" />
                                </div>
                              ))}
                            </div>
                          </CollapsibleSection>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}


