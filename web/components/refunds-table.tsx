"use client"

import React, { useState } from "react"
import { Copy, Check, ChevronDown, ChevronUp, Cpu, RefreshCw } from "lucide-react"

export interface Refund {
  id: string
  created_at: string
  transaction_reference: string
  amount: number
  currency: string
  customer_note: string
  merchant_note: string
  status: string
}

export default function RefundsTable({ refunds }: { refunds: Refund[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const handleCopyText = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
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

  if (!refunds || refunds.length === 0) {
    return (
      <div className="text-center py-16 text-zinc-500 dark:text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/20 font-sans animate-in fade-in duration-200">
        <RefreshCw className="w-8 h-8 text-zinc-400 mx-auto mb-3 animate-spin duration-3000" />
        <p className="text-sm font-semibold">No refund history found.</p>
        <p className="text-xs text-zinc-400 mt-1.5">Processed transaction refunds will appear in this audit log.</p>
      </div>
    )
  }

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111] rounded-xl overflow-hidden text-sm font-sans shadow-sm transition-colors animate-in fade-in duration-200">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/40 text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-xs select-none">
              <th className="px-6 py-3.5">Refund ID</th>
              <th className="px-6 py-3.5">Target Transaction</th>
              <th className="px-6 py-3.5">Amount</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-900/60">
            {refunds.map((refund) => {
              const isExpanded = expandedId === refund.id
              const isCopied = copiedId === refund.id
              const date = new Date(refund.created_at).toLocaleString()

              return (
                <React.Fragment key={refund.id}>
                  <tr
                    onClick={() => toggleExpand(refund.id)}
                    className="hover:bg-zinc-50/40 dark:hover:bg-zinc-900/30 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-3.5 font-bold text-zinc-900 dark:text-zinc-100 font-mono flex items-center gap-2 group">
                      <span className="truncate max-w-[120px]" title={refund.id}>{refund.id}</span>
                      <button
                        onClick={(e) => handleCopyText(refund.id, refund.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all rounded"
                        title="Copy Refund ID"
                      >
                        {isCopied ? <Check className="w-3 text-emerald-500" /> : <Copy className="w-3" />}
                      </button>
                    </td>
                    <td className="px-6 py-3.5 font-bold text-zinc-500 dark:text-zinc-400 font-mono">
                      {refund.transaction_reference}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-zinc-700 dark:text-zinc-300 font-mono">
                      ₦{refund.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-3.5">{getStatusBadge(refund.status)}</td>
                    <td className="px-6 py-3.5 text-right text-zinc-400 dark:text-zinc-500 flex items-center justify-end gap-1.5">
                      <span>{date}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />}
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="bg-zinc-50/30 dark:bg-zinc-900/40 border-t border-zinc-200 dark:border-zinc-800 animate-in fade-in duration-150">
                      <td colSpan={5} className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <span className="font-bold text-zinc-400 dark:text-zinc-500 block uppercase tracking-wider text-[10px]">
                              Notes
                            </span>
                            <div className="space-y-2.5 text-xs">
                              <div>
                                <span className="font-semibold text-zinc-400 dark:text-zinc-500 block">Customer Note:</span>
                                <p className="text-zinc-700 dark:text-zinc-300 mt-0.5">
                                  {refund.customer_note || <em className="text-zinc-400 dark:text-zinc-600">No customer note</em>}
                                </p>
                              </div>
                              <div>
                                <span className="font-semibold text-zinc-400 dark:text-zinc-500 block">Merchant Note:</span>
                                <p className="text-zinc-700 dark:text-zinc-300 mt-0.5">
                                  {refund.merchant_note || <em className="text-zinc-400 dark:text-zinc-600">No merchant note</em>}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <span className="font-bold text-zinc-400 dark:text-zinc-500 block uppercase tracking-wider text-[10px]">
                              Details
                            </span>
                            <div className="space-y-1.5 font-mono text-zinc-600 dark:text-zinc-400 text-xs bg-zinc-50/50 dark:bg-zinc-900/30 p-3 rounded-lg border border-zinc-200 dark:border-zinc-900">
                              <div className="flex justify-between">
                                <span className="text-zinc-400 dark:text-zinc-500 font-semibold">Currency:</span>
                                <span className="font-bold text-zinc-800 dark:text-zinc-200 uppercase">{refund.currency}</span>
                              </div>
                              <div className="flex justify-between mt-1">
                                <span className="text-zinc-400 dark:text-zinc-500 font-semibold">Refund Date:</span>
                                <span className="font-bold text-zinc-800 dark:text-zinc-200">{date}</span>
                              </div>
                            </div>
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
