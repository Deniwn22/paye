"use client"

import Link from "next/link"
import { useState } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { ArrowLeft, BookOpen, Zap, Settings, ShieldCheck, Copy, Check } from "lucide-react"

export default function DocsPage() {
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(id)
    setTimeout(() => setCopiedText(null), 2000)
  }

  const scriptSnippet = `<script src="http://localhost:8080/sdk/your_merchant_public_id.js"></script>`
  const containerSnippet = `<div data-paye-checkout 
     data-amount="5000" 
     data-email="customer@email.com">
</div>`
  const dynamicSnippet = `<input type="email" id="customer-email" placeholder="customer@example.com">
<span id="cart-total">₦12,500.00</span>

<!-- Paye Checkout Widget -->
<div data-paye-checkout 
     data-email-source="#customer-email"
     data-amount-source="#cart-total"
     data-button-text="Proceed to Payment">
</div>`
  const sdkSnippet = `window.Paye.pay({
  amount: 7500,
  email: "buyer@example.com",
  currency: "NGN",
  onSuccess: function(reference) {
    console.log("Payment successful! Reference: " + reference);
  },
  onFailure: function(error) {
    console.error("Payment failed: " + error);
  }
});`

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-zinc-900 dark:text-[#f5f5f5] font-sans transition-colors duration-200">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-[#222] bg-white dark:bg-[#0a0a0a] sticky top-0 z-50 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <span className="w-6 h-6 bg-sky-500 text-black flex items-center justify-center font-bold text-xs rounded-md">
                P
              </span>
            </Link>
            <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-white">Paye Docs</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Docs Body Layout */}
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Nav */}
        <aside className="lg:col-span-3 lg:sticky lg:top-24 h-fit space-y-6 text-sm">
          <div className="space-y-2">
            <h4 className="font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-600 text-xs">Integration guides</h4>
            <nav className="flex flex-col gap-1">
              <a href="#no-code" className="px-3 py-2 rounded-md hover:bg-zinc-100 dark:hover:bg-[#111] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-medium transition-all">
                Zero-Code Setup (Bloggers)
              </a>
              <a href="#dynamic-binding" className="px-3 py-2 rounded-md hover:bg-zinc-100 dark:hover:bg-[#111] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-medium transition-all">
                Dynamic Form Binding
              </a>
              <a href="#developer-sdk" className="px-3 py-2 rounded-md hover:bg-zinc-100 dark:hover:bg-[#111] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-medium transition-all">
                JavaScript SDK Trigger
              </a>
            </nav>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-600 text-xs">Reference</h4>
            <nav className="flex flex-col gap-1">
              <Link href="/signin" className="px-3 py-2 rounded-md hover:bg-zinc-100 dark:hover:bg-[#111] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-medium transition-all">
                Merchant Dashboard
              </Link>
              <a href="#support" className="px-3 py-2 rounded-md hover:bg-zinc-100 dark:hover:bg-[#111] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-medium transition-all">
                Contact & Support
              </a>
            </nav>
          </div>
        </aside>

        {/* Documentation Content */}
        <main className="lg:col-span-9 space-y-12 max-w-3xl">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
              Integration Guide
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mt-2">
              Paye allows you to add payment checkouts to any website instantly. Whether you are running a WordPress blog, a Webflow portfolio, or a custom landing page, you can accept credit cards and bank transfers with zero code.
            </p>
          </div>

          {/* Section 1: Zero-Code Setup */}
          <section id="no-code" className="scroll-mt-20 space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-[#222] pb-2">
              <Zap className="w-5 h-5 text-sky-500" />
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Zero-Code Setup (Bloggers & Creators)</h2>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              If you want to place a simple payment button on your website (e.g. for donations, single product checkouts, or invoices) without writing code, follow these steps:
            </p>
            
            <div className="space-y-5 text-sm">
              {/* Step 1 */}
              <div className="space-y-1.5">
                <h4 className="font-semibold text-zinc-800 dark:text-white">Step 1: Copy your script tag</h4>
                <p className="text-zinc-500 dark:text-zinc-400">
                  Retrieve your unique script URL from your Paye Dashboard (under the <strong>API Keys</strong> tab) and paste it into the footer or header of your page:
                </p>
                <div className="relative border border-zinc-200 dark:border-[#222] bg-zinc-50 dark:bg-[#111] rounded-lg overflow-hidden mt-2">
                  <pre className="p-4 overflow-x-auto font-mono text-xs text-sky-600 dark:text-sky-400">
                    <code>{scriptSnippet}</code>
                  </pre>
                  <button
                    onClick={() => handleCopy(scriptSnippet, 'script')}
                    className="absolute top-3 right-3 p-1.5 border border-zinc-200 dark:border-[#333] hover:border-sky-500 text-zinc-500 hover:text-zinc-800 dark:hover:text-white rounded bg-white dark:bg-[#0a0a0a] transition-all cursor-pointer"
                  >
                    {copiedText === 'script' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Step 2 */}
              <div className="space-y-1.5">
                <h4 className="font-semibold text-zinc-800 dark:text-white">Step 2: Place checkout target anywhere</h4>
                <p className="text-zinc-500 dark:text-zinc-400">
                  Place this simple HTML element where you want the checkout button to appear. Set the amount, customer email, and custom currency/button text:
                </p>
                <div className="relative border border-zinc-200 dark:border-[#222] bg-zinc-50 dark:bg-[#111] rounded-lg overflow-hidden mt-2">
                  <pre className="p-4 overflow-x-auto font-mono text-xs text-sky-600 dark:text-sky-400">
                    <code>{containerSnippet}</code>
                  </pre>
                  <button
                    onClick={() => handleCopy(containerSnippet, 'container')}
                    className="absolute top-3 right-3 p-1.5 border border-zinc-200 dark:border-[#333] hover:border-sky-500 text-zinc-500 hover:text-zinc-800 dark:hover:text-white rounded bg-white dark:bg-[#0a0a0a] transition-all cursor-pointer"
                  >
                    {copiedText === 'container' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </section>          {/* Section 2: Dynamic Form Binding */}
          <section id="dynamic-binding" className="scroll-mt-20 space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-[#222] pb-2">
              <Settings className="w-5 h-5 text-sky-500" />
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Dynamic Form Binding</h2>
            </div>
            <p className="text-sm text-zinc-650 dark:text-zinc-400 leading-relaxed">
              If you have a form where customers enter their email or a dynamic cart total display, you don&apos;t need to write custom handlers. Link the Paye widget directly to your HTML elements:
            </p>
            <div className="space-y-3 text-sm">
              <p className="text-zinc-500 dark:text-zinc-400">
                Use <code className="text-sky-600 dark:text-sky-400 font-mono font-semibold">data-email-source</code> and <code className="text-sky-600 dark:text-sky-400 font-mono font-semibold">data-amount-source</code> to point to input or text selectors. The script automatically pulls their values on click:
              </p>
              <div className="relative border border-zinc-200 dark:border-[#222] bg-zinc-50 dark:bg-[#111] rounded-lg overflow-hidden mt-2">
                <pre className="p-4 overflow-x-auto font-mono text-xs text-sky-600 dark:text-sky-400">
                  <code>{dynamicSnippet}</code>
                </pre>
                <button
                  onClick={() => handleCopy(dynamicSnippet, 'dynamic')}
                  className="absolute top-3 right-3 p-1.5 border border-zinc-200 dark:border-[#333] hover:border-sky-500 text-zinc-500 hover:text-zinc-800 dark:hover:text-white rounded bg-white dark:bg-[#0a0a0a] transition-all cursor-pointer"
                >
                  {copiedText === 'dynamic' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </section>
          {/* Section 3: Programmatic SDK checkout */}
          <section id="developer-sdk" className="scroll-mt-20 space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-[#222] pb-2">
              <ShieldCheck className="w-5 h-5 text-sky-500" />
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">JavaScript SDK Callback (Programmatic)</h2>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              For frontend developers building React/Vue apps or custom order workflows, you can trigger payment checkouts programmatically via the exported global helper:
            </p>
            <div className="relative border border-zinc-200 dark:border-[#222] bg-zinc-50 dark:bg-[#111] rounded-lg overflow-hidden mt-2">
              <pre className="p-4 overflow-x-auto font-mono text-xs text-sky-600 dark:text-sky-400 leading-relaxed">
                <code>{sdkSnippet}</code>
              </pre>
              <button
                onClick={() => handleCopy(sdkSnippet, 'sdk')}
                className="absolute top-3 right-3 p-1.5 border border-zinc-200 dark:border-[#333] hover:border-sky-500 text-zinc-500 hover:text-zinc-800 dark:hover:text-white rounded bg-white dark:bg-[#0a0a0a] transition-all cursor-pointer"
              >
                {copiedText === 'sdk' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </section>

          {/* Section 4: Support */}
          <section id="support" className="scroll-mt-20 border-t border-zinc-200 dark:border-[#222] pt-8 space-y-4 text-sm">
            <h3 className="font-bold text-zinc-900 dark:text-white">Need Help?</h3>
            <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
              If you have any questions or want to integrate Paye into a specific website builder (like WordPress or Webflow), contact our hackathon support team inside your Slack/Discord or email us at <a href="mailto:support@paye.ng" className="text-sky-500 hover:underline">support@paye.ng</a>.
            </p>
          </section>
        </main>
      </div>
    </div>
  )
}
