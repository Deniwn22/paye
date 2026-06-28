"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function LandingNav({ token }: { token: string | null }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-black/[0.08] bg-white dark:border-white/[0.08] dark:bg-[#141414]">
      <div className="mx-auto flex h-[60px] max-w-[1280px] items-center justify-between px-5">
        {/* Logo */}
        <Link
          href="/"
          className="text-[19px] font-bold tracking-[-0.5px] text-[#0A0A0A] select-none dark:text-[#F9FAFB]"
        >
          Paye<span className="text-[#2563EB]">.</span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden list-none items-center gap-8 md:flex">
          {[
            { label: "Product", href: "#product" },
            { label: "How it works", href: "#how-it-works" },
            { label: "Providers", href: "#providers" },
            { label: "Developers", href: "#developers" },
            { label: "Docs", href: "/docs" },
          ].map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                className="text-[14px] text-[#6B7280] transition-colors hover:text-[#0A0A0A] dark:text-[#9CA3AF] dark:hover:text-[#F9FAFB]"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop actions */}
        <div className="hidden items-center gap-4 md:flex">
          <ThemeToggle />
          {token ? (
            <Link
              href="/dashboard"
              className="rounded-[8px] bg-[#2563EB] px-5 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#1D4ED8]"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/signin"
                className="text-[14px] text-[#6B7280] transition-colors hover:text-[#0A0A0A] dark:text-[#9CA3AF] dark:hover:text-[#F9FAFB]"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-[8px] bg-[#2563EB] px-5 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#1D4ED8]"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-[36px] w-[36px] items-center justify-center rounded-[8px] border border-black/[0.08] bg-[#F3F4F6] text-[#0A0A0A] transition-colors hover:bg-white dark:border-white/[0.08] dark:bg-[#1F1F1F] dark:text-[#F9FAFB] dark:hover:bg-[#141414]"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {isOpen && (
        <div className="absolute top-[60px] right-0 left-0 z-40 flex animate-in flex-col gap-5 border-b border-black/[0.08] bg-white px-5 py-6 duration-150 slide-in-from-top-2 md:hidden dark:border-white/[0.08] dark:bg-[#141414]">
          <ul className="flex list-none flex-col gap-4">
            {[
              { label: "Product", href: "#product" },
              { label: "How it works", href: "#how-it-works" },
              { label: "Providers", href: "#providers" },
              { label: "Developers", href: "#developers" },
              { label: "Docs", href: "/docs" },
            ].map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  onClick={() => setIsOpen(false)}
                  className="text-[15px] font-medium text-[#6B7280] transition-colors hover:text-[#0A0A0A] dark:text-[#9CA3AF] dark:hover:text-[#F9FAFB]"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-3 border-t border-black/[0.08] pt-5 dark:border-white/[0.08]">
            {token ? (
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="rounded-[8px] bg-[#2563EB] px-5 py-2.5 text-center text-[14px] font-medium text-white transition-colors hover:bg-[#1D4ED8]"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/signin"
                  onClick={() => setIsOpen(false)}
                  className="py-2.5 text-center text-[14px] font-medium text-[#6B7280] transition-colors hover:text-[#0A0A0A] dark:text-[#9CA3AF] dark:hover:text-[#F9FAFB]"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setIsOpen(false)}
                  className="rounded-[8px] bg-[#2563EB] px-5 py-2.5 text-center text-[14px] font-medium text-white transition-colors hover:bg-[#1D4ED8]"
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
