"use client"

import React, { useState } from "react"
import { Copy, Check, ChevronDown, ChevronUp, AlertCircle, ShieldCheck, Cpu, Clock } from "lucide-react"

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

function formatJSON(jsonStr: string) {
  try {
    const parsed = JSON.parse(jsonStr)
    const formatted = JSON.stringify(parsed, null, 2)
    const lines = formatted.split("\n")
    return (
      <div className="font-mono text-[11px] leading-relaxed select-all">
        {lines.map((line, idx) => {
          const keyRegex = /^(\s*)"([^"]+)":/
          const stringRegex = /"([^"]+)"(,?)$/
          const numberRegex = / ([-+]?[0-9]*\.?[0-9]+)(,?)$/
          const boolRegex = / (true|false|null)(,?)$/

          const keyMatch = line.match(keyRegex)
          if (keyMatch) {
            const indent = keyMatch[1]
            const key = keyMatch[2]
            const rest = line.substring(keyMatch[0].length)

            let valueElement
            const stringMatch = rest.match(stringRegex)
            const numberMatch = rest.match(numberRegex)
            const boolMatch = rest.match(boolRegex)

            if (stringMatch) {
              valueElement = <span className="text-[#16a34a] dark:text-[#22c55e]">"{stringMatch[1]}"</span>
            } else if (numberMatch) {
              valueElement = <span className="text-[#b45309] dark:text-[#f59e0b]">{numberMatch[1]}</span>
            } else if (boolMatch) {
              valueElement = <span className="text-[#2563eb] dark:text-[#3b82f6]">{boolMatch[1]}</span>
            } else {
              valueElement = <span className="text-foreground">{rest}</span>
            }

            return (
              <div key={idx}>
                {indent}
                <span className="text-zinc-500 dark:text-zinc-450">"{key}"</span>:
                {valueElement}
              </div>
            )
          }

          return (
            <div key={idx} className="text-zinc-400 dark:text-zinc-500">
              {line}
            </div>
          )
        })}
      </div>
    )
  } catch {
    return <div className="font-mono text-[11px] text-red-500">{jsonStr}</div>
  }
}

function getHighlights(payloadStr: string) {
  try {
    const data = JSON.parse(payloadStr)
    const highlights: { label: string; value: string }[] = []
    const rootData = data.data || data

    const email = rootData.customer?.email || rootData.email || "—"
    const gatewayMsg = rootData.gateway_response || rootData.processor_response || rootData.message || "—"
    const channel = rootData.channel || rootData.payment_type || "—"
    const status = rootData.status || data.event || "—"

    if (email !== "—") highlights.push({ label: "Customer Email", value: email })
    if (gatewayMsg !== "—") highlights.push({ label: "Processor Message", value: gatewayMsg })
    if (channel !== "—") highlights.push({ label: "Payment Channel", value: String(channel).toUpperCase() })
    if (status !== "—") highlights.push({ label: "Payload Status", value: String(status) })

    return highlights
  } catch {
    return []
  }
}

