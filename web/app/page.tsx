import Link from "next/link"
import { getToken } from "@/lib/cookies"
import { ThemeToggle } from "@/components/theme-toggle"
import { Lock, Code, Link2, LayoutDashboard, Settings, Layers, CreditCard, Check, ArrowRight } from "lucide-react"
import HeroIllustration from "@/components/hero-illustration"

export default async function Page() {
  const token = await getToken()

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-[#0f172a] dark:text-[#f8fafc] font-sans selection:bg-[#0ea5e9]/20 selection:text-[#0ea5e9] transition-colors duration-300">
      
      {/* Navigation */}
      <header className="border-b border-[#e2e8f0] dark:border-[#1e293b] bg-white dark:bg-[#0a0a0a] sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <span className="w-8 h-8 bg-[#0ea5e9] text-white flex items-center justify-center font-black text-base rounded-lg transition-transform group-hover:scale-105 shadow-sm">
                P
              </span>
              <span className="font-extrabold text-lg tracking-tight text-[#0f172a] dark:text-white">Paye</span>
            </Link>
          </div>

          {/* Center: Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#64748b] dark:text-[#94a3b8]">
            <a href="#product" className="hover:text-[#0ea5e9] transition-colors">Product</a>
            <a href="#pricing" className="hover:text-[#0ea5e9] transition-colors">Pricing</a>
            <Link href="/docs" className="hover:text-[#0ea5e9] transition-colors">Docs</Link>
            <a href="#about" className="hover:text-[#0ea5e9] transition-colors">About</a>
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {token ? (
              <Link
                href="/dashboard"
                className="px-4.5 py-2.5 bg-[#0ea5e9] hover:bg-[#0ea5e9]/90 text-white text-sm font-bold transition-all rounded-lg"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="text-sm font-semibold text-[#64748b] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-4.5 py-2.5 bg-[#0ea5e9] hover:bg-[#0ea5e9]/90 text-white text-sm font-bold transition-all rounded-lg"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-16 pb-24 space-y-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left Column Copy */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-[#0ea5e9]/10 text-[#0ea5e9]">
              <span>Now supporting Paystack & Flutterwave</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] text-[#0f172a] dark:text-white">
              One integration. Every African payment provider.
            </h1>

            <p className="text-sm md:text-base text-[#64748b] dark:text-[#94a3b8] leading-relaxed max-w-xl">
              Stop writing payment code for every provider. Connect Paystack, Flutterwave and more from one dashboard. Add payments to any website with one line of code.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href={token ? "/dashboard" : "/signup"}
                className="px-6.5 py-4 bg-[#0ea5e9] hover:bg-[#0ea5e9]/90 text-white text-sm font-extrabold transition-all rounded-lg shadow-sm"
              >
                Start for free
              </Link>
              <a
                href="#how-it-works"
                className="px-6.5 py-4 border border-[#e2e8f0] dark:border-[#1e293b] hover:bg-[#f8fafc] dark:hover:bg-[#111] text-[#64748b] dark:text-[#94a3b8] text-sm font-bold transition-all rounded-lg"
              >
                See how it works
              </a>
            </div>

            <div className="text-sm text-[#94a3b8] font-semibold pt-4">
              Trusted by Nigerian developers and businesses
            </div>
          </div>

          {/* Right Column Custom SVG Orbit */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <HeroIllustration />
          </div>
        </div>

        {/* How It Works Section */}
        <section id="how-it-works" className="border-t border-[#e2e8f0] dark:border-[#1e293b] pt-20 scroll-mt-20">
          <div className="text-center max-w-md mx-auto mb-16 space-y-2">
            <h2 className="text-3xl font-black text-[#0f172a] dark:text-white tracking-tight">Set up in three steps</h2>
            <p className="text-sm text-[#64748b] dark:text-[#94a3b8]">Get your checkout live without structural delays.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div className="space-y-4 relative p-6 bg-[#f8fafc] dark:bg-[#111111] rounded-2xl overflow-hidden border border-[#e2e8f0]/60 dark:border-[#1e293b]/60">
              <div className="absolute top-2 right-4 text-6xl font-black text-zinc-200/50 dark:text-zinc-800/20 select-none">1</div>
              <div className="w-full h-32 flex items-center justify-center bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#e2e8f0]/40 dark:border-[#1e293b]/40">
                {/* Step 1 SVG: Connect credentials */}
                <svg width="100" height="70" viewBox="0 0 100 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="10" y="10" width="80" height="50" rx="6" fill="var(--background)" stroke="currentColor" strokeWidth="1.5" className="text-zinc-200 dark:text-zinc-850" />
                  <rect x="20" y="22" width="20" height="6" rx="2" fill="#0ea5e9" />
                  <rect x="45" y="22" width="35" height="6" rx="2" fill="var(--secondary)" stroke="currentColor" strokeWidth="1" className="text-zinc-300 dark:text-zinc-800" />
                  <rect x="20" y="38" width="20" height="6" rx="2" fill="#0ea5e9" />
                  <rect x="45" y="38" width="35" height="6" rx="2" fill="var(--secondary)" stroke="currentColor" strokeWidth="1" className="text-zinc-300 dark:text-zinc-800" />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="font-extrabold text-base text-[#0f172a] dark:text-white">Connect your providers</h3>
                <p className="text-sm text-[#64748b] dark:text-[#94a3b8] leading-relaxed">
                  Paste your Paystack or Flutterwave keys into the Paye dashboard. Takes 2 minutes.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-4 relative p-6 bg-[#f8fafc] dark:bg-[#111111] rounded-2xl overflow-hidden border border-[#e2e8f0]/60 dark:border-[#1e293b]/60">
              <div className="absolute top-2 right-4 text-6xl font-black text-zinc-200/50 dark:text-zinc-800/20 select-none">2</div>
              <div className="w-full h-32 flex items-center justify-center bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#e2e8f0]/40 dark:border-[#1e293b]/40">
                {/* Step 2 SVG: Code Script tag */}
                <svg width="100" height="70" viewBox="0 0 100 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="10" y="10" width="80" height="50" rx="6" fill="var(--background)" stroke="currentColor" strokeWidth="1.5" className="text-zinc-200 dark:text-zinc-850" />
                  <path d="M 22 25 L 15 35 L 22 45 M 78 25 L 85 35 L 78 45" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="30" y="32" width="40" height="6" rx="3" fill="#0ea5e9" />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="font-extrabold text-base text-[#0f172a] dark:text-white">Get your embed code</h3>
                <p className="text-sm text-[#64748b] dark:text-[#94a3b8] leading-relaxed">
                  Copy one script tag unique to your account. Paste it anywhere on your website.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-4 relative p-6 bg-[#f8fafc] dark:bg-[#111111] rounded-2xl overflow-hidden border border-[#e2e8f0]/60 dark:border-[#1e293b]/60">
              <div className="absolute top-2 right-4 text-6xl font-black text-zinc-200/50 dark:text-zinc-800/20 select-none">3</div>
              <div className="w-full h-32 flex items-center justify-center bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#e2e8f0]/40 dark:border-[#1e293b]/40">
                {/* Step 3 SVG: Complete Checklist */}
                <svg width="100" height="70" viewBox="0 0 100 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="35" r="24" fill="#10b981" fillOpacity="0.1" />
                  <circle cx="50" cy="35" r="18" fill="#10b981" />
                  <path d="M 44 35 L 48 39 L 57 30" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="font-extrabold text-base text-[#0f172a] dark:text-white">Accept payments</h3>
                <p className="text-sm text-[#64748b] dark:text-[#94a3b8] leading-relaxed">
                  Your customers see a clean checkout. You see every transaction in your dashboard.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* Who It's For Section */}
        <section className="border-t border-[#e2e8f0] dark:border-[#1e293b] pt-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Left Card: Developers */}
            <div className="p-8 bg-[#f8fafc] dark:bg-[#111111] rounded-2xl border border-[#e2e8f0] dark:border-[#1e293b] flex flex-col justify-between h-[360px] space-y-6">
              <div className="space-y-4">
                <span className="text-xs uppercase font-bold text-[#0ea5e9] tracking-wider">For Developers</span>
                <h3 className="text-2xl font-black text-[#0f172a] dark:text-white tracking-tight">One API. All providers. Zero boilerplate.</h3>
              </div>
              <div className="flex-1 bg-white dark:bg-[#0a0a0a] border border-[#e2e8f0] dark:border-[#1e293b] p-4 rounded-xl font-mono text-xs text-[#0ea5e9] overflow-x-auto leading-relaxed select-all font-semibold">
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
            <div className="p-8 bg-[#f8fafc] dark:bg-[#111111] rounded-2xl border border-[#e2e8f0] dark:border-[#1e293b] flex flex-col justify-between h-[360px] space-y-6">
              <div className="space-y-4">
                <span className="text-xs uppercase font-bold text-[#0ea5e9] tracking-wider">For Non-Technical Founders</span>
                <h3 className="text-2xl font-black text-[#0f172a] dark:text-white tracking-tight">No code. No backend. Just paste and go.</h3>
              </div>
              <div className="flex-1 flex flex-col justify-between bg-white dark:bg-[#0a0a0a] border border-[#e2e8f0] dark:border-[#1e293b] p-4 rounded-xl overflow-x-auto select-all">
                <pre className="font-mono text-xs text-[#0ea5e9] leading-relaxed">
                  {`<script src="https://paye.ng/sdk/YOUR_ID.js"></script>`}
                </pre>
                <div className="text-sm font-semibold text-[#64748b] dark:text-[#94a3b8] mt-4 pt-2 border-t border-[#e2e8f0] dark:border-[#1e293b] select-none">
                  That's it. Payments are live.
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Features Section */}
        <section className="border-t border-[#e2e8f0] dark:border-[#1e293b] pt-20">
          <div className="text-center max-w-md mx-auto mb-16 space-y-2">
            <h2 className="text-3xl font-black text-[#0f172a] dark:text-white tracking-tight">Everything you need to accept payments</h2>
            <p className="text-sm text-[#64748b] dark:text-[#94a3b8]">Robust platform essentials focused entirely on business operations.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="space-y-3.5 p-6 bg-white dark:bg-zinc-900/10 border border-[#e2e8f0] dark:border-[#1e293b] rounded-2xl shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-[#0ea5e9]/10 flex items-center justify-center text-[#0ea5e9]">
                <Code className="w-4.5 h-4.5" />
              </div>
              <h4 className="font-extrabold text-base text-[#0f172a] dark:text-white">Unified API</h4>
              <p className="text-sm text-[#64748b] dark:text-[#94a3b8] leading-relaxed">
                One endpoint for all providers. Never rebuild checkout layers if you swap underlying channels.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="space-y-3.5 p-6 bg-white dark:bg-zinc-900/10 border border-[#e2e8f0] dark:border-[#1e293b] rounded-2xl shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-[#0ea5e9]/10 flex items-center justify-center text-[#0ea5e9]">
                <Lock className="w-4.5 h-4.5" />
              </div>
              <h4 className="font-extrabold text-base text-[#0f172a] dark:text-white">Encrypted Key Storage</h4>
              <p className="text-sm text-[#64748b] dark:text-[#94a3b8] leading-relaxed">
                Your provider keys never leave our servers in plaintext. All secrets are cryptographically shielded.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="space-y-3.5 p-6 bg-white dark:bg-zinc-900/10 border border-[#e2e8f0] dark:border-[#1e293b] rounded-2xl shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-[#0ea5e9]/10 flex items-center justify-center text-[#0ea5e9]">
                <Link2 className="w-4.5 h-4.5" />
              </div>
              <h4 className="font-extrabold text-base text-[#0f172a] dark:text-white">Webhook Proxy</h4>
              <p className="text-sm text-[#64748b] dark:text-[#94a3b8] leading-relaxed">
                Give providers your Paye URL, keep your private backend secure from unauthorized exposures.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="space-y-3.5 p-6 bg-white dark:bg-zinc-900/10 border border-[#e2e8f0] dark:border-[#1e293b] rounded-2xl shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-[#0ea5e9]/10 flex items-center justify-center text-[#0ea5e9]">
                <LayoutDashboard className="w-4.5 h-4.5" />
              </div>
              <h4 className="font-extrabold text-base text-[#0f172a] dark:text-white">Transaction Dashboard</h4>
              <p className="text-sm text-[#64748b] dark:text-[#94a3b8] leading-relaxed">
                Every payment, every status, in one place. Standardized logs across Paystack and Flutterwave.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="space-y-3.5 p-6 bg-white dark:bg-zinc-900/10 border border-[#e2e8f0] dark:border-[#1e293b] rounded-2xl shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-[#0ea5e9]/10 flex items-center justify-center text-[#0ea5e9]">
                <CreditCard className="w-4.5 h-4.5" />
              </div>
              <h4 className="font-extrabold text-base text-[#0f172a] dark:text-white">No-code Embed</h4>
              <p className="text-sm text-[#64748b] dark:text-[#94a3b8] leading-relaxed">
                One script tag, full checkout experience. Create checkout buttons instantly on plain HTML.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="space-y-3.5 p-6 bg-white dark:bg-zinc-900/10 border border-[#e2e8f0] dark:border-[#1e293b] rounded-2xl shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-[#0ea5e9]/10 flex items-center justify-center text-[#0ea5e9]">
                <Settings className="w-4.5 h-4.5" />
              </div>
              <h4 className="font-extrabold text-base text-[#0f172a] dark:text-white">Provider Switching</h4>
              <p className="text-sm text-[#64748b] dark:text-[#94a3b8] leading-relaxed">
                Toggle providers on or off without touching code. Shift traffic dynamically inside the dashboard.
              </p>
            </div>

          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e2e8f0] dark:border-[#1e293b] bg-[#f8fafc] dark:bg-[#111111] py-12 text-sm text-[#64748b] dark:text-[#94a3b8] transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 bg-[#0ea5e9] text-white flex items-center justify-center font-black text-base rounded-lg shadow-sm">
              P
            </span>
            <span className="font-extrabold text-base text-[#0f172a] dark:text-white">Paye</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[#0ea5e9]">Product</a>
            <a href="#" className="hover:text-[#0ea5e9]">Pricing</a>
            <a href="#" className="hover:text-[#0ea5e9]">Docs</a>
            <a href="#" className="hover:text-[#0ea5e9]">About</a>
          </div>
          <p>© {new Date().getFullYear()} Paye. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
