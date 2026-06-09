"use client"

import { useState, useEffect } from "react"
import { Play, RotateCw, CheckCircle, ShieldAlert, Cpu, Terminal, ArrowRight, Lock, Server, Sparkles, AlertCircle } from "lucide-react"

interface EventTemplate {
  event: string
  payload: object
}

const TEMPLATES: Record<string, Record<string, EventTemplate>> = {
  paystack: {
    "charge.success": {
      event: "charge.success",
      payload: {
        event: "charge.success",
        data: {
          id: 30129302,
          domain: "live",
          status: "success",
          reference: "paye_ref_92384x98",
          amount: 2500000,
          currency: "NGN",
          gateway_response: "Successful",
          paid_at: "2026-06-04T15:00:00.000Z",
          channel: "card",
          customer: {
            id: 843920,
            first_name: "Tega",
            last_name: "Thompson",
            email: "thompson@example.com",
            phone: "+2348012345678"
          }
        }
      }
    },
    "charge.failed": {
      event: "charge.failed",
      payload: {
        event: "charge.failed",
        data: {
          id: 30129388,
          domain: "live",
          status: "failed",
          reference: "paye_ref_fail_1120a",
          amount: 500000,
          currency: "NGN",
          gateway_response: "Insufficient Funds",
          paid_at: "2026-06-04T15:02:11.000Z",
          channel: "bank_transfer",
          customer: {
            id: 843991,
            email: "failed_user@domain.com"
          }
        }
      }
    }
  },
  flutterwave: {
    "charge.completed": {
      event: "charge.completed",
      payload: {
        event: "charge.completed",
        data: {
          id: 902812,
          tx_ref: "paye_fw_ref_9281a",
          flw_ref: "FLW-MOCK-92083",
          amount: 8500,
          currency: "KES",
          status: "successful",
          payment_type: "mpesa",
          created_at: "2026-06-04T15:05:44.000Z",
          customer: {
            name: "John Kamau",
            email: "john.kamau@domain.ke"
          }
        }
      }
    }
  }
}

