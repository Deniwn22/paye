import { redirect } from "next/navigation"
import { getToken, getActiveMode } from "@/lib/cookies"
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
      <div className="border-b border-border/80 pb-5">
        <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
          <span>Overview</span>
          {!isLive && (
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Test Mode
            </span>
          )}
        </h1>
        <p className="mt-1 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          Real-time transaction overview and delivery status
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
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Total Volume Card */}
        <div className="relative flex h-32 flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.01] hover:border-sky-500/30 group">
          {/* Subtle top indicator bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 to-sky-550 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div>
            <span className="block text-[10px] font-bold tracking-widest text-zinc-400 uppercase dark:text-zinc-500 select-none">
              Total Volume
            </span>
          </div>
          <div>
            <span className="block font-mono text-2xl font-black tracking-tight text-foreground">
              ₦
              {totalVolume.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </span>
            <span className="mt-1 block text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider select-none">
              Across connected providers
            </span>
          </div>
        </div>

        {/* Transactions count Card */}
        <div className="relative flex h-32 flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.01] hover:border-sky-500/30 group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 to-sky-550 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div>
            <span className="block text-[10px] font-bold tracking-widest text-zinc-400 uppercase dark:text-zinc-500 select-none">
              Transactions
            </span>
          </div>
          <div>
            <span className="block font-mono text-2xl font-black tracking-tight text-foreground">
              {totalTransactions}
            </span>
            <span className="mt-1 block text-[10px] text-rose-500 font-bold uppercase tracking-wider select-none">
              {failedTransactions} failed transactions
            </span>
          </div>
        </div>

        {/* Delivery Success Rate Card */}
        <div className="relative flex h-32 flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.01] hover:border-sky-500/30 group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 to-sky-550 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div>
            <span className="block text-[10px] font-bold tracking-widest text-zinc-400 uppercase dark:text-zinc-500 select-none">
              Delivery Rate
            </span>
          </div>
          <div>
            <span className="block font-mono text-2xl font-black tracking-tight text-foreground">
              {deliverySuccessRate}%
            </span>
            <span className="mt-1 block text-[10px] text-emerald-500 font-bold uppercase tracking-wider select-none truncate">
              {successfulDeliveries} OK / {failedDeliveries} failed
            </span>
          </div>
        </div>

        {/* Active Providers count Card */}
        <div className="relative flex h-32 flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.01] hover:border-sky-500/30 group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 to-sky-550 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div>
            <span className="block text-[10px] font-bold tracking-widest text-zinc-400 uppercase dark:text-zinc-500 select-none">
              Active Routing
            </span>
          </div>
          <div>
            <span className="block font-mono text-2xl font-black tracking-tight text-foreground">
              {activeProviders}
            </span>
            <span className="mt-1 block text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider select-none">
              connected channels
            </span>
          </div>
        </div>
      </div>

      {/* Webhook Log List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3 select-none">
          <h2 className="text-[10px] font-bold tracking-widest text-zinc-450 uppercase">
            Recent Activity Log
          </h2>
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
            Latest 10 audit logs
          </span>
        </div>
        <WebhookLogsTable logs={logs} />
      </div>
    </div>
  )
}
