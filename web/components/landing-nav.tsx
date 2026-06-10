"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function LandingNav({ token }: { token: string | null }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="home-nav relative">
      <div className="wrap nav-inner">
        <Link href="/" className="logo select-none">
          Paye<span>.</span>
        </Link>

        {/* Desktop Links */}
        <ul className="nav-links desktop-nav-links">
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

        {/* Desktop Actions */}
        <div className="nav-actions desktop-nav-actions">
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

        {/* Mobile Control Section */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="mobile-menu-btn"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu Overlay */}
      {isOpen && (
        <div className="mobile-menu-overlay animate-in slide-in-from-top-2 duration-150">
          <ul className="mobile-menu-links">
            <li>
              <a href="#product" onClick={() => setIsOpen(false)}>Product</a>
            </li>
            <li>
              <a href="#how-it-works" onClick={() => setIsOpen(false)}>How it works</a>
            </li>
            <li>
              <a href="#business" onClick={() => setIsOpen(false)}>Business</a>
            </li>
            <li>
              <a href="#developers" onClick={() => setIsOpen(false)}>Developers</a>
            </li>
            <li>
              <Link href="/docs" onClick={() => setIsOpen(false)}>Docs</Link>
            </li>
          </ul>

          <div className="mobile-menu-actions">
            {token ? (
              <Link
                href="/dashboard"
                className="btn-primary text-center w-full"
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="btn-ghost text-center w-full py-2"
                  onClick={() => setIsOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="btn-primary text-center w-full"
                  onClick={() => setIsOpen(false)}
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
