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
  RefreshCw,
  FileText,
  Send,
  Star,
  Zap,
} from "lucide-react"
import HeroIllustration from "@/components/hero-illustration"
import InteractiveSimulator from "@/components/interactive-simulator"

export default async function Page() {
  const token = await getToken()

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-sky-500/20 selection:text-sky-500 bg-grid-pattern bg-mesh-radial relative overflow-hidden transition-colors duration-300">
      
      {/* Dynamic ambient lights in background */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-sky-500/5 dark:bg-sky-500/10 blur-[120px] -z-10" />
      <div className="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-[150px] -z-10" />

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/70 backdrop-blur-md transition-all duration-300">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="group flex items-center gap-2.5 select-none">
              <span className="text-lg font-black tracking-tight text-foreground">
                Paye<span className="text-sky-500 font-medium">.</span>
              </span>
            </Link>
          </div>

          {/* Center: Links */}
          <nav className="hidden items-center gap-8 text-xs font-bold uppercase tracking-wider text-muted-foreground md:flex">
            <a href="#product" className="transition-colors hover:text-sky-500 dark:hover:text-sky-400">
              Product
            </a>
            <a href="#how-it-works" className="transition-colors hover:text-sky-500 dark:hover:text-sky-400">
              How It Works
            </a>
            <a href="#simulator" className="transition-colors hover:text-sky-500 dark:hover:text-sky-400">
              Simulator
            </a>
            <Link href="/docs" className="transition-colors hover:text-sky-500 dark:hover:text-sky-400">
              Docs
            </Link>
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {token ? (
              <Link
                href="/dashboard"
                className="rounded-xl bg-sky-500 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-sky-500/15 transition-all hover:bg-sky-450 hover:shadow-sky-500/25 active:scale-[0.98]"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="rounded-xl bg-sky-500 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-sky-500/15 transition-all hover:bg-sky-450 hover:shadow-sky-500/25 active:scale-[0.98]"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="mx-auto max-w-7xl space-y-32 px-6 pt-20 pb-32">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-12">
          
          {/* Left Column */}
          <div className="space-y-7 lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/10 border border-sky-500/20 px-3.5 py-1.5 text-xs font-bold text-sky-600 dark:text-sky-450">
              <Zap className="w-3.5 h-3.5 fill-current animate-pulse text-sky-500 dark:text-sky-400" />
              <span>Unified Gateway Router • Live Sandbox</span>
            </div>

            <h1 className="text-4xl leading-[1.1] font-black tracking-tight text-foreground md:text-[56px]">
              One API. Every African{" "}
              <span className="bg-gradient-to-r from-sky-500 to-indigo-500 dark:from-sky-400 dark:to-indigo-400 bg-clip-text text-transparent">
                payment provider.
              </span>
            </h1>

            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Stop writing payment code for every provider. Connect Paystack,
              Flutterwave, and more from one visual dashboard. Route checks dynamically, verify signatures instantly, and manage transactions seamlessly.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href={token ? "/dashboard" : "/signup"}
                className="rounded-xl bg-sky-500 px-7 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-sky-500/20 transition-all hover:bg-sky-450 hover:shadow-sky-500/30 active:scale-[0.98]"
              >
                Start Routing Free
              </Link>
              <a
                href="#how-it-works"
                className="rounded-xl border border-border bg-muted/40 px-7 py-4 text-xs font-black uppercase tracking-widest text-foreground transition-all hover:bg-muted/70 hover:text-foreground"
              >
                See how it works
              </a>
            </div>


          </div>

          {/* Right Column: Dynamic SVG Illustration */}
          <div className="flex flex-col items-center lg:col-span-5 relative">
            <div className="absolute inset-0 bg-sky-500/5 rounded-full blur-3xl -z-10" />
            <HeroIllustration />
          </div>
        </div>

        {/* Live interactive simulator wrapper */}
        <section id="simulator" className="scroll-mt-24 border-t border-border/80 pt-20">
          <div className="mx-auto mb-16 max-w-2xl text-center space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-3.5 py-1.5 text-[10px] font-bold text-sky-650 dark:text-sky-400 uppercase tracking-widest">
              Live Webhook Sandbox
            </div>
            <h2 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
              Test Webhook Routing Live
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Simulate webhook payloads from Paystack and Flutterwave, decrypt gateway API keys, verify cryptographic signatures, and proxy events instantly.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <InteractiveSimulator />
          </div>
        </section>

        {/* How It Works Section */}
        <section
          id="how-it-works"
          className="scroll-mt-24 border-t border-border/80 pt-20"
        >
          <div className="mx-auto mb-16 max-w-md space-y-3 text-center">
            <h2 className="text-3xl font-black tracking-tight text-foreground">
              Set Up In Three Steps
            </h2>
            <p className="text-sm text-muted-foreground">
              Integrate checkout buttons and webhook proxies with zero structural latency.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            
            {/* Step 1 */}
            <div className="relative space-y-5 overflow-hidden rounded-3xl border border-border bg-card p-6 hover:border-border/80 hover:shadow-sm transition-all group/step">
              <div className="absolute top-2 right-4 text-7xl font-black text-muted/30 dark:text-zinc-800/15 select-none font-mono tracking-tight group-hover/step:text-muted/40 dark:group-hover/step:text-zinc-700/20 transition-colors">
                01
              </div>
              <div className="flex h-32 w-full items-center justify-center rounded-2xl border border-border bg-muted/30 shadow-inner">
                <svg width="100" height="70" viewBox="0 0 100 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="10" y="10" width="80" height="50" rx="8" fill="var(--card)" stroke="var(--border)" strokeWidth="1.5" />
                  <rect x="22" y="24" width="22" height="6" rx="2" fill="#0ea5e9" className="opacity-80" />
                  <rect x="50" y="24" width="28" height="6" rx="2" fill="var(--border)" />
                  <rect x="22" y="38" width="22" height="6" rx="2" fill="#0ea5e9" className="opacity-80" />
                  <rect x="50" y="38" width="28" height="6" rx="2" fill="var(--border)" />
                </svg>
              </div>
              <div className="space-y-2 relative z-10">
                <h3 className="text-base font-extrabold text-foreground">
                  Connect credentials
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Save your Paystack or Flutterwave public/private keys inside the dashboard. Keys are AES-GCM encrypted.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative space-y-5 overflow-hidden rounded-3xl border border-border bg-card p-6 hover:border-border/80 hover:shadow-sm transition-all group/step">
              <div className="absolute top-2 right-4 text-7xl font-black text-muted/30 dark:text-zinc-800/15 select-none font-mono tracking-tight group-hover/step:text-muted/40 dark:group-hover/step:text-zinc-700/20 transition-colors">
                02
              </div>
              <div className="flex h-32 w-full items-center justify-center rounded-2xl border border-border bg-muted/30 shadow-inner">
                <svg width="100" height="70" viewBox="0 0 100 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="10" y="10" width="80" height="50" rx="8" fill="var(--card)" stroke="var(--border)" strokeWidth="1.5" />
                  <path d="M 24 26 L 16 35 L 24 44 M 76 26 L 84 35 L 76 44" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="32" y="32" width="36" height="6" rx="3" fill="#0ea5e9" className="opacity-50" />
                </svg>
              </div>
              <div className="space-y-2 relative z-10">
                <h3 className="text-base font-extrabold text-foreground">
                  Embed custom script
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Copy a single script tag customized for your project. Place checkout buttons anywhere on your pages.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative space-y-5 overflow-hidden rounded-3xl border border-border bg-card p-6 hover:border-border/80 hover:shadow-sm transition-all group/step">
              <div className="absolute top-2 right-4 text-7xl font-black text-muted/30 dark:text-zinc-800/15 select-none font-mono tracking-tight group-hover/step:text-muted/40 dark:group-hover/step:text-zinc-700/20 transition-colors">
                03
              </div>
              <div className="flex h-32 w-full items-center justify-center rounded-2xl border border-border bg-muted/30 shadow-inner">
                <svg width="100" height="70" viewBox="0 0 100 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="35" r="22" fill="#10b981" fillOpacity="0.1" />
                  <circle cx="50" cy="35" r="16" fill="#10b981" />
                  <path d="M 44 35 L 48 39 L 57 30" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="space-y-2 relative z-10">
                <h3 className="text-base font-extrabold text-foreground">
                  Accept payments
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Customers experience a smooth checkout overlay, while your server processes incoming secure webhook proxies.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Who It's For Section */}
        <section className="border-t border-border/85 pt-20">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            
            {/* Left Card: Developers */}
            <div className="flex flex-col justify-between rounded-3xl border border-border bg-card p-8 shadow-sm hover:border-border/85 transition-all">
              <div className="space-y-3">
                <span className="text-[10px] font-bold tracking-widest text-sky-600 dark:text-sky-450 uppercase">
                  For Developers
                </span>
                <h3 className="text-2xl font-black tracking-tight text-foreground">
                  One API contract. No boilerplates.
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
                  Initialize payments, confirm webhooks, and map transaction structures dynamically across gateways.
                </p>
              </div>
              <div className="mt-8 rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-zinc-950 p-5 font-mono text-[11px] leading-relaxed text-sky-400 overflow-x-auto shadow-inner">
                <pre>
                  {`POST /api/v1/transactions/initialize
X-API-Key: paye_live_••••a52

{
  "amount": 12500,
  "email": "customer@paye.ng",
  "provider": "paystack",
  "currency": "NGN"
}`}
                </pre>
              </div>
            </div>

            {/* Right Card: Non-tech Founders */}
            <div className="flex flex-col justify-between rounded-3xl border border-border bg-card p-8 shadow-sm hover:border-border/85 transition-all">
              <div className="space-y-3">
                <span className="text-[10px] font-bold tracking-widest text-sky-600 dark:text-sky-450 uppercase">
                  For Non-Tech Teams
                </span>
                <h3 className="text-2xl font-black tracking-tight text-foreground">
                  Zero backend code. Simple script tags.
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
                  Add custom checkout buttons on Webflow, Wix, or standard HTML sites without spinning up servers.
                </p>
              </div>
              <div className="mt-8 flex flex-col justify-between rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-zinc-950 p-5 font-mono text-[11px] leading-relaxed text-sky-400 overflow-x-auto shadow-inner">
                <pre className="select-all">
                  {`<script 
  src="https://paye.ng/sdk/paye_pub_b82a.js">
</script>`}
                </pre>
                <div className="mt-6 border-t border-zinc-900/60 pt-3 text-[11px] font-bold text-zinc-500">
                  That's it. Payments are routed instantly.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t border-border/85 pt-20">
          <div className="mx-auto mb-16 max-w-md space-y-3 text-center">
            <h2 className="text-3xl font-black tracking-tight text-foreground">
              Platform features
            </h2>
            <p className="text-sm text-muted-foreground">
              Robust operations utilities styled as modular visual layers.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            
            {/* Card 1 */}
            <div className="space-y-3 rounded-2xl border border-border bg-card p-6 hover:border-sky-500/30 transition-all group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-all">
                <Code className="h-5 w-5" />
              </div>
              <h4 className="text-base font-black text-foreground">Unified API Router</h4>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Integrate once. Swap gateways or route transactions dynamically without changing API endpoints.
              </p>
            </div>

            {/* Card 2 */}
            <div className="space-y-3 rounded-2xl border border-border bg-card p-6 hover:border-sky-500/30 transition-all group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-all">
                <Lock className="h-5 w-5" />
              </div>
              <h4 className="text-base font-black text-foreground">AES-GCM Encryption</h4>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Gateway credentials are cryptographically encrypted at rest. Original keys never leave our proxy layer.
              </p>
            </div>

            {/* Card 3 */}
            <div className="space-y-3 rounded-2xl border border-border bg-card p-6 hover:border-sky-500/30 transition-all group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-all">
                <Link2 className="h-5 w-5" />
              </div>
              <h4 className="text-base font-black text-foreground">Webhook Proxies</h4>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Intercept callback payloads, validate authenticity headers, and dispatch events safely to your servers.
              </p>
            </div>

            {/* Card 4 */}
            <div className="space-y-3 rounded-2xl border border-border bg-card p-6 hover:border-sky-500/30 transition-all group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-all">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <h4 className="text-base font-black text-foreground">Visual Audit logs</h4>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Audited transaction charts, logs, payload details, and webhook event status timelines.
              </p>
            </div>

            {/* Card 5 */}
            <div className="space-y-3 rounded-2xl border border-border bg-card p-6 hover:border-sky-500/30 transition-all group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-all">
                <CreditCard className="h-5 w-5" />
              </div>
              <h4 className="text-base font-black text-foreground">Zero-Code Embeds</h4>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Create inline checkout overlays on any plain HTML layout page by copying a short script element.
              </p>
            </div>

            {/* Card 6 */}
            <div className="space-y-3 rounded-2xl border border-border bg-card p-6 hover:border-sky-500/30 transition-all group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-all">
                <Settings className="h-5 w-5" />
              </div>
              <h4 className="text-base font-black text-foreground">Provider Switching</h4>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Toggle channels or swap routing paths inside the dashboard instantly without editing system backend code.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/40 py-14 text-xs text-muted-foreground tracking-wide">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-6 sm:flex-row">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-sky-400 to-indigo-600 text-xs font-black text-white shadow-md">
              P
            </span>
            <span className="text-sm font-black text-foreground">
              Paye<span className="text-sky-500 font-medium">.</span>
            </span>
          </div>
          <div className="flex gap-8 font-bold uppercase tracking-wider text-muted-foreground">
            <a href="#" className="hover:text-sky-500 dark:hover:text-sky-400">
              Product
            </a>
            <a href="#" className="hover:text-sky-500 dark:hover:text-sky-400">
              Pricing
            </a>
            <a href="#" className="hover:text-sky-500 dark:hover:text-sky-400">
              Docs
            </a>
            <a href="#" className="hover:text-sky-500 dark:hover:text-sky-400">
              About
            </a>
          </div>
          <p>© {new Date().getFullYear()} Paye. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
