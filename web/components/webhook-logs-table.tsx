"use client"

import React, { useState } from "react"
import { Copy, Check, ChevronDown, ChevronUp, AlertCircle, ShieldCheck, Cpu, Clock, Terminal } from "lucide-react"

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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.05)] select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Verified
          </span>
        )
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20 shadow-[0_0_8px_rgba(239,68,68,0.05)] select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Bad Signature
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Unverified
          </span>
        )
    }
  }

  const getForwardBadge = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 dark:text-emerald-450 border border-emerald-500/20 font-mono shadow-[0_0_6px_rgba(16,185,129,0.02)]">
          HTTP {statusCode}
        </span>
      )
    }
    if (statusCode === 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
          Not Sent
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-550 dark:text-rose-400 border border-rose-500/20 font-mono">
        HTTP {statusCode}
      </span>
    )
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-14 text-zinc-500 dark:text-zinc-450 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/30 dark:bg-zinc-950/10 font-sans shadow-sm select-none">
        <Cpu className="w-8 h-8 text-zinc-400 dark:text-zinc-650 mx-auto mb-3 animate-pulse" />
        <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">No webhook payload logs audited yet.</p>
        <p className="text-xs text-zinc-450 mt-1.5">Payment notification calls will display here in real-time.</p>
      </div>
    )
  }

  return (
    <div className="border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#0c0c10] rounded-2xl overflow-hidden text-sm font-sans shadow-md select-text">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/40 text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider text-[10px] select-none">
              <th className="px-6 py-4">Event & Reference</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Signature Validation</th>
              <th className="px-6 py-4">API Delivery Status</th>
              <th className="px-6 py-4 text-right font-semibold">Processed At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-900/40">
            {logs.map((log) => {
              const isExpanded = expandedLogId === log.id
              const isCopied = copiedLogId === log.id
              const date = new Date(log.created_at).toLocaleString()

              return (
                <React.Fragment key={log.id}>
                  {/* Table Row Card-Style */}
                  <tr
                    onClick={() => toggleExpand(log.id)}
                    className={`hover:bg-zinc-50/80 dark:hover:bg-zinc-900/20 cursor-pointer transition-colors duration-200 ${
                      isExpanded ? "bg-zinc-50/40 dark:bg-zinc-900/10" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="font-extrabold text-zinc-800 dark:text-zinc-100 text-sm">{log.event}</div>
                      <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-1 select-all font-bold">
                        REF: {log.reference || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-800 dark:text-zinc-200 font-extrabold font-mono">
                      {log.amount > 0 ? `₦${log.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "—"}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(log.status)}</td>
                    <td className="px-6 py-4">{getForwardBadge(log.forwarded_status)}</td>
                    <td className="px-6 py-4 text-right text-zinc-400 dark:text-zinc-500">
                      <div className="flex items-center justify-end gap-2 text-xs">
                        <Clock className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-650 shrink-0" />
                        <span className="font-semibold">{date}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-zinc-400 dark:text-zinc-600 shrink-0 ml-1" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-zinc-400 dark:text-zinc-600 shrink-0 ml-1" />
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded detail box */}
                  {isExpanded && (
                    <tr className="bg-zinc-50/20 dark:bg-zinc-950/20 border-t border-zinc-200 dark:border-zinc-900 animate-in fade-in duration-200">
                      <td colSpan={5} className="px-6 py-5">
                        <div className="space-y-4">
                          {log.error_message && (
                            <div className="p-4 border border-rose-500/15 bg-rose-500/5 text-rose-500 dark:text-rose-400 rounded-xl flex items-start gap-3 shadow-inner">
                              <AlertCircle className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5 animate-pulse" />
                              <div className="space-y-1">
                                <span className="font-extrabold block uppercase tracking-wider text-[9px] text-rose-600 dark:text-rose-300">
                                  Delivery Error Log
                                </span>
                                <p className="text-xs font-mono leading-normal">{log.error_message}</p>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            {/* Code Payload Viewer */}
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between select-none">
                                <span className="font-bold text-zinc-400 dark:text-zinc-500 block uppercase tracking-wider text-[9px]">
                                  Event Payload (JSON)
                                </span>
                                <button
                                  onClick={(e) => handleCopyText(log.payload, log.id, e)}
                                  className="text-[10px] text-sky-500 hover:text-sky-400 font-bold hover:underline flex items-center gap-1.5 cursor-pointer bg-sky-500/5 px-2.5 py-1 rounded-lg border border-sky-500/10 hover:border-sky-500/20 transition-all"
                                >
                                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                  <span>{isCopied ? "Copied" : "Copy"}</span>
                                </button>
                              </div>
                              <div className="p-4 bg-[#050507] border border-zinc-200/5 dark:border-zinc-800/80 rounded-xl max-h-60 overflow-y-auto font-mono text-xs text-sky-400/90 leading-relaxed whitespace-pre-wrap select-all shadow-inner shadow-black/20">
                                {(() => {
                                  try {
                                    return JSON.stringify(JSON.parse(log.payload), null, 2)
                                  } catch {
                                    return log.payload
                                  }
                                })()}
                              </div>
                            </div>

                            {/* Verification info panel */}
                            <div className="flex flex-col justify-between h-full space-y-5">
                              <div className="space-y-3">
                                <span className="font-bold text-zinc-400 dark:text-zinc-500 block uppercase tracking-wider text-[9px]">
                                  Delivery Headers
                                </span>
                                <div className="space-y-2 font-mono text-zinc-500 dark:text-zinc-450 text-[11px] bg-zinc-50/50 dark:bg-zinc-950/40 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-900/60 shadow-sm">
                                  <div className="flex flex-col gap-0.5 border-b border-zinc-100 dark:border-zinc-900/60 pb-2">
                                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Log UUID</span> 
                                    <span className="select-all font-bold text-zinc-750 dark:text-zinc-250 truncate">{log.id}</span>
                                  </div>
                                  <div className="flex flex-col gap-0.5 pt-1">
                                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Webhook Config Slug</span> 
                                    <span className="select-all font-bold text-zinc-750 dark:text-zinc-250 truncate">{log.webhook_config_id}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider select-none bg-zinc-50 dark:bg-zinc-900/20 p-2.5 rounded-xl border border-zinc-200/50 dark:border-zinc-900 self-end">
                                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span>Cryptographically Authenticated</span>
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
