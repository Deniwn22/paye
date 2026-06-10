"use client"

import Link from "next/link"
import { useState } from "react"
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
  Send,
  Coins,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { PAYE_API_URL } from "@/lib/config"

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState<string>("intro")
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(id)
    setTimeout(() => setCopiedText(null), 2000)
  }

  const scriptSnippet = `<script src="${PAYE_API_URL}/sdk/your_merchant_public_id.js"></script>`
  const containerSnippet = `<div data-paye-checkout
     data-amount="5000"
     data-email="customer@email.com">
</div>`

  const declarativeSubSnippet = `<div data-paye-checkout
     data-type="subscription"
     data-plan-id="PLAN_UUID_HERE"
     data-email="customer@email.com"
     data-button-text="Subscribe Now">
</div>`

  const dynamicSnippet = `<input type="email" id="customer-email" placeholder="customer@example.com">
<span id="cart-total">₦12,500.00</span>

<!-- Paye Checkout Widget -->
<div data-paye-checkout
     data-email-source="#customer-email"
     data-amount-source="#cart-total"
     data-button-text="Proceed to Payment">
</div>`

  const sdkPaymentSnippet = `window.Paye.pay({
  type: "payment", // default
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

  const sdkSubSnippet = `window.Paye.pay({
  type: "subscription",
  planId: "8b7fae01-1b9a-4121-aa05-e3d179d679b4",
  email: "buyer@example.com",
  onSuccess: function(subscription) {
    console.log("Subscription created successfully! Code: " + subscription.subscription_code);
  },
  onFailure: function(error) {
    console.error("Subscription failed: " + error);
  }
});`

  const initTxSnippet = `// POST /api/v1/sdk/transactions/initialize
// Request Body:
{
  "publicId": "paye_pub_test_12345",
  "amount": 250.00,
  "email": "customer@test.com",
  "currency": "NGN"
}

// Response Body (200 OK):
{
  "status": true,
  "message": "Transaction initialized successfully",
  "data": {
    "reference": "paye_ref_9999",
    "authorization_url": "https://checkout.paystack.com/abcdef",
    "access_code": "access_code_12345"
  }
}`

  const verifyTxSnippet = `// GET /api/v1/transactions/verify/:reference
// Headers: X-Paye-API-Key: paye_test_key_xxxx

// Response Body (200 OK):
{
  "status": true,
  "message": "Transaction verified successfully",
  "data": {
    "reference": "paye_ref_9999",
    "status": "success",
    "amount": 250.00,
    "currency": "NGN",
    "provider": "paystack"
  }
}`

  const refundSnippet = `// POST /api/v1/refund
// Headers: X-Paye-API-Key: paye_test_key_xxxx
// Request Body:
{
  "transaction_reference": "paye_ref_9999",
  "amount": 100.00, // Optional: defaults to full refund if omitted
  "currency": "NGN",
  "customer_note": "Returning damaged goods",
  "merchant_note": "Internal refund authorization #45"
}

// Response Body (200 OK):
{
  "status": true,
  "message": "Refund processed successfully",
  "data": {
    "status": "success",
    "transaction_ref": "paye_ref_9999",
    "amount": 100.00,
    "currency": "NGN",
    "provider": "paystack"
  }
}`

  const createRecipientSnippet = `// POST /api/v1/recipients
// Headers: X-Paye-API-Key: paye_test_key_xxxx
// Request Body:
{
  "name": "Jane Doe",
  "account_number": "0123456789",
  "bank_code": "058",
  "currency": "NGN"
}

// Response Body (200 OK):
{
  "status": true,
  "message": "Transfer recipient created successfully",
  "data": {
    "status": true,
    "message": "Recipient created",
    "recipient_code": "RCP_22222",
    "provider": "paystack"
  }
}`

  const initiateTransferSnippet = `// POST /api/v1/transfers
// Headers: X-Paye-API-Key: paye_test_key_xxxx
// Request Body:
{
  "amount": 50000,
  "recipientAccount": "0123456789", // Optional if recipient_code is specified
  "bankCode": "058",             // Optional if recipient_code is specified
  "recipient_code": "RCP_22222",   // Optional if account details are specified
  "reason": "Contractor Vendor Payment",
  "currency": "NGN",
  "provider": "paystack"           // Optional preferred provider
}

