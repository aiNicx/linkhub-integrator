"use client"

import { Button } from "@/components/ui/button"
import { Zap } from "lucide-react"
import { signOut, useSession } from "next-auth/react"

interface AppHeaderProps {
  title?: string
  subtitle?: string
}

export function AppHeader({ title = "LinkHub Integrator", subtitle = "Gestisci le integrazioni con i tuoi software enterprise" }: AppHeaderProps) {
  const { data: session } = useSession()

  return (
    <header className="border-b bg-card px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-[hsl(221,83%,53%)] rounded flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-card-foreground">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {session?.user?.email && (
            <span className="text-sm text-muted-foreground">{session.user.email}</span>
          )}
          <Button variant="outline" onClick={() => signOut({ redirectTo: "/" })}>Esci</Button>
        </div>
      </div>
    </header>
  )
}

export default AppHeader

