"use client"

import React, { useState } from "react"
import { Plus, Copy, Check, Landmark, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createRecipientAction } from "@/app/actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export interface TransferRecipient {
  id: string
  created_at: string
  name: string
  account_number: string
  bank_code: string
  currency: string
  recipient_code: string
  provider: string
}

// Major Nigerian Banks list for payout support
export const NIGERIAN_BANKS = [
  { name: "Access Bank", code: "044" },
  { name: "Citibank", code: "023" },
  { name: "Ecobank Nigeria", code: "050" },
  { name: "FCMB", code: "214" },
  { name: "Fidelity Bank", code: "070" },
  { name: "First Bank of Nigeria", code: "011" },
  { name: "GTBank", code: "058" },
  { name: "Heritage Bank", code: "030" },
  { name: "Keystone Bank", code: "082" },
  { name: "Providus Bank", code: "101" },
  { name: "Stanbic IBTC Bank", code: "221" },
  { name: "Sterling Bank", code: "232" },
  { name: "Union Bank of Nigeria", code: "032" },
  { name: "United Bank for Africa (UBA)", code: "033" },
  { name: "Unity Bank", code: "215" },
  { name: "Wema Bank", code: "035" },
  { name: "Zenith Bank", code: "057" },
]

export default function RecipientsList({ recipients }: { recipients: TransferRecipient[] }) {
  const router = useRouter()
  const [localRecipients, setLocalRecipients] = useState<TransferRecipient[]>(recipients)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Add Recipient Modal States
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [bankCode, setBankCode] = useState(NIGERIAN_BANKS[6].code) // Default to GTBank (058)
  const [currency, setCurrency] = useState("NGN")
  const [isSubmitting, setIsSubmitting] = useState(false)

  React.useEffect(() => {
    setLocalRecipients(recipients)
  }, [recipients])

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleCreateRecipient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || accountNumber.length !== 10) {
      toast.error("Please enter a valid name and 10-digit account number")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await createRecipientAction(name.trim(), accountNumber, bankCode, currency)
      if (res.success && res.recipient) {
        toast.success("Transfer recipient added successfully")
        setLocalRecipients((prev) => [res.recipient, ...prev])
        setIsOpen(false)

        // Reset fields
        setName("")
        setAccountNumber("")
        setBankCode(NIGERIAN_BANKS[6].code)
        
        router.refresh()
      } else {
        toast.error(res.error || "Failed to add recipient")
      }
    } catch (err) {
      toast.error("An error occurred while creating transfer recipient")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getBankName = (code: string) => {
    const bank = NIGERIAN_BANKS.find((b) => b.code === code)
    return bank ? bank.name : `Bank (${code})`
  }

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-200">
      <div className="flex items-center justify-between border-b border-zinc-200/60 pb-5 dark:border-zinc-900/60">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Payout Recipients</h1>
          <p className="text-sm text-slate-400 mt-1">Manage bank account recipients for payouts and transfers.</p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-black font-extrabold text-sm rounded-lg shadow-md shadow-sky-500/10 hover:shadow-sky-500/20 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>Add Recipient</span>
        </button>
      </div>

      {localRecipients.length === 0 ? (
        <div className="text-center py-16 text-zinc-500 dark:text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/20">
          <Landmark className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
          <p className="text-sm font-semibold">No recipients found.</p>
          <p className="text-xs text-zinc-400 mt-1.5">Add a transfer recipient to start initiating payouts.</p>
        </div>
      ) : (
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111] rounded-xl overflow-hidden text-sm shadow-sm transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/40 text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-xs select-none">
                  <th className="px-6 py-3.5">Name</th>
                  <th className="px-6 py-3.5">Account Number</th>
                  <th className="px-6 py-3.5">Bank</th>
                  <th className="px-6 py-3.5">Recipient Code</th>
                  <th className="px-6 py-3.5">Provider</th>
                  <th className="px-6 py-3.5 text-right">Date Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-900/60">
                {localRecipients.map((rec) => {
                  const isCopied = copiedCode === rec.recipient_code
                  const date = new Date(rec.created_at).toLocaleDateString()

                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-zinc-50/40 dark:hover:bg-zinc-900/30 transition-colors"
                    >
                      <td className="px-6 py-3.5 font-bold text-zinc-900 dark:text-zinc-100">
                        {rec.name}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-zinc-600 dark:text-zinc-400 font-semibold">
                        {rec.account_number}
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-zinc-700 dark:text-zinc-300">
                        {getBankName(rec.bank_code)}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-xs text-zinc-500 dark:text-zinc-400 font-bold flex items-center gap-1.5 group">
                        <span className="truncate max-w-[120px]">{rec.recipient_code}</span>
                        <button
                          onClick={(e) => handleCopyCode(rec.recipient_code, e)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all rounded"
                          title="Copy recipient code"
                        >
                          {isCopied ? <Check className="w-3 text-emerald-500" /> : <Copy className="w-3" />}
                        </button>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                          {rec.provider}
                        </span>
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

      {/* Add Recipient Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 font-sans">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-zinc-900 dark:text-zinc-100">
              <Plus className="w-4.5 h-4.5 text-sky-500" />
              <span>Add Payout Recipient</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
              Register a bank account to receive money transfers and payouts.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateRecipient} className="space-y-4 pt-3 text-sm">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Recipient Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-sky-500 rounded-lg font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Account Number</label>
                <input
                  type="text"
                  maxLength={10}
                  pattern="\d{10}"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                  placeholder="10-digit number"
                  className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-sky-500 rounded-lg font-semibold font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Bank Name</label>
                <select
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-sky-500 rounded-lg font-semibold h-[38px] cursor-pointer"
                >
                  {NIGERIAN_BANKS.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name}
                    </option>
                  ))}
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
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-black font-extrabold rounded-lg shadow-md shadow-sky-500/10 hover:shadow-sky-500/20 cursor-pointer disabled:opacity-50 transition-all flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Adding...</span>
                  </>
                ) : (
                  <span>Add Recipient</span>
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
