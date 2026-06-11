import Link from "next/link"
import { getToken } from "@/lib/cookies"
import LandingNav from "@/components/landing-nav"

export default async function Page() {
  const token = await getToken()

  return (
    <div className="min-h-screen bg-white font-sans text-[#0A0A0A] antialiased dark:bg-[#0A0A0A] dark:text-[#F9FAFB]">
      {/* NAV */}
      <LandingNav token={token} />

      {/* HERO */}
      <section className="overflow-hidden border-b border-black/[0.08] bg-white pt-24 dark:border-white/[0.08] dark:bg-[#141414]">
        <div className="mx-auto max-w-[1100px] px-8">
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
                Paystack, Flutterwave, and more from a single endpoint — and
                route dynamically.
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
                    2<span className="text-[#2563EB]">+</span>
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
                {/*<div>
                  <div className="text-[26px] font-bold tracking-[-1px]">
                    54<span className="text-[#2563EB]"> countries</span>
                  </div>
                  <div className="mt-0.5 text-[12px] text-[#9CA3AF]">
                    African market reach
                  </div>
                </div>*/}
              </div>
            </div>

            {/* Right — Africa illustration */}
            <div className="relative flex h-[520px] items-end justify-center">
              <svg
                className="absolute bottom-0 h-[520px] w-[420px]"
                viewBox="0 0 520 620"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M190,22 L238,19 L278,27 L308,21 L326,34 L332,58 L320,77 L326,96 L340,114 L346,138 L337,157 L352,175 L358,200 L349,224 L358,249 L364,280 L358,310 L346,334 L337,358 L320,382 L302,406 L283,430 L265,450 L248,468 L236,485 L223,502 L212,518 L204,534 L197,548 L191,557 L186,548 L179,534 L170,518 L158,502 L144,485 L128,466 L112,444 L96,419 L82,392 L70,363 L62,333 L57,301 L54,268 L51,235 L54,203 L60,173 L57,145 L65,124 L74,106 L84,90 L90,72 L99,56 L115,43 L134,32 L158,24 L190,22Z"
                  fill="#2563EB"
                  fillOpacity="0.055"
                  stroke="#2563EB"
                  strokeOpacity="0.18"
                  strokeWidth="1.2"
                />
                <path
                  d="M358,200 L372,190 L388,196 L380,210 L364,215 L358,200Z"
                  fill="#2563EB"
                  fillOpacity="0.055"
                  stroke="#2563EB"
                  strokeOpacity="0.15"
                  strokeWidth="1"
                />
                <ellipse
                  cx="400"
                  cy="348"
                  rx="14"
                  ry="34"
                  fill="#2563EB"
                  fillOpacity="0.05"
                  stroke="#2563EB"
                  strokeOpacity="0.12"
                  strokeWidth="1"
                  transform="rotate(-18 400 348)"
                />
                <path
                  d="M118,210 Q168,250 215,285"
                  stroke="#2563EB"
                  strokeWidth="1.2"
                  strokeOpacity="0.3"
                  fill="none"
                  strokeDasharray="5,4"
                />
                <path
                  d="M298,170 Q275,220 248,278"
                  stroke="#F5A623"
                  strokeWidth="1.2"
                  strokeOpacity="0.3"
                  fill="none"
                  strokeDasharray="5,4"
                />
                <path
                  d="M86,262 Q158,275 212,292"
                  stroke="#6B21A8"
                  strokeWidth="1"
                  strokeOpacity="0.22"
                  fill="none"
                  strokeDasharray="4,4"
                />
                <path
                  d="M110,338 Q172,318 212,302"
                  stroke="#DC2626"
                  strokeWidth="1"
                  strokeOpacity="0.22"
                  fill="none"
                  strokeDasharray="4,4"
                />
                <path
                  d="M152,150 Q188,208 218,278"
                  stroke="#10B981"
                  strokeWidth="1"
                  strokeOpacity="0.22"
                  fill="none"
                  strokeDasharray="4,4"
                />
                <circle r="3.5" fill="#2563EB" fillOpacity="0.85">
                  <animateMotion
                    dur="2.2s"
                    repeatCount="indefinite"
                    path="M118,210 Q168,250 215,285"
                  />
                </circle>
                <circle r="3.5" fill="#F5A623" fillOpacity="0.85">
                  <animateMotion
                    dur="2s"
                    repeatCount="indefinite"
                    begin="0.5s"
                    path="M298,170 Q275,220 248,278"
                  />
                </circle>
                <circle r="2" fill="#6B21A8" fillOpacity="0.6">
                  <animateMotion
                    dur="3.4s"
                    repeatCount="indefinite"
                    begin="1.1s"
                    path="M86,262 Q158,275 212,292"
                  />
                </circle>
                <circle r="2" fill="#DC2626" fillOpacity="0.5">
                  <animateMotion
                    dur="3.8s"
                    repeatCount="indefinite"
                    begin="2.2s"
                    path="M110,338 Q172,318 212,302"
                  />
                </circle>
                <circle
                  cx="234"
                  cy="293"
                  r="38"
                  fill="none"
                  stroke="#2563EB"
                  strokeOpacity="0.15"
                  strokeWidth="1"
                >
                  <animate
                    attributeName="r"
                    values="34;52;34"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="stroke-opacity"
                    values="0.2;0;0.2"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx="234" cy="293" r="33" fill="#2563EB" />
                <text
                  x="234"
                  y="288"
                  textAnchor="middle"
                  fontFamily="Inter,sans-serif"
                  fontSize="13"
                  fontWeight="700"
                  fill="#FFFFFF"
                  letterSpacing="-0.3"
                >
                  Paye
                </text>
                <text
                  x="248"
                  y="301"
                  textAnchor="middle"
                  fontFamily="Inter,sans-serif"
                  fontSize="15"
                  fontWeight="700"
                  fill="#FFFFFF"
                >
                  .
                </text>
                <g transform="translate(94,193)">
                  <circle
                    cx="0"
                    cy="0"
                    r="27"
                    fill="#FFFFFF"
                    stroke="#2563EB"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx="0"
                    cy="0"
                    r="27"
                    fill="none"
                    stroke="#2563EB"
                    strokeOpacity="0.12"
                    strokeWidth="10"
                  />
                  <text
                    x="0"
                    y="-3"
                    textAnchor="middle"
                    fontFamily="Inter,sans-serif"
                    fontSize="6.5"
                    fontWeight="700"
                    fill="#2563EB"
                    letterSpacing="0.4"
                  >
                    PAY
                  </text>
                  <text
                    x="0"
                    y="6"
                    textAnchor="middle"
                    fontFamily="Inter,sans-serif"
                    fontSize="6.5"
                    fontWeight="700"
                    fill="#2563EB"
                    letterSpacing="0.4"
                  >
                    STACK
                  </text>
                </g>
                <g transform="translate(320,152)">
                  <circle
                    cx="0"
                    cy="0"
                    r="27"
                    fill="#FFFFFF"
                    stroke="#F5A623"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx="0"
                    cy="0"
                    r="27"
                    fill="none"
                    stroke="#F5A623"
                    strokeOpacity="0.12"
                    strokeWidth="10"
                  />
                  <text
                    x="0"
                    y="-3"
                    textAnchor="middle"
                    fontFamily="Inter,sans-serif"
                    fontSize="6"
                    fontWeight="700"
                    fill="#B87515"
                    letterSpacing="0.3"
                  >
                    FLUTTER
                  </text>
                  <text
                    x="0"
                    y="6"
                    textAnchor="middle"
                    fontFamily="Inter,sans-serif"
                    fontSize="6"
                    fontWeight="700"
                    fill="#B87515"
                    letterSpacing="0.3"
                  >
                    WAVE
                  </text>
                </g>
                <g transform="translate(64,250)">
                  <circle
                    cx="0"
                    cy="0"
                    r="21"
                    fill="#FFFFFF"
                    stroke="#6B21A8"
                    strokeWidth="1.2"
                  />
                  <text
                    x="0"
                    y="-3"
                    textAnchor="middle"
                    fontFamily="Inter,sans-serif"
                    fontSize="5.5"
                    fontWeight="700"
                    fill="#6B21A8"
                  >
                    INTER
                  </text>
                  <text
                    x="0"
                    y="5"
                    textAnchor="middle"
                    fontFamily="Inter,sans-serif"
                    fontSize="5.5"
                    fontWeight="700"
                    fill="#6B21A8"
                  >
                    SWITCH
                  </text>
                </g>
                <g transform="translate(86,328)">
                  <circle
                    cx="0"
                    cy="0"
                    r="21"
                    fill="#FFFFFF"
                    stroke="#DC2626"
                    strokeWidth="1.2"
                  />
                  <text
                    x="0"
                    y="2"
                    textAnchor="middle"
                    fontFamily="Inter,sans-serif"
                    fontSize="6.5"
                    fontWeight="700"
                    fill="#DC2626"
                  >
                    REMITA
                  </text>
                </g>
                <g transform="translate(140,142)">
                  <circle
                    cx="0"
                    cy="0"
                    r="20"
                    fill="#FFFFFF"
                    stroke="#10B981"
                    strokeWidth="1.2"
                  />
                  <text
                    x="0"
                    y="2"
                    textAnchor="middle"
                    fontFamily="Inter,sans-serif"
                    fontSize="7.5"
                    fontWeight="700"
                    fill="#059669"
                  >
                    OPay
                  </text>
                </g>
                <g transform="translate(226,66)">
                  <circle
                    cx="0"
                    cy="0"
                    r="16"
                    fill="#F9FAFB"
                    stroke="#D1D5DB"
                    strokeWidth="1"
                    strokeDasharray="3,2"
                  />
                  <text
                    x="0"
                    y="1"
                    textAnchor="middle"
                    fontFamily="Inter,sans-serif"
                    fontSize="13"
                    fill="#9CA3AF"
                  >
                    +
                  </text>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20" id="how-it-works">
        <div className="mx-auto max-w-[1100px] px-8">
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
                body: "Add your Paystack and Flutterwave credentials inside the dashboard. Keys are encrypted with AES-GCM at rest — they never leave our proxy layer in plain text.",
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

      {/* PROVIDERS */}
      <section
        className="border-t border-black/[0.06] py-20 dark:border-white/[0.06]"
        id="providers"
      >
        <div className="mx-auto max-w-[1100px] space-y-8 px-8">
          <h2 className="sr-only">
            Paye supported payment providers — live and coming soon
          </h2>
          <div className="space-y-2">
            <p className="text-[11px] font-medium tracking-[0.08em] text-[#2563EB] uppercase">
              Providers
            </p>
            <h3 className="text-[32px] leading-tight font-bold tracking-tight">
              Works with the providers
              <br />
              you already use.
            </h3>
            <p className="max-w-sm text-[15px] text-[#6B7280] dark:text-[#9CA3AF]">
              Swap or add providers any time — no code changes needed.
            </p>
          </div>
          <div className="space-y-6">
            <div>
              <p className="mb-3 text-[11px] font-medium tracking-[0.06em] text-[#9CA3AF] uppercase select-none dark:text-zinc-600">
                Live now
              </p>
              <div className="flex flex-wrap gap-2">
                {["Paystack", "Flutterwave"].map((name) => (
                  <div
                    key={name}
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-1.5 select-none dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#16A34A]" />
                    <span className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200">
                      {name}
                    </span>
                    <span className="rounded-full bg-[#f0fdf4] px-2 py-0.5 text-[10px] font-medium text-[#16a34a] dark:bg-[#0f2a17]">
                      Live
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-3 text-[11px] font-medium tracking-[0.06em] text-[#9CA3AF] uppercase select-none dark:text-zinc-600">
                Coming soon — Nigeria
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Monnify",
                  "Interswitch",
                  "Remita",
                  "BudPay",
                  "GT Pay",
                  "OPay",
                ].map((name) => (
                  <div
                    key={name}
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-1.5 select-none dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                    <span className="text-[13px] font-medium text-zinc-400 dark:text-zinc-500">
                      {name}
                    </span>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-400 dark:bg-zinc-900 dark:text-zinc-600">
                      Soon
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section
        className="border-t border-b border-black/[0.06] bg-[#F3F4F6] py-20 dark:border-white/[0.06] dark:bg-[#1F1F1F]"
        id="product"
      >
        <div className="mx-auto max-w-[1100px] px-8">
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
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {[
              {
                icon: "⇄",
                title: "Unified API router",
                body: "One endpoint handles every provider. Swap gateways or route dynamically without touching your integration code.",
              },
              {
                icon: "🔒",
                title: "AES-GCM encryption",
                body: "Gateway credentials are encrypted at rest. Original keys never leave our proxy layer — your secrets stay secret.",
              },
              {
                icon: "⚡",
                title: "Webhook proxies",
                body: "Intercept, validate, and forward webhook events from any provider. One endpoint handles all provider callbacks.",
              },
              {
                icon: "📊",
                title: "Transaction audit logs",
                body: "Every payment, every event — logged with payload details, webhook status, and provider response timelines.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-[14px] border border-black/[0.08] bg-white p-6 transition-colors hover:border-black/[0.12] dark:border-white/[0.08] dark:bg-[#141414] dark:hover:border-white/[0.12]"
              >
                <div className="mb-4 flex h-[38px] w-[38px] items-center justify-center rounded-[8px] bg-[#EFF6FF] text-[18px] dark:bg-[#1E3A5F]">
                  {f.icon}
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
        <div className="mx-auto max-w-[1100px] px-8">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-[11px] font-medium tracking-[0.08em] text-[#2563EB] uppercase">
                For businesses
              </p>
              <h2 className="mb-6 text-[36px] leading-[1.12] font-bold tracking-[-1px]">
                Maximize revenue.
                <br />
                Minimize payment friction.
              </h2>
              <p className="mb-4 text-[15px] leading-[1.65] text-[#6B7280] dark:text-[#9CA3AF]">
                Technical outages and gateway suspensions shouldn't halt your
                operations. Paye gives your business redundant, secure, and
                smart transaction routing across Africa's leading payment
                providers.
              </p>
              <p className="mb-8 text-[15px] leading-[1.65] text-[#6B7280] dark:text-[#9CA3AF]">
                Maintain complete flexibility over your financial stack,
                optimize acceptance rates, and split payment traffic dynamically
                without writing custom code for every vendor.
              </p>
              <Link
                href="/signup"
                className="inline-block rounded-[10px] bg-[#2563EB] px-7 py-3.5 text-[15px] font-medium text-white transition-all hover:bg-[#1D4ED8]"
              >
                Start free trial →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-5">
              {[
                {
                  title: "Failover routing",
                  body: "Automatically shift traffic to alternative gateways if your primary processor experiences downtime.",
                },
                {
                  title: "Lower transaction fees",
                  body: "Intelligently direct transactions to gateways with the best processing rates for each payment type.",
                },
                {
                  title: "Multicurrency settlement",
                  body: "Accept NGN, GHS, KES, and USD, routing settlements to your preferred regional merchant channels.",
                },
                {
                  title: "Fraud mitigation",
                  body: "Verify transaction status and webhooks from multiple gateways to prevent duplicate charges or double payouts.",
                },
              ].map((c) => (
                <div
                  key={c.title}
                  className="rounded-[14px] border border-black/[0.08] bg-white p-6 dark:border-white/[0.08] dark:bg-[#141414]"
                >
                  <h4 className="mb-2 text-[14px] font-semibold">{c.title}</h4>
                  <p className="text-[13px] leading-[1.6] text-[#6B7280] dark:text-[#9CA3AF]">
                    {c.body}
                  </p>
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
        <div className="mx-auto max-w-[1100px] px-8">
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
                Switch from Paystack to Flutterwave by changing one field. Your
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
                <span className="text-[#86EFAC]">"paystack"</span>
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
        <div className="mx-auto max-w-[1100px] px-8">
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
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-4 px-8">
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
