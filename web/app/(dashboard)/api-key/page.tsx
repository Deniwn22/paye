import { redirect } from "next/navigation"
import { getToken, getActiveProjectID } from "@/lib/cookies"
import ApiKeyPanel from "@/components/api-key-panel"
import { BACKEND_URL } from "@/lib/config"
import { Project } from "@/components/project-switcher"

export default async function ApiKeyPage() {
  const token = await getToken()
  if (!token) {
    redirect("/signin")
  }

  const activeProjectID = await getActiveProjectID()

  // Fetch projects list from backend
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

  const activeProject = projects.find((p) => p.id === activeProjectID) || projects[0]
  const apiKey = activeProject?.api_key || ""
  const publicId = activeProject?.public_id || ""

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">API Keys</h1>
        <p className="text-sm text-slate-400 mt-1">Your keys to connect your website and server to Paye.</p>
      </div>

      <ApiKeyPanel apiKey={apiKey} publicId={publicId} />
    </div>
  )
}
