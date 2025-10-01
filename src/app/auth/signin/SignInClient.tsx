"use client"

import { useEffect, useState } from "react"
import { getProviders } from "next-auth/react"
import { SigninButton } from "@/components/auth/SigninButton"

interface Provider {
  id: string
  name: string
  type: string
  signinUrl: string
  callbackUrl: string
}

export function SignInClient() {
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProviders = async () => {
      try {
        const providersData = await getProviders()
        setProviders(providersData)
      } catch (error) {
        console.error("Errore nel caricamento dei provider:", error)
      } finally {
        setLoading(false)
      }
    }

    loadProviders()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Caricamento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Accedi a LinkHub Integrator
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Usa il tuo account LinkHub per accedere
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow">
          {providers && Object.values(providers).map((provider) => (
            <div key={provider.name} className="mb-4">
              <SigninButton provider={provider} />
            </div>
          ))}

          {(!providers || Object.keys(providers).length === 0) && (
            <div className="text-center text-gray-500">
              Nessun provider di autenticazione configurato
            </div>
          )}
        </div>
      </div>
    </div>
  )
}