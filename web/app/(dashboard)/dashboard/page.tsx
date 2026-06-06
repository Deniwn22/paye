import { redirect } from "next/navigation"
import { getToken, getActiveProjectID } from "@/lib/cookies"
import WebhookLogsTable from "@/components/webhook-logs-table"
import { AlertTriangle } from "lucide-react"
import { BACKEND_URL } from "@/lib/config"

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
    if (err instanceof Error) console.error(err.message)
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
    if (err instanceof Error) console.error(err.message)
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
      ? Math.round(
          (successfulDeliveries / (successfulDeliveries + failedDeliveries)) *
            100
        )
      : 100

  return (
    <div className="space-y-8 select-text">
      {/* Title */}
      <div className="border-b border-zinc-200/60 pb-5 dark:border-zinc-900/60">
        <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          Overview
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Real-time transaction overview and delivery status.
        </p>
      </div>

      {/* Offline Alert */}
      {!stats && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-500/25 bg-rose-500/5 p-4 text-sm font-semibold text-rose-600 shadow-sm dark:text-rose-400">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold">Connection error</h4>
            <p className="text-xs leading-normal text-zinc-500 dark:text-zinc-400">
              Unable to connect to server. Please try again.
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Volume */}
        <div className="flex h-31.25 flex-col justify-between rounded-xl border border-zinc-200/60 bg-white p-5 transition-all hover:border-b-[#0ea5e9] dark:border-zinc-900 dark:bg-[#111111] hover:dark:border-b-[#0ea5e9]">
          <div>
            <span className="block text-xs font-bold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
              Total Volume
            </span>
          </div>
          <div>
            <span className="block font-mono text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
              ₦
              {totalVolume.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </span>
            <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
              Across all connected providers
            </span>
          </div>
        </div>

        {/* Transactions count */}
        <div className="flex h-31.25 flex-col justify-between rounded-xl border border-zinc-200/60 bg-white p-5 transition-all hover:border-b-[#0ea5e9] dark:border-zinc-900 dark:bg-[#111111] hover:dark:border-b-[#0ea5e9]">
          <div>
            <span className="block text-xs font-bold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
              Transactions
            </span>
          </div>
          <div>
            <span className="block font-mono text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
              {totalTransactions}
            </span>
            <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
              {failedTransactions} failed
            </span>
          </div>
        </div>

        {/* Delivery Success Rate */}
        <div className="flex h-31.25 flex-col justify-between rounded-xl border border-zinc-200/60 bg-white p-5 transition-all hover:border-b-[#0ea5e9] dark:border-zinc-900 dark:bg-[#111111] hover:dark:border-b-[#0ea5e9]">
          <div>
            <span className="block text-xs font-bold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
              Delivery Rate
            </span>
          </div>
          <div>
            <span className="block font-mono text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
              {deliverySuccessRate}%
            </span>
            <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
              {successfulDeliveries} successful / {failedDeliveries} failed
              deliveries
            </span>
          </div>
        </div>

        {/* Active Providers count */}
        <div className="flex h-31.25 flex-col justify-between rounded-xl border border-zinc-200/60 bg-white p-5 transition-all hover:border-b-[#0ea5e9] dark:border-zinc-900 dark:bg-[#111111] hover:dark:border-b-[#0ea5e9]">
          <div>
            <span className="block text-xs font-bold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
              Active Providers
            </span>
          </div>
          <div>
            <span className="block font-mono text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
              {activeProviders}
            </span>
            <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
              providers connected
            </span>
          </div>
        </div>
      </div>

      {/* Webhook Log List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-200/60 pb-3 dark:border-zinc-900/60">
          <h2 className="text-sm font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
            Recent Activity
          </h2>
          <span className="text-xs text-zinc-400">
            Showing latest 10 deliveries
          </span>
        </div>
        <WebhookLogsTable logs={logs} />
      </div>
    </div>
  )
}
