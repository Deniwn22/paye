import { redirect } from "next/navigation"
import { getToken, getActiveProjectID } from "@/lib/cookies"
import WebhookLogsTable from "@/components/webhook-logs-table"
import { CreditCard, Activity, Network, TrendingUp, AlertTriangle } from "lucide-react"

const BACKEND_URL = "http://localhost:8080/api/v1"

async function getStats(token: string, projectID: string | null) {
  try {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
    if (projectID) {
      headers["X-Project-ID"] = projectID
    }
    const res = await fetch(`${BACKEND_URL}/dashboard/stats`, {
      headers,
      cache: "no-store",
    })
    if (!res.ok) return null
    const result = await res.json()
    return result.status ? result.data : null
  } catch (err) {
    return null
  }
}

async function getLogs(token: string, projectID: string | null) {
  try {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
    if (projectID) {
      headers["X-Project-ID"] = projectID
    }
    const res = await fetch(`${BACKEND_URL}/dashboard/logs?limit=10`, {
      headers,
      cache: "no-store",
    })
    if (!res.ok) return null
    const result = await res.json()
    return result.status ? result.data : []
  } catch (err) {
    return []
  }
}

export default async function DashboardPage() {
  const token = await getToken()
  if (!token) {
    redirect("/signin")
  }

  const projectID = await getActiveProjectID()
  const stats = await getStats(token, projectID)
  const logs = await getLogs(token, projectID)

  const totalVolume = stats?.total_volume || 0
  const totalTransactions = stats?.total_transactions || 0
  const failedTransactions = stats?.failed_transactions || 0
  const successfulDeliveries = stats?.successful_deliveries || 0
  const failedDeliveries = stats?.failed_deliveries || 0
  const activeProviders = stats?.active_providers_count || 0

  const deliverySuccessRate =
    successfulDeliveries + failedDeliveries > 0
      ? Math.round((successfulDeliveries / (successfulDeliveries + failedDeliveries)) * 100)
      : 100

  return (
    <div className="space-y-8 select-text">
      {/* Title */}
      <div className="border-b border-zinc-200/60 dark:border-zinc-900/60 pb-5">
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Overview</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Real-time transaction overview and delivery status.</p>
      </div>

      {/* Offline Alert */}
      {!stats && (
        <div className="p-4 border border-rose-500/25 bg-rose-500/5 text-rose-600 dark:text-rose-400 text-sm font-semibold rounded-xl flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm">Connection error</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
              Unable to connect to server. Please try again.
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Volume */}
        <div className="p-5 border border-zinc-200/60 dark:border-zinc-900 bg-white dark:bg-[#111111] rounded-xl hover:border-b-[#0ea5e9] hover:dark:border-b-[#0ea5e9] transition-all flex flex-col justify-between h-[125px]">
          <div>
            <span className="text-xs text-zinc-400 dark:text-zinc-500 uppercase font-bold tracking-wider block">Total Volume</span>
          </div>
          <div>
            <span className="text-2xl font-black text-zinc-900 dark:text-white block font-mono tracking-tight">
              ₦{totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 block mt-1">
              Across all connected providers
            </span>
          </div>
        </div>

        {/* Transactions count */}
        <div className="p-5 border border-zinc-200/60 dark:border-zinc-900 bg-white dark:bg-[#111111] rounded-xl hover:border-b-[#0ea5e9] hover:dark:border-b-[#0ea5e9] transition-all flex flex-col justify-between h-[125px]">
          <div>
            <span className="text-xs text-zinc-400 dark:text-zinc-500 uppercase font-bold tracking-wider block">Transactions</span>
          </div>
          <div>
            <span className="text-2xl font-black text-zinc-900 dark:text-white block font-mono tracking-tight">
              {totalTransactions}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 block mt-1">
              {failedTransactions} failed
            </span>
          </div>
        </div>

        {/* Delivery Success Rate */}
        <div className="p-5 border border-zinc-200/60 dark:border-zinc-900 bg-white dark:bg-[#111111] rounded-xl hover:border-b-[#0ea5e9] hover:dark:border-b-[#0ea5e9] transition-all flex flex-col justify-between h-[125px]">
          <div>
            <span className="text-xs text-zinc-400 dark:text-zinc-500 uppercase font-bold tracking-wider block">Delivery Rate</span>
          </div>
          <div>
            <span className="text-2xl font-black text-zinc-900 dark:text-white block font-mono tracking-tight">
              {deliverySuccessRate}%
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 block mt-1">
              {successfulDeliveries} successful / {failedDeliveries} failed deliveries
            </span>
          </div>
        </div>

        {/* Active Providers count */}
        <div className="p-5 border border-zinc-200/60 dark:border-zinc-900 bg-white dark:bg-[#111111] rounded-xl hover:border-b-[#0ea5e9] hover:dark:border-b-[#0ea5e9] transition-all flex flex-col justify-between h-[125px]">
          <div>
            <span className="text-xs text-zinc-400 dark:text-zinc-500 uppercase font-bold tracking-wider block">Active Providers</span>
          </div>
          <div>
            <span className="text-2xl font-black text-zinc-900 dark:text-white block font-mono tracking-tight">
              {activeProviders}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 block mt-1">
              providers connected
            </span>
          </div>
        </div>
      </div>

      {/* Webhook Log List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-200/60 dark:border-zinc-900/60 pb-3">
          <h2 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Recent Activity</h2>
          <span className="text-xs text-zinc-400">Showing latest 10 deliveries</span>
        </div>
        <WebhookLogsTable logs={logs} />
      </div>
    </div>
  )
}
