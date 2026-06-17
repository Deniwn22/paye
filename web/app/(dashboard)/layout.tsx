import Link from "next/link"
import { redirect } from "next/navigation"
import { getToken, getActiveProjectID, getActiveMode } from "@/lib/cookies"
import { decodeJWT } from "@/lib/jwt"
import { signOutAction } from "@/app/actions"
import { ThemeToggle } from "@/components/theme-toggle"
import ModeSwitcher from "@/components/mode-switcher"
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
import ProjectSwitcher, { Project } from "@/components/project-switcher"
import { LogOut, ChevronRight } from "lucide-react"
import { BACKEND_URL } from "@/lib/config"

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
  if (!claims || (claims.exp && claims.exp * 1000 < Date.now())) {
    redirect("/api/auth/logout")
  }

  const email = claims.user_email || "merchant@paye.co"
  const activeMode = await getActiveMode()

  // Fetch projects from backend
  let projects: Project[] = []
  let shouldRedirect = false
  try {
    const res = await fetch(`${BACKEND_URL}/projects`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 0 },
    })
    if (res.status === 401) {
      shouldRedirect = true
    } else if (res.ok) {
      const data = await res.json()
      if (data.status) {
        projects = data.data || []
      }
    }
  } catch (e) {
    console.error("Failed to load projects:", e)
  }

  if (shouldRedirect) {
    redirect("/api/auth/logout")
  }

  const activeProjectID =
    (await getActiveProjectID()) || (projects[0]?.id ?? "")

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background font-sans text-foreground transition-colors duration-300 selection:bg-[#2563eb]/20 selection:text-[#2563eb]">
        {/* Sidebar Container */}
        <Sidebar className="border-r border-border bg-background">
          {/* Top-left Brand Logo and Project Switcher */}
          <SidebarHeader className="flex flex-col justify-center gap-3.5 border-b border-border bg-background px-6 py-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 select-none"
            >
              <span className="text-base font-black tracking-tight text-foreground">
                Paye<span className="font-medium text-[#2563EB]">.</span>
              </span>
            </Link>
            <ProjectSwitcher
              projects={projects}
              activeProjectID={activeProjectID}
            />
          </SidebarHeader>

          {/* Navigation Items (left-aligned) */}
          <SidebarContent className="bg-background py-2">
            <SidebarNav />
          </SidebarContent>

          {/* Footer Merchant Info & Logout */}
          <SidebarFooter className="border-t border-border bg-background p-4">
            <div className="truncate px-2.5">
              <span className="block text-[10px] tracking-wider text-muted-foreground uppercase select-none">
                Active Merchant
              </span>
              <span
                className="mt-0.5 block truncate font-mono text-xs text-foreground"
                title={email}
              >
                {email}
              </span>
            </div>

            <form action={signOutAction} className="mt-3">
              <button
                type="submit"
                className="text-red-650 dark:text-red-450 flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition-all select-none hover:bg-red-500/5 dark:hover:bg-red-950/15"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </form>
          </SidebarFooter>
        </Sidebar>

        {/* Right Shell Panel */}
        <SidebarInset className="flex min-w-0 flex-1 flex-col bg-background">
          {/* Header */}
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/80 bg-background/80 px-6 backdrop-blur-md transition-all duration-300">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="rounded-lg border border-border p-1.5 text-zinc-500 shadow-sm hover:bg-zinc-100 hover:text-zinc-900 active:scale-[0.98] dark:hover:bg-zinc-900 dark:hover:text-white" />
              <div className="h-4 w-px bg-border" />
              <div className="text-zinc-455 flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase select-none">
                <span className="text-zinc-400">Dashboard</span>
                <ChevronRight className="h-3 w-3 text-zinc-400" />
                <span className="font-black text-foreground">Workspace</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <ModeSwitcher initialMode={activeMode} />
              <ThemeToggle />
            </div>
          </header>

          {/* Main content viewport */}
          <main className="mx-auto w-full max-w-7xl flex-1 space-y-8 p-6 select-text md:p-8">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
