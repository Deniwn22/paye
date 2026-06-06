import Link from "next/link"
import { getToken } from "@/lib/cookies"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Lock,
  Code,
  Link2,
  LayoutDashboard,
  Settings,
  CreditCard,
} from "lucide-react"
import HeroIllustration from "@/components/hero-illustration"

export default async function Page() {
  const token = await getToken()

  return (
    <div className="min-h-screen bg-white font-sans text-[#0f172a] transition-colors duration-300 selection:bg-[#0ea5e9]/20 selection:text-[#0ea5e9] dark:bg-[#0a0a0a] dark:text-[#f8fafc]">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-[#e2e8f0] bg-white transition-colors duration-300 dark:border-[#1e293b] dark:bg-[#0a0a0a]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="group flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0ea5e9] text-base font-black text-white shadow-sm transition-transform group-hover:scale-105">
                P
              </span>
              <span className="text-lg font-extrabold tracking-tight text-[#0f172a] dark:text-white">
                Paye
              </span>
            </Link>
          </div>

          {/* Center: Links */}
          <nav className="hidden items-center gap-8 text-sm font-semibold text-[#64748b] md:flex dark:text-[#94a3b8]">
            <a
              href="#product"
              className="transition-colors hover:text-[#0ea5e9]"
            >
              Product
            </a>
            <a
              href="#pricing"
              className="transition-colors hover:text-[#0ea5e9]"
            >
              Pricing
            </a>
            <Link
              href="/docs"
              className="transition-colors hover:text-[#0ea5e9]"
            >
              Docs
            </Link>
            <a href="#about" className="transition-colors hover:text-[#0ea5e9]">
              About
            </a>
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {token ? (
              <Link
                href="/dashboard"
                className="rounded-lg bg-[#0ea5e9] px-4.5 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#0ea5e9]/90"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="text-sm font-semibold text-[#64748b] transition-colors hover:text-[#0f172a] dark:text-[#94a3b8] dark:hover:text-white"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-[#0ea5e9] px-4.5 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#0ea5e9]/90"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="mx-auto max-w-7xl space-y-24 px-6 pt-16 pb-24">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-12">
          {/* Left Column Copy */}
          <div className="space-y-6 lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#0ea5e9]/10 px-3 py-1.5 text-xs font-bold text-[#0ea5e9]">
              <span>Now supporting Paystack & Flutterwave</span>
            </div>

            <h1 className="text-4xl leading-[1.1] font-black tracking-tight text-[#0f172a] md:text-6xl dark:text-white">
              One integration. Every African payment provider.
            </h1>

            <p className="max-w-xl text-sm leading-relaxed text-[#64748b] md:text-base dark:text-[#94a3b8]">
              Stop writing payment code for every provider. Connect Paystack,
              Flutterwave and more from one dashboard. Add payments to any
              website with one line of code.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href={token ? "/dashboard" : "/signup"}
                className="rounded-lg bg-[#0ea5e9] px-6.5 py-4 text-sm font-extrabold text-white shadow-sm transition-all hover:bg-[#0ea5e9]/90"
              >
                Start for free
              </Link>
              <a
                href="#how-it-works"
                className="rounded-lg border border-[#e2e8f0] px-6.5 py-4 text-sm font-bold text-[#64748b] transition-all hover:bg-[#f8fafc] dark:border-[#1e293b] dark:text-[#94a3b8] dark:hover:bg-[#111]"
              >
                See how it works
              </a>
            </div>

            <div className="pt-4 text-sm font-semibold text-[#94a3b8]">
              Trusted by Nigerian developers and businesses
            </div>
          </div>

          {/* Right Column Custom SVG Orbit */}
          <div className="flex flex-col items-center lg:col-span-5">
            <HeroIllustration />
          </div>
        </div>

        {/* How It Works Section */}
        <section
          id="how-it-works"
          className="scroll-mt-20 border-t border-[#e2e8f0] pt-20 dark:border-[#1e293b]"
        >
          <div className="mx-auto mb-16 max-w-md space-y-2 text-center">
            <h2 className="text-3xl font-black tracking-tight text-[#0f172a] dark:text-white">
              Set up in three steps
            </h2>
            <p className="text-sm text-[#64748b] dark:text-[#94a3b8]">
              Get your checkout live without structural delays.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="relative space-y-4 overflow-hidden rounded-2xl border border-[#e2e8f0]/60 bg-[#f8fafc] p-6 dark:border-[#1e293b]/60 dark:bg-[#111111]">
              <div className="absolute top-2 right-4 text-6xl font-black text-zinc-200/50 select-none dark:text-zinc-800/20">
                1
              </div>
              <div className="flex h-32 w-full items-center justify-center rounded-xl border border-[#e2e8f0]/40 bg-white dark:border-[#1e293b]/40 dark:bg-[#0a0a0a]">
                {/* Step 1 SVG: Connect credentials */}
                <svg
                  width="100"
                  height="70"
                  viewBox="0 0 100 70"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="10"
                    y="10"
                    width="80"
                    height="50"
                    rx="6"
                    fill="var(--background)"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="dark:text-zinc-850 text-zinc-200"
                  />
                  <rect
                    x="20"
                    y="22"
                    width="20"
                    height="6"
                    rx="2"
                    fill="#0ea5e9"
                  />
                  <rect
                    x="45"
                    y="22"
                    width="35"
                    height="6"
                    rx="2"
                    fill="var(--secondary)"
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-zinc-300 dark:text-zinc-800"
                  />
                  <rect
                    x="20"
                    y="38"
                    width="20"
                    height="6"
                    rx="2"
                    fill="#0ea5e9"
                  />
                  <rect
                    x="45"
                    y="38"
                    width="35"
                    height="6"
                    rx="2"
                    fill="var(--secondary)"
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-zinc-300 dark:text-zinc-800"
                  />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-extrabold text-[#0f172a] dark:text-white">
                  Connect your providers
                </h3>
                <p className="text-sm leading-relaxed text-[#64748b] dark:text-[#94a3b8]">
                  Paste your Paystack or Flutterwave keys into the Paye
                  dashboard. Takes 2 minutes.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative space-y-4 overflow-hidden rounded-2xl border border-[#e2e8f0]/60 bg-[#f8fafc] p-6 dark:border-[#1e293b]/60 dark:bg-[#111111]">
              <div className="absolute top-2 right-4 text-6xl font-black text-zinc-200/50 select-none dark:text-zinc-800/20">
                2
              </div>
              <div className="flex h-32 w-full items-center justify-center rounded-xl border border-[#e2e8f0]/40 bg-white dark:border-[#1e293b]/40 dark:bg-[#0a0a0a]">
                {/* Step 2 SVG: Code Script tag */}
                <svg
                  width="100"
                  height="70"
                  viewBox="0 0 100 70"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="10"
                    y="10"
                    width="80"
                    height="50"
                    rx="6"
                    fill="var(--background)"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="dark:text-zinc-850 text-zinc-200"
                  />
                  <path
                    d="M 22 25 L 15 35 L 22 45 M 78 25 L 85 35 L 78 45"
                    stroke="#0ea5e9"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <rect
                    x="30"
                    y="32"
                    width="40"
                    height="6"
                    rx="3"
                    fill="#0ea5e9"
                  />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-extrabold text-[#0f172a] dark:text-white">
                  Get your embed code
                </h3>
                <p className="text-sm leading-relaxed text-[#64748b] dark:text-[#94a3b8]">
                  Copy one script tag unique to your account. Paste it anywhere
                  on your website.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative space-y-4 overflow-hidden rounded-2xl border border-[#e2e8f0]/60 bg-[#f8fafc] p-6 dark:border-[#1e293b]/60 dark:bg-[#111111]">
              <div className="absolute top-2 right-4 text-6xl font-black text-zinc-200/50 select-none dark:text-zinc-800/20">
                3
              </div>
              <div className="flex h-32 w-full items-center justify-center rounded-xl border border-[#e2e8f0]/40 bg-white dark:border-[#1e293b]/40 dark:bg-[#0a0a0a]">
                {/* Step 3 SVG: Complete Checklist */}
                <svg
                  width="100"
                  height="70"
                  viewBox="0 0 100 70"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="50"
                    cy="35"
                    r="24"
                    fill="#10b981"
                    fillOpacity="0.1"
                  />
                  <circle cx="50" cy="35" r="18" fill="#10b981" />
                  <path
                    d="M 44 35 L 48 39 L 57 30"
                    stroke="#ffffff"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-extrabold text-[#0f172a] dark:text-white">
                  Accept payments
                </h3>
                <p className="text-sm leading-relaxed text-[#64748b] dark:text-[#94a3b8]">
                  Your customers see a clean checkout. You see every transaction
                  in your dashboard.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Who It's For Section */}
        <section className="border-t border-[#e2e8f0] pt-20 dark:border-[#1e293b]">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Left Card: Developers */}
            <div className="flex h-90 flex-col justify-between space-y-6 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-8 dark:border-[#1e293b] dark:bg-[#111111]">
              <div className="space-y-4">
                <span className="text-xs font-bold tracking-wider text-[#0ea5e9] uppercase">
                  For Developers
                </span>
                <h3 className="text-2xl font-black tracking-tight text-[#0f172a] dark:text-white">
                  One API. All providers. Zero boilerplate.
                </h3>
              </div>
              <div className="flex-1 overflow-x-auto rounded-xl border border-[#e2e8f0] bg-white p-4 font-mono text-xs leading-relaxed font-semibold text-[#0ea5e9] select-all dark:border-[#1e293b] dark:bg-[#0a0a0a]">
                <pre>
                  {`POST /api/v1/transactions/initialize
X-API-Key: paye_xxxx

{
  "amount": 5000,
  "email": "user@email.com",
  "provider": "paystack"
}`}
                </pre>
              </div>
            </div>

            {/* Right Card: Non-tech Founders */}
            <div className="flex h-90 flex-col justify-between space-y-6 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-8 dark:border-[#1e293b] dark:bg-[#111111]">
              <div className="space-y-4">
                <span className="text-xs font-bold tracking-wider text-[#0ea5e9] uppercase">
                  For Non-Technical Founders
                </span>
                <h3 className="text-2xl font-black tracking-tight text-[#0f172a] dark:text-white">
                  No code. No backend. Just paste and go.
                </h3>
              </div>
              <div className="flex flex-1 flex-col justify-between overflow-x-auto rounded-xl border border-[#e2e8f0] bg-white p-4 select-all dark:border-[#1e293b] dark:bg-[#0a0a0a]">
                <pre className="font-mono text-xs leading-relaxed text-[#0ea5e9]">
                  {`<script src="https://paye.ng/sdk/YOUR_ID.js"></script>`}
                </pre>
                <div className="mt-4 border-t border-[#e2e8f0] pt-2 text-sm font-semibold text-[#64748b] select-none dark:border-[#1e293b] dark:text-[#94a3b8]">
                  {"That's it. Payments are live."}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t border-[#e2e8f0] pt-20 dark:border-[#1e293b]">
          <div className="mx-auto mb-16 max-w-md space-y-2 text-center">
            <h2 className="text-3xl font-black tracking-tight text-[#0f172a] dark:text-white">
              Everything you need to accept payments
            </h2>
            <p className="text-sm text-[#64748b] dark:text-[#94a3b8]">
              Robust platform essentials focused entirely on business
              operations.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Feature 1 */}
            <div className="space-y-3.5 rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm dark:border-[#1e293b] dark:bg-zinc-900/10">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0ea5e9]/10 text-[#0ea5e9]">
                <Code className="h-4.5 w-4.5" />
              </div>
              <h4 className="text-base font-extrabold text-[#0f172a] dark:text-white">
                Unified API
              </h4>
              <p className="text-sm leading-relaxed text-[#64748b] dark:text-[#94a3b8]">
                One endpoint for all providers. Never rebuild checkout layers if
                you swap underlying channels.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="space-y-3.5 rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm dark:border-[#1e293b] dark:bg-zinc-900/10">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0ea5e9]/10 text-[#0ea5e9]">
                <Lock className="h-4.5 w-4.5" />
              </div>
              <h4 className="text-base font-extrabold text-[#0f172a] dark:text-white">
                Encrypted Key Storage
              </h4>
              <p className="text-sm leading-relaxed text-[#64748b] dark:text-[#94a3b8]">
                Your provider keys never leave our servers in plaintext. All
                secrets are cryptographically shielded.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="space-y-3.5 rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm dark:border-[#1e293b] dark:bg-zinc-900/10">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0ea5e9]/10 text-[#0ea5e9]">
                <Link2 className="h-4.5 w-4.5" />
              </div>
              <h4 className="text-base font-extrabold text-[#0f172a] dark:text-white">
                Webhook Proxy
              </h4>
              <p className="text-sm leading-relaxed text-[#64748b] dark:text-[#94a3b8]">
                Give providers your Paye URL, keep your private backend secure
                from unauthorized exposures.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="space-y-3.5 rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm dark:border-[#1e293b] dark:bg-zinc-900/10">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0ea5e9]/10 text-[#0ea5e9]">
                <LayoutDashboard className="h-4.5 w-4.5" />
              </div>
              <h4 className="text-base font-extrabold text-[#0f172a] dark:text-white">
                Transaction Dashboard
              </h4>
              <p className="text-sm leading-relaxed text-[#64748b] dark:text-[#94a3b8]">
                Every payment, every status, in one place. Standardized logs
                across Paystack and Flutterwave.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="space-y-3.5 rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm dark:border-[#1e293b] dark:bg-zinc-900/10">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0ea5e9]/10 text-[#0ea5e9]">
                <CreditCard className="h-4.5 w-4.5" />
              </div>
              <h4 className="text-base font-extrabold text-[#0f172a] dark:text-white">
                No-code Embed
              </h4>
              <p className="text-sm leading-relaxed text-[#64748b] dark:text-[#94a3b8]">
                One script tag, full checkout experience. Create checkout
                buttons instantly on plain HTML.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="space-y-3.5 rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm dark:border-[#1e293b] dark:bg-zinc-900/10">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0ea5e9]/10 text-[#0ea5e9]">
                <Settings className="h-4.5 w-4.5" />
              </div>
              <h4 className="text-base font-extrabold text-[#0f172a] dark:text-white">
                Provider Switching
              </h4>
              <p className="text-sm leading-relaxed text-[#64748b] dark:text-[#94a3b8]">
                Toggle providers on or off without touching code. Shift traffic
                dynamically inside the dashboard.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e2e8f0] bg-[#f8fafc] py-12 text-sm text-[#64748b] transition-colors duration-300 dark:border-[#1e293b] dark:bg-[#111111] dark:text-[#94a3b8]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0ea5e9] text-base font-black text-white shadow-sm">
              P
            </span>
            <span className="text-base font-extrabold text-[#0f172a] dark:text-white">
              Paye
            </span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[#0ea5e9]">
              Product
            </a>
            <a href="#" className="hover:text-[#0ea5e9]">
              Pricing
            </a>
            <a href="#" className="hover:text-[#0ea5e9]">
              Docs
            </a>
            <a href="#" className="hover:text-[#0ea5e9]">
              About
            </a>
          </div>
          <p>© {new Date().getFullYear()} Paye. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
