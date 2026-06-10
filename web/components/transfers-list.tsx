"use client"

import React, { useState } from "react"
import { Send, Plus, Copy, Check, Calendar, Loader2, ArrowUpRight } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createTransferAction } from "@/app/actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export interface Transfer {
  id: string
  created_at: string
  recipient_code: string
  amount: number
  currency: string
  reason: string
  reference: string
  transfer_code: string
  status: string
  provider: string
}

export interface TransferRecipient {
  recipient_code: string
  name: string
  account_number: string
  bank_code: string
}

export default function TransfersList({
  transfers,
  recipients,
}: {
  transfers: Transfer[]
  recipients: TransferRecipient[]
}) {
  const router = useRouter()
  const [localTransfers, setLocalTransfers] = useState<Transfer[]>(transfers)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // New Transfer Modal States
  const [isOpen, setIsOpen] = useState(false)
  const [recipientCode, setRecipientCode] = useState("")
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")
  const [reference, setReference] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  React.useEffect(() => {
    setLocalTransfers(transfers)
    if (recipients.length > 0 && !recipientCode) {
      setRecipientCode(recipients[0].recipient_code)
    }
  }, [transfers, recipients])

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }
    if (!recipientCode) {
      toast.error("Please select a recipient")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await createTransferAction(parsedAmount, recipientCode, reason, reference)
      if (res.success && res.transfer) {
        toast.success("Transfer initiated successfully")
        setLocalTransfers((prev) => [res.transfer, ...prev])
        setIsOpen(false)

        // Reset fields
        setAmount("")
        setReason("")
        setReference("")
        
        router.refresh()
      } else {
        toast.error(res.error || "Failed to initiate transfer")
      }
    } catch (err) {
      toast.error("An error occurred while creating transfer")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRecipientName = (code: string) => {
    const recipient = recipients.find((r) => r.recipient_code === code)
    return recipient ? recipient.name : `Recipient (${code})`
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "success":
      case "successful":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            Successful
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

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-200">
      <div className="flex items-center justify-between border-b border-zinc-200/60 pb-5 dark:border-zinc-900/60">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Payout Transfers</h1>
          <p className="text-sm text-slate-400 mt-1">Audit log of all initiated payouts and balance transfers.</p>
        </div>
        <button
          onClick={() => {
            if (recipients.length === 0) {
              toast.error("Please add a recipient before initiating a transfer")
              return
            }
            setIsOpen(true)
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold text-sm rounded-lg cursor-pointer transition-all"
        >
          <ArrowUpRight className="w-4.5 h-4.5 shrink-0" />
          <span>New Transfer</span>
        </button>
      </div>

      {localTransfers.length === 0 ? (
        <div className="text-center py-16 text-zinc-500 dark:text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/20">
          <Send className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
          <p className="text-sm font-semibold">No payout transfers found.</p>
          <p className="text-xs text-zinc-400 mt-1.5">Initiate a transfer to distribute payouts to recipients.</p>
        </div>
      ) : (
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111] rounded-xl overflow-hidden text-sm shadow-sm transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/40 text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-xs select-none">
                  <th className="px-6 py-3.5">Recipient</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Reason</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Transfer Code / Reference</th>
                  <th className="px-6 py-3.5 text-right font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-900/60">
                {localTransfers.map((tx) => {
                  const isCopiedCode = copiedCode === tx.transfer_code
                  const isCopiedRef = copiedCode === tx.reference
                  const date = new Date(tx.created_at).toLocaleString()

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-zinc-50/40 dark:hover:bg-zinc-900/30 transition-colors"
                    >
                      <td className="px-6 py-3.5">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">{getRecipientName(tx.recipient_code)}</div>
                        <div className="text-xs text-zinc-400 font-mono mt-0.5">{tx.recipient_code}</div>
                      </td>
                      <td className="px-6 py-3.5 font-bold font-mono text-zinc-700 dark:text-zinc-300">
                        ₦{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-3.5 text-zinc-600 dark:text-zinc-400 font-medium">
                        {tx.reason || <em className="text-zinc-400 dark:text-zinc-600">No reason</em>}
                      </td>
                      <td className="px-6 py-3.5">{getStatusBadge(tx.status)}</td>
                      <td className="px-6 py-3.5 font-mono text-xs space-y-1 select-all font-bold">
                        {tx.transfer_code && (
                          <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400 group">
                            <span>Code: {tx.transfer_code}</span>
                            <button
                              onClick={(e) => handleCopyCode(tx.transfer_code, e)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-400 hover:text-zinc-900 rounded"
                              title="Copy code"
                            >
                              {isCopiedCode ? <Check className="w-2.5 text-emerald-500" /> : <Copy className="w-2.5" />}
                            </button>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500 group">
                          <span>Ref: {tx.reference}</span>
                          <button
                            onClick={(e) => handleCopyCode(tx.reference, e)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-400 hover:text-zinc-900 rounded"
                            title="Copy reference"
                          >
                            {isCopiedRef ? <Check className="w-2.5 text-emerald-500" /> : <Copy className="w-2.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-right text-zinc-400 dark:text-zinc-500">
                        {date}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Transfer Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 font-sans">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-zinc-100">
              <Send className="w-4.5 h-4.5 text-[#2563eb]" />
              <span>Initiate New Payout Transfer</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
              Transfer funds from your merchant balance to a saved recipient.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTransfer} className="space-y-4 pt-3 text-sm">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Select Recipient</label>
              <select
                value={recipientCode}
                required
                onChange={(e) => setRecipientCode(e.target.value)}
                className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#2563eb] rounded-lg font-semibold h-[38px] cursor-pointer"
              >
                <option value="" disabled>-- Choose Recipient --</option>
                {recipients.map((r) => (
                  <option key={r.recipient_code} value={r.recipient_code}>
                    {r.name} ({r.account_number})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Amount (NGN)</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 15000"
                className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 focus:outline-none focus:border-[#2563eb] rounded-lg font-semibold font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Reason for Transfer</label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Supplier payment"
                className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 focus:outline-none focus:border-[#2563eb] rounded-lg font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Custom Reference (Optional)</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Unique transfer reference prefix"
                className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 focus:outline-none focus:border-[#2563eb] rounded-lg font-semibold font-mono"
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
                    <span>Sending...</span>
                  </>
                ) : (
                  <span>Send Payout</span>
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
