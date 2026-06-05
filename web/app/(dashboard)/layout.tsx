import Link from "next/link"
import { redirect } from "next/navigation"
import { getToken, getActiveProjectID } from "@/lib/cookies"
import { decodeJWT } from "@/lib/jwt"
import { signOutAction } from "@/app/actions"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar"
import SidebarNav from "@/components/sidebar-nav"
import ProjectSwitcher from "@/components/project-switcher"
import { LogOut, ChevronRight } from "lucide-react"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const token = await getToken()
  if (!token) {
    redirect("/signin")
  }

  const claims = decodeJWT(token)
  const email = claims?.user_email || "merchant@paye.co"

  // Fetch projects from backend
  let projects: any[] = []
  try {
    const res = await fetch("http://localhost:8080/api/v1/projects", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 0 },
    })
    const data = await res.json()
    if (res.ok && data.status) {
      projects = data.data || []
    }
  } catch (e) {
    console.error("Failed to load projects:", e)
  }

  const activeProjectID = (await getActiveProjectID()) || (projects[0]?.id ?? "")

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-white dark:bg-[#0a0a0a] text-[#0f172a] dark:text-[#f8fafc] font-sans selection:bg-[#0ea5e9]/20 selection:text-[#0ea5e9] transition-colors duration-300">
        
        {/* Sidebar Container */}
        <Sidebar className="border-r border-[#e2e8f0] dark:border-[#1e293b] bg-white dark:bg-[#0a0a0a]">
          
          {/* Top-left Brand Logo and Project Switcher */}
          <SidebarHeader className="px-6 border-b border-[#e2e8f0] dark:border-[#1e293b] flex flex-col justify-center gap-3 py-4">
            <Link href="/dashboard" className="flex items-center gap-2.5 select-none">
              <span className="w-8 h-8 bg-[#0ea5e9] text-white flex items-center justify-center font-black text-base rounded-lg shadow-sm">
                P
              </span>
              <span className="font-extrabold text-lg tracking-tight text-[#0f172a] dark:text-white">Paye</span>
            </Link>
            <ProjectSwitcher projects={projects} activeProjectID={activeProjectID} />
          </SidebarHeader>

          {/* Navigation Items (left-aligned) */}
          <SidebarContent className="py-2">
            <SidebarNav />
          </SidebarContent>

          {/* Footer Merchant Info & Logout */}
          <SidebarFooter className="p-4 border-t border-[#e2e8f0] dark:border-[#1e293b] bg-[#f8fafc] dark:bg-[#111111]">
            <div className="px-2 py-1 mb-3">
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                Active Merchant
              </span>
              <span className="text-sm font-mono font-bold text-zinc-700 dark:text-zinc-300 truncate block mt-0.5" title={email}>
                {email}
              </span>
            </div>
            
            <form action={signOutAction}>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-[#e2e8f0] dark:border-[#1e293b] bg-white dark:bg-zinc-900/30 hover:border-red-500/20 hover:bg-red-500/5 dark:hover:bg-red-950/20 text-zinc-500 dark:text-[#94a3b8] hover:text-red-500 dark:hover:text-red-400 text-sm font-bold transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </form>
          </SidebarFooter>
        </Sidebar>

        {/* Right Shell Panel */}
        <SidebarInset className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0a0a0a]">
          {/* Header (Router Online Indicator Removed) */}
          <header className="h-16 border-b border-[#e2e8f0] dark:border-[#1e293b] bg-white dark:bg-[#0a0a0a] flex items-center justify-between px-6 sticky top-0 z-20 transition-all duration-300">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="p-1.5 hover:bg-zinc-100 dark:hover:bg-[#111] rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white border border-[#e2e8f0] dark:border-[#1e293b]" />
              <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
              <div className="flex items-center gap-1.5 text-sm text-zinc-400 font-semibold select-none">
                <span>Dashboard</span>
                <ChevronRight className="w-3 h-3 text-zinc-400" />
                <span className="text-[#0f172a] dark:text-zinc-200 font-bold">Workspace</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <ThemeToggle />
            </div>
          </header>

          {/* Main content viewport */}
          <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8 select-text">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