// Response Body (200 OK):
{
  "status": true,
  "message": "Transfer initiated successfully",
  "data": {
    "status": "success",
    "transfer_code": "TRF_33333",
    "reference": "ref_9999",
    "amount": 50000,
    "currency": "NGN",
    "provider": "paystack"
  }
}`

  const listPlansSnippet = `// GET /api/v1/plans
// Headers: X-Paye-API-Key: paye_test_key_xxxx

// Response Body (200 OK):
{
  "status": true,
  "message": "Plans retrieved successfully",
  "data": [
    {
      "id": "8b7fae01-1b9a-4121-aa05-e3d179d679b4",
      "created_at": "2026-06-06T10:41:56Z",
      "plan_code": "PLN_44444",
      "name": "Gold Weekly",
      "amount": 5000.00,
      "interval": "weekly",
      "currency": "NGN",
      "description": "Weekly Premium Subscription",
      "provider": "paystack"
    }
  ]
}`

  const createSubSnippet = `// POST /api/v1/subscriptions
// Headers: X-Paye-API-Key: paye_test_key_xxxx
// Request Body:
{
  "customer_email": "subscriber@example.com",
  "plan_code": "PLN_44444"
}

// Response Body (200 OK):
{
  "status": true,
  "message": "Subscription created successfully",
  "data": {
    "status": "active",
    "subscription_code": "SUB_55555",
    "customer_email": "subscriber@example.com",
    "plan_code": "PLN_44444",
    "provider": "paystack"
  }
}`

  const sections = [
    { id: "intro", title: "Overview & Architecture" },
    { id: "ways-to-use", title: "Ways to use Paye" },
    { id: "authentication", title: "Authentication & Projects" },
    { id: "providers", title: "Configuring Providers" },
    { id: "sdk-one-time", title: "One-Time Checkout" },
    { id: "sdk-subscription", title: "Subscription Checkout" },
    { id: "sdk-declarative", title: "Declarative Attributes" },
    { id: "payments-api", title: "Payments API" },
    { id: "transfers-api", title: "Transfers & Payouts" },
    { id: "billing-api", title: "Billing & Plans" },
    { id: "support", title: "Need Help?" },
  ]

  const getSectionIndex = (id: string) => sections.findIndex((s) => s.id === id)

  const handleNext = () => {
    const idx = getSectionIndex(activeSection)
    if (idx !== -1 && idx < sections.length - 1) {
      setActiveSection(sections[idx + 1].id)
      window.scrollTo({ top: 0, behavior: "instant" })
    }
  }

  const handlePrev = () => {
    const idx = getSectionIndex(activeSection)
    if (idx !== -1 && idx > 0) {
      setActiveSection(sections[idx - 1].id)
      window.scrollTo({ top: 0, behavior: "instant" })
    }
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md transition-colors duration-200">
        <div className="mx-auto flex h-14 max-w-[1100px] items-center justify-between px-6">
          <div className="flex items-center gap-3 select-none">
            <Link href="/" className="group flex items-center gap-2">
              <span className="text-sm font-black tracking-tight text-foreground">
                Paye<span className="text-[#2563EB] dark:text-[#3B82F6]">.</span>
              </span>
            </Link>
            <div className="h-4 w-px bg-border" />
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400 dark:text-zinc-500">
              Developer Docs
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-[#2563eb] dark:hover:text-[#3b82f6] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Home</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Docs Body Layout */}
      <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-8 px-6 py-10 lg:grid-cols-12">
        {/* Sidebar Nav */}
        <aside className="h-fit space-y-6 text-[13px] lg:sticky lg:top-24 lg:col-span-3">
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase select-none">
              Introduction
            </h4>
            <nav className="flex flex-col gap-0.5">
              {[
                { id: "intro", label: "Overview & Architecture" },
                { id: "ways-to-use", label: "Ways to use Paye" },
                { id: "authentication", label: "Authentication & Projects" },
                { id: "providers", label: "Configuring Providers" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`text-left rounded-lg px-3 py-2 font-medium transition-colors cursor-pointer ${
                    activeSection === item.id
                      ? "bg-[#eff6ff] text-[#2563eb] dark:bg-[#1e3a5f] dark:text-[#3b82f6] font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="space-y-2">
            <h4 className="text-[11px] font-bold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase select-none">
              JS SDK Checkout
            </h4>
            <nav className="flex flex-col gap-0.5">
              {[
                { id: "sdk-one-time", label: "One-Time Checkout" },
                { id: "sdk-subscription", label: "Subscription Checkout" },
                { id: "sdk-declarative", label: "Declarative Attributes" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`text-left rounded-lg px-3 py-2 font-medium transition-colors cursor-pointer ${
                    activeSection === item.id
                      ? "bg-[#eff6ff] text-[#2563eb] dark:bg-[#1e3a5f] dark:text-[#3b82f6] font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="space-y-2">
            <h4 className="text-[11px] font-bold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase select-none">
              API Reference
            </h4>
            <nav className="flex flex-col gap-0.5">
              {[
                { id: "payments-api", label: "Payments API" },
                { id: "transfers-api", label: "Transfers & Payouts" },
                { id: "billing-api", label: "Billing & Plans" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`text-left rounded-lg px-3 py-2 font-medium transition-colors cursor-pointer ${
                    activeSection === item.id
                      ? "bg-[#eff6ff] text-[#2563eb] dark:bg-[#1e3a5f] dark:text-[#3b82f6] font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="space-y-2">
            <h4 className="text-[11px] font-bold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase select-none">
              Support
            </h4>
            <nav className="flex flex-col gap-0.5">
              <button
                onClick={() => setActiveSection("support")}
                className={`text-left rounded-lg px-3 py-2 font-medium transition-colors cursor-pointer ${
                  activeSection === "support"
                    ? "bg-[#eff6ff] text-[#2563eb] dark:bg-[#1e3a5f] dark:text-[#3b82f6] font-semibold"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                Need Help?
              </button>
            </nav>
          </div>
        </aside>

        {/* Documentation Content */}
        <main className="lg:col-span-9 min-h-[500px] flex flex-col justify-between">
          <div className="space-y-10">
            {/* Section 1: Intro */}
            {activeSection === "intro" && (
              <section className="space-y-4 animate-in fade-in duration-200">
                <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                  Overview & Architecture
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                  Paye is a unified payment gateway abstraction layer. Instead of
                  writing separate integrations for Paystack, Flutterwave, or other
                  regional gateways, you build once against Paye&apos;s interface.
                  Paye handles routing, provider failovers, record persistence, and
                  webhook normalization under the hood.
                </p>
                <div className="rounded-xl border-[0.5px] border-border bg-secondary p-5 mt-6">
                  <h3 className="font-bold text-sm text-foreground mb-2">Core Benefits</h3>
                  <ul className="list-disc pl-5 text-xs text-zinc-600 dark:text-zinc-450 space-y-1.5 leading-relaxed">
                    <li><strong>Gateway Agnostic:</strong> Code to one model. Swap backends inside the visual panel instantly.</li>
                    <li><strong>Automatic Failover:</strong> If your primary provider experiences downtime, routing auto-switches immediately.</li>
                    <li><strong>Unified Webhook Logs:</strong> Check headers, verified authenticity signatures, and payload deliveries in one audit console.</li>
                  </ul>
                </div>
              </section>
            )}

            {/* Section 2: Ways to use Paye */}
            {activeSection === "ways-to-use" && (
              <section className="space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                  <BookOpen className="h-5 w-5 text-[#2563eb] dark:text-[#3b82f6]" />
                  <h2 className="text-lg font-bold text-foreground">
                    Ways to Use Paye
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mt-4">
                  <div className="space-y-3 rounded-xl border-[0.5px] border-border bg-secondary p-5">
                    <h4 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                      <span className="h-2 w-2 rounded-full bg-[#2563eb]" />
                      Paye Dashboard (No-Code)
                    </h4>
                    <p className="text-zinc-600 dark:text-zinc-450 text-xs leading-relaxed">
                      A visual interface for business operators. Manage your
                      projects, configure provider secret/public keys, view
                      transaction analytics, design billing plans, issue refunds,
                      and initiate visual payouts to Nigeria banks with no
                      programming required.
                    </p>
                  </div>

                  <div className="space-y-3 rounded-xl border-[0.5px] border-border bg-secondary p-5">
                    <h4 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                      <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
                      Paye API & SDK (Developers)
                    </h4>
                    <p className="text-zinc-600 dark:text-zinc-450 text-xs leading-relaxed">
                      Programmatic libraries to embed checkouts directly inside
                      React/Next.js/mobile applications, initiate automated vendor
                      payout pipelines on your servers, sync sub-merchants, and
                      automate multi-provider subscription billing workflows.
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border-l-4 border-[#2563eb] bg-[#eff6ff]/30 dark:bg-[#1e3a5f]/10 p-4 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  <strong>The Paye Promise:</strong> You never need to know which
                  payment provider is running underneath. You configure your
                  providers once in the dashboard, and from that point on, you
                  interact only with the Paye API/SDK. If you switch from Paystack
                  to Flutterwave tomorrow, your code stays completely untouched.
                </div>
              </section>
            )}

            {/* Section 3: Auth & Projects */}
            {activeSection === "authentication" && (
              <section className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                  <Key className="h-5 w-5 text-[#2563eb] dark:text-[#3b82f6]" />
                  <h2 className="text-lg font-bold text-foreground">
                    Authentication & Multi-Project Scoping
                  </h2>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                  Every resource in Paye is isolated inside a **Project**. A
                  merchant can create multiple projects (e.g. staging vs production,
                  or separate business lines).
                </p>
                <div className="space-y-4 text-xs mt-4">
                  <div className="space-y-2 rounded-lg border-[0.5px] border-border bg-secondary p-4">
                    <strong className="block text-foreground">
                      Server-to-Server Private Endpoints
                    </strong>
                    <p className="text-zinc-500">
                      Requires your project-specific API key, passed in the HTTP
                      Header:
                    </p>
                    <div className="rounded border-[0.5px] border-border bg-background p-2.5 font-mono text-[#2563eb] dark:text-[#3b82f6]">
                      X-Paye-API-Key: paye_test_merchant_api_key_xxxxx
                    </div>
                  </div>
                  <div className="space-y-2 rounded-lg border-[0.5px] border-border bg-secondary p-4">
                    <strong className="block text-foreground">
                      Browser-Safe Public SDK Client
                    </strong>
                    <p className="text-zinc-500">
                      Requires your project-specific Public ID, embedded directly
                      into the JS SDK source URL:
                    </p>
                    <div className="rounded border-[0.5px] border-border bg-background p-2.5 font-mono text-[#2563eb] dark:text-[#3b82f6]">
                      {scriptSnippet}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Section 3.5: Providers Setup */}
            {activeSection === "providers" && (
              <section className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                  <Settings className="h-5 w-5 text-[#2563eb] dark:text-[#3b82f6]" />
                  <h2 className="text-lg font-bold text-foreground">
                    Configuring Payment Providers
                  </h2>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                  Paye integrates seamlessly with external payment gateways like Paystack and Flutterwave. Instead of writing custom integration code for each provider, you simply configure them once in the Paye dashboard and let Paye handle the rest.
                </p>
                
                <div className="space-y-6 mt-4">
                  <div className="space-y-3 rounded-lg border-[0.5px] border-border bg-secondary p-5">
                    <h3 className="font-bold text-foreground">Paystack Setup</h3>
                    <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                      To connect Paystack, you need to provide your API keys from the Paystack Dashboard (Settings &gt; API Keys &amp; Webhooks).
                    </p>
                    <ul className="list-disc pl-5 text-xs text-zinc-600 dark:text-zinc-450 space-y-1 leading-relaxed">
                      <li><strong>Secret Key:</strong> Used by Paye backend to verify transactions, process refunds, and manage subscriptions.</li>
                      <li><strong>Public Key:</strong> Used by the Paye JS SDK to securely initialize the Paystack inline checkout popup.</li>
                    </ul>
                  </div>

                  <div className="space-y-3 rounded-lg border-[0.5px] border-border bg-secondary p-5">
                    <h3 className="font-bold text-foreground">Flutterwave Setup</h3>
                    <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                      To connect Flutterwave, retrieve your API keys from the Flutterwave Dashboard (Settings &gt; API).
                    </p>
                    <ul className="list-disc pl-5 text-xs text-zinc-600 dark:text-zinc-450 space-y-1 leading-relaxed">
                      <li><strong>Secret Key:</strong> Used by Paye to securely communicate with Flutterwave API for transaction verification and more.</li>
                      <li><strong>Public Key:</strong> Used by the Paye JS SDK to launch the Flutterwave standard checkout inline modal.</li>
                      <li><strong>Webhook Secret Hash:</strong> To receive automatic transaction updates from Flutterwave, configure a Webhook Secret Hash on your Flutterwave Dashboard. <strong>Important: Paye requires you to set your Webhook Secret Hash to exactly match your Flutterwave Secret Key.</strong></li>
                    </ul>
                  </div>

                  <div className="rounded-lg border-l-4 border-[#22c55e] bg-[#f0fdf4]/30 dark:bg-[#14291a]/10 p-4 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    <strong>Why does Paye need these?</strong> Providing your API keys allows Paye to act as a secure proxy and abstraction layer. Your secret keys are encrypted using bank-grade AES-256-GCM before being stored in the database.
                  </div>
                </div>
              </section>
            )}

            {/* Section 4: JS SDK Checkout */}
            {activeSection === "sdk-one-time" && (
              <section className="space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                  <ShieldCheck className="h-5 w-5 text-[#2563eb] dark:text-[#3b82f6]" />
                  <h2 className="text-lg font-bold text-foreground">
                    JavaScript SDK - One-Time Payments
                  </h2>
                </div>
                <p className="text-zinc-650 text-sm leading-relaxed dark:text-zinc-400">
                  Accept one-time checkouts programmatically. Include the script tag
                  on your page and call the checkout loader:
                </p>
                <div className="relative overflow-hidden rounded-lg border-[0.5px] border-border bg-secondary">
                  <pre className="overflow-x-auto p-4 font-mono text-xs text-[#2563eb] dark:text-[#3b82f6]">
                    <code>{sdkPaymentSnippet}</code>
                  </pre>
                  <button
                    onClick={() => handleCopy(sdkPaymentSnippet, "sdk-one-time")}
                    className="absolute top-3 right-3 cursor-pointer rounded border-[0.5px] border-border bg-background p-1.5 text-zinc-500 transition-all hover:border-[#2563eb] hover:text-zinc-800 dark:hover:text-white"
                  >
                    {copiedText === "sdk-one-time" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </section>
            )}

            {/* Section 5: Subscription Checkout */}
            {activeSection === "sdk-subscription" && (
              <section className="space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                  <Coins className="h-5 w-5 text-[#2563eb] dark:text-[#3b82f6]" />
                  <h2 className="text-lg font-bold text-foreground">
                    JavaScript SDK - Subscription Checkouts
                  </h2>
                </div>
                <p className="text-zinc-650 text-sm leading-relaxed dark:text-zinc-400">
                  Start recurring billing for a plan. Set{" "}
                  <code className="font-mono text-[#2563eb] dark:text-[#3b82f6]">
                    type: &quot;subscription&quot;
                  </code>{" "}
                  and provide your plan UUID. The SDK automatically performs the
                  initial card auth charge, updates the database via webhooks, and
                  programmatically establishes the active subscription:
                </p>
                <div className="relative overflow-hidden rounded-lg border-[0.5px] border-border bg-secondary">
                  <pre className="overflow-x-auto p-4 font-mono text-xs text-[#2563eb] dark:text-[#3b82f6]">
                    <code>{sdkSubSnippet}</code>
                  </pre>
                  <button
                    onClick={() => handleCopy(sdkSubSnippet, "sdk-sub")}
                    className="absolute top-3 right-3 cursor-pointer rounded border-[0.5px] border-border bg-background p-1.5 text-zinc-500 transition-all hover:border-[#2563eb] hover:text-zinc-800 dark:hover:text-white"
                  >
                    {copiedText === "sdk-sub" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                <div className="rounded-lg border-l-4 border-[#2563eb] bg-[#eff6ff]/30 dark:bg-[#1e3a5f]/10 p-4 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  <strong className="block mb-1 text-foreground">How Paye-Managed Subscriptions Work:</strong>
                  <ul className="list-disc pl-4 space-y-1.5 leading-relaxed">
                    <li>
                      <strong>Initial Authorization Charge:</strong> The JS SDK initializes a one-time transaction using either Paystack or Flutterwave. Once completed, Paye captures the payment authorization details securely.
                    </li>
                    <li>
                      <strong>Subscription Registration:</strong> Paye creates a local subscription record linked to the customer email and selected plan, calculating the <code>NextBillingDate</code> automatically based on the interval.
                    </li>
                    <li>
                      <strong>Automated Billing:</strong> A background cron worker iterates through active subscriptions that are due for billing and charges the customer using the provider&apos;s tokenized charge API.
                    </li>
                    <li>
                      <strong>Provider Agnostic:</strong> Subscriptions are completely controlled inside Paye. If you deactivate Paystack and activate Flutterwave, Paye routes the next recurring billing attempt using Flutterwave, ensuring zero disruption.
                    </li>
                  </ul>
                </div>
              </section>
            )}

            {/* Section 6: Declarative Checkout */}
            {activeSection === "sdk-declarative" && (
              <section className="space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                  <Zap className="h-5 w-5 text-[#2563eb] dark:text-[#3b82f6]" />
                  <h2 className="text-lg font-bold text-foreground">
                    Declarative HTML Checkouts (No-JS Trigger)
                  </h2>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                  Alternatively, render payment buttons declaratively using HTML
                  tags. Link to form fields or specify static attributes. The script
                  will intercept click handlers and configure the popups:
                </p>
                <div className="relative overflow-hidden rounded-lg border-[0.5px] border-border bg-secondary">
                  <pre className="overflow-x-auto p-4 font-mono text-xs text-[#2563eb] dark:text-[#3b82f6]">
                    <code>{declarativeSubSnippet}</code>
                  </pre>
                  <button
                    onClick={() => handleCopy(declarativeSubSnippet, "dec-sub")}
                    className="absolute top-3 right-3 cursor-pointer rounded border-[0.5px] border-border bg-background p-1.5 text-zinc-500 transition-all hover:border-[#2563eb] hover:text-zinc-800 dark:hover:text-white"
                  >
                    {copiedText === "dec-sub" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </section>
            )}

            {/* Section 7: Payments API */}
            {activeSection === "payments-api" && (
              <section className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                  <Settings className="h-5 w-5 text-[#2563eb] dark:text-[#3b82f6]" />
                  <h2 className="text-lg font-bold text-foreground">
                    Payments API Reference
                  </h2>
                </div>

                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                    <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                      POST
                    </span>
                    <code>/sdk/transactions/initialize</code>
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Initialize checkout page sessions. Called under-the-hood by the
                    JavaScript SDK.
                  </p>
                  <div className="relative overflow-hidden rounded-lg border-[0.5px] border-border bg-secondary">
                    <pre className="text-[#2563eb] dark:text-[#3b82f6] overflow-x-auto p-4 font-mono text-xs">
                      <code>{initTxSnippet}</code>
                    </pre>
                  </div>
                </div>

                <div className="space-y-3 border-t border-border pt-4">
                  <h3 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                    <span className="rounded border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-500">
                      GET
                    </span>
                    <code>/transactions/verify/:reference</code>
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Verify the status of a specific payment session. Requires
                    private API Key authentication.
                  </p>
                  <div className="relative overflow-hidden rounded-lg border-[0.5px] border-border bg-secondary">
                    <pre className="text-[#2563eb] dark:text-[#3b82f6] overflow-x-auto p-4 font-mono text-xs">
                      <code>{verifyTxSnippet}</code>
                    </pre>
                  </div>
                </div>

                <div className="space-y-3 border-t border-border pt-4">
                  <h3 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                    <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                      POST
                    </span>
                    <code>/refund</code>
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Process a partial or full refund on a transaction. Original
                    transaction reference must belong to the active project context.
                    Requires private API Key authentication.
                  </p>
                  <div className="relative overflow-hidden rounded-lg border-[0.5px] border-border bg-secondary">
                    <pre className="text-[#2563eb] dark:text-[#3b82f6] overflow-x-auto p-4 font-mono text-xs">
                      <code>{refundSnippet}</code>
                    </pre>
                  </div>
                </div>
              </section>
            )}

            {/* Section 8: Transfers API */}
            {activeSection === "transfers-api" && (
              <section className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                  <Send className="h-5 w-5 text-[#2563eb] dark:text-[#3b82f6]" />
                  <h2 className="text-lg font-bold text-foreground">
                    Transfers & Bank Payouts API
                  </h2>
                </div>

                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                    <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                      POST
                    </span>
                    <code>/recipients</code>
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Create and save a transfer recipient. Scoped to the project.
                    Requires private API Key authentication.
                  </p>
                  <div className="relative overflow-hidden rounded-lg border-[0.5px] border-border bg-secondary">
                    <pre className="text-[#2563eb] dark:text-[#3b82f6] overflow-x-auto p-4 font-mono text-xs">
                      <code>{createRecipientSnippet}</code>
                    </pre>
                  </div>
                </div>

                <div className="space-y-3 border-t border-border pt-4">
                  <h3 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                    <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                      POST
                    </span>
                    <code>/transfers</code>
                  </h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Initiate a bank transfer. Supports explicit routing via the
                    optional <code className="font-mono text-[#2563eb] dark:text-[#3b82f6]">provider</code> field.
                    If omitted, uses the project&apos;s default provider. If the
                    selected provider fails, Paye automatically falls back to
                    alternative active configs. Can resolve account names
                    dynamically. Requires private API Key authentication.
                  </p>
                  <div className="relative overflow-hidden rounded-lg border-[0.5px] border-border bg-secondary">
                    <pre className="text-[#2563eb] dark:text-[#3b82f6] overflow-x-auto p-4 font-mono text-xs">
                      <code>{initiateTransferSnippet}</code>
                    </pre>
                  </div>
                </div>
              </section>
            )}

            {/* Section 9: Billing API */}
            {activeSection === "billing-api" && (
              <section className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                  <FileText className="h-5 w-5 text-[#2563eb] dark:text-[#3b82f6]" />
                  <h2 className="text-lg font-bold text-foreground">
                    Billing, Plans & Subscriptions API
                  </h2>
                </div>

                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                    <span className="rounded border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-500">
                      GET
                    </span>
                    <code>/plans</code>
                  </h3>
                  <p className="text-xs text-zinc-500">
                    List all created billing plans scoped to the current project
                    context. Requires private API Key authentication.
                  </p>
                  <div className="relative overflow-hidden rounded-lg border-[0.5px] border-border bg-secondary">
                    <pre className="text-[#2563eb] dark:text-[#3b82f6] overflow-x-auto p-4 font-mono text-xs">
                      <code>{listPlansSnippet}</code>
                    </pre>
                  </div>
                </div>

                <div className="space-y-3 border-t border-border pt-4">
                  <h3 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                    <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                      POST
                    </span>
                    <code>/subscriptions</code>
                  </h3>
                  <p className="text-xs text-zinc-550 leading-relaxed">
                    Create a recurring customer subscription using a saved
                    authorization code. Requires private API Key authentication.
                  </p>
                  <div className="relative overflow-hidden rounded-lg border-[0.5px] border-border bg-secondary">
                    <pre className="text-[#2563eb] dark:text-[#3b82f6] overflow-x-auto p-4 font-mono text-xs">
                      <code>{createSubSnippet}</code>
                    </pre>
                  </div>
                </div>
              </section>
            )}

            {/* Section 10: Support */}
            {activeSection === "support" && (
              <section className="space-y-4 animate-in fade-in duration-200">
                <h3 className="font-bold text-lg text-foreground">
                  Need Help?
                </h3>
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  If you have any questions or want to integrate Paye into a
                  specific website builder (like WordPress or Webflow), contact our
                  hackathon support team inside your Slack/Discord or email us at{" "}
                  <a
                    href="mailto:support@paye.ng"
                    className="text-[#2563eb] dark:text-[#3b82f6] hover:underline font-semibold"
                  >
                    support@paye.ng
                  </a>
                  . We will reply as quickly as possible.
                </p>
              </section>
            )}
          </div>

          {/* Section Navigation Buttons */}
          <div className="flex items-center justify-between border-t border-border mt-16 pt-6 select-none">
            {getSectionIndex(activeSection) > 0 ? (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 px-4 py-2 border-[0.5px] border-border bg-secondary hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-350 transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>{sections[getSectionIndex(activeSection) - 1].title}</span>
              </button>
            ) : (
              <div />
            )}

            {getSectionIndex(activeSection) < sections.length - 1 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] dark:bg-[#3b82f6] dark:hover:bg-[#2563eb] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <span>{sections[getSectionIndex(activeSection) + 1].title}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <div />
            )}
          </div>
        </main>
      </div>
      
      <footer className="border-t border-border py-6 mt-12 bg-background/50 transition-colors duration-200">
        <div className="mx-auto max-w-[1100px] px-6 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <div>© 2026 Paye. All rights reserved.</div>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-[#2563eb] dark:hover:text-[#3b82f6] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[#2563eb] dark:hover:text-[#3b82f6] transition-colors">Terms</Link>
            <Link href="/" className="hover:text-[#2563eb] dark:hover:text-[#3b82f6] transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
