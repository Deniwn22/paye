"use client"

import { useState } from "react"
import {
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  Terminal,
  Code,
  Cpu,
  ShieldCheck,
  Server,
  Calendar,
  Undo2,
  ArrowRightLeft,
} from "lucide-react"
import { toast } from "sonner"
import { PAYE_API_URL, BACKEND_URL } from "@/lib/config"

export default function ApiKeyPanel({ apiKey, publicId }: { apiKey: string; publicId: string }) {
  const [showKey, setShowKey] = useState(false)
  const [activeTab, setActiveTab] = useState<"curl" | "sdk">("sdk")
  const [sdkButtonType, setSdkButtonType] = useState<"payment" | "subscription">("payment")
  const [serverGuideTab, setServerGuideTab] = useState<"refunds" | "transfers" | "billing">("refunds")
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({})

  const handleCopyToClipboard = (text: string, id: string, message: string) => {
    navigator.clipboard.writeText(text)
    setCopiedStates((prev) => ({ ...prev, [id]: true }))
    toast.success(message)
    setTimeout(() => {
      setCopiedStates((prev) => ({ ...prev, [id]: false }))
    }, 2000)
  }

  const scriptCode = `<script src="${PAYE_API_URL}/sdk/${publicId || "your_public_id"}.js"></script>`

  const buttonCode = sdkButtonType === "payment"
    ? `<div data-paye-checkout 
     data-amount="5000" 
     data-email="customer@email.com"
     data-button-text="Pay Now"
     data-currency="NGN">
</div>`
    : `<div data-paye-checkout 
     data-type="subscription"
     data-plan-id="PLN_YOUR_PLAN_CODE"
     data-email="customer@email.com"
     data-button-text="Subscribe Now">
</div>`

  const curlInitializeCode = `curl -X POST "${BACKEND_URL}/api/v1/transactions/initialize" \\
  -H "X-Paye-API-Key: ${showKey ? apiKey : "paye_live_xxxxxxxxxxxxxxxx"}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 5000,
    "email": "customer@example.com",
    "currency": "NGN",
    "provider": "paystack"
  }'`

  const refundCurlCode = `curl -X POST "${BACKEND_URL}/api/v1/refund" \\
  -H "X-Paye-API-Key: ${showKey ? apiKey : "paye_live_xxxxxxxxxxxxxxxx"}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "transaction_reference": "paye_ref_9999",
    "amount": 5000,
    "customer_note": "Customer request",
    "merchant_note": "Internal refund authorization"
  }'`

  const recipientCurlCode = `curl -X POST "${BACKEND_URL}/api/v1/recipients" \\
  -H "X-Paye-API-Key: ${showKey ? apiKey : "paye_live_xxxxxxxxxxxxxxxx"}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Jane Doe",
    "account_number": "0123456789",
    "bank_code": "058",
    "currency": "NGN"
  }'`

  const transferCurlCode = `curl -X POST "${BACKEND_URL}/api/v1/transfers" \\
  -H "X-Paye-API-Key: ${showKey ? apiKey : "paye_live_xxxxxxxxxxxxxxxx"}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 25000,
    "recipient_code": "RCP_xxxxxxxx",
    "reason": "Consulting Payout",
    "currency": "NGN"
  }'`

  const planCurlCode = `curl -X POST "${BACKEND_URL}/api/v1/plans" \\
  -H "X-Paye-API-Key: ${showKey ? apiKey : "paye_live_xxxxxxxxxxxxxxxx"}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Gold Weekly Plan",
    "interval": "weekly",
    "amount": 5000,
    "currency": "NGN",
    "description": "Weekly Premium Access"
  }'`

  const subscriptionCurlCode = `curl -X POST "${BACKEND_URL}/api/v1/subscriptions" \\
  -H "X-Paye-API-Key: ${showKey ? apiKey : "paye_live_xxxxxxxxxxxxxxxx"}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "customer_email": "subscriber@example.com",
    "plan_code": "PLN_xxxxxxxx"
  }'`

  return (
    <div className="space-y-8 w-full text-sm font-sans">
      {/* API Key Panel Card */}
      <div className="p-6 border border-zinc-200 dark:border-[#222] bg-zinc-50 dark:bg-[#111] rounded-lg relative">
        <h2 className="font-bold text-zinc-800 dark:text-slate-200 text-base mb-2 uppercase tracking-wide flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-sky-500" />
          <span>Merchant API Key</span>
        </h2>
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
              onClick={() => handleCopyToClipboard(apiKey, "apiKey", "Secret API key copied to clipboard")}
              className={`px-5 py-3 text-base font-bold transition-all border cursor-pointer rounded-md flex items-center gap-1.5 ${
                copiedStates["apiKey"]
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  : "bg-sky-500 border-sky-500 hover:bg-sky-400 text-white"
              }`}
            >
              {copiedStates["apiKey"] ? (
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
            <h3 className="font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-sm">Frontend Checkout Integration</h3>
            <p className="text-xs text-zinc-500 mt-1">Quick guides to add payment flows to your website.</p>
          </div>
          <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setActiveTab("sdk")}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${
                activeTab === "sdk" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
              }`}
            >
              Adding a Payment Button
            </button>
            <button
              onClick={() => setActiveTab("curl")}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${
                activeTab === "curl" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
              }`}
            >
              Connecting Your Server
            </button>
          </div>
        </div>

        {/* Tab 1: Backend API curl */}
        {activeTab === "curl" && (
          <div className="p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] rounded-xl space-y-4 shadow-sm animate-in fade-in duration-200">
            <div className="space-y-1">
              <span className="text-zinc-800 dark:text-zinc-200 font-bold block">Server Transaction Initialization</span>
              <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-sm">
                Authenticate server-side transactions by sending your secret API key in the <code className="text-zinc-800 dark:text-sky-400 font-mono font-bold bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded">X-Paye-API-Key</code> header of your requests.
              </p>
            </div>

            <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#09090b] rounded-xl overflow-hidden text-sm transition-colors">
              <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-[#18181b]/50 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-mono transition-colors">
                <span>POST /api/v1/transactions/initialize</span>
                <button
                  onClick={() => handleCopyToClipboard(curlInitializeCode, "curlInit", "Curl snippet copied")}
                  className="flex items-center gap-1 hover:text-sky-500 dark:hover:text-sky-400 cursor-pointer font-sans"
                >
                  {copiedStates["curlInit"] ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span className="text-emerald-500">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-xs font-mono text-zinc-800 dark:text-zinc-100 leading-relaxed select-all">
                <code>{curlInitializeCode}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Tab 2: Frontend JS SDK */}
        {activeTab === "sdk" && (
          <div className="p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] rounded-xl space-y-5 shadow-sm animate-in fade-in duration-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-zinc-800 dark:text-zinc-200 font-bold block text-sm">No-Code Button Script</span>
                <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-sm">
                  Accept payments on your website using our simple button script. This uses your public ID, which is safe to show in client-side HTML.
                </p>
              </div>

              {/* Selector for payment type */}
              <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 max-w-fit self-start md:self-auto">
                <button
                  onClick={() => setSdkButtonType("payment")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    sdkButtonType === "payment" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
                  }`}
                >
                  One-Time Payment
                </button>
                <button
                  onClick={() => setSdkButtonType("subscription")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    sdkButtonType === "subscription" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
                  }`}
                >
                  Subscription Payment
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#09090b] rounded-xl overflow-hidden text-sm transition-colors">
                <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-[#18181b]/50 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-mono transition-colors">
                  <span>1. Copy the Script Tag (Add inside your HTML head or body)</span>
                  <button
                    onClick={() => handleCopyToClipboard(scriptCode, "script", "Script tag copied")}
                    className="flex items-center gap-1 hover:text-sky-500 dark:hover:text-sky-400 cursor-pointer font-sans"
                  >
                    {copiedStates["script"] ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto text-xs font-mono text-zinc-800 dark:text-zinc-100 leading-relaxed select-all">
                  <code>{scriptCode}</code>
                </pre>
              </div>

              <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#09090b] rounded-xl overflow-hidden text-sm transition-colors">
                <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-[#18181b]/50 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-mono transition-colors">
                  <span>2. Add the Payment Button Target Element</span>
                  <button
                    onClick={() => handleCopyToClipboard(buttonCode, "button", "Checkout snippet copied")}
                    className="flex items-center gap-1 hover:text-sky-500 dark:hover:text-sky-400 cursor-pointer font-sans"
                  >
                    {copiedStates["button"] ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto text-xs font-mono text-zinc-800 dark:text-zinc-100 leading-relaxed select-all">
                  <code>{buttonCode}</code>
                </pre>
              </div>

              {sdkButtonType === "subscription" && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-600 dark:text-amber-400">
                  <strong>Important:</strong> Subscription buttons require a valid plan code. Make sure to replace <code>PLN_YOUR_PLAN_CODE</code> with an active plan code created via the Billing dashboard or the Plans API.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Server-Side Operations Guide */}
      <div className="p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] rounded-xl space-y-6 shadow-sm">
        <div className="flex items-center gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="p-2.5 bg-sky-500/10 rounded-lg text-sky-500">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-800 dark:text-slate-200 text-base">Server-to-Server API Guide</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Securely manage refunds, transfers, and recurring billing directly from your backend server.</p>
          </div>
        </div>

        {/* Guide Tabs */}
        <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 max-w-fit">
          <button
            onClick={() => setServerGuideTab("refunds")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              serverGuideTab === "refunds" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
            }`}
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Refunds</span>
          </button>
          <button
            onClick={() => setServerGuideTab("transfers")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              serverGuideTab === "transfers" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Transfers (Payouts)</span>
          </button>
          <button
            onClick={() => setServerGuideTab("billing")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              serverGuideTab === "billing" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Plans & Subscriptions</span>
          </button>
        </div>

        {/* Refunds Section */}
        {serverGuideTab === "refunds" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="space-y-1">
              <span className="text-zinc-800 dark:text-zinc-200 font-bold block text-sm">Issue refunds for customer charges</span>
              <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-sm">
                Process full or partial refunds directly using the transaction reference. Always keep this logic on your secure backend server.
              </p>
            </div>

            <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#09090b] rounded-xl overflow-hidden text-sm">
              <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-[#18181b]/50 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                <span>POST /api/v1/refund</span>
                <button
                  onClick={() => handleCopyToClipboard(refundCurlCode, "refundCurl", "Refund snippet copied")}
                  className="flex items-center gap-1 hover:text-sky-500 dark:hover:text-sky-400 cursor-pointer font-sans"
                >
                  {copiedStates["refundCurl"] ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span className="text-emerald-500">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-xs font-mono text-zinc-800 dark:text-zinc-100 leading-relaxed select-all">
                <code>{refundCurlCode}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Transfers Section */}
        {serverGuideTab === "transfers" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="space-y-1">
              <span className="text-zinc-800 dark:text-zinc-200 font-bold block text-sm">Initiate payouts to vendors and customers</span>
              <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-sm">
                To issue payouts, first create a transfer recipient with account details, and then call the transfer endpoint.
              </p>
            </div>

            <div className="space-y-4">
              <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#09090b] rounded-xl overflow-hidden text-sm">
                <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-[#18181b]/50 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                  <span>1. Create Recipient: POST /api/v1/recipients</span>
                  <button
                    onClick={() => handleCopyToClipboard(recipientCurlCode, "recipientCurl", "Recipient snippet copied")}
                    className="flex items-center gap-1 hover:text-sky-500 dark:hover:text-sky-400 cursor-pointer font-sans"
                  >
                    {copiedStates["recipientCurl"] ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto text-xs font-mono text-zinc-800 dark:text-zinc-100 leading-relaxed select-all">
                  <code>{recipientCurlCode}</code>
                </pre>
              </div>

              <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#09090b] rounded-xl overflow-hidden text-sm">
                <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-[#18181b]/50 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                  <span>2. Initiate Transfer: POST /api/v1/transfers</span>
                  <button
                    onClick={() => handleCopyToClipboard(transferCurlCode, "transferCurl", "Transfer snippet copied")}
                    className="flex items-center gap-1 hover:text-sky-500 dark:hover:text-sky-400 cursor-pointer font-sans"
                  >
                    {copiedStates["transferCurl"] ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto text-xs font-mono text-zinc-800 dark:text-zinc-100 leading-relaxed select-all">
                  <code>{transferCurlCode}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Plans & Subscriptions Section */}
        {serverGuideTab === "billing" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="space-y-1">
              <span className="text-zinc-800 dark:text-zinc-200 font-bold block text-sm">Manage subscription billing</span>
              <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-sm">
                Create recurrent subscription plans and register customers to them. Once registered, billing cycles are automated.
              </p>
            </div>

            <div className="space-y-4">
              <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#09090b] rounded-xl overflow-hidden text-sm">
                <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-[#18181b]/50 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                  <span>1. Create Billing Plan: POST /api/v1/plans</span>
                  <button
                    onClick={() => handleCopyToClipboard(planCurlCode, "planCurl", "Plan snippet copied")}
                    className="flex items-center gap-1 hover:text-sky-500 dark:hover:text-sky-400 cursor-pointer font-sans"
                  >
                    {copiedStates["planCurl"] ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto text-xs font-mono text-zinc-800 dark:text-zinc-100 leading-relaxed select-all">
                  <code>{planCurlCode}</code>
                </pre>
              </div>

              <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#09090b] rounded-xl overflow-hidden text-sm">
                <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-[#18181b]/50 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                  <span>2. Create Customer Subscription: POST /api/v1/subscriptions</span>
                  <button
                    onClick={() => handleCopyToClipboard(subscriptionCurlCode, "subCurl", "Subscription snippet copied")}
                    className="flex items-center gap-1 hover:text-sky-500 dark:hover:text-sky-400 cursor-pointer font-sans"
                  >
                    {copiedStates["subCurl"] ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto text-xs font-mono text-zinc-800 dark:text-zinc-100 leading-relaxed select-all">
                  <code>{subscriptionCurlCode}</code>
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
