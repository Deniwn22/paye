import { redirect } from "next/navigation"
import { getToken, getActiveProjectID } from "@/lib/cookies"
import WebhooksManager from "@/components/webhooks-manager"
import { BACKEND_URL } from "@/lib/config"

async function getWebhooks(token: string, projectID: string | null) {
  try {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
    if (projectID) {
      headers["X-Project-ID"] = projectID
    }
    const res = await fetch(`${BACKEND_URL}/webhooks/configs`, {
      headers,
      cache: "no-store",
    })
    if (!res.ok) return []
    const result = await res.json()
    return result.status && result.data ? result.data : []
  } catch (err) {
    return []
  }
}

export default async function WebhooksPage() {
  const token = await getToken()
  if (!token) {
    redirect("/signin")
  }

  const projectID = await getActiveProjectID()
  const initialConfigs = await getWebhooks(token, projectID)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Webhook Routes</h1>
        <p className="text-sm text-slate-400 mt-1">Manage where payment notifications are sent when you get paid.</p>
      </div>

      <WebhooksManager initialConfigs={initialConfigs} />
    </div>
  )
}
