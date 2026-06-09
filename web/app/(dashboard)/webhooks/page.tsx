import { redirect } from "next/navigation"
import { getToken } from "@/lib/cookies"
import WebhooksManager from "@/components/webhooks-manager"
import { fetchBackend } from "@/lib/api"

async function getWebhooks() {
  try {
    const res = await fetchBackend("/webhooks/configs", {
      cache: "no-store",
    })
    if (!res.ok) return []
    const result = await res.json()
    return result.status && result.data ? result.data : []
  } catch (err) {
    return []
  }
}

async function getWebhookLogs() {
  try {
    const res = await fetchBackend("/webhooks/logs?limit=50", {
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

  const initialConfigs = await getWebhooks()
  const initialLogs = await getWebhookLogs()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Webhook Routes & Logs</h1>
        <p className="text-sm text-slate-400 mt-1">Manage where payment notifications are sent when you get paid and inspect recent webhook log history.</p>
      </div>

      <WebhooksManager initialConfigs={initialConfigs} initialLogs={initialLogs} />
    </div>
  )
}
