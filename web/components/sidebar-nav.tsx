"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, CreditCard, Layers, Webhook, Key } from "lucide-react"

export default function SidebarNav() {
  const pathname = usePathname()

  const navItems = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Transactions", href: "/transactions", icon: CreditCard },
    { label: "Providers", href: "/providers", icon: Layers },
    { label: "Webhooks", href: "/webhooks", icon: Webhook },
    { label: "API Key", href: "/api-key", icon: Key },
  ]

  return (
    <nav className="px-3 py-6 space-y-1.5 text-sm">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href

        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-none border-l-2 bg-transparent transition-all font-semibold ${
              isActive
                ? "border-[#0ea5e9] text-zinc-900 dark:text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? "text-[#0ea5e9]" : "text-zinc-400 dark:text-zinc-500"}`} />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
