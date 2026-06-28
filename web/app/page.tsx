import Image from "next/image"
import Link from "next/link"
import { getToken } from "@/lib/cookies"
import LandingNav from "@/components/landing-nav"
import { BACKEND_URL } from "@/lib/config"
import { ArrowLeftRight, ShieldCheck, Zap, BarChart3, TrendingUp, RefreshCw, Globe2, AlertTriangle } from "lucide-react"

export default async function Page() {
  const token = await getToken()

  let userCount = 0
  try {
    const res = await fetch(`${BACKEND_URL}/users/count`, {
      next: { revalidate: 30 },
    })
    const json = await res.json()
    if (res.ok && json.status) {
      userCount = json.data.count
    }
  } catch (err) {
    // Fail silently
  }

  // Providers data — live and coming soon
  const liveProviders = [
    {
      name: "Paystack",
      description: "Nigeria's most trusted payment gateway. Accept cards, bank transfers, USSD and more.",
      logo: "/provider-logos/Paystack/Paystack_idSL4BuSLF_0.svg",
      color: "#00C3F7",
      bgColor: "#F0FEFF",
      darkBg: "#0a2030",
      tag: "Live",
      features: ["Card payments", "Bank transfers", "Subscriptions", "Refunds"],
    },
    {
      name: "Flutterwave",
      description: "Pan-African payment infrastructure. 30+ currencies, 150+ payment methods across Africa.",
      logo: null,
      logoText: "Flutterwave",
      color: "#F5A623",
      bgColor: "#FFFBF0",
      darkBg: "#2a1f00",
      tag: "Live",
      features: ["Multi-currency", "Card payments", "Mobile money", "Transfers"],
    },
    {
      name: "Nomba",
      description: "Nigeria's next-gen payment network. Virtual accounts, POS, and real-time settlements.",
      logo: "/provider-logos/Nomba/Nomba_idgTwBzT7P_6.svg",
      color: "#7C3AED",
      bgColor: "#F5F3FF",
      darkBg: "#1a0a30",
      tag: "Live",
      features: ["Virtual accounts", "Checkout", "Webhooks", "Reconciliation"],
    },
    {
      name: "OPay",
      description: "High-volume payment processing with deep penetration across Nigeria's agent banking network.",
      logo: "/provider-logos/OPay/OPay_id6sbCso4N_2.svg",
      color: "#10B981",
      bgColor: "#F0FDF4",
      darkBg: "#0a2018",
      tag: "Live",
      features: ["Checkout", "USSD", "Agent banking", "Transfers"],
    },
  ]

  const comingSoonProviders = [
    {
      name: "Monnify",
      logo: "/provider-logos/Monnify/Monnify_idd_hoTCde_1.svg",
      description: "Bank-backed collection infrastructure by Moniepoint.",
    },
    {
      name: "Interswitch",
      logo: "/provider-logos/Interswitch_Group/Interswitch_Group_Logo_0.svg",
      description: "Africa's pioneer digital payments and commerce company.",
    },
    {
      name: "Remita",
      logo: "/provider-logos/Remita/Remita_idXg6YFMnd_0.png",
      description: "Government and enterprise payment collection platform.",
    },
    {
      name: "BudPay",
      logo: "/provider-logos/Budpay/idr-wnZYrY_logos.png",
      description: "Modern fintech payment gateway for Africa.",
    },
  ]

  return (
    <div className="min-h-screen bg-white font-sans text-[#0A0A0A] antialiased dark:bg-[#0A0A0A] dark:text-[#F9FAFB]">
      {/* NAV */}
      <LandingNav token={token} />

      {/* HERO */}
      <section className="overflow-hidden border-b border-black/[0.08] bg-white pt-24 dark:border-white/[0.08] dark:bg-[#141414]">
        <div className="mx-auto max-w-[1280px] px-5">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            {/* Left */}
            <div className="pb-24">
              <h1 className="mb-6 text-[56px] leading-[1.06] font-bold tracking-[-2px] text-[#0A0A0A] dark:text-[#F9FAFB]">
                One API.
                <br />
                Every African
                <br />
                payment <em className="text-[#2563EB] not-italic">provider.</em>
              </h1>
              <p className="mb-10 max-w-[420px] text-[17px] leading-[1.65] text-[#6B7280] dark:text-[#9CA3AF]">
                Stop rewriting payment logic for every gateway. Integrate
                Paystack, Flutterwave, Nomba and more from a single endpoint —
                switch providers without touching your code.
              </p>
              <div className="mb-16 flex flex-wrap gap-3">
                <Link
                  href={token ? "/dashboard" : "/signup"}
                  className="rounded-[10px] bg-[#2563EB] px-7 py-3.5 text-[15px] font-medium text-white transition-all hover:bg-[#1D4ED8] active:scale-[0.98]"
                >
                  Start building free
                </Link>
                <a
                  href="#how-it-works"
                  className="rounded-[10px] border border-black/[0.12] px-7 py-3.5 text-[15px] font-medium text-[#6B7280] transition-all hover:bg-[#F3F4F6] dark:border-white/[0.12] dark:text-[#9CA3AF] dark:hover:bg-[#1F1F1F]"
                >
                  How it works →
                </a>
              </div>
              <div className="flex gap-12 border-t border-black/[0.08] pt-8 dark:border-white/[0.08]">
                <div>
                  <div className="text-[26px] font-bold tracking-[-1px]">
                    4<span className="text-[#2563EB]">+</span>
                  </div>
                  <div className="mt-0.5 text-[12px] text-[#9CA3AF]">
                    Payment providers
                  </div>
                </div>
                <div>
                  <div className="text-[26px] font-bold tracking-[-1px]">
                    1<span className="text-[#2563EB]"> API</span>
                  </div>
                  <div className="mt-0.5 text-[12px] text-[#9CA3AF]">
                    Single integration
                  </div>
                </div>
                <div>
                  <div className="text-[26px] font-bold tracking-[-1px]">
                    {userCount}<span className="text-[#2563EB]"> merchants</span>
                  </div>
                  <div className="mt-0.5 text-[12px] text-[#9CA3AF]">
                    Active on platform
                  </div>
                </div>
              </div>
            </div>

            {/* Right — Africa illustration with real logos */}
            <div className="relative flex h-[640px] items-end justify-center">
              <svg
                className="absolute bottom-0 h-[640px] w-[520px]"
                viewBox="0 0 520 620"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Glow filters */}
                  <filter id="glow-blue" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="6" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                  <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="5" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                  <filter id="glow-amber" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="5" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                  <filter id="glow-purple" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                  <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                  {/* Clip paths for logo circles */}
                  <clipPath id="clip-paystack"><circle cx="0" cy="0" r="18"/></clipPath>
                  <clipPath id="clip-flutterwave"><circle cx="0" cy="0" r="18"/></clipPath>
                  <clipPath id="clip-nomba"><circle cx="0" cy="0" r="14"/></clipPath>
                  <clipPath id="clip-opay"><circle cx="0" cy="0" r="14"/></clipPath>
                </defs>

                {/* Africa continent fill */}
                <path
                  d="M190,22 L238,19 L278,27 L308,21 L326,34 L332,58 L320,77 L326,96 L340,114 L346,138 L337,157 L352,175 L358,200 L349,224 L358,249 L364,280 L358,310 L346,334 L337,358 L320,382 L302,406 L283,430 L265,450 L248,468 L236,485 L223,502 L212,518 L204,534 L197,548 L191,557 L186,548 L179,534 L170,518 L158,502 L144,485 L128,466 L112,444 L96,419 L82,392 L70,363 L62,333 L57,301 L54,268 L51,235 L54,203 L60,173 L57,145 L65,124 L74,106 L84,90 L90,72 L99,56 L115,43 L134,32 L158,24 L190,22Z"
                  fill="#2563EB" fillOpacity="0.055" stroke="#2563EB" strokeOpacity="0.18" strokeWidth="1.2"
                />
                <path d="M358,200 L372,190 L388,196 L380,210 L364,215 L358,200Z" fill="#2563EB" fillOpacity="0.055" stroke="#2563EB" strokeOpacity="0.15" strokeWidth="1"/>
                <ellipse cx="400" cy="348" rx="14" ry="34" fill="#2563EB" fillOpacity="0.05" stroke="#2563EB" strokeOpacity="0.12" strokeWidth="1" transform="rotate(-18 400 348)"/>

                {/* Connection lines */}
                <path d="M118,210 Q168,250 215,285" stroke="#00C3F7" strokeWidth="1.5" strokeOpacity="0.35" fill="none" strokeDasharray="6,4"/>
                <path d="M298,170 Q275,220 248,278" stroke="#F5A623" strokeWidth="1.5" strokeOpacity="0.35" fill="none" strokeDasharray="6,4"/>
                <path d="M80,258 Q158,272 210,290" stroke="#7C3AED" strokeWidth="1.2" strokeOpacity="0.3" fill="none" strokeDasharray="5,4"/>
                <path d="M104,334 Q168,314 210,300" stroke="#10B981" strokeWidth="1.2" strokeOpacity="0.3" fill="none" strokeDasharray="5,4"/>

                {/* Animated data packets */}
                <circle r="4" fill="#00C3F7" fillOpacity="0.9" filter="url(#glow-cyan)">
                  <animateMotion dur="2.2s" repeatCount="indefinite" path="M118,210 Q168,250 215,285"/>
                </circle>
                <circle r="4" fill="#F5A623" fillOpacity="0.9" filter="url(#glow-amber)">
                  <animateMotion dur="2s" repeatCount="indefinite" begin="0.5s" path="M298,170 Q275,220 248,278"/>
                </circle>
                <circle r="3" fill="#7C3AED" fillOpacity="0.8" filter="url(#glow-purple)">
                  <animateMotion dur="3.2s" repeatCount="indefinite" begin="1.1s" path="M80,258 Q158,272 210,290"/>
                </circle>
                <circle r="3" fill="#10B981" fillOpacity="0.8" filter="url(#glow-green)">
                  <animateMotion dur="3.6s" repeatCount="indefinite" begin="2.2s" path="M104,334 Q168,314 210,300"/>
                </circle>

                {/* Center Paye node — pulsing rings */}
                <circle cx="234" cy="293" r="50" fill="none" stroke="#2563EB" strokeOpacity="0.08" strokeWidth="1">
                  <animate attributeName="r" values="46;64;46" dur="3.5s" repeatCount="indefinite"/>
                  <animate attributeName="stroke-opacity" values="0.12;0;0.12" dur="3.5s" repeatCount="indefinite"/>
                </circle>
                <circle cx="234" cy="293" r="40" fill="none" stroke="#2563EB" strokeOpacity="0.12" strokeWidth="1">
                  <animate attributeName="r" values="38;54;38" dur="3s" repeatCount="indefinite"/>
                  <animate attributeName="stroke-opacity" values="0.18;0;0.18" dur="3s" repeatCount="indefinite"/>
                </circle>
                <circle cx="234" cy="293" r="34" fill="#2563EB" filter="url(#glow-blue)"/>
                <text x="234" y="299" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="13" fontWeight="700" fill="#FFFFFF" letterSpacing="-0.3">Paye<tspan fill="#93C5FD">.</tspan></text>

                {/* Paystack node — real logo */}
                <g transform="translate(94,193)">
                  <circle cx="0" cy="0" r="32" fill="#00C3F7" fillOpacity="0.08" filter="url(#glow-cyan)"/>
                  <circle cx="0" cy="0" r="28" fill="#FFFFFF" stroke="#00C3F7" strokeWidth="2"/>
                  <image href="/provider-logos/Paystack/Paystack_idSL4BuSLF_0.svg" x="-16" y="-16" width="32" height="32" clipPath="url(#clip-paystack)"/>
                </g>

                {/* Flutterwave node — text logo (no SVG available in that format) */}
                <g transform="translate(320,152)">
                  <circle cx="0" cy="0" r="32" fill="#F5A623" fillOpacity="0.08" filter="url(#glow-amber)"/>
                  <circle cx="0" cy="0" r="28" fill="#FFFBF0" stroke="#F5A623" strokeWidth="2"/>
                  <text x="0" y="-3" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="6" fontWeight="800" fill="#C27A0E" letterSpacing="0.5">FLUTTER</text>
                  <text x="0" y="7" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="6" fontWeight="800" fill="#C27A0E" letterSpacing="0.5">WAVE</text>
                </g>

                {/* Nomba node — real logo */}
                <g transform="translate(64,250)">
                  <circle cx="0" cy="0" r="26" fill="#7C3AED" fillOpacity="0.08" filter="url(#glow-purple)"/>
                  <circle cx="0" cy="0" r="22" fill="#FFFFFF" stroke="#7C3AED" strokeWidth="1.8"/>
                  <image href="/provider-logos/Nomba/Nomba_idgTwBzT7P_6.svg" x="-13" y="-13" width="26" height="26" clipPath="url(#clip-nomba)"/>
                </g>

                {/* OPay node — real logo */}
                <g transform="translate(86,328)">
                  <circle cx="0" cy="0" r="26" fill="#10B981" fillOpacity="0.08" filter="url(#glow-green)"/>
                  <circle cx="0" cy="0" r="22" fill="#FFFFFF" stroke="#10B981" strokeWidth="1.8"/>
                  <image href="/provider-logos/OPay/OPay_id6sbCso4N_2.svg" x="-13" y="-13" width="26" height="26" clipPath="url(#clip-opay)"/>
                </g>

                {/* More providers node */}
                <g transform="translate(148,140)">
                  <circle cx="0" cy="0" r="16" fill="#F9FAFB" stroke="#D1D5DB" strokeWidth="1" strokeDasharray="3,2"/>
                  <text x="0" y="4" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="14" fill="#9CA3AF">+</text>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20" id="how-it-works">
        <div className="mx-auto max-w-[1280px] px-5">
          <div className="mb-14">
            <p className="mb-3 text-[11px] font-medium tracking-[0.08em] text-[#2563EB] uppercase">
              How it works
            </p>
            <h2 className="mb-4 text-[38px] leading-[1.12] font-bold tracking-[-1px]">
              Set up in three steps.
            </h2>
            <p className="max-w-[460px] text-[16px] leading-[1.65] text-[#6B7280] dark:text-[#9CA3AF]">
              No boilerplate. No provider-specific SDKs. One clean API contract
              that works across gateways.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                n: "1",
                title: "Connect your gateways",
                body: "Add your Paystack, Flutterwave, or Nomba credentials inside the dashboard. Keys are encrypted with AES-GCM at rest — they never leave our proxy layer in plain text.",
              },
              {
                n: "2",
                title: "Integrate once",
                body: "Call a single Paye API endpoint for every payment action — initialize, verify, refund, transfer. We normalize the response shape across all providers.",
              },
              {
                n: "3",
                title: "Route and go live",
                body: "Payments route to the best available provider automatically. Switch, failover, or split traffic from the dashboard — no code changes needed.",
              },
            ].map((s) => (
              <div
                key={s.n}
                className="rounded-[14px] border border-black/[0.08] bg-white p-7 dark:border-white/[0.08] dark:bg-[#141414]"
              >
                <div className="mb-5 flex h-[34px] w-[34px] items-center justify-center rounded-[8px] border border-[#BFDBFE] bg-[#EFF6FF] text-[13px] font-bold text-[#2563EB] dark:border-[#1D4ED8] dark:bg-[#1E3A5F]">
                  {s.n}
                </div>
                <h3 className="mb-2 text-[15px] font-semibold">{s.title}</h3>
                <p className="text-[13px] leading-[1.6] text-[#6B7280] dark:text-[#9CA3AF]">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCT PREVIEW */}
      <section className="border-t border-black/[0.06] bg-[#F8F9FB] py-20 dark:border-white/[0.06] dark:bg-[#0D0D0D]">
        <div className="mx-auto max-w-[1280px] px-5">
          <div className="mb-10">
            <p className="mb-3 text-[11px] font-medium tracking-[0.08em] text-[#2563EB] uppercase">Dashboard</p>
            <h2 className="mb-3 text-[38px] leading-[1.12] font-bold tracking-[-1px]">Everything in one place.</h2>
            <p className="max-w-[460px] text-[15px] leading-[1.65] text-[#6B7280] dark:text-[#9CA3AF]">
              Manage providers, watch transactions flow in real time, inspect webhook logs — all from a single clean dashboard.
            </p>
          </div>

          {/* Browser frame mockup */}
          <div className="overflow-hidden rounded-[20px] border border-black/[0.10] shadow-2xl shadow-black/[0.08] dark:border-white/[0.08] dark:shadow-black/[0.4]">
            {/* Browser chrome */}
            <div className="flex h-10 items-center gap-3 border-b border-black/[0.08] bg-[#F1F3F5] px-4 dark:border-white/[0.06] dark:bg-[#1A1A1A]">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-[#FF5F57]"/>
                <span className="h-3 w-3 rounded-full bg-[#FFBD2E]"/>
                <span className="h-3 w-3 rounded-full bg-[#28C840]"/>
              </div>
              <div className="flex flex-1 items-center justify-center">
                <div className="flex h-6 items-center gap-1.5 rounded-[6px] bg-white px-3 text-[11px] text-[#9CA3AF] dark:bg-[#2A2A2A] dark:text-[#555]">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1a4 4 0 1 0 0 8A4 4 0 0 0 5 1z" stroke="#9CA3AF" strokeWidth="1"/><path d="M5 3v2l1.5 1" stroke="#9CA3AF" strokeWidth="1" strokeLinecap="round"/></svg>
                  paye.africa/dashboard
                </div>
              </div>
            </div>

            {/* Dashboard UI */}
            <div className="flex bg-white dark:bg-[#111]" style={{minHeight: 420}}>

              {/* Sidebar */}
              <div className="hidden w-[180px] shrink-0 flex-col border-r border-black/[0.06] bg-[#FAFAFA] px-3 py-4 sm:flex dark:border-white/[0.06] dark:bg-[#141414]">
                <div className="mb-6 px-2 text-[15px] font-bold tracking-[-0.5px]">Paye<span className="text-[#2563EB]">.</span></div>
                {[
                  { icon: "▣", label: "Overview", active: true },
                  { icon: "↕", label: "Transactions", active: false },
                  { icon: "⚡", label: "Webhooks", active: false },
                  { icon: "⊞", label: "Providers", active: false },
                  { icon: "≡", label: "Logs", active: false },
                ].map((item) => (
                  <div key={item.label} className={`mb-0.5 flex items-center gap-2.5 rounded-[8px] px-2 py-2 text-[12px] ${
                    item.active
                      ? "bg-[#EFF6FF] font-semibold text-[#2563EB] dark:bg-[#1E3A5F]"
                      : "text-[#6B7280] dark:text-[#555]"
                  }`}>
                    <span className="text-[14px]">{item.icon}</span>
                    {item.label}
                  </div>
                ))}
              </div>

              {/* Main content */}
              <div className="flex-1 overflow-hidden p-5">
                {/* Header row */}
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[16px] font-bold tracking-tight">Overview</p>
                    <p className="text-[11px] text-[#9CA3AF]">June 2026</p>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full border border-[#BBF7D0] bg-[#F0FDF4] px-3 py-1 text-[11px] font-semibold text-[#16A34A] dark:border-[#14532D] dark:bg-[#0f2a17]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]"/>
                    Live mode
                  </div>
                </div>

                {/* Stats row */}
                <div className="mb-5 grid grid-cols-3 gap-3">
                  {[
                    { label: "Total Volume", value: "₦2,481,500", sub: "+12.4% this week", color: "text-[#16A34A]" },
                    { label: "Transactions", value: "1,249", sub: "124 today", color: "text-[#2563EB]" },
                    { label: "Success Rate", value: "98.2%", sub: "↑ 0.4% vs last week", color: "text-[#16A34A]" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-[12px] border border-black/[0.06] bg-white p-3.5 dark:border-white/[0.06] dark:bg-[#1A1A1A]">
                      <p className="mb-1 text-[10px] text-[#9CA3AF] uppercase tracking-wide">{stat.label}</p>
                      <p className="text-[18px] font-bold tracking-tight">{stat.value}</p>
                      <p className={`text-[10px] font-medium ${stat.color}`}>{stat.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Active provider */}
                <div className="mb-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Active Provider</p>
                  <div className="flex items-center justify-between rounded-[12px] border border-[#EDE9FE] bg-[#F5F3FF] px-4 py-3 dark:border-[#3B0764] dark:bg-[#1a0a30]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-white dark:bg-[#2a1a40]">
                        <Image src="/provider-logos/Nomba/Nomba_idgTwBzT7P_6.svg" alt="Nomba" width={20} height={20} className="object-contain"/>
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold">Nomba</p>
                        <p className="text-[10px] text-[#9CA3AF]">Virtual accounts · Checkout · Webhooks</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-[#7C3AED]"><span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]"/>Active</span>
                      <div className="rounded-[6px] border border-black/[0.08] bg-white px-2.5 py-1 text-[10px] font-medium text-[#6B7280] dark:bg-[#2a2a2a] dark:text-[#888]">Swap →</div>
                    </div>
                  </div>
                </div>

                {/* Recent transactions */}
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Recent Transactions</p>
                  <div className="overflow-hidden rounded-[12px] border border-black/[0.06] dark:border-white/[0.06]">
                    {[
                      { ref: "paye_ref_8f2a", email: "ada@acme.io", amount: "₦12,500", status: "SUCCESS", provider: "Nomba", color: "text-[#16A34A] bg-[#F0FDF4]" },
                      { ref: "paye_ref_3d1c", email: "bola@store.ng", amount: "₦5,000", status: "SUCCESS", provider: "Paystack", color: "text-[#16A34A] bg-[#F0FDF4]" },
                      { ref: "paye_ref_9e4b", email: "chi@market.io", amount: "₦8,200", status: "PENDING", provider: "Nomba", color: "text-[#B45309] bg-[#FFFBEB]" },
                    ].map((tx, i) => (
                      <div key={tx.ref} className={`flex items-center justify-between px-4 py-2.5 text-[11px] ${
                        i < 2 ? "border-b border-black/[0.04] dark:border-white/[0.04]" : ""
                      } bg-white dark:bg-[#141414]`}>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[10px] text-[#6B7280]">{tx.ref}</span>
                          <span className="hidden text-[#9CA3AF] sm:block">{tx.email}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">{tx.amount}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${tx.color}`}>{tx.status}</span>
                          <span className="hidden text-[10px] text-[#9CA3AF] sm:block">{tx.provider}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROVIDERS — Big Cards */}
      <section
        className="border-t border-black/[0.06] py-20 dark:border-white/[0.06]"
        id="providers"
      >
        <div className="mx-auto max-w-[1280px] px-5">
          <div className="mb-12">
            <p className="mb-3 text-[11px] font-medium tracking-[0.08em] text-[#2563EB] uppercase">
              Providers
            </p>
            <h2 className="mb-4 text-[38px] leading-tight font-bold tracking-[-1px]">
              Works with the providers
              <br />
              you already use.
            </h2>
            <p className="max-w-sm text-[15px] text-[#6B7280] dark:text-[#9CA3AF]">
              Swap or add providers any time — no code changes needed.
            </p>
          </div>

          {/* Live provider big cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {liveProviders.map((p) => (
              <div
                key={p.name}
                className="group relative overflow-hidden rounded-[18px] border border-black/[0.08] bg-white p-6 transition-all hover:shadow-lg hover:-translate-y-0.5 dark:border-white/[0.08] dark:bg-[#141414]"
              >
                {/* Live badge */}
                <span className="absolute top-4 right-4 rounded-full bg-[#f0fdf4] px-2.5 py-1 text-[10px] font-semibold text-[#16a34a] dark:bg-[#0f2a17]">
                  ● Live
                </span>

                {/* Logo area */}
                <div
                  className="mb-5 flex h-[56px] w-[56px] items-center justify-center rounded-[14px]"
                  style={{ backgroundColor: p.bgColor }}
                >
                  {p.logo ? (
                    <Image
                      src={p.logo}
                      alt={`${p.name} logo`}
                      width={34}
                      height={34}
                      className="object-contain"
                    />
                  ) : (
                    <span className="text-[11px] font-bold" style={{ color: p.color }}>
                      {p.logoText}
                    </span>
                  )}
                </div>

                <h3 className="mb-1.5 text-[17px] font-bold tracking-[-0.3px]">{p.name}</h3>
                <p className="mb-5 text-[13px] leading-[1.55] text-[#6B7280] dark:text-[#9CA3AF]">
                  {p.description}
                </p>

                {/* Feature list */}
                <ul className="space-y-1.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="text-[12px] text-[#6B7280] dark:text-[#9CA3AF]">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* Bottom accent line */}
                <div
                  className="absolute bottom-0 left-0 h-[3px] w-full opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ backgroundColor: p.color }}
                />
              </div>
            ))}
          </div>

          {/* Coming soon — smaller cards */}
          <div className="mt-8">
            <p className="mb-4 text-[11px] font-medium tracking-[0.06em] text-[#9CA3AF] uppercase select-none dark:text-zinc-600">
              Coming soon
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {comingSoonProviders.map((p) => (
                <div
                  key={p.name}
                  className="flex items-center gap-3 rounded-[14px] border border-dashed border-black/[0.10] bg-[#FAFAFA] px-4 py-4 dark:border-white/[0.06] dark:bg-[#111]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-white border border-black/[0.08] dark:bg-[#1a1a1a] dark:border-white/[0.06]">
                    <Image
                      src={p.logo}
                      alt={`${p.name} logo`}
                      width={24}
                      height={24}
                      className="object-contain grayscale opacity-50"
                    />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-zinc-400 dark:text-zinc-500">{p.name}</p>
                    <p className="text-[10px] text-zinc-300 dark:text-zinc-600 leading-tight">{p.description.slice(0, 30)}…</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HACKATHONS */}
      <section className="border-t border-black/[0.06] bg-[#F3F4F6] py-20 dark:border-white/[0.06] dark:bg-[#111]">
        <div className="mx-auto max-w-[1280px] px-5">
          <div className="mb-12">
            <p className="mb-3 text-[11px] font-medium tracking-[0.08em] text-[#2563EB] uppercase">
              Recognition
            </p>
            <h2 className="mb-4 text-[38px] leading-[1.12] font-bold tracking-[-1px]">
              Built in the arena.
            </h2>
            <p className="max-w-[500px] text-[15px] leading-[1.65] text-[#6B7280] dark:text-[#9CA3AF]">
              Paye has been submitted to and recognized at competitive fintech hackathons — putting unified payment infrastructure in front of Africa's top innovators and investors.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* OPay */}
            <div className="relative overflow-hidden rounded-[18px] border border-black/[0.08] bg-white p-7 dark:border-white/[0.08] dark:bg-[#141414]">
              <div className="mb-5 flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] bg-[#F0FDF4]">
                  <Image
                    src="/provider-logos/OPay/OPay_id6sbCso4N_2.svg"
                    alt="OPay logo"
                    width={36}
                    height={36}
                    className="object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-[17px] font-bold tracking-[-0.3px]">OPay National Innovation Challenge</h3>
                  <p className="text-[12px] text-[#9CA3AF]">2026 · Nigeria</p>
                </div>
              </div>
              <p className="mb-4 text-[14px] leading-[1.65] text-[#6B7280] dark:text-[#9CA3AF]">
                Part of OPay's ₦1.2 billion scholars programme in partnership with Google and Nigeria's 3MTT initiative. Paye was submitted to tackle real fintech infrastructure problems — unified payment routing as a solution for Nigerian developers.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#F0FDF4] px-3 py-1 text-[11px] font-medium text-[#16a34a]">Fintech Track</span>
                <span className="rounded-full bg-[#F0FDF4] px-3 py-1 text-[11px] font-medium text-[#16a34a]">Google Partnership</span>
                <span className="rounded-full bg-[#F0FDF4] px-3 py-1 text-[11px] font-medium text-[#16a34a]">₦10M Grant Prize</span>
              </div>
              <a
                href="https://www.opayweb.com/innovation-challenge"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-1 text-[13px] font-medium text-[#2563EB] hover:underline"
              >
                View challenge →
              </a>
            </div>

            {/* Nomba */}
            <div className="relative overflow-hidden rounded-[18px] border border-black/[0.08] bg-white p-7 dark:border-white/[0.08] dark:bg-[#141414]">
              <div className="mb-5 flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] bg-[#F5F3FF]">
                  <Image
                    src="/provider-logos/Nomba/Nomba_idgTwBzT7P_6.svg"
                    alt="Nomba logo"
                    width={36}
                    height={36}
                    className="object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-[17px] font-bold tracking-[-0.3px]">Nomba Developer Challenge</h3>
                  <p className="text-[12px] text-[#9CA3AF]">2026 · Nigeria</p>
                </div>
              </div>
              <p className="mb-4 text-[14px] leading-[1.65] text-[#6B7280] dark:text-[#9CA3AF]">
                Paye is entered in Nomba's developer innovation challenge, demonstrating deep integration of Nomba's virtual account and checkout APIs. Our unified abstraction layer gives Nigerian developers a frictionless migration path to Nomba — without rewriting their payment logic.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#F5F3FF] px-3 py-1 text-[11px] font-medium text-[#7C3AED]">Virtual Accounts</span>
                <span className="rounded-full bg-[#F5F3FF] px-3 py-1 text-[11px] font-medium text-[#7C3AED]">Deep Integration</span>
                <span className="rounded-full bg-[#F5F3FF] px-3 py-1 text-[11px] font-medium text-[#7C3AED]">Infrastructure</span>
              </div>
              <a
                href="https://nomba.com"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-1 text-[13px] font-medium text-[#2563EB] hover:underline"
              >
                Learn about Nomba →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section
        className="border-t border-b border-black/[0.06] py-20 dark:border-white/[0.06]"
        id="product"
      >
        <div className="mx-auto max-w-[1280px] px-5">
          <div className="mb-14">
            <p className="mb-3 text-[11px] font-medium tracking-[0.08em] text-[#2563EB] uppercase">
              Platform
            </p>
            <h2 className="text-[38px] leading-[1.12] font-bold tracking-[-1px]">
              Everything your payment
              <br />
              infrastructure needs.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {([
              {
                Icon: ArrowLeftRight,
                title: "Unified API router",
                body: "One endpoint handles every provider. Swap gateways or route dynamically without touching your integration code.",
              },
              {
                Icon: ShieldCheck,
                title: "AES-GCM encryption",
                body: "Gateway credentials are encrypted at rest. Original keys never leave our proxy layer — your secrets stay secret.",
              },
              {
                Icon: Zap,
                title: "Webhook proxies",
                body: "Intercept, validate, and forward webhook events from any provider. One endpoint handles all provider callbacks.",
              },
              {
                Icon: BarChart3,
                title: "Transaction audit logs",
                body: "Every payment, every event — logged with payload details, webhook status, and provider response timelines.",
              },
            ] as const).map((f) => (
              <div
                key={f.title}
                className="rounded-[14px] border border-black/[0.08] bg-white p-6 transition-colors hover:border-black/[0.12] dark:border-white/[0.08] dark:bg-[#141414] dark:hover:border-white/[0.12]"
              >
                <div className="mb-4 flex h-[38px] w-[38px] items-center justify-center rounded-[8px] bg-[#EFF6FF] dark:bg-[#1E3A5F]">
                  <f.Icon className="h-[18px] w-[18px] text-[#2563EB]" strokeWidth={1.8} />
                </div>
                <h3 className="mb-1.5 text-[14px] font-semibold">{f.title}</h3>
                <p className="text-[13px] leading-[1.6] text-[#6B7280] dark:text-[#9CA3AF]">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOR BUSINESSES */}
      <section className="py-20" id="business">
        <div className="mx-auto max-w-[1280px] px-5">
          {/* Top label + headline */}
          <div className="mb-12 max-w-[560px]">
            <p className="mb-3 text-[11px] font-medium tracking-[0.08em] text-[#2563EB] uppercase">For businesses</p>
            <h2 className="mb-4 text-[42px] leading-[1.08] font-bold tracking-[-1.5px]">
              Built for revenue.
              <br />
              <span className="text-[#6B7280]"> Not for downtime. </span>
            </h2>
            <p className="text-[16px] leading-[1.65] text-[#6B7280] dark:text-[#9CA3AF]">
              African payment gateways go down. Keys get suspended. Paye keeps your checkout running by routing intelligently across providers — without a single line of code change from your team.
            </p>
          </div>

          {/* Main grid: dark metrics panel + feature list */}
          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-5">

            {/* Left: dark stat panel */}
            <div className="relative overflow-hidden rounded-[20px] bg-[#0A0A0A] p-8 lg:col-span-2 dark:bg-[#0D0D0D] dark:border dark:border-white/[0.06]">
              {/* Subtle grid bg */}
              <div className="pointer-events-none absolute inset-0" style={{
                backgroundImage: "radial-gradient(circle at 80% 20%, rgba(37,99,235,0.18) 0%, transparent 60%), linear-gradient(180deg, rgba(37,99,235,0.04) 0%, transparent 100%)"
              }}/>
              <p className="mb-8 text-[11px] font-semibold tracking-[0.1em] text-white/40 uppercase">What Paye delivers</p>
              <div className="grid grid-cols-2 gap-5">
                {[
                  { value: "99.9%", label: "Uptime SLA", sub: "Multi-provider failover" },
                  { value: "4×", label: "Providers", sub: "Live and routing" },
                  { value: "<2s", label: "Switch time", sub: "Zero code change" },
                  { value: "100%", label: "Audit log", sub: "Every transaction" },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-[30px] font-bold tracking-[-1px] text-white">{s.value}</p>
                    <p className="text-[12px] font-semibold text-white/70">{s.label}</p>
                    <p className="text-[11px] text-white/35">{s.sub}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-[10px] bg-[#2563EB] px-6 py-3 text-[14px] font-semibold text-white transition-all hover:bg-[#1D4ED8]"
                >
                  Start free trial
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7.5 4l3.5 3-3.5 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </Link>
              </div>
            </div>

            {/* Right: feature rows */}
            <div className="flex flex-col gap-4 lg:col-span-3">
              {([
                {
                  Icon: RefreshCw,
                  color: "#2563EB",
                  bg: "#EFF6FF",
                  darkBg: "#1E3A5F",
                  title: "Automatic failover routing",
                  body: "If Paystack times out or Nomba returns a 5xx, Paye instantly re-routes your transaction to the next available provider — in under 2 seconds, invisible to your user.",
                },
                {
                  Icon: TrendingUp,
                  color: "#16A34A",
                  bg: "#F0FDF4",
                  darkBg: "#0f2a17",
                  title: "Lower effective processing fees",
                  body: "Route high-volume card transactions to Nomba, bank transfers to Paystack. Pick the cheapest processor per payment type without writing any conditional logic.",
                },
                {
                  Icon: Globe2,
                  color: "#7C3AED",
                  bg: "#F5F3FF",
                  darkBg: "#1a0a30",
                  title: "Multi-currency settlement",
                  body: "Accept NGN, GHS, KES and USD today. Paye normalises currency handling across gateways — your checkout code never changes when you expand to a new market.",
                },
                {
                  Icon: AlertTriangle,
                  color: "#B45309",
                  bg: "#FFFBEB",
                  darkBg: "#2a1800",
                  title: "Fraud and duplicate-charge protection",
                  body: "Webhook signatures are verified per-provider. Duplicate transaction references are rejected. Double payouts and phantom charges are blocked at the proxy layer.",
                },
              ] as const).map((f) => (
                <div
                  key={f.title}
                  className="flex gap-4 rounded-[16px] border border-black/[0.07] bg-white p-5 transition-shadow hover:shadow-md dark:border-white/[0.07] dark:bg-[#141414]"
                >
                  <div
                    className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]"
                    style={{ background: f.bg }}
                  >
                    <f.Icon className="h-5 w-5" style={{ color: f.color }} strokeWidth={1.8}/>
                  </div>
                  <div>
                    <h4 className="mb-1 text-[14px] font-semibold tracking-[-0.2px]">{f.title}</h4>
                    <p className="text-[13px] leading-[1.65] text-[#6B7280] dark:text-[#9CA3AF]">{f.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOR DEVELOPERS */}
      <section
        className="border-t border-black/[0.06] py-20 dark:border-white/[0.06]"
        id="developers"
      >
        <div className="mx-auto max-w-[1280px] px-5">
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-[11px] font-medium tracking-[0.08em] text-[#2563EB] uppercase">
                For developers
              </p>
              <h2 className="mb-4 text-[36px] leading-[1.12] font-bold tracking-[-1px]">
                Clean API.
                <br />
                Zero boilerplate.
              </h2>
              <p className="mb-4 text-[15px] leading-[1.65] text-[#6B7280] dark:text-[#9CA3AF]">
                One request initializes a payment across any provider. The
                response shape is always the same — no per-gateway parsing.
              </p>
              <p className="mb-8 text-[15px] leading-[1.65] text-[#6B7280] dark:text-[#9CA3AF]">
                Switch from Paystack to Nomba by changing one field. Your
                server code stays exactly the same.
              </p>
              <Link
                href="/docs"
                className="inline-block rounded-[10px] bg-[#2563EB] px-7 py-3.5 text-[15px] font-medium text-white transition-all hover:bg-[#1D4ED8]"
              >
                Read the docs →
              </Link>
            </div>
            <div className="overflow-hidden rounded-[14px] bg-[#0F172A] p-6">
              <p className="mb-4 font-mono text-[10px] font-medium tracking-[0.08em] text-[#475569] uppercase">
                POST /api/v1/transactions/initialize
              </p>
              <pre className="overflow-x-auto font-mono text-[12.5px] leading-[1.85] whitespace-pre text-[#CBD5E1]">
                <span className="text-[#93C5FD]">X-API-Key</span>
                <span className="text-[#64748B]">: </span>
                <span className="text-[#86EFAC]">paye_live_••••a52</span>
                {"\n\n"}
                <span className="text-[#64748B]">{"{"}</span>
                {"\n"}
                {"  "}
                <span className="text-[#FCA5A5]">"amount"</span>
                <span className="text-[#64748B]">: </span>
                <span className="text-[#86EFAC]">12500</span>
                <span className="text-[#64748B]">,</span>
                {"\n"}
                {"  "}
                <span className="text-[#FCA5A5]">"email"</span>
                <span className="text-[#64748B]">: </span>
                <span className="text-[#86EFAC]">"user@email.com"</span>
                <span className="text-[#64748B]">,</span>
                {"\n"}
                {"  "}
                <span className="text-[#FCA5A5]">"provider"</span>
                <span className="text-[#64748B]">: </span>
                <span className="text-[#86EFAC]">"nomba"</span>
                <span className="text-[#64748B]">,</span>
                {"\n"}
                {"  "}
                <span className="text-[#FCA5A5]">"currency"</span>
                <span className="text-[#64748B]">: </span>
                <span className="text-[#86EFAC]">"NGN"</span>
                {"\n"}
                <span className="text-[#64748B]">{"}"}</span>
                {"\n\n"}
                <span className="text-[#64748B]">← 200 OK</span>
                {"\n"}
                <span className="text-[#64748B]">{"{"}</span>
                {"\n"}
                {"  "}
                <span className="text-[#FCA5A5]">"status"</span>
                <span className="text-[#64748B]">: </span>
                <span className="text-[#86EFAC]">"success"</span>
                <span className="text-[#64748B]">,</span>
                {"\n"}
                {"  "}
                <span className="text-[#FCA5A5]">"checkout_url"</span>
                <span className="text-[#64748B]">: </span>
                <span className="text-[#86EFAC]">"https://..."</span>
                <span className="text-[#64748B]">,</span>
                {"\n"}
                {"  "}
                <span className="text-[#FCA5A5]">"reference"</span>
                <span className="text-[#64748B]">: </span>
                <span className="text-[#86EFAC]">"paye_ref_92x98"</span>
                {"\n"}
                <span className="text-[#64748B]">{"}"}</span>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-black/[0.08] bg-white py-24 text-center dark:border-white/[0.08] dark:bg-[#141414]">
        <div className="mx-auto max-w-[1280px] px-5">
          <h2 className="mb-4 text-[42px] font-bold tracking-[-1px]">
            Start routing payments
            <br />
            in minutes.
          </h2>
          <p className="mb-10 text-[16px] text-[#6B7280] dark:text-[#9CA3AF]">
            Free to start. No credit card required.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-[10px] bg-[#2563EB] px-7 py-3.5 text-[15px] font-medium text-white transition-all hover:bg-[#1D4ED8]"
            >
              Create free account
            </Link>
            <Link
              href="/docs"
              className="rounded-[10px] border border-black/[0.12] px-7 py-3.5 text-[15px] font-medium text-[#6B7280] transition-all hover:bg-[#F3F4F6] dark:border-white/[0.12] dark:text-[#9CA3AF] dark:hover:bg-[#1F1F1F]"
            >
              Read the docs
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-black/[0.08] bg-[#F9FAFB] py-8 dark:border-white/[0.08] dark:bg-[#0A0A0A]">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 px-5">
          <Link href="/" className="text-[16px] font-bold tracking-[-0.5px]">
            Paye<span className="text-[#2563EB]">.</span>
          </Link>
          <p className="text-[13px] text-[#9CA3AF]">
            © 2026 Paye. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="text-[13px] text-[#9CA3AF] transition-colors hover:text-[#6B7280]"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-[13px] text-[#9CA3AF] transition-colors hover:text-[#6B7280]"
            >
              Terms
            </Link>
            <Link
              href="/docs"
              className="text-[13px] text-[#9CA3AF] transition-colors hover:text-[#6B7280]"
            >
              Docs
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
