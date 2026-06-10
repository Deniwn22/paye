import { redirect } from "next/navigation"
import { getToken, getActiveProjectID } from "@/lib/cookies"
import ApiKeyPanel from "@/components/api-key-panel"
import { BACKEND_URL } from "@/lib/config"
import { Project } from "@/components/project-switcher"
import { getActiveMode } from "@/lib/cookies"

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

  const activeProject =
    projects.find((p) => p.id === activeProjectID) || projects[0]

  // inside the page function, after you have activeProject:
  const mode = await getActiveMode()
  const isLive = mode === "live"

  const apiKey = isLive
    ? activeProject?.api_key || ""
    : activeProject?.test_api_key || ""

  const publicId = isLive
    ? activeProject?.public_id || ""
    : activeProject?.test_public_id || ""

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          API Keys
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Your keys to connect your website and server to Paye.
        </p>
      </div>

      <ApiKeyPanel apiKey={apiKey} publicId={publicId} />
    </div>
  )
}
