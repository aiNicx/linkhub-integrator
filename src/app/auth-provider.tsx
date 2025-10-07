"use client"

import { SessionProvider } from "next-auth/react"
import { ReactNode } from "react"
import { ConvexProvider, ConvexReactClient } from "convex/react"

interface AuthProviderProps {
  children: ReactNode
}

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL as string)

export default function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <ConvexProvider client={convex}>
        {children}
      </ConvexProvider>
    </SessionProvider>
  )
}