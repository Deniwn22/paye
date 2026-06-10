import { redirect } from "next/navigation"
import { getToken, getActiveMode, getUserName } from "@/lib/cookies"
import WebhookLogsTable from "@/components/webhook-logs-table"
import { AlertTriangle } from "lucide-react"
import { fetchBackend } from "@/lib/api"

async function getStats() {
  try {
    const res = await fetchBackend("/dashboard/stats", {
      cache: "no-store",
    })
    if (!res.ok) return null
    const result = await res.json()
    return result.status ? result.data : null
  } catch (err) {
    if (err instanceof Error) console.error(err.message)
    return null
  }
}

async function getLogs() {
  try {
    const res = await fetchBackend("/dashboard/logs?limit=10", {
      cache: "no-store",
    })
    if (!res.ok) return null
    const result = await res.json()
    return result.status ? result.data : []
  } catch (err) {
    if (err instanceof Error) console.error(err.message)
    return []
  }
}

export default async function DashboardPage() {
  const token = await getToken()
  if (!token) {
    redirect("/signin")
  }

  const mode = await getActiveMode()
  const isLive = mode === "live"

  const stats = await getStats()
  const logs = await getLogs()

  const userName = await getUserName()
  // Derivation fallback: if name cookie doesn't exist, extract name from email or default to Thompson
  let name = userName
  if (!name && token) {
    try {
      const { decodeJWT } = require("@/lib/jwt")
      const claims = decodeJWT(token)
      if (claims?.user_email) {
        const localPart = claims.user_email.split("@")[0]
        if (localPart !== "paye") {
          name = localPart.charAt(0).toUpperCase() + localPart.slice(1)
        }
      }
    } catch (e) {}
  }
  if (!name) name = "Thompson"

  const totalVolume = stats?.total_volume || 0
  const totalTransactions = stats?.total_transactions || 0
  const failedTransactions = stats?.failed_transactions || 0
  const successfulDeliveries = stats?.successful_deliveries || 0
  const failedDeliveries = stats?.failed_deliveries || 0
  const activeProviders = stats?.active_providers_count || 0

  const deliverySuccessRate =
    successfulDeliveries + failedDeliveries > 0
      ? Math.round(
          (successfulDeliveries / (successfulDeliveries + failedDeliveries)) *
            100
        )
      : 100

  return (
    <div className="space-y-8 select-text">
      {/* Title Header Section */}
      <div className="border-b border-border pb-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-foreground select-none">
            Good morning, {name}.
          </h2>
        </div>
        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400 select-none">
          Here&apos;s what&apos;s happening across your connected providers.
        </p>
      </div>

      {/* Offline Alert */}
      {!stats && (
        <div className="flex items-start gap-3.5 rounded-2xl border border-rose-500/15 bg-rose-500/5 p-4 text-xs font-bold text-rose-500 dark:text-rose-400 shadow-sm animate-pulse">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500" />
          <div className="space-y-1">
            <h4 className="font-extrabold uppercase tracking-wider text-[10px]">Connection Error</h4>
            <p className="text-zinc-500 dark:text-zinc-400 leading-normal font-medium">
              Unable to reach the Paye router engine. Ensure docker services are active.
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Total Volume Card */}
        <div className="rounded-xl border-[0.5px] border-border bg-card p-5">
          <span className="block text-[11px] font-semibold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase select-none">
            Total Volume
          </span>
          <span className="block text-2xl font-bold tracking-tight text-foreground mt-2">
            ₦{totalVolume.toLocaleString(undefined, { minimumFractionDigits: 0 })}
          </span>
          <span className="block text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 select-none">
            Across all providers
          </span>
        </div>

        {/* Transactions count Card */}
        <div className="rounded-xl border-[0.5px] border-border bg-card p-5">
          <span className="block text-[11px] font-semibold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase select-none">
            Transactions
          </span>
          <span className="block text-2xl font-bold tracking-tight text-foreground mt-2">
            {totalTransactions}
          </span>
          <span className={`block text-[11px] font-semibold mt-1 select-none ${failedTransactions > 0 ? "text-[#dc2626] dark:text-[#ef4444]" : "text-[#16a34a] dark:text-[#22c55e]"}`}>
            {failedTransactions} failed
          </span>
        </div>

        {/* Delivery Success Rate Card */}
        <div className="rounded-xl border-[0.5px] border-border bg-card p-5">
          <span className="block text-[11px] font-semibold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase select-none">
            Delivery Rate
          </span>
          <span className="block text-2xl font-bold tracking-tight text-foreground mt-2">
            {deliverySuccessRate}%
          </span>
          <span className={`block text-[11px] font-semibold mt-1 select-none truncate ${failedDeliveries > 0 ? "text-[#dc2626] dark:text-[#ef4444]" : "text-[#16a34a] dark:text-[#22c55e]"}`}>
            {successfulDeliveries} OK · {failedDeliveries} failed
          </span>
        </div>

        {/* Active Routing count Card */}
        <div className="rounded-xl border-[0.5px] border-border bg-card p-5">
          <span className="block text-[11px] font-semibold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase select-none">
            Active Routing
          </span>
          <span className="block text-2xl font-bold tracking-tight text-foreground mt-2">
            {activeProviders}
          </span>
          <span className="block text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 select-none">
            {activeProviders === 1 ? "Connected provider" : "Connected providers"}
          </span>
        </div>
      </div>

      {/* Webhook Log List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3 select-none">
          <h2 className="text-[11px] font-semibold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase">
            Recent Activity Log
          </h2>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider">
            Latest 10 audit logs
          </span>
        </div>
        <WebhookLogsTable logs={logs} />
      </div>
    </div>
  )
}
