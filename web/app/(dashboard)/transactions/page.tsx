import { redirect } from "next/navigation"
import { getToken, getActiveProjectID } from "@/lib/cookies"
import TransactionsTable from "@/components/transactions-table"

const BACKEND_URL = "http://localhost:8080/api/v1"

async function getTransactions(token: string, projectID: string | null) {
  try {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
    if (projectID) {
      headers["X-Project-ID"] = projectID
    }
    const res = await fetch(`${BACKEND_URL}/transactions?limit=50`, {
      headers,
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

  const projectID = await getActiveProjectID()
  const transactions = await getTransactions(token, projectID)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Transactions</h1>
        <p className="text-sm text-slate-400 mt-1">History of all customer payments and checkout attempts.</p>
      </div>

      <TransactionsTable transactions={transactions} />
    </div>
  )
}
