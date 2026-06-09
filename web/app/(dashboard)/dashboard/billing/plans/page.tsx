import { redirect } from "next/navigation"
import { getToken, getActiveProjectID } from "@/lib/cookies"
import PlansList from "@/components/plans-list"
import { BACKEND_URL } from "@/lib/config"
import { AlertTriangle } from "lucide-react"

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
    if (!res.ok) return null
    const result = await res.json()
    return result.status ? (result.data || []) : null
  } catch (err) {
    return null
  }
}

export default async function PlansPage() {
  const token = await getToken()
  if (!token) {
    redirect("/signin")
  }

  const projectID = await getActiveProjectID()
  const plans = await getPlans(token, projectID)

  return (
    <div className="space-y-6">
      {!plans && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-500/25 bg-rose-500/5 p-4 text-sm font-semibold text-rose-600 shadow-sm dark:text-rose-400">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold">Connection error</h4>
            <p className="text-xs leading-normal text-zinc-500 dark:text-zinc-400">
              Unable to load billing plans. Make sure the API server is online.
            </p>
          </div>
        </div>
      )}

      {plans && <PlansList plans={plans} />}
    </div>
  )
}
