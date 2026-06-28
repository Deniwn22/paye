"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PAYE_API_URL } from "@/lib/config"
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react"

interface NotificationListenerProps {
  token: string
}

export default function NotificationListener({ token }: NotificationListenerProps) {
  const router = useRouter()

  useEffect(() => {
    if (!token) return

    // Connect to the Server-Sent Events endpoint passing the token in query parameter
    const es = new EventSource(`${PAYE_API_URL}/api/v1/notifications/stream?token=${token}`)

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.type === "transaction_updated" && data.payload) {
          const tx = data.payload
          const ref = tx.reference
          const status = tx.status // success, failed, pending

          // Customize toast styling based on transaction status
          if (status === "success") {
            toast.success(`Transaction ${ref.slice(-8)} is Successful`, {
              description: `Amount: ${tx.currency} ${tx.amount}`,
              icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
              duration: 5000,
            })
          } else if (status === "failed") {
            toast.error(`Transaction ${ref.slice(-8)} Failed`, {
              description: tx.message || "Payment verification failed",
              icon: <XCircle className="w-5 h-5 text-red-500" />,
              duration: 5000,
            })
          } else {
            toast.info(`Transaction ${ref.slice(-8)} is Pending`, {
              icon: <AlertCircle className="w-5 h-5 text-amber-500" />,
              duration: 3000,
            })
          }

          // Trigger Next.js router refresh to update active tables/stats on current viewport
          router.refresh()
        }
      } catch (err) {
        console.error("Failed to parse real-time notification:", err)
      }
    }

    es.onerror = (err) => {
      console.warn("EventSource error, reconnecting...", err)
    }

    return () => {
      es.close()
    }
  }, [token, router])

  return null // Headless component
}
