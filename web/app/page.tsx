import Link from "next/link"
import { getToken } from "@/lib/cookies"
import { ThemeToggle } from "@/components/theme-toggle"

export default async function Page() {
  const token = await getToken()

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

            :root {
              --blue: #2563EB;
              --blue-hover: #1D4ED8;
              --blue-subtle: #EFF6FF;
              --blue-border: #BFDBFE;
              --text-primary: #0A0A0A;
              --text-secondary: #6B7280;
              --text-tertiary: #9CA3AF;
              --bg-page: #F9FAFB;
              --bg-surface: #FFFFFF;
              --bg-secondary: #F3F4F6;
              --border: rgba(0,0,0,0.08);
              --border-mid: rgba(0,0,0,0.12);
              --success-bg: #F0FDF4;
              --success-text: #16A34A;
              --mono: 'Courier New', monospace;
              --radius-sm: 8px;
              --radius-md: 12px;
              --radius-lg: 14px;
            }


            /* next-themes support */
            .dark {
              --blue: #3B82F6;
              --blue-hover: #2563EB;
              --blue-subtle: #1E3A5F;
              --blue-border: #1D4ED8;
              --text-primary: #F9FAFB;
              --text-secondary: #9CA3AF;
              --text-tertiary: #6B7280;
              --bg-page: #0A0A0A;
              --bg-surface: #141414;
              --bg-secondary: #1F1F1F;
              --border: rgba(255,255,255,0.08);
              --border-mid: rgba(255,255,255,0.12);
            }

            html { scroll-behavior: smooth; }

            .home-body {
              font-family: 'Inter', sans-serif;
              background: var(--bg-page);
              color: var(--text-primary);
              line-height: 1.6;
              -webkit-font-smoothing: antialiased;
              min-h: 100-screen;
            }

            .wrap { max-width: 1100px; margin: 0 auto; padding: 0 2rem; }

            /* ── NAV ── */
            nav.home-nav {
              position: sticky; top: 0; z-index: 50;
              background: var(--bg-surface);
              border-bottom: 0.5px solid var(--border);
              padding: 0;
            }
            .nav-inner {
              display: flex; align-items: center; justify-content: space-between;
              height: 60px;
            }
            .logo {
              font-size: 19px; font-weight: 700; letter-spacing: -0.5px;
              color: var(--text-primary); text-decoration: none;
            }
            .logo span { color: #2563EB; }
            .nav-links { display: flex; align-items: center; gap: 2rem; list-style: none; }
            .nav-links a {
              font-size: 14px; color: var(--text-secondary);
              text-decoration: none; transition: color 0.15s;
            }
            .nav-links a:hover { color: var(--text-primary); }
            .nav-actions { display: flex; align-items: center; gap: 1rem; }
            .btn-ghost {
              font-size: 14px; color: var(--text-secondary);
              background: none; border: none; cursor: pointer;
              font-family: inherit; transition: color 0.15s;
              text-decoration: none; display: inline-block;
            }
            .btn-ghost:hover { color: var(--text-primary); }
            .btn-primary {
              font-size: 14px; font-weight: 500; color: #fff;
              background: #2563EB; border: none;
              padding: 8px 20px; border-radius: var(--radius-sm);
              cursor: pointer; font-family: inherit; transition: background 0.15s;
              text-decoration: none; display: inline-block;
            }
            .btn-primary:hover { background: var(--blue-hover); }

            /* ── HERO ── */
            .hero {
              padding: 6rem 0 0;
              background: var(--bg-surface);
              border-bottom: 0.5px solid var(--border);
              overflow: hidden;
            }
            .hero-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 4rem;
              align-items: center;
            }
            @media (max-width: 900px) {
              .hero-grid {
                grid-template-columns: 1fr;
                gap: 2rem;
              }
              .hero-right {
                height: 380px !important;
              }
              .africa-svg {
                width: 320px !important;
                height: 380px !important;
              }
            }
            .hero-left { padding-bottom: 6rem; }
            .hero h1 {
              font-size: 56px; font-weight: 700;
              line-height: 1.06; letter-spacing: -2px;
              color: var(--text-primary); margin-bottom: 1.5rem;
            }
            .hero h1 em { font-style: normal; color: #2563EB; }
            .hero p {
              font-size: 17px; color: var(--text-secondary);
              line-height: 1.65; max-width: 420px; margin-bottom: 2.5rem;
            }
            .hero-btns { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 4rem; }
            .btn-lg {
              font-size: 15px; font-weight: 500; color: #fff;
              background: #2563EB; border: none;
              padding: 13px 28px; border-radius: 10px;
              cursor: pointer; font-family: inherit;
              text-decoration: none; display: inline-block;
              transition: background 0.15s, transform 0.1s;
            }
            .btn-lg:hover { background: #1D4ED8; }
            .btn-lg:active { transform: scale(0.98); }
            .btn-lg-outline {
              font-size: 15px; font-weight: 500;
              color: var(--text-secondary);
              background: none;
              border: 0.5px solid var(--border-mid);
              padding: 13px 28px; border-radius: 10px;
              cursor: pointer; font-family: inherit;
              text-decoration: none; display: inline-block;
              transition: background 0.15s;
            }
            .btn-lg-outline:hover { background: var(--bg-secondary); }

            .hero-stats {
              display: flex; gap: 3rem;
              padding-top: 2rem;
              border-top: 0.5px solid var(--border);
            }
            .stat-num {
              font-size: 26px; font-weight: 700;
              letter-spacing: -1px; color: var(--text-primary);
            }
            .stat-num span { color: #2563EB; }
            .stat-label {
              font-size: 12px; color: var(--text-tertiary);
              margin-top: 3px; letter-spacing: 0.02em;
            }

            /* ── AFRICA ILLUSTRATION ── */
            .hero-right {
              position: relative;
              height: 520px;
              display: flex; align-items: flex-end; justify-content: center;
            }
            .africa-svg {
              position: absolute;
              bottom: 0;
              width: 420px;
              height: 520px;
            }

            /* ── TRUST STRIP ── */
            .trust {
              padding: 1.75rem 0;
              border-bottom: 0.5px solid var(--border);
              background: var(--bg-page);
            }
            .trust-inner { display: flex; align-items: center; gap: 2.5rem; flex-wrap: wrap; }
            .trust-label { font-size: 12px; color: var(--text-tertiary); white-space: nowrap; }
            .trust-items { display: flex; gap: 2.5rem; flex-wrap: wrap; }
            .trust-item { font-size: 14px; font-weight: 600; color: var(--text-secondary); letter-spacing: -0.3px; }
            .trust-div { width: 0.5px; height: 14px; background: var(--border-mid); }

            /* ── SECTIONS ── */
            .section { padding: 5rem 0; }
            .section-alt { background: var(--bg-secondary); border-top: 0.5px solid var(--border); border-bottom: 0.5px solid var(--border); }
            .section-eyebrow {
              font-size: 11px; font-weight: 500;
              letter-spacing: 0.08em; text-transform: uppercase;
              color: #2563EB; margin-bottom: 0.75rem;
            }
            .section-title {
              font-size: 38px; font-weight: 700;
              letter-spacing: -1px; line-height: 1.12;
              margin-bottom: 1rem;
            }
            .section-sub {
              font-size: 16px; color: var(--text-secondary);
              line-height: 1.65; max-width: 460px;
            }
            .section-header { margin-bottom: 3.5rem; }

            /* ── STEPS ── */
            .steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
            @media (max-width: 768px) {
              .steps { grid-template-columns: 1fr; }
              .features { grid-template-columns: 1fr !important; }
              .code-split { grid-template-columns: 1fr !important; }
            }
            .step {
              background: var(--bg-surface);
              border: 0.5px solid var(--border);
              border-radius: var(--radius-lg);
              padding: 1.75rem;
            }
            .step-num {
              width: 34px; height: 34px; border-radius: var(--radius-sm);
              background: var(--blue-subtle); border: 0.5px solid var(--blue-border);
              display: flex; align-items: center; justify-content: center;
              font-size: 13px; font-weight: 700; color: #2563EB;
              margin-bottom: 1.25rem;
            }
            .step h3 { font-size: 15px; font-weight: 600; margin-bottom: 0.5rem; }
            .step p { font-size: 13px; color: var(--text-secondary); line-height: 1.6; }

            /* ── FEATURES ── */
            .features { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }
            .feat {
              background: var(--bg-surface);
              border: 0.5px solid var(--border);
              border-radius: var(--radius-lg);
              padding: 1.5rem;
              transition: border-color 0.15s;
            }
            .feat:hover { border-color: var(--border-mid); }
            .feat-icon {
              width: 38px; height: 38px; border-radius: var(--radius-sm);
              background: var(--blue-subtle);
              display: flex; align-items: center; justify-content: center;
              margin-bottom: 1rem; font-size: 18px;
            }
            .feat h3 { font-size: 14px; font-weight: 600; margin-bottom: 0.4rem; }
            .feat p { font-size: 13px; color: var(--text-secondary); line-height: 1.6; }

            /* ── CODE SECTION ── */
            .code-split {
              display: grid; grid-template-columns: 1fr 1fr;
              gap: 3rem; align-items: start;
            }
            .code-prose h2 { font-size: 36px; font-weight: 700; letter-spacing: -1px; line-height: 1.12; margin-bottom: 1rem; }
            .code-prose p { font-size: 15px; color: var(--text-secondary); line-height: 1.65; margin-bottom: 1rem; }
            .code-block {
              background: #0F172A;
              border-radius: var(--radius-lg);
              padding: 1.5rem;
              overflow: hidden;
            }
            .code-block-label {
              font-size: 10px; font-weight: 500;
              text-transform: uppercase; letter-spacing: 0.08em;
              color: #475569; margin-bottom: 1rem;
              font-family: var(--mono);
            }
            .code-block pre {
              font-family: var(--mono);
              font-size: 12.5px;
              line-height: 1.85;
              color: #CBD5E1;
              white-space: pre;
              overflow-x: auto;
            }
            .ck { color: #93C5FD; }
            .cv { color: #86EFAC; }
            .cs { color: #FCA5A5; }
            .cm { color: #64748B; }

            /* ── CTA ── */
            .cta-section {
              padding: 6rem 0;
              text-align: center;
              background: var(--bg-surface);
              border-top: 0.5px solid var(--border);
            }
            .cta-section h2 {
              font-size: 42px; font-weight: 700;
              letter-spacing: -1px; margin-bottom: 1rem;
            }
            .cta-section p {
              font-size: 16px; color: var(--text-secondary);
              margin-bottom: 2.5rem;
            }
            .cta-btns { display: flex; gap: 0.75rem; justify-content: center; }

            /* ── FOOTER ── */
            footer.home-footer {
              background: var(--bg-page);
              border-top: 0.5px solid var(--border);
              padding: 2rem 0;
            }
            .footer-inner {
              display: flex; align-items: center;
              justify-content: space-between; flex-wrap: wrap; gap: 1rem;
            }
            .footer-copy { font-size: 13px; color: var(--text-tertiary); }
            .footer-links { display: flex; gap: 1.5rem; }
            .footer-links a {
              font-size: 13px; color: var(--text-tertiary);
              text-decoration: none; transition: color 0.15s;
            }
            .footer-links a:hover { color: var(--text-secondary); }

            /* ── BUSINESS ── */
            .business-grid {
              display: grid; grid-template-columns: 1fr 1fr;
              gap: 4rem; align-items: center;
            }
            @media (max-width: 900px) {
              .business-grid { grid-template-columns: 1fr; gap: 2.5rem; }
            }
            .business-prose h2 { font-size: 36px; font-weight: 700; letter-spacing: -1px; line-height: 1.12; margin-bottom: 1.5rem; }
            .business-prose p { font-size: 15px; color: var(--text-secondary); line-height: 1.65; margin-bottom: 1.5rem; }
            .business-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
            @media (max-width: 600px) {
              .business-cards { grid-template-columns: 1fr; }
            }
            .biz-card {
              background: var(--bg-surface);
              border: 0.5px solid var(--border);
              border-radius: var(--radius-lg);
              padding: 1.5rem;
            }
            .biz-card h4 { font-size: 14px; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-primary); }
            .biz-card p { font-size: 13px; color: var(--text-secondary); line-height: 1.6; }
          `,
        }}
      />

      <div className="home-body">
        {/* NAV */}
        <nav className="home-nav">
          <div className="wrap nav-inner">
            <Link href="/" className="logo">
              Paye<span>.</span>
            </Link>
            <ul className="nav-links">
              <li>
                <a href="#product">Product</a>
              </li>
              <li>
                <a href="#how-it-works">How it works</a>
              </li>
              <li>
                <a href="#business">Business</a>
              </li>
              <li>
                <a href="#developers">Developers</a>
              </li>
              <li>
                <Link href="/docs">Docs</Link>
              </li>
            </ul>
            <div className="nav-actions">
              <ThemeToggle />
              {token ? (
                <Link href="/dashboard" className="btn-primary">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/signin" className="btn-ghost">
                    Sign in
                  </Link>
                  <Link href="/signup" className="btn-primary">
                    Get started
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* HERO */}
        <section className="hero">
          <div className="wrap">
            <div className="hero-grid">
              <div className="hero-left">
                <h1>
                  One API.
                  <br />
                  Every African
                  <br />
                  payment <em>provider.</em>
                </h1>
                <p>
                  Stop rewriting payment logic for every gateway. Integrate
                  Paystack, Flutterwave, and more from a single endpoint — and
                  route dynamically.
                </p>
                <div className="hero-btns">
                  <Link href="/signup" className="btn-lg">
                    Start building free
                  </Link>
                  <a href="#how-it-works" className="btn-lg-outline">
                    How it works →
                  </a>
                </div>
                <div className="hero-stats">
                  <div>
                    <div className="stat-num">
                      2<span>+</span>
                    </div>
                    <div className="stat-label">Payment providers</div>
                  </div>
                  <div>
                    <div className="stat-num">
                      1<span> API</span>
                    </div>
                    <div className="stat-label">Single integration</div>
                  </div>
                  <div>
                    <div className="stat-num">
                      54<span> countries</span>
                    </div>
                    <div className="stat-label">African market reach</div>
                  </div>
                </div>
              </div>

              <div className="hero-right">
                <svg
                  className="africa-svg"
                  viewBox="0 0 520 620"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Africa continent */}
                  <path
                    d="
                      M190,22 L238,19 L278,27 L308,21 L326,34 L332,58 L320,77 L326,96
                      L340,114 L346,138 L337,157 L352,175 L358,200 L349,224 L358,249
                      L364,280 L358,310 L346,334 L337,358 L320,382 L302,406 L283,430
                      L265,450 L248,468 L236,485 L223,502 L212,518 L204,534 L197,548
                      L191,557 L186,548 L179,534 L170,518 L158,502 L144,485 L128,466
                      L112,444 L96,419 L82,392 L70,363 L62,333 L57,301 L54,268 L51,235
                      L54,203 L60,173 L57,145 L65,124 L74,106 L84,90 L90,72 L99,56
                      L115,43 L134,32 L158,24 L190,22Z
                    "
                    fill="#2563EB"
                    fillOpacity="0.055"
                    stroke="#2563EB"
                    strokeOpacity="0.18"
                    strokeWidth="1.2"
                  />
                  {/* Horn of Africa */}
                  <path
                    d="M358,200 L372,190 L388,196 L380,210 L364,215 L358,200Z"
                    fill="#2563EB"
                    fillOpacity="0.055"
                    stroke="#2563EB"
                    strokeOpacity="0.15"
                    strokeWidth="1"
                  />
                  {/* Madagascar */}
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

                  {/* Routing lines */}
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
                  <path
                    d="M340,258 Q300,272 256,288"
                    stroke="#10B981"
                    strokeWidth="1.2"
                    strokeOpacity="0.28"
                    fill="none"
                    strokeDasharray="5,4"
                  />
                  <path
                    d="M326,365 Q292,332 256,305"
                    stroke="#0891B2"
                    strokeWidth="1"
                    strokeOpacity="0.22"
                    fill="none"
                    strokeDasharray="4,4"
                  />
                  <path
                    d="M350,218 Q308,248 258,282"
                    stroke="#7C3AED"
                    strokeWidth="1"
                    strokeOpacity="0.2"
                    fill="none"
                    strokeDasharray="4,4"
                  />
                  <path
                    d="M195,474 Q218,398 232,312"
                    stroke="#6B7280"
                    strokeWidth="1"
                    strokeOpacity="0.18"
                    fill="none"
                    strokeDasharray="4,4"
                  />
                  <path
                    d="M138,434 Q180,380 220,308"
                    stroke="#0F766E"
                    strokeWidth="1"
                    strokeOpacity="0.18"
                    fill="none"
                    strokeDasharray="4,4"
                  />
                  <path
                    d="M268,490 Q254,408 244,310"
                    stroke="#EC4899"
                    strokeWidth="1"
                    strokeOpacity="0.18"
                    fill="none"
                    strokeDasharray="4,4"
                  />

                  {/* Animated routing dots */}
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
                  <circle r="2.5" fill="#10B981" fillOpacity="0.8">
                    <animateMotion
                      dur="2.8s"
                      repeatCount="indefinite"
                      begin="0.3s"
                      path="M340,258 Q300,272 256,288"
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
                  <circle r="2" fill="#EC4899" fillOpacity="0.6">
                    <animateMotion
                      dur="4s"
                      repeatCount="indefinite"
                      begin="1.8s"
                      path="M268,490 Q254,408 244,310"
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

                  {/* Paye center node — pulse rings */}
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
                  <circle
                    cx="234"
                    cy="293"
                    r="34"
                    fill="none"
                    stroke="#2563EB"
                    strokeOpacity="0.08"
                    strokeWidth="1"
                  >
                    <animate
                      attributeName="r"
                      values="34;62;34"
                      dur="3s"
                      repeatCount="indefinite"
                      begin="0.5s"
                    />
                    <animate
                      attributeName="stroke-opacity"
                      values="0.1;0;0.1"
                      dur="3s"
                      repeatCount="indefinite"
                      begin="0.5s"
                    />
                  </circle>
                  {/* Paye node */}
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

                  {/* PAYSTACK */}
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

                  {/* FLUTTERWAVE */}
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

                  {/* INTERSWITCH */}
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

                  {/* REMITA */}
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

                  {/* OPAY */}
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

                  {/* M-PESA */}
                  <g transform="translate(352,250)">
                    <circle
                      cx="0"
                      cy="0"
                      r="25"
                      fill="#FFFFFF"
                      stroke="#10B981"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx="0"
                      cy="0"
                      r="25"
                      fill="none"
                      stroke="#10B981"
                      strokeOpacity="0.12"
                      strokeWidth="9"
                    />
                    <text
                      x="0"
                      y="-2"
                      textAnchor="middle"
                      fontFamily="Inter,sans-serif"
                      fontSize="7"
                      fontWeight="700"
                      fill="#059669"
                    >
                      M-PESA
                    </text>
                    <text
                      x="0"
                      y="7"
                      textAnchor="middle"
                      fontFamily="Inter,sans-serif"
                      fontSize="5.5"
                      fill="#9CA3AF"
                    >
                      Kenya
                    </text>
                  </g>

                  {/* DPO GROUP */}
                  <g transform="translate(336,366)">
                    <circle
                      cx="0"
                      cy="0"
                      r="21"
                      fill="#FFFFFF"
                      stroke="#0891B2"
                      strokeWidth="1.2"
                    />
                    <text
                      x="0"
                      y="-2"
                      textAnchor="middle"
                      fontFamily="Inter,sans-serif"
                      fontSize="7"
                      fontWeight="700"
                      fill="#0891B2"
                    >
                      DPO
                    </text>
                    <text
                      x="0"
                      y="6"
                      textAnchor="middle"
                      fontFamily="Inter,sans-serif"
                      fontSize="5.5"
                      fill="#9CA3AF"
                    >
                      Group
                    </text>
                  </g>

                  {/* CELLULANT */}
                  <g transform="translate(366,212)">
                    <circle
                      cx="0"
                      cy="0"
                      r="20"
                      fill="#FFFFFF"
                      stroke="#7C3AED"
                      strokeWidth="1.2"
                    />
                    <text
                      x="0"
                      y="2"
                      textAnchor="middle"
                      fontFamily="Inter,sans-serif"
                      fontSize="5.2"
                      fontWeight="700"
                      fill="#7C3AED"
                    >
                      CELLULANT
                    </text>
                  </g>

                  {/* PAYFAST */}
                  <g transform="translate(192,478)">
                    <circle
                      cx="0"
                      cy="0"
                      r="21"
                      fill="#FFFFFF"
                      stroke="#2563EB"
                      strokeWidth="1.2"
                    />
                    <text
                      x="0"
                      y="-2"
                      textAnchor="middle"
                      fontFamily="Inter,sans-serif"
                      fontSize="6.5"
                      fontWeight="700"
                      fill="#2563EB"
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
                    >
                      FAST
                    </text>
                  </g>

                  {/* PAYGATE */}
                  <g transform="translate(122,432)">
                    <circle
                      cx="0"
                      cy="0"
                      r="21"
                      fill="#FFFFFF"
                      stroke="#0F766E"
                      strokeWidth="1.2"
                    />
                    <text
                      x="0"
                      y="-2"
                      textAnchor="middle"
                      fontFamily="Inter,sans-serif"
                      fontSize="6.5"
                      fontWeight="700"
                      fill="#0F766E"
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
                      fill="#0F766E"
                    >
                      GATE
                    </text>
                  </g>

                  {/* PEACH PAYMENTS */}
                  <g transform="translate(270,494)">
                    <circle
                      cx="0"
                      cy="0"
                      r="21"
                      fill="#FFFFFF"
                      stroke="#EC4899"
                      strokeWidth="1.2"
                    />
                    <text
                      x="0"
                      y="-2"
                      textAnchor="middle"
                      fontFamily="Inter,sans-serif"
                      fontSize="6"
                      fontWeight="700"
                      fill="#BE185D"
                    >
                      PEACH
                    </text>
                    <text
                      x="0"
                      y="6"
                      textAnchor="middle"
                      fontFamily="Inter,sans-serif"
                      fontSize="6"
                      fontWeight="700"
                      fill="#BE185D"
                    >
                      PAY
                    </text>
                  </g>

                  {/* COMING SOON (North Africa) */}
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

        {/* TRUST STRIP */}
        {/*  <div className="trust">
          <div className="wrap">
            <div className="trust-inner">
              <span className="trust-label">Trusted by teams at</span>
              <div className="trust-div"></div>
              <div className="trust-items">
                <span className="trust-item">Acme Store</span>
                <span className="trust-item">Buildco</span>
                <span className="trust-item">NaijaShop</span>
                <span className="trust-item">Remit.ng</span>
                <span className="trust-item">Fundly</span>
              </div>
            </div>
          </div>
        </div>
        */}

        {/* HOW IT WORKS */}
        <section className="section" id="how-it-works">
          <div className="wrap">
            <div className="section-header">
              <div className="section-eyebrow">How it works</div>
              <div className="section-title">Set up in three steps.</div>
              <div className="section-sub">
                No boilerplate. No provider-specific SDKs. One clean API
                contract that works across gateways.
              </div>
            </div>
            <div className="steps">
              <div className="step">
                <div className="step-num">1</div>
                <h3>Connect your gateways</h3>
                <p>
                  Add your Paystack and Flutterwave credentials inside the
                  dashboard. Keys are encrypted with AES-GCM at rest — they
                  never leave our proxy layer in plain text.
                </p>
              </div>
              <div className="step">
                <div className="step-num">2</div>
                <h3>Integrate once</h3>
                <p>
                  Call a single Paye API endpoint for every payment action —
                  initialize, verify, refund, transfer. We normalize the
                  response shape across all providers.
                </p>
              </div>
              <div className="step">
                <div className="step-num">3</div>
                <h3>Route and go live</h3>
                <p>
                  Payments route to the best available provider automatically.
                  Switch, failover, or split traffic from the dashboard — no
                  code changes needed.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="section section-alt" id="product">
          <div className="wrap">
            <div className="section-header">
              <div className="section-eyebrow">Platform</div>
              <div className="section-title">
                Everything your payment
                <br />
                infrastructure needs.
              </div>
            </div>
            <div className="features">
              <div className="feat">
                <div className="feat-icon">⇄</div>
                <h3>Unified API router</h3>
                <p>
                  One endpoint handles every provider. Swap gateways or route
                  dynamically without touching your integration code.
                </p>
              </div>
              <div className="feat">
                <div className="feat-icon">🔒</div>
                <h3>AES-GCM encryption</h3>
                <p>
                  Gateway credentials are encrypted at rest. Original keys never
                  leave our proxy layer — your secrets stay secret.
                </p>
              </div>
              <div className="feat">
                <div className="feat-icon">⚡</div>
                <h3>Webhook proxies</h3>
                <p>
                  Intercept, validate, and forward webhook events from any
                  provider. One endpoint handles all provider callbacks.
                </p>
              </div>
              <div className="feat">
                <div className="feat-icon">📊</div>
                <h3>Transaction audit logs</h3>
                <p>
                  Every payment, every event — logged with payload details,
                  webhook status, and provider response timelines.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* BUSINESS */}
        <section className="section" id="business">
          <div className="wrap">
            <div className="business-grid">
              <div className="business-prose">
                <div className="section-eyebrow">For businesses</div>
                <h2>
                  Maximize revenue.
                  <br />
                  Minimize payment friction.
                </h2>
                <p>
                  Technical outages and gateway suspensions shouldn't halt your
                  operations. Paye gives your business redundant, secure, and
                  smart transaction routing across Africa's leading payment
                  providers.
                </p>
                <p>
                  Maintain complete flexibility over your financial stack,
                  optimize acceptance rates, and split payment traffic
                  dynamically without writing custom code for every vendor.
                </p>
                <Link
                  href="/signup"
                  className="btn-lg"
                  style={{ marginTop: "1rem", display: "inline-block" }}
                >
                  Start free trial →
                </Link>
              </div>
              <div className="business-cards">
                <div className="biz-card">
                  <h4>Failover routing</h4>
                  <p>
                    Automatically shift transaction traffic to alternative
                    payment gateways if your primary processor experiences
                    downtime.
                  </p>
                </div>
                <div className="biz-card">
                  <h4>Lower transaction fees</h4>
                  <p>
                    Intelligently direct transactions to gateways with the best
                    processing rates for different payment types.
                  </p>
                </div>
                <div className="biz-card">
                  <h4>Multicurrency settlement</h4>
                  <p>
                    Accept local currencies like NGN, GHS, KES, and USD, routing
                    settlements to your preferred regional merchant channels.
                  </p>
                </div>
                <div className="biz-card">
                  <h4>Fraud mitigation</h4>
                  <p>
                    Verify transaction status and webhooks from multiple
                    upstream gateways to prevent duplicate charges or double
                    payouts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CODE */}
        <section className="section" id="developers">
          <div className="wrap">
            <div className="code-split">
              <div className="code-prose">
                <div className="section-eyebrow">For developers</div>
                <h2>
                  Clean API.
                  <br />
                  Zero boilerplate.
                </h2>
                <p>
                  One request initializes a payment across any provider. The
                  response shape is always the same — no per-gateway parsing.
                </p>
                <p>
                  Switch from Paystack to Flutterwave by changing one field.
                  Your server code stays exactly the same.
                </p>
                <Link
                  href="/docs"
                  className="btn-lg"
                  style={{ marginTop: "1rem", display: "inline-block" }}
                >
                  Read the docs →
                </Link>
              </div>
              <div className="code-block">
                <div className="code-block-label">
                  POST /api/v1/transactions/initialize
                </div>
                <pre>
                  <span className="ck">X-API-Key</span>
                  <span className="cm">:</span>{" "}
                  <span className="cv">paye_live_••••a52</span>
                  {"\n\n"}
                  <span className="cm">{"{"}</span>
                  {"\n"} <span className="cs">&quot;amount&quot;</span>
                  <span className="cm">:</span>{" "}
                  <span className="cv">12500</span>
                  <span className="cm">,</span>
                  {"\n"} <span className="cs">&quot;email&quot;</span>
                  <span className="cm">:</span>{" "}
                  <span className="cv">&quot;user@email.com&quot;</span>
                  <span className="cm">,</span>
                  {"\n"} <span className="cs">&quot;provider&quot;</span>
                  <span className="cm">:</span>{" "}
                  <span className="cv">&quot;paystack&quot;</span>
                  <span className="cm">,</span>
                  {"\n"} <span className="cs">&quot;currency&quot;</span>
                  <span className="cm">:</span>{" "}
                  <span className="cv">&quot;NGN&quot;</span>
                  {"\n"}
                  <span className="cm">{"}"}</span>
                  {"\n\n"}
                  <span className="cm">← 200 OK</span>
                  {"\n"}
                  <span className="cm">{"{"}</span>
                  {"\n"} <span className="cs">&quot;status&quot;</span>
                  <span className="cm">:</span>{" "}
                  <span className="cv">&quot;success&quot;</span>
                  <span className="cm">,</span>
                  {"\n"} <span className="cs">&quot;checkout_url&quot;</span>
                  <span className="cm">:</span>{" "}
                  <span className="cv">&quot;https://...&quot;</span>
                  <span className="cm">,</span>
                  {"\n"} <span className="cs">&quot;reference&quot;</span>
                  <span className="cm">:</span>{" "}
                  <span className="cv">&quot;paye_ref_92x98&quot;</span>
                  {"\n"}
                  <span className="cm">{"}"}</span>
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta-section">
          <div className="wrap">
            <h2>
              Start routing payments
              <br />
              in minutes.
            </h2>
            <p>Free to start. No credit card required.</p>
            <div className="cta-btns">
              <Link href="/signup" className="btn-lg">
                Create free account
              </Link>
              <Link href="/docs" className="btn-lg-outline">
                Read the docs
              </Link>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="home-footer">
          <div className="wrap footer-inner">
            <Link href="/" className="logo" style={{ fontSize: "16px" }}>
              Paye<span>.</span>
            </Link>
            <div className="footer-copy">© 2026 Paye. All rights reserved.</div>
            <div className="footer-links">
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/docs">Docs</Link>
              <a href="#">About</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
