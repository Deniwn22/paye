"use client"

import { useState, useEffect } from "react"
import { Play, RotateCw, CheckCircle, ShieldAlert, Cpu, Terminal, ArrowRight, Lock, Server, Sparkles } from "lucide-react"

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
      alert("Invalid JSON payload. Please correct it before simulating.")
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
    <div className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <span className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-xs text-zinc-500 font-mono ml-3">live_proxy_simulator.sh</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Proxy Sandbox Active
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800">
        {/* Left pane: Controls */}
        <div className="lg:col-span-5 p-6 bg-zinc-950 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">
                1. Select Gateway
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setProvider("paystack")}
                  className={`px-3 py-2 text-sm font-semibold rounded-lg border transition-all ${
                    provider === "paystack"
                      ? "border-sky-500 bg-sky-500/10 text-sky-400"
                      : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  Paystack
                </button>
                <button
                  onClick={() => setProvider("flutterwave")}
                  className={`px-3 py-2 text-sm font-semibold rounded-lg border transition-all ${
                    provider === "flutterwave"
                      ? "border-sky-500 bg-sky-500/10 text-sky-400"
                      : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  Flutterwave
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">
                2. Choose Event Type
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg text-sm font-medium focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                {Object.keys(TEMPLATES[provider]).map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  3. Customize JSON Payload
                </label>
                <span className="text-[10px] text-zinc-600 font-mono">Editable</span>
              </div>
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                rows={10}
                className="w-full p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-lg font-mono text-xs text-sky-400/90 focus:outline-none focus:border-sky-500 leading-relaxed resize-none transition-all selection:bg-sky-500/20"
              />
            </div>
          </div>

          <button
            onClick={handleSimulate}
            disabled={status !== "idle" && status !== "done"}
            className="w-full py-3.5 bg-sky-500 hover:bg-sky-400 disabled:bg-zinc-800 text-black disabled:text-zinc-500 text-sm font-extrabold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer select-none"
          >
            {status === "idle" || status === "done" ? (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Fire Test Webhook</span>
              </>
            ) : (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Routing Payload...</span>
              </>
            )}
          </button>
        </div>

        {/* Right pane: Visualization & Terminal logs */}
        <div className="lg:col-span-7 bg-zinc-950 p-6 flex flex-col justify-between gap-6">
                <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-4">
              Live Flow Map
            </label>
            <div className="relative border border-zinc-900 bg-zinc-950/80 p-6 rounded-xl overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Pulse trail background */}
              {status !== "idle" && status !== "done" && (
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] overflow-hidden hidden md:block">
                  <div
                    className="h-full bg-gradient-to-r from-transparent via-sky-400 to-transparent w-32 animate-pulse"
                    style={{
                      animationDuration: "1.5s",
                      animationIterationCount: "infinite",
                      animationTimingFunction: "linear",
                      transform: `translateX(${(progress - 30) * 4}px)`
                    }}
                  />
                </div>
              )}

              {/* Node 1: Gateway */}
              <div
                className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center gap-2 z-10 w-full md:w-32 transition-all ${
                  status === "sending"
                    ? "border-sky-500 bg-sky-950/20 shadow-[0_0_15px_rgba(14,165,233,0.15)] scale-105"
                    : status !== "idle"
                    ? "border-emerald-500/50 bg-emerald-950/5"
                    : "border-zinc-800 bg-zinc-900/20"
                }`}
              >
                <Lock className={`w-5 h-5 ${status === "sending" ? "text-sky-400" : status !== "idle" ? "text-emerald-400" : "text-zinc-500"}`} />
                <span className="text-xs font-bold tracking-tight text-zinc-300">GATEWAY</span>
                <span className="text-[10px] text-zinc-500 font-mono capitalize">{provider}</span>
              </div>

              {/* Arrow 1 */}
              <div className="text-zinc-700 hidden md:block">
                <ArrowRight className={`w-5 h-5 ${status === "sending" || status === "proxying" ? "text-sky-400 animate-pulse" : status === "delivered" || status === "done" ? "text-emerald-400" : "text-zinc-800"}`} />
              </div>

              {/* Node 2: Paye Engine */}
              <div
                className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center gap-2 z-10 w-full md:w-40 transition-all ${
                  status === "proxying"
                    ? "border-sky-500 bg-sky-950/20 shadow-[0_0_15px_rgba(14,165,233,0.15)] scale-105"
                    : status === "delivered" || status === "done"
                    ? "border-emerald-500 bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                    : "border-zinc-800 bg-zinc-900/20"
                }`}
              >
                <Cpu className={`w-5 h-5 ${status === "proxying" ? "text-sky-400 animate-spin" : status === "delivered" || status === "done" ? "text-emerald-400" : "text-zinc-500"}`} style={{ animationDuration: "3s" }} />
                <span className="text-xs font-bold tracking-tight text-zinc-200">PAYE PROXY</span>
                <span className="text-[10px] font-mono text-sky-400">
                  {status === "proxying" ? "decrypting..." : status === "delivered" || status === "done" ? "signatures ok" : "idle"}
                </span>
              </div>

              {/* Arrow 2 */}
              <div className="text-zinc-700 hidden md:block">
                <ArrowRight className={`w-5 h-5 ${status === "proxying" || status === "delivered" ? "text-sky-400 animate-pulse" : status === "done" ? "text-emerald-400" : "text-zinc-800"}`} />
              </div>

              {/* Node 3: Target App */}
              <div
                className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center gap-2 z-10 w-full md:w-32 transition-all ${
                  status === "delivered"
                    ? "border-sky-500 bg-sky-950/20 shadow-[0_0_15px_rgba(14,165,233,0.15)] scale-105"
                    : status === "done"
                    ? "border-emerald-500 bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] scale-105"
                    : "border-zinc-800 bg-zinc-900/20"
                }`}
              >
                <Server className={`w-5 h-5 ${status === "delivered" ? "text-sky-400" : status === "done" ? "text-emerald-400" : "text-zinc-500"}`} />
                <span className="text-xs font-bold tracking-tight text-zinc-300">YOUR SERVER</span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {status === "done" ? "HTTP 200 OK" : status === "delivered" ? "forwarding..." : "pending"}
                </span>
              </div>
            </div>
          </div>

          {/* Console logs */}
          <div className="flex-1 flex flex-col bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden font-mono min-h-[160px]">
            <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between text-xs text-zinc-500">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                <span>Console Log Output</span>
              </span>
              <span>{progress}% Routed</span>
            </div>
            <div className="p-4 overflow-y-auto flex-1 text-xs leading-relaxed space-y-1.5 max-h-56 no-scrollbar selection:bg-sky-500/25 select-text">
              {logs.length === 0 ? (
                <div className="text-zinc-600 italic py-2">Waiting for simulation fire. Click "Fire Test Webhook" to begin routing diagnostics...</div>
              ) : (
                logs.map((l, i) => {
                  let textClass = "text-zinc-400"
                  if (l.includes("✅") || l.includes("🟢") || l.includes("✨")) {
                    textClass = "text-emerald-400"
                  } else if (l.includes("📥") || l.includes("🔐") || l.includes("🔍") || l.includes("📤")) {
                    textClass = "text-sky-400"
                  } else if (l.includes("🚀")) {
                    textClass = "text-amber-400"
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
