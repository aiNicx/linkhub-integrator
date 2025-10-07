import { Button } from "@/components/ui/button"
import Link from "next/link"

interface ErrorPageProps {
  searchParams: Promise<{
    error?: string
  }>
}

export default async function AuthErrorPage({ searchParams }: ErrorPageProps) {
  const { error } = await searchParams

  const getErrorMessage = (error: string) => {
    switch (error) {
      case "Configuration":
        return "Errore di configurazione del server di autenticazione."
      case "AccessDenied":
        return "Accesso negato. Il tuo account non è abilitato come Integrator oppure il signup è disabilitato per questa applicazione. Contatta l'amministratore LinkHub."
      case "Verification":
        return "Errore di verifica del token."
      case "Default":
        return "Si è verificato un errore durante l'autenticazione."
      default:
        return "Errore sconosciuto durante l'autenticazione."
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Errore di Autenticazione
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {error ? getErrorMessage(error) : "Si è verificato un errore imprevisto."}
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow">
          <div className="text-center space-y-4">
            <Button asChild className="w-full">
              <Link href="/auth/signin">
                Riprova
              </Link>
            </Button>

            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                Torna alla Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}