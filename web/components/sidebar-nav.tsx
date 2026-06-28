"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  CreditCard,
  Layers,
  Webhook,
  Key,
  RefreshCw,
  FileText,
  Users,
  Send,
  Landmark,
  Sparkles,
  Bell,
} from "lucide-react"

export default function SidebarNav() {
  const pathname = usePathname()

  const sections = [
    [
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { label: "Providers", href: "/providers", icon: Layers },
      { label: "Webhooks", href: "/webhooks", icon: Webhook },
      { label: "API Keys", href: "/api-key", icon: Key },
      { label: "Notifications", href: "/notifications", icon: Bell },
      { label: "Paye AI", href: "/dashboard/ai", icon: Sparkles },
    ],
    [
      { label: "Transactions", href: "/transactions", icon: CreditCard },
      { label: "Refunds", href: "/dashboard/refunds", icon: RefreshCw },
      { label: "Transfers", href: "/dashboard/payouts/transfers", icon: Send },
      { label: "Recipients", href: "/dashboard/payouts/recipients", icon: Landmark },
    ],
    [
      { label: "Plans", href: "/dashboard/billing/plans", icon: FileText },
      { label: "Subscriptions", href: "/dashboard/billing/subscriptions", icon: Users },
    ]
  ]

  return (
    <nav className="px-3 py-3 space-y-2 text-[13px] font-sans">
      {sections.map((group, groupIdx) => (
        <React.Fragment key={groupIdx}>
          {groupIdx > 0 && <div className="h-[0.5px] bg-border my-2 mx-2" />}
          <div className="space-y-0.5">
            {group.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors select-none cursor-pointer ${
                    isActive
                      ? "bg-[#eff6ff] text-[#2563eb] dark:bg-[#1e3a5f] dark:text-[#3b82f6] font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  <Icon
                    className={`w-[16px] h-[16px] shrink-0 transition-colors ${
                      isActive 
                        ? "text-[#2563eb] dark:text-[#3b82f6]" 
                        : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </React.Fragment>
      ))}
    </nav>
  )
}

import React from "react"
