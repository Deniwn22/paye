import { redirect } from "next/navigation"
import { getToken, getActiveProjectID } from "@/lib/cookies"
import SubscriptionsList from "@/components/subscriptions-list"
import { BACKEND_URL } from "@/lib/config"
import { AlertTriangle } from "lucide-react"

async function getSubscriptions(token: string, projectID: string | null) {
  try {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
    if (projectID) {
      headers["X-Project-ID"] = projectID
    }
    const res = await fetch(`${BACKEND_URL}/subscriptions`, {
      headers,
      cache: "no-store",
    })
    if (!res.ok) return null
    const result = await res.json()
    return result.status ? (result.data || []) : null
  } catch (err) {
    return null
  }
}

async function getPlans(token: string, projectID: string | null) {
  try {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
    if (projectID) {
      headers["X-Project-ID"] = projectID
    }
    const res = await fetch(`${BACKEND_URL}/plans`, {
      headers,
      cache: "no-store",
    })
    if (!res.ok) return []
    const result = await res.json()
    return result.status ? (result.data || []) : []
  } catch (err) {
    return []
  }
}

export default async function SubscriptionsPage() {
  const token = await getToken()
  if (!token) {
    redirect("/signin")
  }

  const projectID = await getActiveProjectID()
  const subscriptions = await getSubscriptions(token, projectID)
  const plans = await getPlans(token, projectID)

  return (
    <div className="space-y-6">
      {!subscriptions && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-500/25 bg-rose-500/5 p-4 text-sm font-semibold text-rose-600 shadow-sm dark:text-rose-400">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold">Connection error</h4>
            <p className="text-xs leading-normal text-zinc-500 dark:text-zinc-400">
              Unable to load subscriptions. Make sure the API server is online.
            </p>
          </div>
        </div>
      )}

      {subscriptions && <SubscriptionsList subscriptions={subscriptions} plans={plans} />}
    </div>
  )
}
