"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"

interface SigninButtonProps {
  provider: {
    id: string
    name: string
    type: string
    signinUrl: string
    callbackUrl: string
  }
}

export function SigninButton({ provider }: SigninButtonProps) {
  return (
    <Button
      onClick={() => signIn(provider.id, { callbackUrl: "/dashboard" })}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
    >
      Accedi con {provider.name}
    </Button>
  )
}