import { redirect } from "next/navigation"
import { getToken, getActiveProjectID, getActiveMode } from "@/lib/cookies"
import { BACKEND_URL } from "@/lib/config"
import { Project } from "@/components/project-switcher"
import AiPromptPanel from "@/components/ai-prompt-panel"

export default async function AiIntegrationPage() {
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

  const mode = await getActiveMode()
  const isLive = mode === "live"

  const apiKey = isLive
    ? activeProject?.api_key || ""
    : activeProject?.test_api_key || ""

  const publicId = isLive
    ? activeProject?.public_id || ""
    : activeProject?.test_public_id || ""

  const payeApiUrl = process.env.NEXT_PUBLIC_PAYE_API_URL || "http://localhost:8080"

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          Paye AI Copilot
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Supercharge your payment integration. Copy a customized system prompt embedded with your sandbox API credentials to instruct your AI assistant (Gemini, Claude, ChatGPT, Cursor).
        </p>
      </div>

      <AiPromptPanel
        apiKey={apiKey}
        publicId={publicId}
        payeApiUrl={payeApiUrl}
        projectName={activeProject?.name || "Default Project"}
      />
    </div>
  )
}
