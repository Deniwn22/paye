import { getNotificationsAction } from "@/app/actions"
import NotificationsManager from "@/components/notifications-manager"

export const metadata = {
  title: "Notifications | Paye",
  description: "View and manage payment alerts and status changes in real-time."
}

export default async function NotificationsPage() {
  const res = await getNotificationsAction()
  const notifications = res.success ? res.notifications : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Notifications</h1>
        <p className="text-xs text-zinc-500 mt-1">View and manage history of payment status alerts and events.</p>
      </div>

      <NotificationsManager initialNotifications={notifications} />
    </div>
  )
}
