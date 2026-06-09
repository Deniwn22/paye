import { redirect } from "next/navigation"
import { getToken, getActiveProjectID } from "@/lib/cookies"
import RefundsTable from "@/components/refunds-table"
import { BACKEND_URL } from "@/lib/config"
import { AlertTriangle } from "lucide-react"

async function getRefunds(token: string, projectID: string | null) {
  try {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
    if (projectID) {
      headers["X-Project-ID"] = projectID
    }
    const res = await fetch(`${BACKEND_URL}/refunds`, {
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

export default async function RefundsPage() {
  const token = await getToken()
  if (!token) {
    redirect("/signin")
  }

  const projectID = await getActiveProjectID()
  const refunds = await getRefunds(token, projectID)

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-200/60 pb-5 dark:border-zinc-900/60">
        <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Refunds</h1>
        <p className="text-sm text-slate-400 mt-1">Audit log of all processed payment refunds.</p>
      </div>

      {!refunds && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-500/25 bg-rose-500/5 p-4 text-sm font-semibold text-rose-600 shadow-sm dark:text-rose-400">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold">Connection error</h4>
            <p className="text-xs leading-normal text-zinc-500 dark:text-zinc-400">
              Unable to load refunds. Make sure the API server is online.
            </p>
          </div>
        </div>
      )}

      {refunds && <RefundsTable refunds={refunds} />}
    </div>
  )
}
