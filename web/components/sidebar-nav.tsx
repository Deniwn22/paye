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
} from "lucide-react"

export default function SidebarNav() {
  const pathname = usePathname()

  const groups = [
    {
      title: "Developer",
      items: [
        { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
        { label: "Providers", href: "/providers", icon: Layers },
        { label: "Webhooks", href: "/webhooks", icon: Webhook },
        { label: "API Key", href: "/api-key", icon: Key },
      ],
    },
    {
      title: "Payments",
      items: [
        { label: "Transactions", href: "/transactions", icon: CreditCard },
        { label: "Refunds", href: "/dashboard/refunds", icon: RefreshCw },
      ],
    },
    {
      title: "Billing",
      items: [
        { label: "Plans", href: "/dashboard/billing/plans", icon: FileText },
        { label: "Subscriptions", href: "/dashboard/billing/subscriptions", icon: Users },
      ],
    },
    {
      title: "Payouts",
      items: [
        { label: "Transfers", href: "/dashboard/payouts/transfers", icon: Send },
        { label: "Recipients", href: "/dashboard/payouts/recipients", icon: Landmark },
      ],
    },
  ]

  return (
    <nav className="px-3 py-4 space-y-6 text-sm">
      {groups.map((group) => (
        <div key={group.title} className="space-y-1.5">
          <h4 className="px-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider select-none">
            {group.title}
          </h4>
          <div className="space-y-0.5">
            {group.items.map((item) => {
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
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? "text-[#0ea5e9]" : "text-zinc-400 dark:text-zinc-500"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}

