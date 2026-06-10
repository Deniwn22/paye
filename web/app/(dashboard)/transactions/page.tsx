import { redirect } from "next/navigation"
import { getToken, getActiveMode } from "@/lib/cookies"
import TransactionsTable from "@/components/transactions-table"
import { fetchBackend } from "@/lib/api"

async function getTransactions() {
  try {
    const res = await fetchBackend("/transactions?limit=50", {
      cache: "no-store",
    })
    if (!res.ok) return []
    const result = await res.json()
    return result.status ? result.data : []
  } catch (err) {
    return []
  }
}

export default async function TransactionsPage() {
  const token = await getToken()
  if (!token) {
    redirect("/signin")
  }

  const mode = await getActiveMode()
  const isLive = mode === "live"

  const transactions = await getTransactions()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
          <span>Transactions</span>
          {!isLive && (
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.1)]">
              Test Mode
            </span>
          )}
        </h1>
        <p className="text-sm text-slate-400 mt-1">History of all customer payments and checkout attempts.</p>
      </div>

      <TransactionsTable transactions={transactions} />
    </div>
  )
}
