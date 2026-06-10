import Link from "next/link"
import { getToken } from "@/lib/cookies"
import { ThemeToggle } from "@/components/theme-toggle"

export default async function TermsPage() {
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
              min-height: 100vh;
              display: flex;
              flex-direction: column;
            }

            .wrap { max-width: 1100px; margin: 0 auto; padding: 0 2rem; width: 100%; }

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

            /* ── CONTENT ── */
            .main-content {
              flex: 1;
              background: var(--bg-surface);
            }
            .legal-content {
              padding: 5rem 0;
              max-width: 720px;
              margin: 0 auto;
            }
            .section-eyebrow {
              font-size: 11px; font-weight: 500;
              letter-spacing: 0.08em; text-transform: uppercase;
              color: #2563EB; margin-bottom: 0.75rem;
            }
            .legal-content h1 {
              font-size: 42px; font-weight: 700;
              letter-spacing: -1.5px; line-height: 1.12;
              margin-bottom: 0.5rem;
            }
            .legal-date {
              font-size: 13px; color: var(--text-tertiary);
              margin-bottom: 3rem;
            }
            .legal-disclaimer {
              background: var(--blue-subtle);
              border: 0.5px solid var(--blue-border);
              border-radius: var(--radius-md);
              padding: 1.5rem;
              margin-bottom: 3rem;
              font-size: 14.5px;
              line-height: 1.6;
              color: var(--text-primary);
            }
            .legal-disclaimer strong {
              color: #2563EB;
              font-weight: 600;
            }
            .legal-content h2 {
              font-size: 20px; font-weight: 600;
              margin-top: 3rem; margin-bottom: 1rem;
              letter-spacing: -0.5px;
            }
            .legal-content p {
              font-size: 15px; color: var(--text-secondary);
              line-height: 1.7; margin-bottom: 1.25rem;
            }
            .legal-content ul {
              margin-bottom: 1.25rem; padding-left: 1.5rem;
              list-style-type: disc;
            }
            .legal-content li {
              font-size: 15px; color: var(--text-secondary);
              line-height: 1.7; margin-bottom: 0.5rem;
            }

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
                <Link href="/#product">Product</Link>
              </li>
              <li>
                <Link href="/#how-it-works">How it works</Link>
              </li>
              <li>
                <Link href="/#developers">Developers</Link>
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

        {/* CONTENT */}
        <div className="main-content">
          <div className="wrap">
            <div className="legal-content">
              <div className="section-eyebrow">Legal</div>
              <h1>Terms of Service</h1>
              <div className="legal-date">Last updated: June 10, 2026</div>

              {/* Prominent disclaimer required by user */}
              <div className="legal-disclaimer">
                <strong>Disclaimer:</strong> Paye. is a routing and proxy infrastructure provider. We do not hold, manage, store, or process merchant funds.
              </div>

              <h2>1. Agreement to Terms</h2>
              <p>
                By creating an account, integrating our API, or using the Services in any way, you agree to comply with and be bound by these Terms of Service. If you do not agree, you must not access or use the Services.
              </p>

              <h2>2. Description of Services</h2>
              <p>
                Paye provides developers and organizations with a unified API routing and proxy middleware layer to connect to third-party African payment processors (e.g., Paystack, Flutterwave, M-Pesa, etc.).
              </p>

              <h2>3. Fund Management Policy (Zero Funds Held)</h2>
              <p>
                Paye acts strictly as a data routing proxy. We process payment instruction requests and direct them dynamically to the specific gateways for execution. Because of this architectural design:
              </p>
              <ul>
                <li><strong>No Custody of Funds:</strong> Paye never receives, handles, stores, holds, or has custody of merchant or customer transaction funds.</li>
                <li><strong>Gateway Direct Settlement:</strong> All transactions are settled directly by the respective upstream payment gateways into your merchant account, in accordance with the terms of your agreements with those gateways.</li>
                <li><strong>No Financial Services:</strong> Paye is not a bank, remittance service, money transmitter, or licensed payment gateway. We are exclusively a software infrastructure provider.</li>
              </ul>

              <h2>4. Developer Responsibilities and API Key Security</h2>
              <p>
                As a developer or merchant using Paye, you are responsible for:
              </p>
              <ul>
                <li>Maintaining the confidentiality of your Paye API keys and credentials.</li>
                <li>Securing your upstream gateway secret keys before providing them to the Paye dashboard.</li>
                <li>Ensuring all calls made to our Services are authorized and comply with merchant-gateway rules.</li>
                <li>All activity that occurs under your developer account.</li>
              </ul>

              <h2>5. Compliance with Gateway Terms</h2>
              <p>
                You must maintain active, compliant merchant accounts with any payment gateway provider you route requests to (e.g., Flutterwave, Paystack). You agree to adhere to all terms, conditions, and guidelines issued by those upstream providers. Paye is not responsible for gateway-level account suspensions, processing holds, or settlement issues.
              </p>

              <h2>6. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by applicable law, Paye shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues (whether incurred directly or indirectly), or any loss of data, use, goodwill, or other intangible losses resulting from:
              </p>
              <ul>
                <li>Your access to or use of, or inability to access or use, our proxy services.</li>
                <li>Any conduct or content of any upstream payment gateway.</li>
                <li>Gateway service interruptions, downtime, or network failures.</li>
                <li>Unauthorized access, use, or alteration of your transmissions or content.</li>
              </ul>

              <h2>7. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction where Paye operates, without regard to its conflict of law provisions.
              </p>

              <h2>8. Contact Information</h2>
              <p>
                For any inquiries regarding these Terms of Service, please contact us at legal@paye.africa.
              </p>
            </div>
          </div>
        </div>

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
