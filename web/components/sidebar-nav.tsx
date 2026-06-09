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
    <nav className="px-4 py-4 space-y-7 text-sm">
      {groups.map((group) => (
        <div key={group.title} className="space-y-2">
          {/* Section title (inspired by MasterX) */}
          <h4 className="px-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest select-none">
            {group.title}
          </h4>
          <div className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon
              // Active check: exact match or starts with if subpage
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 font-bold select-none cursor-pointer group ${
                    isActive
                      ? "bg-sky-500/10 text-sky-500 dark:text-sky-400 border-none shadow-sm"
                      : "text-zinc-550 dark:text-zinc-400 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/30 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive 
                          ? "text-sky-500 dark:text-sky-400" 
                          : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  
                  {/* Subtle right glow dot for active links */}
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 dark:bg-sky-400 shadow-[0_0_8px_rgba(14,165,233,0.8)] animate-pulse" />
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
