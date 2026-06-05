import { redirect } from "next/navigation"
import { getToken, getActiveProjectID } from "@/lib/cookies"
import ProvidersManager from "@/components/providers-manager"

const BACKEND_URL = "http://localhost:8080/api/v1"

async function getProviders(token: string, projectID: string | null) {
  try {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
    if (projectID) {
      headers["X-Project-ID"] = projectID
    }
    const res = await fetch(`${BACKEND_URL}/providers`, {
      headers,
      cache: "no-store",
    })
    if (!res.ok) return []
    const result = await res.json()
    return result.status && result.data ? result.data : []
  } catch (err) {
    return []
  }
}

export default async function ProvidersPage() {
  const token = await getToken()
  if (!token) {
    redirect("/signin")
  }

  const projectID = await getActiveProjectID()
  const initialProviders = await getProviders(token, projectID)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Payment Providers</h1>
        <p className="text-sm text-slate-400 mt-1">Configure keys for your payment providers.</p>
      </div>

      <ProvidersManager initialProviders={initialProviders} />
    </div>
  )
}
