"use client"

import React, { useState } from "react"
import { Copy, Check, ChevronDown, ChevronUp, Terminal, ShieldAlert, Cpu } from "lucide-react"

export interface Transaction {
  reference: string
  status: string
  amount: number
  currency: string
  provider: string
  message: string
}

export default function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
  const [expandedRef, setExpandedRef] = useState<string | null>(null)
  const [copiedRef, setCopiedRef] = useState<string | null>(null)

  const toggleExpand = (ref: string) => {
    setExpandedRef(expandedRef === ref ? null : ref)
  }

  const handleCopyText = (text: string, ref: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row toggling
    navigator.clipboard.writeText(text)
    setCopiedRef(ref)
    setTimeout(() => setCopiedRef(null), 2000)
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

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-16 text-zinc-500 dark:text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/20 font-sans">
        <Cpu className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
        <p className="text-sm font-semibold">No transaction history found.</p>
        <p className="text-xs text-zinc-400 mt-1.5">Initialized checkout payments will appear in this audit log.</p>
      </div>
    )
  }

  return (
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
              <th className="px-6 py-3.5 text-right">Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-900/60">
            {transactions.map((tx) => {
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
                        {isCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded border border-sky-500/20">
                        {tx.provider}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-bold text-zinc-700 dark:text-zinc-300 font-mono">
                      {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-3.5 font-extrabold text-zinc-400 dark:text-zinc-500 font-mono">{tx.currency}</td>
                    <td className="px-6 py-3.5">{getStatusBadge(tx.status)}</td>
                    <td className="px-6 py-3.5 text-right text-zinc-500 dark:text-zinc-400 flex items-center justify-end gap-1.5">
                      <span>{tx.message || "—"}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />}
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
                              {isCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
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
  )
}
