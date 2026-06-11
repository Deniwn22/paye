"use client"

import { useState } from "react"
import { Copy, Check, Sparkles, Terminal, Cpu, Settings2 } from "lucide-react"

interface AiPromptPanelProps {
  apiKey: string
  publicId: string
  payeApiUrl: string
  projectName: string
}

type PromptType = "fullstack" | "frontend" | "backend"

export default function AiPromptPanel({
  apiKey,
  publicId,
  payeApiUrl,
  projectName,
}: AiPromptPanelProps) {
  const [promptType, setPromptType] = useState<PromptType>("fullstack")
  const [amount, setAmount] = useState<string>("5000")
  const [email, setEmail] = useState<string>("customer@email.com")
  const [currency, setCurrency] = useState<string>("NGN")
  const [copied, setCopied] = useState<boolean>(false)

  // Standard helper to calculate minor units for standard currencies
  const getMinorUnitAmount = (amtStr: string, curr: string) => {
    const parsed = parseFloat(amtStr) || 0
    // Zero decimals or non-standard currencies might differ, but normally NGN/USD/ZAR/GHS use 100x minor units
    return Math.round(parsed * 100).toString()
  }

  const minorAmount = getMinorUnitAmount(amount, currency)

  const getPromptText = () => {
    switch (promptType) {
      case "fullstack":
        return `You are an expert developer helping me integrate Paye (a unified API for African payment gateways like Paystack and Flutterwave) into my application.

Use the following merchant settings for the active workspace:
- Project Name: ${projectName}
- Public ID: ${publicId}
- Secret API Key: ${apiKey}
- Paye API base URL: ${payeApiUrl}
- Paye SDK URL: ${payeApiUrl}/sdk/${publicId}.js

We need to implement a payment checkout button on the frontend that loads the JS SDK and triggers the payment overlay, and a verification logic on the backend that handles payment completion.

Please write:
1. HTML/JS frontend code to inject the Paye SDK:
   <script src="${payeApiUrl}/sdk/${publicId}.js"></script>

2. A trigger function that calls the checkout overlay:
   window.Paye.pay({
     type: "payment",
     amount: ${minorAmount}, // amount in minor unit (${minorAmount} kobo/cents for ${amount} ${currency})
     email: "${email}",
     currency: "${currency}",
     onSuccess: function(reference) {
       // Call backend verification endpoint with this reference
       console.log("Payment completed! Reference: " + reference);
     },
     onFailure: function(err) {
       console.error("Payment failed: ", err);
     }
   });

3. A backend route handler (Node.js/Express, Go, or Python) to verify the transaction status:
   - Call Paye API endpoint: GET ${payeApiUrl}/api/v1/transactions/verify/<reference>
   - Authenticate backend requests with the header: X-Paye-API-Key: ${apiKey}
   - Verify transaction status returned is "success" and amount matches before updating the user's account.

Please write clean, secure, and production-ready code blocks for both frontend and backend.`

      case "frontend":
        return `You are an expert frontend developer helping me integrate Paye's payment overlay into my web application.

Use the following merchant credentials:
- Public ID: ${publicId}
- Paye SDK URL: ${payeApiUrl}/sdk/${publicId}.js

Please write a clean frontend component (e.g. React/Next.js or Vanilla HTML/JS) that:
1. Loads the Paye SDK script from the URL: ${payeApiUrl}/sdk/${publicId}.js
2. Implements a payment checkout button.
3. On button click, triggers the payment popup using:
   window.Paye.pay({
     type: "payment",
     amount: ${minorAmount}, // minor unit
     email: "${email}",
     currency: "${currency}",
     onSuccess: function(reference) {
       console.log("Success: " + reference);
     },
     onFailure: function(error) {
       console.error("Error: " + error);
     }
   });

Make sure the UI for the button is modern, responsive, and fits perfectly in a standard web form.`

      case "backend":
        return `You are an expert backend engineer helping me write payment verification and webhook integration logic for Paye.

Use the following merchant credentials:
- Secret API Key: ${apiKey}
- Paye API base URL: ${payeApiUrl}

Please write:
1. A backend endpoint/controller in my server framework of choice (Node/Express, Python/FastAPI, or Go) to verify the status of a payment session:
   - Call the Paye API: GET ${payeApiUrl}/api/v1/transactions/verify/<reference>
   - Inject the authentication header: X-Paye-API-Key: ${apiKey}
   - Check if response status is true and data.status is "success".
2. A secure webhook receiver endpoint at '/webhooks/paye' to handle push notifications from Paye. Webhooks are sent as POST requests with the JSON payload. Ensure we return a 200 OK response.

Make sure the code is secure, includes error handling, and logs validation failures safely.`
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(getPromptText())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Parameters Panel */}
      <div className="space-y-5 lg:col-span-4">
        {/* Customization Settings Card */}
        <div className="rounded-xl border-[0.5px] border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <Settings2 className="h-4 w-4 text-[#2563eb] dark:text-[#3b82f6]" />
            <span>Customize Prompt</span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-zinc-500 dark:text-zinc-400">
                Payment Amount (Standard Unit)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full rounded-lg border-[0.5px] border-border bg-background px-3 py-2 text-foreground outline-none focus:border-[#2563eb]"
              />
              <span className="block text-[10px] text-zinc-400">
                Converted to minor units: <span className="font-mono text-foreground font-bold">{minorAmount}</span>
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-zinc-500 dark:text-zinc-400">
                Customer Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@email.com"
                className="w-full rounded-lg border-[0.5px] border-border bg-background px-3 py-2 text-foreground outline-none focus:border-[#2563eb]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-zinc-500 dark:text-zinc-400">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-lg border-[0.5px] border-border bg-background px-3 py-2 text-foreground outline-none focus:border-[#2563eb]"
              >
                <option value="NGN">NGN (Nigerian Naira)</option>
                <option value="GHS">GHS (Ghanaian Cedi)</option>
                <option value="ZAR">ZAR (South African Rand)</option>
                <option value="KES">KES (Kenyan Shilling)</option>
                <option value="USD">USD (US Dollar)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Info Tip Card */}
        <div className="rounded-xl border-[0.5px] border-border bg-secondary p-5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-[#2563eb] dark:text-[#3b82f6]" />
            <span>How to use</span>
          </div>
          <p>
            1. Select a prompt template matching your integration target.
          </p>
          <p>
            2. Copy the prompt and paste it directly into your AI chat assistant (Claude, Gemini, etc.).
          </p>
          <p>
            3. The AI will write the integration code directly using your active credentials.
          </p>
        </div>
      </div>

      {/* Code Viewer Panel */}
      <div className="space-y-4 lg:col-span-8">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 border-b border-border pb-1">
          {[
            { id: "fullstack", label: "Full Stack", icon: Cpu },
            { id: "frontend", label: "Frontend SDK", icon: Terminal },
            { id: "backend", label: "Backend API", icon: Terminal },
          ].map((tab) => {
            const Icon = tab.icon
            const isSel = promptType === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setPromptType(tab.id as PromptType)}
                className={`flex items-center gap-1.5 rounded-t-lg px-4 py-2 text-xs font-semibold transition-colors cursor-pointer border-b-2 -mb-[5px] ${
                  isSel
                    ? "border-[#2563eb] text-[#2563eb] dark:border-[#3b82f6] dark:text-[#3b82f6]"
                    : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Prompt Card */}
        <div className="relative rounded-xl border-[0.5px] border-border bg-secondary overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/60 bg-zinc-50 dark:bg-zinc-900/50 px-4 py-2.5">
            <span className="text-[10px] font-bold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase select-none font-mono">
              SYSTEM PROMPT TEMPLATE ({promptType.toUpperCase()})
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 cursor-pointer rounded-md border-[0.5px] border-border bg-background px-2.5 py-1 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:border-[#2563eb] hover:text-zinc-800 dark:hover:text-white transition-all active:scale-[0.98]"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-500">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Prompt</span>
                </>
              )}
            </button>
          </div>

          <div className="p-5 font-mono text-[12px] leading-relaxed text-zinc-850 dark:text-zinc-300 max-h-[460px] overflow-y-auto whitespace-pre-wrap select-text">
            {getPromptText()}
          </div>
        </div>
      </div>
    </div>
  )
}
