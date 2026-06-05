"use client"

import { useState } from "react"
import { Terminal, Copy, Check, Code } from "lucide-react"
import { toast } from "sonner"

interface CodeSnippet {
  title: string
  lang: string
  code: string
}

const SNIPPETS: Record<string, CodeSnippet> = {
  bash: {
    title: "cURL API",
    lang: "bash",
    code: `curl -X POST "https://paye.ng/api/v1/transactions/initialize" \\
  -H "X-Paye-API-Key: paye_live_6f8g2j10...a82b" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 10000,
    "email": "customer@example.com",
    "currency": "NGN",
    "provider": "paystack"
  }'`
  },
  js: {
    title: "JS Checkout Embed",
    lang: "html",
    code: `<!-- 1. Include the lightweight script -->
<script src="https://paye.ng/sdk/paye_pub_merchant_8812a.js"></script>

<!-- 2. Mount the secure checkout button -->
<div data-paye-checkout
     data-amount="10000"
     data-email="customer@example.com"
     data-currency="NGN"
     data-button-text="Pay Securely">
</div>`
  },
  node: {
    title: "Node.js (Backend)",
    lang: "javascript",
    code: `const fetch = require('node-fetch');

async function initializePayment() {
  const response = await fetch('https://paye.ng/api/v1/transactions/initialize', {
    method: 'POST',
    headers: {
      'X-Paye-API-Key': 'paye_live_6f8g2j10...a82b',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: 10000,
      email: 'customer@example.com',
      currency: 'NGN',
      provider: 'paystack'
    })
  });
  
  const result = await response.json();
  console.log('Payment URL initialized:', result.data.authorization_url);
}`
  }
}

export default function CodeVisualizer() {
  const [activeTab, setActiveTab] = useState<string>("bash")
  const [copied, setCopied] = useState<boolean>(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(SNIPPETS[activeTab].code)
    setCopied(true)
    toast.success(`${SNIPPETS[activeTab].title} integration template copied`)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm transition-colors">
      {/* Tab bar header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-200/30 dark:bg-zinc-950/30 transition-colors">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {Object.entries(SNIPPETS).map(([key, snippet]) => (
            <button
              key={key}
              onClick={() => {
                setActiveTab(key)
                setCopied(false)
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === key
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              {snippet.title}
            </button>
          ))}
        </div>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer"
          title="Copy to clipboard"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Code body */}
      <div className="p-5 font-mono text-[11px] leading-relaxed overflow-x-auto text-zinc-800 dark:text-zinc-100 select-all max-h-[300px]">
        <pre>
          <code>
            {SNIPPETS[activeTab].code}
          </code>
        </pre>
      </div>
    </div>
  )
}
