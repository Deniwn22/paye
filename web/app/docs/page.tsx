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
} from "lucide-react"
import { PAYE_API_URL } from "@/lib/config"

export default function DocsPage() {
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

  return (
    <div className="min-h-screen bg-white font-sans text-zinc-900 transition-colors duration-200 dark:bg-[#0a0a0a] dark:text-[#f5f5f5]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white transition-colors duration-200 dark:border-[#222] dark:bg-[#0a0a0a]">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="transition-opacity hover:opacity-80">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-500 text-xs font-bold text-black">
                P
              </span>
            </Link>
            <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white">
              Paye Developer Docs
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Home</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Docs Body Layout */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-10 lg:grid-cols-12">
        {/* Sidebar Nav */}
        <aside className="h-fit space-y-6 text-sm lg:sticky lg:top-24 lg:col-span-3">
          <div className="space-y-2">
            <h4 className="dark:text-zinc-650 text-xs font-bold tracking-wider text-zinc-400 uppercase">
              Introduction
            </h4>
            <nav className="flex flex-col gap-1">
              <a
                href="#intro"
                className="rounded-md px-3 py-2 font-medium text-zinc-600 transition-all hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-[#111] dark:hover:text-white"
              >
                Overview & Architecture
              </a>
              <a
                href="#ways-to-use"
                className="rounded-md px-3 py-2 font-medium text-zinc-600 transition-all hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-[#111] dark:hover:text-white"
              >
                Ways to use Paye
              </a>
              <a
                href="#authentication"
                className="rounded-md px-3 py-2 font-medium text-zinc-600 transition-all hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-[#111] dark:hover:text-white"
              >
                Authentication & Projects
              </a>
              <a
                href="#providers"
                className="rounded-md px-3 py-2 font-medium text-zinc-600 transition-all hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-[#111] dark:hover:text-white"
              >
                Configuring Providers
              </a>
            </nav>
          </div>

          <div className="space-y-2">
            <h4 className="dark:text-zinc-650 text-xs font-bold tracking-wider text-zinc-400 uppercase">
              JS SDK Checkout
            </h4>
            <nav className="flex flex-col gap-1">
              <a
                href="#sdk-one-time"
                className="rounded-md px-3 py-2 font-medium text-zinc-600 transition-all hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-[#111] dark:hover:text-white"
              >
                One-Time Checkout
              </a>
              <a
                href="#sdk-subscription"
                className="rounded-md px-3 py-2 font-medium text-zinc-600 transition-all hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-[#111] dark:hover:text-white"
              >
                Subscription Checkout
              </a>
              <a
                href="#sdk-declarative"
                className="rounded-md px-3 py-2 font-medium text-zinc-600 transition-all hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-[#111] dark:hover:text-white"
              >
                Declarative Attributes
              </a>
            </nav>
          </div>

          <div className="space-y-2">
            <h4 className="dark:text-zinc-650 text-xs font-bold tracking-wider text-zinc-400 uppercase">
              API Reference
            </h4>
            <nav className="flex flex-col gap-1">
              <a
                href="#payments-api"
                className="rounded-md px-3 py-2 font-medium text-zinc-600 transition-all hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-[#111] dark:hover:text-white"
              >
                Payments API
              </a>
              <a
                href="#transfers-api"
                className="rounded-md px-3 py-2 font-medium text-zinc-600 transition-all hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-[#111] dark:hover:text-white"
              >
                Transfers & Payouts
              </a>
              <a
                href="#billing-api"
                className="rounded-md px-3 py-2 font-medium text-zinc-600 transition-all hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-[#111] dark:hover:text-white"
              >
                Billing & Plans
              </a>
            </nav>
          </div>

          <div className="space-y-2">
            <h4 className="dark:text-zinc-650 text-xs font-bold tracking-wider text-zinc-400 uppercase">
              Support
            </h4>
            <nav className="flex flex-col gap-1">
              <a
                href="#support"
                className="rounded-md px-3 py-2 font-medium text-zinc-600 transition-all hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-[#111] dark:hover:text-white"
              >
                Need Help?
              </a>
            </nav>
          </div>
        </aside>

        {/* Documentation Content */}
        <main className="max-w-4xl space-y-16 lg:col-span-9">
          {/* Section 1: Intro */}
          <section id="intro" className="scroll-mt-20 space-y-4">
            <h1 className="text-3xl font-black tracking-tight text-zinc-950 md:text-4xl dark:text-white">
              Integration & API Reference
            </h1>
            <p className="text-zinc-650 text-sm leading-relaxed dark:text-zinc-400">
              Paye is a unified payment gateway abstraction layer. Instead of
              writing separate integrations for Paystack, Flutterwave, or other
              regional gateways, you build once against Paye&apos;s interface.
              Paye handles routing, provider failovers, record persistence, and
              webhook normalization under the hood.
            </p>
          </section>

          {/* Section 2: Ways to use Paye */}
          <section id="ways-to-use" className="scroll-mt-20 space-y-5">
            <div className="flex items-center gap-2 border-b border-zinc-200 pb-2 dark:border-[#222]">
              <BookOpen className="h-5 w-5 text-sky-500" />
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Ways to Use Paye
              </h2>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/50 p-5 dark:border-[#222] dark:bg-[#111]/30">
                <h4 className="flex items-center gap-2 text-sm font-extrabold text-zinc-900 dark:text-white">
                  <span className="h-2 w-2 rounded-full bg-sky-500" />
                  Paye Dashboard (No-Code)
                </h4>
                <p className="text-zinc-550 text-xs leading-relaxed dark:text-zinc-400">
                  A visual interface for business operators. Manage your
                  projects, configure provider secret/public keys, view
                  transaction analytics, design billing plans, issue refunds,
                  and initiate visual payouts to Nigeria banks with no
                  programming required.
                </p>
              </div>

              <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/50 p-5 dark:border-[#222] dark:bg-[#111]/30">
                <h4 className="flex items-center gap-2 text-sm font-extrabold text-zinc-900 dark:text-white">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Paye API & SDK (Developers)
                </h4>
                <p className="text-zinc-550 text-xs leading-relaxed dark:text-zinc-400">
                  Programmatic libraries to embed checkouts directly inside
                  React/Next.js/mobile applications, initiate automated vendor
                  payout pipelines on your servers, sync sub-merchants, and
                  automate multi-provider subscription billing workflows.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-r-lg border border-l-4 border-sky-500 bg-sky-500/5 p-4 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              <strong>The Paye Promise:</strong> You never need to know which
              payment provider is running underneath. You configure your
              providers once in the dashboard, and from that point on, you
              interact only with the Paye API/SDK. If you switch from Paystack
              to Flutterwave tomorrow, your code stays completely untouched.
            </div>
          </section>

          {/* Section 3: Auth & Projects */}
          <section id="authentication" className="scroll-mt-20 space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-200 pb-2 dark:border-[#222]">
              <Key className="h-5 w-5 text-sky-500" />
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Authentication & Multi-Project Scoping
              </h2>
            </div>
            <p className="text-zinc-650 text-sm leading-relaxed dark:text-zinc-400">
              Every resource in Paye is isolated inside a **Project**. A
              merchant can create multiple projects (e.g. staging vs production,
              or separate business lines).
            </p>
            <div className="space-y-4 text-xs">
              <div className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50/40 p-4 dark:border-[#222] dark:bg-[#111]/20">
                <strong className="block text-zinc-900 dark:text-white">
                  Server-to-Server Private Endpoints
                </strong>
                <p className="text-zinc-500">
                  Requires your project-specific API key, passed in the HTTP
                  Header:
                </p>
                <div className="rounded border border-zinc-200/50 bg-zinc-100 p-2.5 font-mono text-sky-600 dark:border-[#222] dark:bg-black/40 dark:text-sky-400">
                  X-Paye-API-Key: paye_test_merchant_api_key_xxxxx
                </div>
              </div>
              <div className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50/40 p-4 dark:border-[#222] dark:bg-[#111]/20">
                <strong className="block text-zinc-900 dark:text-white">
                  Browser-Safe Public SDK Client
                </strong>
                <p className="text-zinc-500">
                  Requires your project-specific Public ID, embedded directly
                  into the JS SDK source URL:
                </p>
                <div className="rounded border border-zinc-200/50 bg-zinc-100 p-2.5 font-mono text-sky-600 dark:border-[#222] dark:bg-black/40 dark:text-sky-400">
                  {scriptSnippet}
                </div>
              </div>
            </div>
          </section>

          {/* Section 3.5: Providers Setup */}
          <section id="providers" className="scroll-mt-20 space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-200 pb-2 dark:border-[#222]">
              <Settings className="h-5 w-5 text-sky-500" />
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Configuring Payment Providers
              </h2>
            </div>
            <p className="text-zinc-650 text-sm leading-relaxed dark:text-zinc-400">
              Paye integrates seamlessly with external payment gateways like Paystack and Flutterwave. Instead of writing custom integration code for each provider, you simply configure them once in the Paye dashboard and let Paye handle the rest.
            </p>
            
            <div className="space-y-6 mt-4">
              <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-5 dark:border-[#222] dark:bg-[#111]/30">
                <h3 className="font-bold text-zinc-900 dark:text-white">Paystack Setup</h3>
                <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                  To connect Paystack, you need to provide your API keys from the Paystack Dashboard (Settings &gt; API Keys &amp; Webhooks).
                </p>
                <ul className="list-disc pl-5 text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                  <li><strong>Secret Key:</strong> Used by Paye backend to verify transactions, process refunds, and manage subscriptions.</li>
                  <li><strong>Public Key:</strong> Used by the Paye JS SDK to securely initialize the Paystack inline checkout popup.</li>
                </ul>
              </div>

              <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-5 dark:border-[#222] dark:bg-[#111]/30">
                <h3 className="font-bold text-zinc-900 dark:text-white">Flutterwave Setup</h3>
                <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                  To connect Flutterwave, retrieve your API keys from the Flutterwave Dashboard (Settings &gt; API).
                </p>
                <ul className="list-disc pl-5 text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                  <li><strong>Secret Key:</strong> Used by Paye to securely communicate with Flutterwave API for transaction verification and more.</li>
                  <li><strong>Public Key:</strong> Used by the Paye JS SDK to launch the Flutterwave standard checkout inline modal.</li>
                  <li><strong>Webhook Secret Hash:</strong> To receive automatic transaction updates from Flutterwave, you must configure a Webhook Secret Hash on your Flutterwave Dashboard. <strong>Important: Paye requires you to set your Webhook Secret Hash to exactly match your Flutterwave Secret Key.</strong></li>
                </ul>
              </div>

              <div className="rounded-r-lg border border-l-4 border-emerald-500 bg-emerald-500/5 p-4 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                <strong>Why does Paye need these?</strong> Providing your API keys allows Paye to act as a secure proxy and abstraction layer. Your secret keys are encrypted using bank-grade AES-256-GCM before being stored in the database.
              </div>
            </div>
          </section>

          {/* Section 4: JS SDK Checkout */}
          <section id="sdk-one-time" className="scroll-mt-20 space-y-5">
            <div className="flex items-center gap-2 border-b border-zinc-200 pb-2 dark:border-[#222]">
              <ShieldCheck className="h-5 w-5 text-sky-500" />
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                JavaScript SDK - One-Time Payments
              </h2>
            </div>
            <p className="text-zinc-650 text-sm leading-relaxed dark:text-zinc-400">
              Accept one-time checkouts programmatically. Include the script tag
              on your page and call the checkout loader:
            </p>
            <div className="relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-[#222] dark:bg-[#111]">
              <pre className="overflow-x-auto p-4 font-mono text-xs text-sky-600 dark:text-sky-400">
                <code>{sdkPaymentSnippet}</code>
              </pre>
              <button
                onClick={() => handleCopy(sdkPaymentSnippet, "sdk-one-time")}
                className="absolute top-3 right-3 cursor-pointer rounded border border-zinc-200 bg-white p-1.5 text-zinc-500 transition-all hover:border-sky-500 hover:text-zinc-800 dark:border-[#333] dark:bg-[#0a0a0a] dark:hover:text-white"
              >
                {copiedText === "sdk-one-time" ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </section>          <section id="sdk-subscription" className="scroll-mt-20 space-y-5">
            <div className="flex items-center gap-2 border-b border-zinc-200 pb-2 dark:border-[#222]">
              <Coins className="h-5 w-5 text-sky-500" />
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                JavaScript SDK - Subscription Checkouts
              </h2>
            </div>
            <p className="text-zinc-650 text-sm leading-relaxed dark:text-zinc-400">
              Start recurring billing for a plan. Set{" "}
              <code className="font-mono text-sky-500">
                type: &quot;subscription&quot;
              </code>{" "}
              and provide your plan UUID. The SDK automatically performs the
              initial card auth charge, updates the database via webhooks, and
              programmatically establishes the active subscription:
            </p>
            <div className="relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-[#222] dark:bg-[#111]">
              <pre className="overflow-x-auto p-4 font-mono text-xs text-sky-600 dark:text-sky-400">
                <code>{sdkSubSnippet}</code>
              </pre>
              <button
                onClick={() => handleCopy(sdkSubSnippet, "sdk-sub")}
                className="absolute top-3 right-3 cursor-pointer rounded border border-zinc-200 bg-white p-1.5 text-zinc-500 transition-all hover:border-sky-500 hover:text-zinc-800 dark:border-[#333] dark:bg-[#0a0a0a] dark:hover:text-white"
              >
                {copiedText === "sdk-sub" ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            <div className="rounded-r-lg border border-l-4 border-sky-500 bg-sky-500/5 p-4 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              <strong className="block mb-1 text-zinc-950 dark:text-white">How Paye-Managed Subscriptions Work under the hood:</strong>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  <strong>Initial Authorization Charge:</strong> The JS SDK initializes a one-time transaction using either Paystack or Flutterwave. Once the customer completes checkout, Paye captures the payment authorization details (e.g. <code>authorization_code</code> for Paystack, or a <code>card token</code> for Flutterwave) securely.
                </li>
                <li>
                  <strong>Subscription Registration:</strong> Paye creates a local subscription record linked to the customer email and selected plan, calculating the <code>NextBillingDate</code> automatically based on the plan&apos;s interval (daily, weekly, monthly, annually).
                </li>
                <li>
                  <strong>Automated Billing (Cron Engine):</strong> A background cron worker iterates through active subscriptions that are due for billing. It dynamically retrieves the stored authorization details and charges the customer using the provider&apos;s tokenized charge API.
                </li>
                <li>
                  <strong>Provider Agnostic:</strong> Subscriptions are completely controlled inside Paye. If you deactivate Paystack and activate Flutterwave, Paye will automatically route the next recurring billing attempt using Flutterwave&apos;s tokenized charge process, ensuring no disruption to your recurring revenue.
                </li>
              </ul>
            </div>
          </section>

          <section id="sdk-declarative" className="scroll-mt-20 space-y-5">
            <div className="flex items-center gap-2 border-b border-zinc-200 pb-2 dark:border-[#222]">
              <Zap className="h-5 w-5 text-sky-500" />
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Declarative HTML Checkouts (No-JS Trigger)
              </h2>
            </div>
            <p className="text-zinc-650 text-sm leading-relaxed dark:text-zinc-400">
              Alternatively, render payment buttons declaratively using HTML
              tags. Link to form fields or specify static attributes. The script
              will intercept click handlers and configure the popups:
            </p>
            <div className="relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-[#222] dark:bg-[#111]">
              <pre className="overflow-x-auto p-4 font-mono text-xs text-sky-600 dark:text-sky-400">
                <code>{declarativeSubSnippet}</code>
              </pre>
              <button
                onClick={() => handleCopy(declarativeSubSnippet, "dec-sub")}
                className="absolute top-3 right-3 cursor-pointer rounded border border-zinc-200 bg-white p-1.5 text-zinc-500 transition-all hover:border-sky-500 hover:text-zinc-800 dark:border-[#333] dark:bg-[#0a0a0a] dark:hover:text-white"
              >
                {copiedText === "dec-sub" ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </section>

          {/* Section 5: Payments API */}
          <section id="payments-api" className="scroll-mt-20 space-y-6">
            <div className="flex items-center gap-2 border-b border-zinc-200 pb-2 dark:border-[#222]">
              <Settings className="h-5 w-5 text-sky-500" />
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Payments API Reference
              </h2>
            </div>

            {/* Initialize SDK Tx */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-zinc-900 dark:text-white">
                <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                  POST
                </span>
                <code>/sdk/transactions/initialize</code>
              </h3>
              <p className="text-xs text-zinc-500">
                Initialize checkout page sessions. Called under-the-hood by the
                JavaScript SDK.
              </p>
              <div className="relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-[#222] dark:bg-[#111]">
                <pre className="text-sky-650 dark:text-sky-450 overflow-x-auto p-4 font-mono text-xs">
                  <code>{initTxSnippet}</code>
                </pre>
              </div>
            </div>

            {/* Verify Tx */}
            <div className="space-y-3 border-t border-zinc-100 pt-4 dark:border-zinc-900">
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-zinc-900 dark:text-white">
                <span className="rounded border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-500">
                  GET
                </span>
                <code>/transactions/verify/:reference</code>
              </h3>
              <p className="text-xs text-zinc-500">
                Verify the status of a specific payment session. Requires
                private API Key authentication.
              </p>
              <div className="relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-[#222] dark:bg-[#111]">
                <pre className="text-sky-650 dark:text-sky-450 overflow-x-auto p-4 font-mono text-xs">
                  <code>{verifyTxSnippet}</code>
                </pre>
              </div>
            </div>

            {/* Refund Tx */}
            <div className="space-y-3 border-t border-zinc-100 pt-4 dark:border-zinc-900">
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-zinc-900 dark:text-white">
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
              <div className="relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-[#222] dark:bg-[#111]">
                <pre className="text-sky-650 dark:text-sky-450 overflow-x-auto p-4 font-mono text-xs">
                  <code>{refundSnippet}</code>
                </pre>
              </div>
            </div>
          </section>

          {/* Section 6: Transfers API */}
          <section id="transfers-api" className="scroll-mt-20 space-y-6">
            <div className="flex items-center gap-2 border-b border-zinc-200 pb-2 dark:border-[#222]">
              <Send className="h-5 w-5 text-sky-500" />
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Transfers & Bank Payouts API
              </h2>
            </div>

            {/* Create Recipient */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-zinc-900 dark:text-white">
                <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                  POST
                </span>
                <code>/recipients</code>
              </h3>
              <p className="text-xs text-zinc-500">
                Create and save a transfer recipient. Scoped to the project.
                Requires private API Key authentication.
              </p>
              <div className="relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-[#222] dark:bg-[#111]">
                <pre className="text-sky-650 dark:text-sky-450 overflow-x-auto p-4 font-mono text-xs">
                  <code>{createRecipientSnippet}</code>
                </pre>
              </div>
            </div>

            {/* Initiate Transfer */}
            <div className="space-y-3 border-t border-zinc-100 pt-4 dark:border-zinc-900">
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-zinc-900 dark:text-white">
                <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                  POST
                </span>
                <code>/transfers</code>
              </h3>
              <p className="text-zinc-550 text-xs leading-relaxed dark:text-zinc-400">
                Initiate a bank transfer. Supports explicit routing via the
                optional{" "}
                <code className="font-mono text-sky-500">provider</code> field.
                If omitted, uses the project&apos;s default provider. If the
                selected provider fails, Paye automatically falls back to
                alternative active configs. Can resolve account names
                dynamically. Requires private API Key authentication.
              </p>
              <div className="relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-[#222] dark:bg-[#111]">
                <pre className="text-sky-650 dark:text-sky-450 overflow-x-auto p-4 font-mono text-xs">
                  <code>{initiateTransferSnippet}</code>
                </pre>
              </div>
            </div>
          </section>

          {/* Section 7: Billing API */}
          <section id="billing-api" className="scroll-mt-20 space-y-6">
            <div className="flex items-center gap-2 border-b border-zinc-200 pb-2 dark:border-[#222]">
              <FileText className="h-5 w-5 text-sky-500" />
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Billing, Plans & Subscriptions API
              </h2>
            </div>

            {/* List Plans */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-zinc-900 dark:text-white">
                <span className="rounded border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-500">
                  GET
                </span>
                <code>/plans</code>
              </h3>
              <p className="text-zinc-550 text-xs">
                List all created billing plans scoped to the current project
                context. Requires private API Key authentication.
              </p>
              <div className="relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-[#222] dark:bg-[#111]">
                <pre className="text-sky-650 dark:text-sky-455 overflow-x-auto p-4 font-mono text-xs">
                  <code>{listPlansSnippet}</code>
                </pre>
              </div>
            </div>

            {/* Create Subscription */}
            <div className="space-y-3 border-t border-zinc-100 pt-4 dark:border-zinc-900">
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-zinc-900 dark:text-white">
                <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                  POST
                </span>
                <code>/subscriptions</code>
              </h3>
              <p className="text-zinc-550 text-xs leading-relaxed dark:text-zinc-400">
                Create a recurring customer subscription using a saved
                authorization code (automatically gathered from a previous
                success checkout charge event on file). Requires private API Key
                authentication.
              </p>
              <div className="relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-[#222] dark:bg-[#111]">
                <pre className="text-sky-650 dark:text-sky-455 overflow-x-auto p-4 font-mono text-xs">
                  <code>{createSubSnippet}</code>
                </pre>
              </div>
            </div>
          </section>

          {/* Section 8: Support */}
          <section
            id="support"
            className="scroll-mt-20 space-y-4 border-t border-zinc-200 pt-8 text-sm dark:border-[#222]"
          >
            <h3 className="font-bold text-zinc-900 dark:text-white">
              Need Help?
            </h3>
            <p className="leading-relaxed text-zinc-500 dark:text-zinc-400">
              If you have any questions or want to integrate Paye into a
              specific website builder (like WordPress or Webflow), contact our
              hackathon support team inside your Slack/Discord or email us at{" "}
              <a
                href="mailto:support@paye.ng"
                className="text-sky-500 hover:underline"
              >
                support@paye.ng
              </a>
              .
            </p>
          </section>
        </main>
      </div>
    </div>
  )
}
