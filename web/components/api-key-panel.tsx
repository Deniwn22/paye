"use client"

import { useState } from "react"
import { Key, Eye, EyeOff, Copy, Check, Terminal, Code, Cpu, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { PAYE_API_URL, BACKEND_URL } from "@/lib/config"

export default function ApiKeyPanel({ apiKey, publicId }: { apiKey: string; publicId: string }) {
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<"curl" | "sdk">("curl")

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    toast.success("Secret API key copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6 w-full text-sm font-sans">
      {/* API Key Panel Card */}
      <div className="p-6 border border-zinc-200 dark:border-[#222] bg-zinc-50 dark:bg-[#111] rounded-lg relative">
        <h2 className="font-bold text-zinc-800 dark:text-slate-200 text-base mb-2 uppercase tracking-wide">Merchant API Key</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">
          Use this secret key to authenticate your server-side requests to Paye. Keep this key safe and do not share it or expose it in client-side code.
        </p>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {/* The Key Value Box */}
            <div className="flex-1 px-4.5 py-3 bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-[#222] font-mono text-base text-sky-700 dark:text-sky-400 select-all truncate rounded-md">
              {showKey ? apiKey : `${apiKey.slice(0, 10)}••••••••••••••••••••••••••••••••`}
            </div>

            {/* Show/Hide Button */}
            <button
              onClick={() => setShowKey(!showKey)}
              className="px-5 py-3 bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-[#222] hover:border-sky-500 text-zinc-700 dark:text-zinc-300 text-base font-bold transition-all cursor-pointer select-none rounded-md flex items-center gap-1.5"
            >
              {showKey ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span>Hide</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span>Reveal</span>
                </>
              )}
            </button>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className={`px-5 py-3 text-base font-bold transition-all border cursor-pointer rounded-md flex items-center gap-1.5 ${
                copied
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  : "bg-sky-500 border-sky-500 hover:bg-sky-400 text-white"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Key</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Integration Code Switcher */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <div>
            <h3 className="font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-sm">Setup Guide</h3>
            <p className="text-xs text-zinc-500 mt-1">Quick guides to add payments on your website.</p>
          </div>
          <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setActiveTab("curl")}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${
                activeTab === "curl" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
              }`}
            >
              Connecting Your Server
            </button>
            <button
              onClick={() => setActiveTab("sdk")}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${
                activeTab === "sdk" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
              }`}
            >
              Adding a Payment Button
            </button>
          </div>
        </div>

        {/* Tab 1: Backend API curl */}
        {activeTab === "curl" && (
          <div className="p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] rounded-xl space-y-4 shadow-sm animate-in fade-in duration-200">
            <div className="space-y-1">
              <span className="text-zinc-800 dark:text-zinc-200 font-bold block">Server Setup</span>
              <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-sm">
                Authenticate payments by sending your secret API key in the <code className="text-zinc-800 dark:text-sky-400 font-mono font-bold bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded">X-Paye-API-Key</code> header of your requests.
              </p>
            </div>

            <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#09090b] rounded-xl overflow-hidden text-sm transition-colors">
              <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-[#18181b]/50 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-mono transition-colors">
                <span>Start Payment Request</span>
                <span>POST /transactions/initialize</span>
              </div>
              <pre className="p-4 overflow-x-auto text-xs font-mono text-zinc-800 dark:text-zinc-100 leading-relaxed select-all">
                <code>
{`curl -X POST "${BACKEND_URL}/transactions/initialize" \\
  -H "X-Paye-API-Key: ${showKey ? apiKey : "paye_live_xxxxxxxxxxxxxxxx"}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 5000,
    "email": "customer@example.com",
    "currency": "NGN",
    "provider": "paystack"
  }'`}
                </code>
              </pre>
            </div>
          </div>
        )}

        {/* Tab 2: Frontend JS SDK */}
        {activeTab === "sdk" && (
          <div className="p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] rounded-xl space-y-4 shadow-sm animate-in fade-in duration-200">
            <div className="space-y-1">
              <span className="text-zinc-800 dark:text-zinc-200 font-bold block text-sm">No-Code Button</span>
              <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-sm">
                Accept payments on your website using our simple button script. This uses your public ID, which is safe to show on your website.
              </p>
            </div>

            <div className="space-y-4">
              <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#09090b] rounded-xl overflow-hidden text-sm transition-colors">
                <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-[#18181b]/50 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-mono transition-colors">
                  <span>1. Copy the Script Tag</span>
                  <span>HTML Header</span>
                </div>
                <pre className="p-4 overflow-x-auto text-xs font-mono text-zinc-800 dark:text-zinc-100 leading-relaxed select-all">
                  <code>
{`<script src="${PAYE_API_URL}/sdk/${publicId || "your_public_id"}.js"></script>`}
                  </code>
                </pre>
              </div>

              <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#09090b] rounded-xl overflow-hidden text-sm transition-colors">
                <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-[#18181b]/50 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-mono transition-colors">
                  <span>2. Add the Payment Button Target</span>
                  <span>HTML Button</span>
                </div>
                <pre className="p-4 overflow-x-auto text-xs font-mono text-zinc-800 dark:text-zinc-100 leading-relaxed select-all">
                  <code>
{`<div data-paye-checkout 
     data-amount="5000" 
     data-email="customer@email.com"
     data-button-text="Pay Now"
     data-currency="NGN">
</div>`}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