export default function WebhookLogsTable({ logs }: { logs: WebhookLog[] }) {
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null)

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id)
  }

  const handleCopyText = (text: string, logId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    setCopiedLogId(logId)
    setTimeout(() => setCopiedLogId(null), 2000)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F0FDF4] text-[#16A34A] dark:bg-[#14291A] dark:text-[#22C55E] select-none">
            Verified
          </span>
        )
      case "failed":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FEF2F2] text-[#DC2626] dark:bg-[#2A0A0A] dark:text-[#EF4444] select-none">
            Bad Signature
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400 select-none">
            Unverified
          </span>
        )
    }
  }

  const getForwardBadge = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F0FDF4] text-[#16A34A] dark:bg-[#14291A] dark:text-[#22C55E]">
          HTTP {statusCode}
        </span>
      )
    }
    if (statusCode === 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
          Not Sent
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FEF2F2] text-[#DC2626] dark:bg-[#2A0A0A] dark:text-[#EF4444]">
        HTTP {statusCode}
      </span>
    )
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-14 text-zinc-500 dark:text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/30 dark:bg-zinc-950/10 font-sans select-none">
        <Cpu className="w-8 h-8 text-zinc-400 dark:text-zinc-650 mx-auto mb-3" />
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No webhook payload logs audited yet.</p>
        <p className="text-xs text-zinc-400 mt-1.5">Payment notification calls will display here in real-time.</p>
      </div>
    )
  }

  return (
    <div className="border-[0.5px] border-border bg-card rounded-xl overflow-hidden text-sm font-sans">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-[0.5px] border-border bg-secondary text-muted-foreground font-semibold uppercase tracking-wider text-[10px] select-none">
              <th className="px-6 py-3.5">Event & Reference</th>
              <th className="px-6 py-3.5">Amount</th>
              <th className="px-6 py-3.5">Signature Validation</th>
              <th className="px-6 py-3.5">API Delivery Status</th>
              <th className="px-6 py-3.5 text-right font-semibold">Processed At</th>
            </tr>
          </thead>
          <tbody className="divide-y-[0.5px] divide-border">
            {logs.map((log) => {
              const isExpanded = expandedLogId === log.id
              const isCopied = copiedLogId === log.id
              const date = new Date(log.created_at).toLocaleString()
              const highlights = getHighlights(log.payload)

              return (
                <React.Fragment key={log.id}>
                  <tr
                    onClick={() => toggleExpand(log.id)}
                    className={`hover:bg-secondary/40 cursor-pointer transition-colors duration-150 ${
                      isExpanded ? "bg-secondary/20" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground text-sm">{log.event}</div>
                      <div className="text-[10px] text-muted-foreground font-mono mt-1 select-all font-semibold">
                        REF: {log.reference || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-foreground font-semibold font-mono">
                      {log.amount > 0 ? `₦${log.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "—"}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(log.status)}</td>
                    <td className="px-6 py-4">{getForwardBadge(log.forwarded_status)}</td>
                    <td className="px-6 py-4 text-right text-muted-foreground">
                      <div className="flex items-center justify-end gap-2 text-xs">
                        <Clock className="w-3.5 h-3.5 text-zinc-350 dark:text-zinc-600 shrink-0" />
                        <span className="font-semibold">{date}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-zinc-400 dark:text-zinc-650 shrink-0 ml-1" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-zinc-400 dark:text-zinc-650 shrink-0 ml-1" />
                        )}
                      </div>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="bg-secondary/10 border-t-[0.5px] border-border animate-in fade-in duration-150">
                      <td colSpan={5} className="px-6 py-5">
                        <div className="space-y-4">
                          {log.error_message && (
                            <div className="p-4 border border-rose-500/15 bg-rose-500/5 text-rose-500 dark:text-rose-400 rounded-lg flex items-start gap-3">
                              <AlertCircle className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <span className="font-semibold block uppercase tracking-wider text-[9px] text-rose-600 dark:text-rose-300">
                                  Delivery Error Log
                                </span>
                                <p className="text-xs font-mono leading-normal">{log.error_message}</p>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            {/* Key Highlights & Metadata */}
                            <div className="space-y-4">
                              {highlights.length > 0 && (
                                <div className="space-y-2">
                                  <span className="font-semibold text-zinc-400 dark:text-zinc-500 block uppercase tracking-wider text-[9px]">
                                    Event Highlights
                                  </span>
                                  <div className="space-y-3 bg-zinc-50/50 dark:bg-zinc-900/10 p-4 rounded-lg border-[0.5px] border-border text-xs">
                                    {highlights.map((h, i) => (
                                      <div key={i} className="flex flex-col gap-0.5 border-b-[0.5px] border-border/60 last:border-0 pb-2 last:pb-0">
                                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{h.label}</span>
                                        <span className="font-semibold text-foreground truncate select-all">{h.value}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="space-y-2">
                                <span className="font-semibold text-zinc-400 dark:text-zinc-500 block uppercase tracking-wider text-[9px]">
                                  Audit Context
                                </span>
                                <div className="space-y-3 bg-zinc-50/50 dark:bg-zinc-900/10 p-4 rounded-lg border-[0.5px] border-border text-xs">
                                  <div className="flex flex-col gap-0.5 border-b-[0.5px] border-border/60 pb-2">
                                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Log UUID</span>
                                    <span className="select-all font-semibold text-foreground truncate">{log.id}</span>
                                  </div>
                                  <div className="flex flex-col gap-0.5 pt-1">
                                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Config ID</span>
                                    <span className="select-all font-semibold text-foreground truncate">{log.webhook_config_id}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider select-none bg-zinc-50 dark:bg-zinc-900/20 p-2.5 rounded-lg border-[0.5px] border-border w-fit">
                                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span>Cryptographically Authenticated</span>
                              </div>
                            </div>

                            {/* Code Payload Viewer */}
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between select-none">
                                <span className="font-semibold text-zinc-400 dark:text-zinc-500 block uppercase tracking-wider text-[9px]">
                                  Event Payload (JSON)
                                </span>
                                <button
                                  onClick={(e) => handleCopyText(log.payload, log.id, e)}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                                    isCopied
                                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                      : "bg-[#2563eb] border-[#2563eb] hover:bg-[#1d4ed8] text-white"
                                  }`}
                                >
                                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                  <span>{isCopied ? "Copied" : "Copy Payload"}</span>
                                </button>
                              </div>
                              <div className="p-4 bg-zinc-950 dark:bg-black border-[0.5px] border-border rounded-lg max-h-72 overflow-y-auto font-mono text-xs leading-relaxed whitespace-pre-wrap select-all">
                                {formatJSON(log.payload)}
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
