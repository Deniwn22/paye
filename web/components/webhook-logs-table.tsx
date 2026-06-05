"use client"

import React, { useState } from "react"
import { Copy, Check, ChevronDown, ChevronUp, AlertCircle, ShieldCheck, Terminal, Cpu } from "lucide-react"

export interface WebhookLog {
  id: string
  webhook_config_id: string
  event: string
  reference: string
  amount: number
  status: string
  forwarded_status: number
  error_message: string
  payload: string
  created_at: string
}

export default function WebhookLogsTable({ logs }: { logs: WebhookLog[] }) {
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null)

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id)
  }

  const handleCopyText = (text: string, logId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row expand
    navigator.clipboard.writeText(text)
    setCopiedLogId(logId)
    setTimeout(() => setCopiedLogId(null), 2000)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            Verified
          </span>
        )
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400" />
            Invalid Signature
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
            Unverified
          </span>
        )
    }
  }

  const getForwardBadge = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
          HTTP {statusCode}
        </span>
      )
    }
    if (statusCode === 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
          Not Sent
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-mono">
        HTTP {statusCode}
      </span>
    )
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500 dark:text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/20 font-sans">
        <Cpu className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
        <p className="text-sm font-semibold">No payment notifications received yet.</p>
        <p className="text-xs text-zinc-500 mt-1.5">Payment notifications from your gateways will show up here.</p>
      </div>
    )
  }

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111] rounded-xl overflow-hidden text-sm font-sans shadow-sm transition-colors">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/40 text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-xs select-none">
              <th className="px-6 py-3.5">Event & Reference</th>
              <th className="px-6 py-3.5">Amount</th>
              <th className="px-6 py-3.5">Signature status</th>
              <th className="px-6 py-3.5">Delivery status</th>
              <th className="px-6 py-3.5 text-right font-semibold">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-900/60">
            {logs.map((log) => {
              const isExpanded = expandedLogId === log.id
              const isCopied = copiedLogId === log.id
              const date = new Date(log.created_at).toLocaleString()

              return (
                <React.Fragment key={log.id}>
                  <tr
                    onClick={() => toggleExpand(log.id)}
                    className="hover:bg-zinc-100/40 dark:hover:bg-zinc-900/30 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-3.5">
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">{log.event}</div>
                      <div className="text-xs text-zinc-400 dark:text-zinc-500 font-mono mt-0.5 select-all">
                        REF: {log.reference || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-zinc-700 dark:text-zinc-300 font-bold font-mono">
                      {log.amount > 0 ? `₦${log.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "—"}
                    </td>
                    <td className="px-6 py-3.5">{getStatusBadge(log.status)}</td>
                    <td className="px-6 py-3.5">{getForwardBadge(log.forwarded_status)}</td>
                    <td className="px-6 py-3.5 text-right text-zinc-400 dark:text-zinc-500 flex items-center justify-end gap-1.5 mt-0.5">
                      <span>{date}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />}
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="bg-zinc-50/30 dark:bg-zinc-900/40 border-t border-zinc-200 dark:border-zinc-800 animate-in fade-in duration-150">
                      <td colSpan={5} className="px-6 py-4">
                        <div className="space-y-4 text-sm">
                          {log.error_message && (
                            <div className="p-4 border border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400 rounded-xl flex items-start gap-2.5">
                              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <span className="font-bold block uppercase tracking-wider text-[10px]">
                                  Delivery error details
                                </span>
                                <p className="text-xs font-mono leading-normal">{log.error_message}</p>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-zinc-400 dark:text-zinc-500 block uppercase tracking-wider text-[10px]">
                                  Notification details
                                </span>
                                <button
                                  onClick={(e) => handleCopyText(log.payload, log.id, e)}
                                  className="text-sm text-sky-600 dark:text-sky-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                  <span>{isCopied ? "Copied" : "Copy Payload"}</span>
                                </button>
                              </div>
                              <div className="p-4 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl max-h-56 overflow-y-auto font-mono text-xs text-zinc-800 dark:text-zinc-100 leading-relaxed whitespace-pre-wrap select-all">
                                {(() => {
                                  try {
                                    return JSON.stringify(JSON.parse(log.payload), null, 2)
                                  } catch {
                                    return log.payload
                                  }
                                })()}
                              </div>
                            </div>

                            <div className="flex flex-col justify-between space-y-4">
                              <div className="space-y-3">
                                <span className="font-bold text-zinc-400 dark:text-zinc-500 block uppercase tracking-wider text-[10px]">
                                  Delivery details
                                </span>
                                <div className="space-y-1.5 font-mono text-zinc-600 dark:text-zinc-400 text-xs bg-zinc-50/50 dark:bg-zinc-900/30 p-3 rounded-lg border border-zinc-200 dark:border-zinc-900">
                                  <div className="flex justify-between">
                                    <span className="text-zinc-400 dark:text-zinc-500 font-semibold">Log UUID:</span> 
                                    <span className="select-all font-bold text-zinc-800 dark:text-zinc-200">{log.id}</span>
                                  </div>
                                  <div className="flex justify-between mt-1">
                                    <span className="text-zinc-400 dark:text-zinc-500 font-semibold">Config Slug ID:</span> 
                                    <span className="select-all font-bold text-zinc-800 dark:text-zinc-200">{log.webhook_config_id}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 self-end">
                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                <span>Payment verified by Paye</span>
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
