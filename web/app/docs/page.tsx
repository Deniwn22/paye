"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  ArrowLeft,
  BookOpen,
  Zap,
  Settings,
  ShieldCheck,
  Copy,
  Check,
  Key,
  Coins,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  Terminal,
  Box,
  Bell,
} from "lucide-react"
import { PAYE_API_URL } from "@/lib/config"
import dynamic from "next/dynamic"

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false })
import "swagger-ui-react/swagger-ui.css"

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState<string>("intro")
  const [copiedText, setCopiedText] = useState<string | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Suppress legacy React lifecycle warnings from swagger-ui-react
  useEffect(() => {
    const originalError = console.error
    console.error = (...args: any[]) => {
      if (typeof args[0] === "string" && args[0].includes("UNSAFE_componentWillReceiveProps")) {
        return
      }
      originalError.apply(console, args)
    }
    return () => {
      console.error = originalError
    }
  }, [])

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(id)
    setTimeout(() => setCopiedText(null), 2000)
  }

  const scriptSnippet = `<script src="${PAYE_API_URL}/sdk/your_merchant_public_id.js"></script>`
  
  const sdkPaymentSnippet = `window.Paye.pay({
  type: "payment", 
  amount: 7500,
  email: "buyer@example.com",
  currency: "NGN",
  onSuccess: function(reference) {
    console.log("Payment successful! Ref: " + reference);
  }
});`

  const virtualAccountSnippet = `// Request Virtual Account
fetch("https://api.paye.ng/v1/virtual-accounts", {
  method: "POST",
  headers: {
    "X-Paye-API-Key": "sk_test_xxxxx",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    customer_id: "CUS_12345",
    currency: "NGN",
    bvn: "12345678901"
  })
});`

  const projectsSnippet = `// Create a new staging environment
fetch("https://api.paye.ng/v1/projects", {
  method: "POST",
  headers: {
    "Authorization": "Bearer <user_jwt>",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    name: "Staging V2"
  })
});`

  const notificationsSnippet = `// Connect to SSE for realtime updates
const evtSource = new EventSource("https://api.paye.ng/v1/notifications/stream?api_key=sk_test_xxx");

evtSource.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log("New Event Received:", data.type);
};`

  const categories = [
    {
      title: "Getting Started",
      items: [
        { id: "intro", label: "Overview & Architecture", icon: BookOpen },
        { id: "ways-to-use", label: "Ways to use Paye", icon: Layers },
      ]
    },
    {
      title: "JS SDK Guide",
      items: [
        { id: "sdk-one-time", label: "One-Time Checkout", icon: ShieldCheck },
      ]
    },
    {
      title: "API Guides",
      items: [
        { id: "virtual-accounts", label: "Virtual Accounts", icon: Layers },
        { id: "projects", label: "Projects & Environments", icon: Box },
        { id: "notifications", label: "Realtime Notifications", icon: Bell },
      ]
    },
    {
      title: "API Explorer",
      items: [
        { id: "swagger-docs", label: "Swagger UI Sandbox", icon: Terminal },
      ]
    }
  ]

  const flatSections = categories.flatMap(c => c.items)
  const getSectionIndex = (id: string) => flatSections.findIndex((s) => s.id === id)

  const handleNext = () => {
    const idx = getSectionIndex(activeSection)
    if (idx !== -1 && idx < flatSections.length - 1) {
      setActiveSection(flatSections[idx + 1].id)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handlePrev = () => {
    const idx = getSectionIndex(activeSection)
    if (idx !== -1 && idx > 0) {
      setActiveSection(flatSections[idx - 1].id)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] font-sans text-foreground selection:bg-[#2563eb]/30 relative">
      <header className={`fixed top-0 inset-x-0 z-50 border-b transition-all duration-300 ${isScrolled ? 'border-border bg-white dark:bg-zinc-950 shadow-sm' : 'border-transparent bg-white dark:bg-[#0a0a0a]'}`}>
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
          <div className="flex items-center gap-4 select-none">
            <Link href="/" className="group flex items-center gap-2">
              <span className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white">
                Paye<span className="text-[#2563EB]">.</span>
              </span>
            </Link>
            <div className="h-5 w-px bg-border/60" />
            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              Documentation
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/" className="group flex items-center gap-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-[#2563eb] transition-colors">
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              <span>Back to App</span>
            </Link>
            <div className="h-5 w-px bg-border/60" />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-12 px-6 pt-28 pb-20 lg:grid-cols-12 relative z-10">
        <aside className="h-fit lg:sticky lg:top-28 lg:col-span-3 hidden md:block">
          <div className="rounded-xl border border-border bg-zinc-50 dark:bg-zinc-900/50 p-5">
            {categories.map((cat, idx) => (
              <div key={idx} className="mb-6 last:mb-0">
                <h4 className="mb-3 px-2 text-[10px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase select-none">
                  {cat.title}
                </h4>
                <nav className="flex flex-col gap-1">
                  {cat.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={`group flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 cursor-pointer ${
                          isActive
                            ? "bg-[#2563eb] text-white shadow-md shadow-blue-500/20"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"}`} />
                        <span>{item.label}</span>
                      </button>
                    )
                  })}
                </nav>
              </div>
            ))}
          </div>
        </aside>

        <main className="lg:col-span-9 min-h-[600px] flex flex-col justify-between">
          <div className="space-y-12">
            
            {activeSection === "intro" && (
              <section className="space-y-6">
                <div className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-[#2563eb] dark:text-[#3b82f6]">
                  Welcome to Paye
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white md:text-5xl">
                  Overview & Architecture
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed max-w-3xl">
                  Paye is a unified payment gateway abstraction layer. Instead of
                  writing separate integrations for Paystack, Flutterwave, or other
                  regional gateways, you build once against Paye's elegant interface.
                </p>
                <div className="grid md:grid-cols-3 gap-4 mt-8">
                  {[
                    { title: "Gateway Agnostic", desc: "Code to one model. Swap backends inside the visual panel instantly." },
                    { title: "Automatic Failover", desc: "If your primary provider goes down, Paye auto-routes to backups." },
                    { title: "Unified Webhooks", desc: "Check headers, signatures, and payload deliveries in one audit console." }
                  ].map((feature, i) => (
                    <div key={i} className="rounded-xl border border-border bg-zinc-50 dark:bg-zinc-900/50 p-6 hover:border-border/80 transition-colors">
                      <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-4">
                        <ShieldCheck className="h-5 w-5 text-[#2563eb]" />
                      </div>
                      <h3 className="font-bold text-zinc-900 dark:text-white mb-2">{feature.title}</h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeSection === "ways-to-use" && (
              <section className="space-y-6">
                <h2 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                  <Layers className="h-8 w-8 text-[#2563eb]" /> Ways to Use Paye
                </h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mt-4">
                  <div className="space-y-4 rounded-xl border border-border bg-zinc-50 dark:bg-zinc-900/50 p-8">
                    <h4 className="flex items-center gap-2 text-lg font-extrabold text-zinc-900 dark:text-white">
                      <span className="h-3 w-3 rounded-full bg-[#2563eb] shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
                      Paye Dashboard (No-Code)
                    </h4>
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                      A visual interface for business operators. Manage projects, configure keys, view analytics, and initiate payouts visually without programming.
                    </p>
                  </div>
                  <div className="space-y-4 rounded-xl border border-border bg-zinc-50 dark:bg-zinc-900/50 p-8">
                    <h4 className="flex items-center gap-2 text-lg font-extrabold text-zinc-900 dark:text-white">
                      <span className="h-3 w-3 rounded-full bg-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                      Paye API & SDK (Developers)
                    </h4>
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                      Programmatic libraries to embed checkouts directly inside applications, initiate automated vendor pipelines, and orchestrate complex billing flows.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {(() => {
              const CodeBlock = ({ code, language, id }: { code: string, language: string, id: string }) => (
                <div className="relative overflow-hidden rounded-xl border border-border bg-[#0d1117] group mt-4">
                  <div className="flex items-center px-4 py-2 border-b border-zinc-800 bg-[#161b22]">
                    <div className="text-xs font-medium text-zinc-400 uppercase">{language}</div>
                  </div>
                  <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-[#c9d1d9]">
                    <code>{code}</code>
                  </pre>
                  <button
                    onClick={() => handleCopy(code, id)}
                    className="absolute top-10 right-3 cursor-pointer rounded bg-zinc-800/80 p-1.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-white"
                  >
                    {copiedText === id ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              )

              return (
                <>
                  {activeSection === "sdk-one-time" && (
                    <section className="space-y-6">
                      <h2 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                        <ShieldCheck className="h-8 w-8 text-[#2563eb]" /> JavaScript SDK Checkout
                      </h2>
                      <p className="text-zinc-600 dark:text-zinc-400 text-lg">
                        The easiest way to accept payments is using our client-side SDK. First, include the script tag on your HTML page. Replace the URL with your merchant's public ID.
                      </p>
                      <CodeBlock code={scriptSnippet} language="HTML" id="sdk-script" />
                      <p className="text-zinc-600 dark:text-zinc-400 text-lg mt-6">
                        Once the script is loaded, you can call <code>window.Paye.pay()</code> to trigger the checkout modal securely.
                      </p>
                      <CodeBlock code={sdkPaymentSnippet} language="JavaScript" id="sdk-js" />
                    </section>
                  )}

                  {activeSection === "virtual-accounts" && (
                    <section className="space-y-6">
                      <h2 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                        <Layers className="h-8 w-8 text-[#2563eb]" /> Virtual Accounts API
                      </h2>
                      <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed">
                        Virtual accounts allow you to generate unique, static bank account numbers for your customers. When a customer transfers money into a virtual account, Paye automatically detects the transfer, credits your Paye balance, and fires a webhook to your server.
                      </p>
                      <div className="bg-blue-50 dark:bg-blue-500/10 text-blue-800 dark:text-blue-200 p-4 rounded-lg text-sm border border-blue-200 dark:border-blue-800 mb-6">
                        <strong>Tip:</strong> Virtual accounts are highly recommended for B2B applications, wallets, and savings platforms where customers need to make recurring deposits without entering card details.
                      </div>
                      <h3 className="text-xl font-bold text-zinc-900 dark:text-white mt-8 mb-4">Creating an Account</h3>
                      <p className="text-zinc-600 dark:text-zinc-400">
                        To provision an account, send a <code>POST</code> request with your customer's ID and BVN. We will return the provisioned account number and bank name (e.g., Providus Bank, Wema Bank).
                      </p>
                      <CodeBlock code={virtualAccountSnippet} language="JavaScript" id="va-api" />
                    </section>
                  )}

                  {activeSection === "projects" && (
                    <section className="space-y-6">
                      <h2 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                        <Box className="h-8 w-8 text-[#2563eb]" /> Projects & Environments
                      </h2>
                      <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed">
                        Paye is fully multi-tenant. You can create distinct "Projects" (e.g., Staging, Production, or different client apps) under a single merchant account. Each project has its own API keys, webhooks, and provider configurations.
                      </p>
                      <h3 className="text-xl font-bold text-zinc-900 dark:text-white mt-8 mb-4">Authentication</h3>
                      <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        Unlike payment APIs which use the Project API Key (`X-Paye-API-Key`), the Projects API requires a <strong>User JWT</strong> (`Bearer &lt;token&gt;`). This is because projects are managed at the user level.
                      </p>
                      <CodeBlock code={projectsSnippet} language="JavaScript" id="proj-api" />
                    </section>
                  )}

                  {activeSection === "notifications" && (
                    <section className="space-y-6">
                      <h2 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                        <Bell className="h-8 w-8 text-[#2563eb]" /> Realtime Notifications
                      </h2>
                      <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed">
                        While webhooks push events to your backend, our Server-Sent Events (SSE) Notifications API allows you to stream realtime events directly to your frontend dashboard or internal tools.
                      </p>
                      <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        This is useful for updating UI states when a background payout completes, or when a customer successfully pays via a Virtual Account transfer.
                      </p>
                      <h3 className="text-xl font-bold text-zinc-900 dark:text-white mt-8 mb-4">Connecting to the Stream</h3>
                      <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        Use the standard browser `EventSource` API. Include your `X-Paye-API-Key` as a query parameter or header to authenticate the stream.
                      </p>
                      <CodeBlock code={notificationsSnippet} language="JavaScript" id="notif-api" />
                    </section>
                  )}
                </>
              )
            })()}

            {activeSection === "swagger-docs" && (
              <section className="space-y-6 w-full overflow-hidden">
                <h2 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                  <Terminal className="h-8 w-8 text-[#2563eb]" /> Swagger UI Sandbox
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400 text-lg mb-8">
                  Looking for the exhaustive endpoint specifications? Explore our full OpenAPI spec below to test payloads and view schemas.
                </p>
                <div className="rounded-xl border border-border bg-white dark:bg-zinc-950 shadow-sm overflow-hidden p-2 swagger-container-wrapper">
                  <style dangerouslySetInnerHTML={{ __html: `
                    .swagger-container-wrapper .swagger-ui { font-family: inherit; }
                    .dark .swagger-container-wrapper .swagger-ui { filter: invert(0.9) hue-rotate(180deg); }
                  ` }} />
                  <SwaggerUI url="/swagger.json" />
                </div>
              </section>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border mt-20 pt-8 select-none">
            {getSectionIndex(activeSection) > 0 ? (
              <button
                onClick={handlePrev}
                className="group flex items-center gap-2 px-5 py-2 border border-border bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                <span>{flatSections[getSectionIndex(activeSection) - 1].label}</span>
              </button>
            ) : (
              <div />
            )}

            {getSectionIndex(activeSection) < flatSections.length - 1 ? (
              <button
                onClick={handleNext}
                className="group flex items-center gap-2 px-5 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
              >
                <span>{flatSections[getSectionIndex(activeSection) + 1].label}</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            ) : (
              <div />
            )}
          </div>
        </main>
      </div>
      
      <footer className="border-t border-border py-8 bg-zinc-50 dark:bg-[#0a0a0a] relative z-10">
        <div className="mx-auto max-w-[1200px] px-6 flex flex-col md:flex-row items-center justify-between text-sm text-zinc-500 dark:text-zinc-400 gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>All systems operational</span>
          </div>
          <div>© 2026 Paye Infrastructure. All rights reserved.</div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-[#2563eb] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[#2563eb] transition-colors">Terms</Link>
            <Link href="/" className="hover:text-[#2563eb] transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
