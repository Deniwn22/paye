"use client"

import React, { useState, useEffect } from "react"
import { Copy, Check, ChevronDown, ChevronUp, Cpu, RefreshCw } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { refundTransactionAction } from "@/app/actions"
import { toast } from "sonner"

export interface Transaction {
  reference: string
  status: string
  amount: number
  currency: string
  provider: string
  message: string
}

export default function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>(transactions)
  const [expandedRef, setExpandedRef] = useState<string | null>(null)
  const [copiedRef, setCopiedRef] = useState<string | null>(null)

  // Refund Modal States
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false)
  const [refundType, setRefundType] = useState<"full" | "partial">("full")
  const [refundAmount, setRefundAmount] = useState<string>("")
  const [customerNote, setCustomerNote] = useState("")
  const [merchantNote, setMerchantNote] = useState("")
  const [isRefunding, setIsRefunding] = useState(false)

  useEffect(() => {
    setLocalTransactions(transactions)
  }, [transactions])

  const toggleExpand = (ref: string) => {
    setExpandedRef(expandedRef === ref ? null : ref)
  }

  const handleCopyText = (text: string, ref: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    setCopiedRef(ref)
    setTimeout(() => setCopiedRef(null), 2000)
  }

  const handleOpenRefund = (tx: Transaction, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedTx(tx)
    setRefundType("full")
    setRefundAmount(tx.amount.toString())
    setCustomerNote("")
    setMerchantNote("")
    setIsRefundModalOpen(true)
  }

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTx) return

    const amt = refundType === "full" ? selectedTx.amount : parseFloat(refundAmount)
    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid refund amount")
      return
    }
    if (amt > selectedTx.amount) {
      toast.error(`Refund amount cannot exceed the transaction amount (₦${selectedTx.amount})`)
      return
    }

    setIsRefunding(true)
    try {
      const res = await refundTransactionAction(
        selectedTx.reference,
        refundType === "full" ? undefined : amt,
        customerNote,
        merchantNote
      )

      if (res.success) {
        toast.success("Refund processed successfully")
        setLocalTransactions((prev) =>
          prev.map((t) =>
            t.reference === selectedTx.reference
              ? { ...t, status: "refunded", message: "Refunded" }
              : t
          )
        )
        setIsRefundModalOpen(false)
      } else {
        toast.error(res.error || "Failed to process refund")
      }
    } catch (err) {
      toast.error("An error occurred while processing refund")
    } finally {
      setIsRefunding(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            Success
          </span>
        )
      case "refunded":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 dark:bg-sky-400" />
            Refunded
          </span>
        )
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400" />
            Failed
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
            Pending
          </span>
        )
    }
  }

  if (!localTransactions || localTransactions.length === 0) {
    return (
      <div className="text-center py-16 text-zinc-500 dark:text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/20 font-sans">
        <Cpu className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
        <p className="text-sm font-semibold">No transaction history found.</p>
        <p className="text-xs text-zinc-400 mt-1.5">Initialized checkout payments will appear in this audit log.</p>
      </div>
    )
  }

  return (
    <>
      <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111] rounded-xl overflow-hidden text-sm font-sans shadow-sm transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/40 text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-xs select-none">
                <th className="px-6 py-3.5">Reference</th>
                <th className="px-6 py-3.5">Provider</th>
                <th className="px-6 py-3.5">Amount</th>
                <th className="px-6 py-3.5">Currency</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-900/60">
              {localTransactions.map((tx) => {
                const isExpanded = expandedRef === tx.reference
                const isCopied = copiedRef === tx.reference

                return (
                  <React.Fragment key={tx.reference}>
                    <tr
                      onClick={() => toggleExpand(tx.reference)}
                      className="hover:bg-zinc-50/40 dark:hover:bg-zinc-900/30 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-3.5 font-bold text-zinc-900 dark:text-zinc-100 font-mono flex items-center gap-2 group">
                        <span className="truncate max-w-[150px]">{tx.reference}</span>
                        <button
                          onClick={(e) => handleCopyText(tx.reference, tx.reference, e)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all rounded"
                          title="Copy reference"
                        >
                          {isCopied ? <Check className="w-3 text-emerald-500" /> : <Copy className="w-3" />}
                        </button>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded border border-sky-500/20">
                          {tx.provider}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-bold text-zinc-700 dark:text-zinc-300 font-mono">
                        ₦{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-3.5 font-extrabold text-zinc-400 dark:text-zinc-500 font-mono">{tx.currency}</td>
                      <td className="px-6 py-3.5">{getStatusBadge(tx.status)}</td>
                      <td className="px-6 py-3.5 text-right flex items-center justify-end gap-3" onClick={(e) => e.stopPropagation()}>
                        {tx.status === "success" && (
                          <button
                            onClick={(e) => handleOpenRefund(tx, e)}
                            className="px-2.5 py-1 text-xs font-bold border border-sky-500/20 bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 rounded transition-all cursor-pointer flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Refund</span>
                          </button>
                        )}
                        <button
                          onClick={() => toggleExpand(tx.reference)}
                          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />}
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-zinc-50/30 dark:bg-zinc-900/40 border-t border-zinc-200 dark:border-zinc-800 animate-in fade-in duration-150">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-zinc-400 dark:text-zinc-500 block uppercase tracking-wider text-[10px]">
                                Transaction details
                              </span>
                              <button
                                onClick={(e) => handleCopyText(JSON.stringify(tx, null, 2), tx.reference, e)}
                                className="text-sm text-sky-600 dark:text-sky-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                {isCopied ? <Check className="w-3 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{isCopied ? "Copied" : "Copy details"}</span>
                              </button>
                            </div>
                            <div className="p-4 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl max-h-56 overflow-y-auto">
                              <pre className="text-zinc-800 dark:text-zinc-100 leading-relaxed font-mono text-xs whitespace-pre-wrap select-all">
                                {JSON.stringify(tx, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refund Modal */}
      <Dialog open={isRefundModalOpen} onOpenChange={setIsRefundModalOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 font-sans">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-zinc-900 dark:text-zinc-100">
              <RefreshCw className="w-4.5 h-4.5 text-sky-500" />
              <span>Refund Transaction</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
              Initiate a refund for transaction <code className="font-mono font-bold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-900 px-1 py-0.5 rounded">{selectedTx?.reference}</code>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRefundSubmit} className="space-y-4 pt-3 text-sm">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Refund Option</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="refundType"
                    checked={refundType === "full"}
                    onChange={() => {
                      setRefundType("full")
                      if (selectedTx) setRefundAmount(selectedTx.amount.toString())
                    }}
                    className="accent-sky-500"
                  />
                  <span>Full Refund (₦{selectedTx?.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
                </label>
                <label className="flex items-center gap-2 font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="refundType"
                    checked={refundType === "partial"}
                    onChange={() => {
                      setRefundType("partial")
                      setRefundAmount("")
                    }}
                    className="accent-sky-500"
                  />
                  <span>Partial Refund</span>
                </label>
              </div>
            </div>

            {refundType === "partial" && (
              <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-150">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Refund Amount (NGN)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="e.g. 2500"
                  className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-sky-500 rounded-lg font-semibold font-mono"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Customer Note (Optional)</label>
              <input
                type="text"
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                placeholder="Reason sent to the customer"
                className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-sky-500 rounded-lg font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Merchant Note (Optional)</label>
              <input
                type="text"
                value={merchantNote}
                onChange={(e) => setMerchantNote(e.target.value)}
                placeholder="Internal note for your team"
                className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-sky-500 rounded-lg font-medium"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsRefundModalOpen(false)}
                className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg font-bold text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isRefunding}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-black font-extrabold rounded-lg shadow-md shadow-sky-500/10 hover:shadow-sky-500/20 cursor-pointer disabled:opacity-50 transition-all"
              >
                {isRefunding ? "Refunding..." : "Confirm Refund"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