export default function InteractiveSimulator() {
  const [provider, setProvider] = useState<"paystack" | "flutterwave">("paystack")
  const [eventType, setEventType] = useState<string>("charge.success")
  const [jsonText, setJsonText] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "proxying" | "delivered" | "done">("idle")
  const [logs, setLogs] = useState<string[]>([])
  const [progress, setProgress] = useState(0)

  // Sync JSON text when template changes
  useEffect(() => {
    const list = TEMPLATES[provider]
    const key = Object.keys(list).includes(eventType) ? eventType : Object.keys(list)[0]
    setEventType(key)
    setJsonText(JSON.stringify(list[key].payload, null, 2))
  }, [provider])

  useEffect(() => {
    if (TEMPLATES[provider][eventType]) {
      setJsonText(JSON.stringify(TEMPLATES[provider][eventType].payload, null, 2))
    }
  }, [eventType])

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])
  }

  const handleSimulate = () => {
    if (status !== "idle" && status !== "done") return

    // Verify valid JSON first
    try {
      JSON.parse(jsonText)
    } catch (e) {
      addLog("❌ Error: Invalid JSON payload. Correct it before simulating.")
      return
    }

    setStatus("sending")
    setLogs([])
    setProgress(5)
    addLog(`🚀 Simulating payload fire from ${provider.toUpperCase()} webhook gateway...`)

    setTimeout(() => {
      setProgress(30)
      addLog(`📥 Incoming request received on Paye endpoint: /api/v1/webhooks/receive/${provider}-live-route`)
      setStatus("proxying")
    }, 1000)

    setTimeout(() => {
      setProgress(55)
      addLog(`🔐 Fetching merchant keys: dynamic AES-GCM credential decryption successful.`)
      addLog(`🔍 Verifying original ${provider.toUpperCase()} cryptographic signature...`)
    }, 1800)

    setTimeout(() => {
      setProgress(75)
      addLog(`✅ Signature matching matches provider header! Payload is verified authentic.`)
      addLog(`➕ Appending Paye signature header: X-Paye-Signature: sha256=••••d29b`)
      addLog(`📤 Forwarding verified payload securely to Target URL: https://api.mycompany.com/paye-webhook`)
      setStatus("delivered")
    }, 2800)

    setTimeout(() => {
      setProgress(100)
      addLog(`🟢 Target server accepted proxy. Response: HTTP 200 OK`)
      addLog(`✨ Webhook proxy cycle complete! Audit logs written successfully.`)
      setStatus("done")
    }, 3800)
  }

  return (
    <div className="w-full bg-white dark:bg-[#0c0c10] border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative select-none">
      
      {/* Top Bar Navigation Dashboard-Style */}
      <div className="flex items-center justify-between px-6 py-4.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/30 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono ml-3 font-semibold">live_webhook_sandbox.sh</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            Proxy Sandbox Active
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-250 dark:divide-zinc-800 bg-zinc-50/20 dark:bg-transparent">
        
        {/* Left Pane: Controls */}
        <div className="lg:col-span-5 p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div>
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-2.5">
                1. Select Gateway
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { if (status === "idle" || status === "done") setProvider("paystack"); }}
                  className={`px-4 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    provider === "paystack"
                      ? "border-sky-500 bg-sky-500/10 text-sky-400 shadow-sm"
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/25 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  Paystack
                </button>
                <button
                  onClick={() => { if (status === "idle" || status === "done") setProvider("flutterwave"); }}
                  className={`px-4 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    provider === "flutterwave"
                      ? "border-sky-500 bg-sky-500/10 text-sky-400 shadow-sm"
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/25 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  Flutterwave
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-2">
                2. Choose Event Type
              </label>
              <select
                value={eventType}
                disabled={status !== "idle" && status !== "done"}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-250 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 cursor-pointer shadow-sm"
              >
                {Object.keys(TEMPLATES[provider]).map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 select-none">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  3. Customize JSON Payload
                </label>
                <span className="text-[9px] text-zinc-400 font-mono font-bold uppercase tracking-wider bg-zinc-200/50 dark:bg-zinc-800/50 px-1.5 py-0.5 rounded">Editable</span>
              </div>
              <textarea
                value={jsonText}
                disabled={status !== "idle" && status !== "done"}
                onChange={(e) => setJsonText(e.target.value)}
                rows={9}
                className="w-full p-4 bg-white dark:bg-zinc-950/50 border border-zinc-250 dark:border-zinc-850 rounded-xl font-mono text-xs text-sky-650 dark:text-sky-400 focus:outline-none focus:border-sky-500 leading-relaxed resize-none transition-all selection:bg-sky-500/20 shadow-inner"
              />
            </div>
          </div>

          <button
            onClick={handleSimulate}
            disabled={status !== "idle" && status !== "done"}
            className="w-full relative overflow-hidden py-3.5 bg-sky-500 hover:bg-sky-450 disabled:bg-zinc-200 dark:disabled:bg-zinc-800/80 text-white disabled:text-zinc-450 dark:disabled:text-zinc-600 text-xs font-black rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer select-none"
          >
            {status === "idle" || status === "done" ? (
              <>
                <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                <span>Fire Test Webhook</span>
              </>
            ) : (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span>Routing Payload...</span>
              </>
            )}
          </button>
        </div>

        {/* Right Pane: Visualization & Terminal logs */}
        <div className="lg:col-span-7 p-6 flex flex-col justify-between gap-6 bg-zinc-50/10 dark:bg-black/10">
          <div>
            <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-4.5">
              Live Flow Map
            </label>
            <div className="relative border border-zinc-200 dark:border-zinc-900 bg-white/50 dark:bg-zinc-950/40 p-6 rounded-2xl overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
              
              {/* Visible connection path underneath */}
              <div className="absolute inset-x-12 top-1/2 -translate-y-1/2 h-[2px] bg-zinc-200/60 dark:bg-zinc-900 hidden md:block -z-10" />

              {/* Pulse trail animation on top */}
              {status !== "idle" && status !== "done" && (
                <div className="absolute inset-x-12 top-1/2 -translate-y-1/2 h-[2px] overflow-hidden hidden md:block">
                  <div
                    className="h-full bg-gradient-to-r from-transparent via-sky-400 to-transparent w-24"
                    style={{
                      animation: "flow-pulse 1.8s linear infinite",
                      transform: `translateX(${(progress - 30) * 3.5}px)`
                    }}
                  />
                  <style jsx>{`
                    @keyframes flow-pulse {
                      0% { transform: translateX(-100px); }
                      100% { transform: translateX(300px); }
                    }
                  `}</style>
                </div>
              )}

              {/* Node 1: Gateway */}
              <div
                className={`p-3.5 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 z-10 w-full md:w-32 transition-all ${
                  status === "sending"
                    ? "border-sky-500 bg-sky-500/10 shadow-[0_0_15px_rgba(14,165,233,0.15)] scale-[1.03]"
                    : status !== "idle"
                    ? "border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/2"
                    : "border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950/20"
                }`}
              >
                <Lock className={`w-4 h-4 ${status === "sending" ? "text-sky-400" : status !== "idle" ? "text-emerald-500" : "text-zinc-400 dark:text-zinc-500"}`} />
                <span className="text-xs font-black tracking-tight text-zinc-700 dark:text-zinc-300">GATEWAY</span>
                <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono capitalize font-bold">{provider}</span>
              </div>

              {/* Node 2: Paye Engine */}
              <div
                className={`p-3.5 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 z-10 w-full md:w-36 transition-all ${
                  status === "proxying"
                    ? "border-sky-500 bg-sky-500/10 shadow-[0_0_15px_rgba(14,165,233,0.15)] scale-[1.03]"
                    : status === "delivered" || status === "done"
                    ? "border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_12px_rgba(16,185,129,0.05)]"
                    : "border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950/20"
                }`}
              >
                <Cpu className={`w-4 h-4 ${status === "proxying" ? "text-sky-450 animate-spin" : status === "delivered" || status === "done" ? "text-emerald-500" : "text-zinc-400 dark:text-zinc-500"}`} style={{ animationDuration: "4s" }} />
                <span className="text-xs font-black tracking-tight text-zinc-800 dark:text-zinc-200">PAYE ENGINE</span>
                <span className="text-[9px] font-mono font-bold text-sky-500">
                  {status === "proxying" ? "decrypting..." : status === "delivered" || status === "done" ? "signatures ok" : "waiting..."}
                </span>
              </div>

              {/* Node 3: Target App */}
              <div
                className={`p-3.5 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 z-10 w-full md:w-32 transition-all ${
                  status === "delivered"
                    ? "border-sky-500 bg-sky-500/10 shadow-[0_0_15px_rgba(14,165,233,0.15)] scale-[1.03]"
                    : status === "done"
                    ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)] scale-[1.03]"
                    : "border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950/20"
                }`}
              >
                <Server className={`w-4 h-4 ${status === "delivered" ? "text-sky-400" : status === "done" ? "text-emerald-500" : "text-zinc-400 dark:text-zinc-500"}`} />
                <span className="text-xs font-black tracking-tight text-zinc-700 dark:text-zinc-300">YOUR SERVER</span>
                <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono font-bold">
                  {status === "done" ? "HTTP 200 OK" : status === "delivered" ? "proxying..." : "pending"}
                </span>
              </div>
            </div>
          </div>

          {/* Console logs */}
          <div className="flex-1 flex flex-col bg-[#050507] border border-zinc-200 dark:border-zinc-850 rounded-2xl overflow-hidden font-mono min-h-[180px] shadow-sm select-text">
            <div className="px-4.5 py-2.5 border-b border-zinc-200/10 bg-zinc-900/60 flex items-center justify-between text-[10px] text-zinc-400 font-bold uppercase tracking-wider select-none">
              <span className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                <span>Console Log Output</span>
              </span>
              <span>{progress}% Routed</span>
            </div>
            <div className="p-4 overflow-y-auto flex-1 text-xs leading-relaxed space-y-1.5 max-h-56 no-scrollbar selection:bg-sky-500/25">
              {logs.length === 0 ? (
                <div className="text-zinc-600 dark:text-zinc-500 italic py-2">
                  Waiting for simulation fire. Click "Fire Test Webhook" to begin routing diagnostics...
                </div>
              ) : (
                logs.map((l, i) => {
                  let textClass = "text-zinc-400"
                  if (l.includes("✅") || l.includes("🟢") || l.includes("✨")) {
                    textClass = "text-emerald-450 font-semibold"
                  } else if (l.includes("❌")) {
                    textClass = "text-rose-405 font-bold animate-pulse"
                  } else if (l.includes("📥") || l.includes("🔐") || l.includes("🔍") || l.includes("📤")) {
                    textClass = "text-sky-400"
                  } else if (l.includes("🚀")) {
                    textClass = "text-amber-500 font-bold"
                  }

                  return (
                    <div key={i} className={textClass}>
                      {l}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
