"use client"

import React, { useState } from "react"
import { Plus, Copy, Check, FileText, Calendar, Loader2, Landmark } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createPlanAction } from "@/app/actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export interface Plan {
  id: string
  created_at: string
  plan_code: string
  name: string
  amount: number
  interval: string
  currency: string
  description: string
  provider: string
}

export default function PlansList({ plans }: { plans: Plan[] }) {
  const router = useRouter()
  const [localPlans, setLocalPlans] = useState<Plan[]>(plans)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  
  // Create Plan Modal States
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [interval, setInterval] = useState("monthly")
  const [currency, setCurrency] = useState("NGN")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  React.useEffect(() => {
    setLocalPlans(plans)
  }, [plans])

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await createPlanAction(name, interval, parsedAmount, currency, description)
      if (res.success && res.plan) {
        toast.success("Billing plan created successfully")
        setLocalPlans((prev) => [res.plan, ...prev])
        setIsOpen(false)
        
        // Reset fields
        setName("")
        setAmount("")
        setInterval("monthly")
        setCurrency("NGN")
        setDescription("")
        
        router.refresh()
      } else {
        toast.error(res.error || "Failed to create plan")
      }
    } catch (err) {
      toast.error("An error occurred while creating billing plan")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between border-b border-zinc-200/60 pb-5 dark:border-zinc-900/60">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Billing Plans</h1>
          <p className="text-sm text-slate-400 mt-1">Manage subscription plans and recurring pricing models.</p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold text-sm rounded-lg cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>Create Plan</span>
        </button>
      </div>

      {localPlans.length === 0 ? (
        <div className="text-center py-16 text-zinc-500 dark:text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/20">
          <FileText className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
          <p className="text-sm font-semibold">No billing plans found.</p>
          <p className="text-xs text-zinc-400 mt-1.5">Create a plan to enable customer subscriptions.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {localPlans.map((plan) => (
            <div
              key={plan.id}
              className="flex flex-col justify-between rounded-xl border border-zinc-200/60 bg-white p-5 dark:border-zinc-900 dark:bg-[#111111] hover:border-[#2563eb]/40 hover:dark:border-[#2563eb]/40 transition-all shadow-sm group"
            >
              <div>
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100 line-clamp-1">{plan.name}</h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#eff6ff] text-[#2563eb] dark:bg-[#1e3a5f]/30 dark:text-[#3b82f6] border border-[#2563eb]/20 dark:border-[#3b82f6]/20 uppercase tracking-wider">
                    {plan.interval}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 line-clamp-2 min-h-[2rem]">
                  {plan.description || "No description provided."}
                </p>
                <div className="mt-4 space-y-1.5">
                  <span className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    Plan Code
                  </span>
                  <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-900/60 px-2.5 py-1.5 rounded-lg border border-zinc-100 dark:border-zinc-800/80 font-mono text-[11px] text-zinc-600 dark:text-zinc-400 font-bold select-all group/code">
                    <span className="truncate">{plan.plan_code}</span>
                    <button
                      onClick={(e) => handleCopyCode(plan.plan_code, e)}
                      className="ml-auto p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded transition-all"
                      title="Copy plan code"
                    >
                      {copiedCode === plan.plan_code ? <Check className="w-3 text-emerald-500" /> : <Copy className="w-3" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-900 flex justify-between items-baseline">
                <div>
                  <span className="text-2xl font-black text-zinc-900 dark:text-white font-mono">
                    ₦{plan.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold lowercase">
                    /{plan.interval}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(plan.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Plan Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 font-sans">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-zinc-100">
              <Plus className="w-4.5 h-4.5 text-[#2563eb]" />
              <span>Create Billing Plan</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
              Create a new subscription pricing model for your customers.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreatePlan} className="space-y-4 pt-3 text-sm">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Plan Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Premium Monthly Plan"
                className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 focus:outline-none focus:border-[#2563eb] rounded-lg font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Amount (NGN)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-655 focus:outline-none focus:border-[#2563eb] rounded-lg font-semibold font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Billing Interval</label>
                <select
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#2563eb] rounded-lg font-semibold h-[38px] cursor-pointer"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="annually">Annually</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Currency</label>
              <select
                value={currency}
                disabled
                className="w-full px-3.5 py-2 bg-zinc-50/50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 text-zinc-400 dark:text-zinc-600 rounded-lg font-semibold h-[38px] cursor-not-allowed"
              >
                <option value="NGN">NGN (₦)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief plan description for your reference."
                rows={3}
                className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 focus:outline-none focus:border-[#2563eb] rounded-lg font-medium"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg font-bold text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold rounded-lg cursor-pointer disabled:opacity-50 transition-all flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create Plan</span>
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
