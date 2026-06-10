import { redirect } from "next/navigation"
import { getToken } from "@/lib/cookies"

export default async function SubscriptionsPage() {
  const token = await getToken()
  if (!token) {
    redirect("/signin")
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground select-none">Subscriptions</h1>
        <p className="text-sm text-muted-foreground mt-1 select-none">View active recurring customer subscriptions and billing states.</p>
      </div>

      <div className="rounded-xl border-[0.5px] border-border bg-card p-12 text-center max-w-xl mx-auto mt-12">
        <div className="mx-auto w-12 h-12 rounded-lg bg-blue-subtle text-[#2563eb] dark:text-[#3b82f6] flex items-center justify-center mb-4 text-lg select-none">
          🔄
        </div>
        <h2 className="text-base font-semibold text-foreground mb-2 select-none">Upcoming Feature</h2>
        <p className="text-xs text-muted-foreground leading-relaxed select-none">
          We are currently building subscription lifecycle management. You will soon be able to monitor recurring payment logs, trigger manual retries on card auth failures, and cancel or resume active customer subscriptions from this view.
        </p>
      </div>
    </div>
  )
}
