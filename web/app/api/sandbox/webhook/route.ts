import { NextRequest, NextResponse } from "next/server"
import { readDB, writeDB, SandboxWebhookLog } from "@/lib/sandbox-db"

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    console.log("Sandbox Webhook Received:", payload)

    const db = readDB()

    // Add to webhook logs
    const logEntry: SandboxWebhookLog = {
      id: Math.random().toString(36).substring(2, 9),
      event: payload.event || "unknown",
      payload,
      receivedAt: new Date().toISOString(),
    }
    db.webhookLogs.unshift(logEntry) // prepend to see latest logs first

    // Process charge success
    if (payload.event === "charge.success") {
      const data = payload.data || {}
      const ref = data.reference

      // Update Order Status
      if (ref) {
        const orderIdx = db.orders.findIndex((o) => o.reference === ref)
        if (orderIdx !== -1) {
          db.orders[orderIdx].status = "completed"
        }
      }
    }

    // Process subscription created/disabled
    if (
      payload.event === "subscription.create" ||
      payload.event === "subscription.disable" ||
      payload.event === "invoice.payment_failed"
    ) {
      const data = payload.data || {}
      const subCode = data.subscription_code || data.subscription?.subscription_code
      const customerEmail = data.customer?.email || data.customer_email
      const planCode = data.plan?.plan_code

      if (payload.event === "subscription.create") {
        // Create or activate subscription
        if (customerEmail && planCode) {
          const subIdx = db.subscriptions.findIndex(
            (s) => s.userEmail === customerEmail && s.planCode === planCode
          )
          if (subIdx !== -1) {
            db.subscriptions[subIdx].status = "active"
            db.subscriptions[subIdx].subscriptionCode = subCode || db.subscriptions[subIdx].subscriptionCode
          } else {
            db.subscriptions.push({
              id: Math.random().toString(36).substring(2, 9),
              userEmail: customerEmail,
              planCode,
              status: "active",
              subscriptionCode: subCode || `SUB_MOCK_${Math.random().toString(36).substring(2, 9)}`,
              createdAt: new Date().toISOString(),
            })
          }
        }
      } else {
        // Disable subscription
        if (subCode) {
          const subIdx = db.subscriptions.findIndex((s) => s.subscriptionCode === subCode)
          if (subIdx !== -1) {
            db.subscriptions[subIdx].status =
              payload.event === "invoice.payment_failed" ? "expired" : "cancelled"
          }
        }
      }
    }

    writeDB(db)

    return NextResponse.json({ status: "success", message: "Webhook processed" })
  } catch (err: any) {
    console.error("Error in sandbox webhook handler:", err)
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 })
  }
}
