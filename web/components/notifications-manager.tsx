"use client"

import { useState, useTransition, useEffect } from "react"
import { markNotificationAsReadAction, markAllNotificationsAsReadAction, deleteNotificationAction } from "@/app/actions"
import { Trash2, Check, CheckCheck, BellOff, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export interface NotificationItem {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}

interface NotificationsManagerProps {
  initialNotifications: NotificationItem[]
}

export default function NotificationsManager({ initialNotifications }: NotificationsManagerProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications || [])
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setNotifications(initialNotifications || [])
  }, [initialNotifications])

  const unreadCount = (notifications || []).filter((n) => !n.is_read).length

  const handleMarkAsRead = async (id: string) => {
    startTransition(async () => {
      const res = await markNotificationAsReadAction(id)
      if (!res.success) {
        toast.error(res.error || "Failed to mark notification as read")
      } else {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        )
        toast.success("Notification marked as read")
      }
    })
  }

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return
    startTransition(async () => {
      const res = await markAllNotificationsAsReadAction()
      if (!res.success) {
        toast.error(res.error || "Failed to mark notifications as read")
      } else {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
        toast.success("All notifications marked as read")
      }
    })
  }

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      const res = await deleteNotificationAction(id)
      if (!res.success) {
        toast.error(res.error || "Failed to delete notification")
      } else {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
        toast.success("Notification deleted")
      }
    })
  }

  // Group notifications by date
  const getGroupedNotifications = () => {
    const today: NotificationItem[] = []
    const yesterday: NotificationItem[] = []
    const older: NotificationItem[] = []

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000

    ;(notifications || []).forEach((n) => {
      const time = new Date(n.created_at).getTime()
      if (time >= startOfToday) {
        today.push(n)
      } else if (time >= startOfYesterday) {
        yesterday.push(n)
      } else {
        older.push(n)
      }
    })

    return { today, yesterday, older }
  }

  const { today, yesterday, older } = getGroupedNotifications()

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString)
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } catch (e) {
      return ""
    }
  }

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString)
      return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
    } catch (e) {
      return ""
    }
  }

  const renderNotificationRow = (n: NotificationItem) => {
    const isSuccess = n.type === "success"
    const isFailed = n.type === "failed"

    return (
      <div
        key={n.id}
        className={`p-4 border bg-white/40 dark:bg-zinc-900/10 backdrop-blur rounded-xl flex items-center justify-between gap-4 transition-all duration-300 ${
          n.is_read
            ? "border-zinc-200 dark:border-zinc-900 opacity-75"
            : "border-l-4 border-l-[#2563eb] border-zinc-250 dark:border-zinc-800 shadow-[0_2px_10px_rgba(37,99,235,0.02)]"
        }`}
      >
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="shrink-0 mt-0.5">
            {isSuccess ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : isFailed ? (
              <XCircle className="w-5 h-5 text-red-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-500" />
            )}
          </div>
          <div className="space-y-0.5 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={`font-bold text-sm truncate ${n.is_read ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-900 dark:text-zinc-100"}`}>
                {n.title}
              </span>
              {!n.is_read && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb] shrink-0" />
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal">{n.message}</p>
            <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 block pt-0.5">
              {formatTime(n.created_at)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!n.is_read && (
            <button
              onClick={() => handleMarkAsRead(n.id)}
              disabled={isPending}
              title="Mark as read"
              className="p-1.5 border border-zinc-200 dark:border-zinc-905 hover:border-[#2563eb]/20 hover:bg-[#2563eb]/5 text-zinc-500 dark:text-zinc-400 hover:text-[#2563eb] transition-all cursor-pointer rounded-lg bg-white dark:bg-transparent"
            >
              <Check className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => handleDelete(n.id)}
            disabled={isPending}
            title="Delete notification"
            className="p-1.5 border border-zinc-200 dark:border-zinc-905 hover:border-red-500/20 hover:bg-red-500/5 text-zinc-500 dark:text-zinc-400 hover:text-red-500 transition-all cursor-pointer rounded-lg bg-white dark:bg-transparent"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  const renderGroup = (title: string, list: NotificationItem[], subtitle?: string) => {
    if (list.length === 0) return null
    return (
      <div className="space-y-3">
        <div className="flex items-baseline justify-between px-1">
          <h2 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{title}</h2>
          {subtitle && <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{subtitle}</span>}
        </div>
        <div className="space-y-2.5">
          {list.map(renderNotificationRow)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200/60 dark:border-zinc-900">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            {unreadCount === 0 ? "All notifications read" : `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`}
          </span>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={isPending}
            className="px-3 py-1.5 bg-[#2563eb]/10 hover:bg-[#2563eb]/15 border border-[#2563eb]/20 text-[#2563eb] font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer select-none"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {(notifications || []).length === 0 ? (
        <div className="text-center py-20 text-zinc-500 dark:text-zinc-600 border border-dashed border-zinc-200 dark:border-zinc-900 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/20">
          <BellOff className="w-9 h-9 text-zinc-400 mx-auto mb-3" />
          <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">All caught up!</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-sm mx-auto">No notifications stored for this workspace yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {renderGroup("Today", today)}
          {renderGroup("Yesterday", yesterday)}
          {renderGroup("Older", older, older.length > 0 ? `${formatDate(older[older.length - 1].created_at)} and older` : undefined)}
        </div>
      )}
    </div>
  )
}
