"use client"

import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  LayoutDashboard, 
  FileText, 
  Database, 
  BarChart3, 
  CheckSquare, 
  ChevronDown, 
  Zap 
} from "lucide-react"

export function AppSidebar() {
  const router = useRouter()
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <aside className="w-64 bg-[hsl(221,83%,53%)] text-white flex flex-col fixed left-0 top-0 h-screen z-40">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-[hsl(221,83%,53%)]" />
          </div>
          <div>
            <div className="font-bold text-lg">LinkHub</div>
            <div className="text-sm text-white/80">Integrator</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 pb-4">
        <div className="space-y-2">
          <Button 
            variant={isActive('/dashboard') ? 'secondary' : 'ghost'}
            className={`w-full justify-start h-10 ${
              isActive('/dashboard') 
                ? 'bg-white/20 text-white' 
                : 'text-white hover:bg-white/10'
            }`}
            onClick={() => router.push('/dashboard')}
          >
            <LayoutDashboard className="w-4 h-4 mr-3" />
            Dashboard
          </Button>
          
          <Button 
            variant={isActive('/api-docs') ? 'secondary' : 'ghost'}
            className={`w-full justify-start h-10 ${
              isActive('/api-docs') 
                ? 'bg-white/20 text-white' 
                : 'text-white hover:bg-white/10'
            }`}
            onClick={() => router.push('/api-docs')}
          >
            <FileText className="w-4 h-4 mr-3" />
            API Documentation
          </Button>
        </div>

        <div className="mt-8">
          <div className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-4">
            INTEGRAZIONI
          </div>
          
          <div className="space-y-1">
            <Button 
              variant="ghost" 
              className="w-full justify-between text-white hover:bg-white/10 h-10"
            >
              <div className="flex items-center">
                <Database className="w-4 h-4 mr-3" />
                CRM
              </div>
              <ChevronDown className="w-4 h-4" />
            </Button>
            
            <div className="ml-7 space-y-1">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-white/80 hover:bg-white/10 h-8 text-sm"
              >
                <FileText className="w-3 h-3 mr-2" />
                HubSpot
              </Button>
            </div>

            <Button 
              variant="ghost" 
              className="w-full justify-between text-white hover:bg-white/10 h-10"
            >
              <div className="flex items-center">
                <BarChart3 className="w-4 h-4 mr-3" />
                Data Analysis
              </div>
              <ChevronDown className="w-4 h-4" />
            </Button>
            
            <div className="ml-7 space-y-1">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-white/80 hover:bg-white/10 h-8 text-sm"
              >
                <FileText className="w-3 h-3 mr-2" />
                Power BI
              </Button>
            </div>

            <Button 
              variant="ghost" 
              className="w-full justify-between text-white hover:bg-white/10 h-10"
            >
              <div className="flex items-center">
                <CheckSquare className="w-4 h-4 mr-3" />
                Task Manager
              </div>
              <ChevronDown className="w-4 h-4" />
            </Button>
            
            <div className="ml-7 space-y-1">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-white/80 hover:bg-white/10 h-8 text-sm"
              >
                <FileText className="w-3 h-3 mr-2" />
                Microsoft Planner
              </Button>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  )
}

export default AppSidebar

