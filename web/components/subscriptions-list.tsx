"use client"

import React, { useState } from "react"
import { Users, Copy, Check, Calendar, Trash2, Loader2, AlertTriangle, ShieldCheck } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cancelSubscriptionAction } from "@/app/actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export interface Subscription {
  id: string
  created_at: string
  subscription_code: string
  customer_email: string
  plan_code: string
  status: string // active, cancelled, attention, failed, etc.
  start_date: string
  provider: string
}

export interface Plan {
  plan_code: string
  name: string
  amount: number
  interval: string
}

export default function SubscriptionsList({
  subscriptions,
  plans,
}: {
  subscriptions: Subscription[]
  plans: Plan[]
}) {
  const router = useRouter()
  const [localSubs, setLocalSubs] = useState<Subscription[]>(subscriptions)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  
  // Cancel Modal States
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null)
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  React.useEffect(() => {
    setLocalSubs(subscriptions)
  }, [subscriptions])

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSub) return

    setIsCancelling(true)
    try {
      const res = await cancelSubscriptionAction(selectedSub.subscription_code)
      if (res.success) {
        toast.success("Subscription cancelled successfully")
        setLocalSubs((prev) =>
          prev.map((s) =>
            s.subscription_code === selectedSub.subscription_code
              ? { ...s, status: "cancelled" }
              : s
          )
        )
        setIsCancelOpen(false)
        router.refresh()
      } else {
        toast.error(res.error || "Failed to cancel subscription")
      }
    } catch (err) {
      toast.error("An error occurred while cancelling subscription")
    } finally {
      setIsCancelling(false)
    }
  }

  // Helper to map plan code to plan name and interval
  const getPlanDetails = (planCode: string) => {
    const plan = plans.find((p) => p.plan_code === planCode)
    return {
      name: plan ? plan.name : planCode,
      amount: plan ? plan.amount : 0,
      interval: plan ? plan.interval : "monthly",
    }
  }

  // Helper to calculate next charge date based on start date and interval
  const getNextChargeDate = (sub: Subscription, interval: string) => {
    const baseDateStr = sub.start_date || sub.created_at
    const date = new Date(baseDateStr)
    if (isNaN(date.getTime())) return "N/A"
    
    switch (interval.toLowerCase()) {
      case "daily":
        date.setDate(date.getDate() + 1)
        break
      case "weekly":
        date.setDate(date.getDate() + 7)
        break
      case "monthly":
        date.setMonth(date.getMonth() + 1)
        break
      case "annually":
      case "yearly":
        date.setFullYear(date.getFullYear() + 1)
        break
      default:
        date.setMonth(date.getMonth() + 1)
    }
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const getStatusBadge = (status: string) => {
    const normalStatus = status.toLowerCase()
    
    // Highlight failed payments states with a distinct rose visual indicator
    if (normalStatus === "attention" || normalStatus === "failed" || normalStatus === "payment_failed") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <AlertTriangle className="w-3 h-3 text-rose-500 animate-pulse" />
          <span>Payment Failed</span>
        </span>
      )
    }

    if (normalStatus === "active") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
          Active
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
        Cancelled
      </span>
    )
  }

  if (localSubs.length === 0) {
    return (
      <div className="text-center py-16 text-zinc-500 dark:text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/20 font-sans">
        <Users className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
        <p className="text-sm font-semibold">No active subscriptions found.</p>
        <p className="text-xs text-zinc-400 mt-1.5">When customers subscribe to a plan, they will show up here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="border-b border-zinc-200/60 pb-5 dark:border-zinc-900/60">
        <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Subscriptions</h1>
        <p className="text-sm text-slate-400 mt-1">Track and manage customer billing subscriptions.</p>
      </div>

      <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111] rounded-xl overflow-hidden text-sm shadow-sm transition-colors animate-in fade-in duration-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/40 text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-xs select-none">
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Plan Name</th>
                <th className="px-6 py-3.5">Subscription Code</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Next Charge Date</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-900/60">
              {localSubs.map((sub) => {
                const isCopied = copiedCode === sub.subscription_code
                const planDetails = getPlanDetails(sub.plan_code)
                const nextCharge = getNextChargeDate(sub, planDetails.interval)

                return (
                  <tr
                    key={sub.id}
                    className="hover:bg-zinc-50/40 dark:hover:bg-zinc-900/30 transition-colors"
                  >
                    <td className="px-6 py-3.5 font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                      {sub.customer_email}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="font-bold text-zinc-700 dark:text-zinc-300">{planDetails.name}</div>
                      {planDetails.amount > 0 && (
                        <div className="text-xs text-zinc-400 font-mono mt-0.5">
                          ₦{planDetails.amount.toLocaleString()}/{planDetails.interval}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs text-zinc-500 dark:text-zinc-400 font-bold flex items-center gap-1.5 group">
                      <span className="truncate max-w-[120px]">{sub.subscription_code}</span>
                      <button
                        onClick={(e) => handleCopyCode(sub.subscription_code, e)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all rounded"
                        title="Copy subscription code"
                      >
                        {isCopied ? <Check className="w-3 text-emerald-500" /> : <Copy className="w-3" />}
                      </button>
                    </td>
                    <td className="px-6 py-3.5">{getStatusBadge(sub.status)}</td>
                    <td className="px-6 py-3.5 text-zinc-500 dark:text-zinc-400 font-medium">
                      {sub.status.toLowerCase() === "active" ? nextCharge : "—"}
                    </td>
                    <td className="px-6 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      {sub.status.toLowerCase() === "active" && (
                        <button
                          onClick={() => {
                            setSelectedSub(sub)
                            setIsCancelOpen(true)
                          }}
                          className="px-2.5 py-1 text-xs font-bold border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded transition-all cursor-pointer flex items-center gap-1 ml-auto"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Cancel</span>
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancel Subscription Confirmation Modal */}
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 font-sans">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-zinc-900 dark:text-zinc-100">
              <AlertTriangle className="w-4.5 h-4.5 text-rose-500 animate-bounce" />
              <span>Cancel Subscription</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
              Are you sure you want to cancel the subscription <code className="font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1 py-0.5 rounded">{selectedSub?.subscription_code}</code>?
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCancelSubmit} className="space-y-4 pt-3 text-sm">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
              This action will cancel recurring renewals for <strong className="text-zinc-700 dark:text-zinc-300">{selectedSub?.customer_email}</strong>.
              This operation is permanent and cannot be undone directly.
            </p>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCancelOpen(false)}
                className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg font-bold text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer"
              >
                No, Keep Active
              </button>
              <button
                type="submit"
                disabled={isCancelling}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white font-extrabold rounded-lg shadow-md shadow-rose-500/10 hover:shadow-rose-500/20 cursor-pointer disabled:opacity-50 transition-all flex items-center gap-1.5"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <span>Yes, Cancel Subscription</span>
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
