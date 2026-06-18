import { redirect } from "next/navigation"
import { getToken } from "@/lib/cookies"
import ProvidersManager from "@/components/providers-manager"
import { fetchBackend } from "@/lib/api"
import { decodeJWT } from "@/lib/jwt"

async function getProviders() {
  try {
    const res = await fetchBackend("/providers", {
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

  const decoded = decodeJWT(token)
  const userRole = decoded?.role || "merchant"

  const initialProviders = await getProviders()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Payment Providers</h1>
        <p className="text-sm text-slate-400 mt-1">Configure keys for your payment providers.</p>
      </div>

      <ProvidersManager initialProviders={initialProviders} userRole={userRole} />
    </div>
  )
}
