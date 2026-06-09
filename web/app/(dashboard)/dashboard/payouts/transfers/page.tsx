import { redirect } from "next/navigation"
import { getToken } from "@/lib/cookies"
import TransfersList from "@/components/transfers-list"
import { fetchBackend } from "@/lib/api"
import { AlertTriangle } from "lucide-react"

async function getTransfers() {
  try {
    const res = await fetchBackend("/transfers", {
      cache: "no-store",
    })
    if (!res.ok) return null
    const result = await res.json()
    return result.status ? (result.data || []) : null
  } catch (err) {
    return null
  }
}

async function getRecipients() {
  try {
    const res = await fetchBackend("/recipients", {
      cache: "no-store",
    })
    if (!res.ok) return []
    const result = await res.json()
    return result.status ? (result.data || []) : []
  } catch (err) {
    return []
  }
}

export default async function TransfersPage() {
  const token = await getToken()
  if (!token) {
    redirect("/signin")
  }

  const transfers = await getTransfers()
  const recipients = await getRecipients()

  return (
    <div className="space-y-6">
      {!transfers && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-500/25 bg-rose-500/5 p-4 text-sm font-semibold text-rose-600 shadow-sm dark:text-rose-400">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold">Connection error</h4>
            <p className="text-xs leading-normal text-zinc-500 dark:text-zinc-400">
              Unable to load transfers. Make sure the API server is online.
            </p>
          </div>
        </div>
      )}

      {transfers && <TransfersList transfers={transfers} recipients={recipients} />}
    </div>
  )
}
