import { NextRequest, NextResponse } from "next/server"
import { readDB, writeDB } from "@/lib/sandbox-db"
import { BACKEND_URL } from "@/lib/config"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")

  if (!email) {
    return NextResponse.json({ status: false, message: "Email is required" }, { status: 400 })
  }

  const db = readDB()
  const activeSubs = db.subscriptions.filter((s) => s.userEmail === email)
  return NextResponse.json({ status: true, data: activeSubs })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, planCode, action, subscriptionCode } = body

    if (!email || !action) {
      return NextResponse.json({ status: false, message: "Email and action are required" }, { status: 400 })
    }

    const db = readDB()

    if (action === "cancel") {
      if (!subscriptionCode) {
        return NextResponse.json(
          { status: false, message: "subscriptionCode is required for cancel" },
          { status: 400 }
        )
      }

      // Mark local DB as cancelled first
      const subIdx = db.subscriptions.findIndex((s) => s.subscriptionCode === subscriptionCode)
      if (subIdx !== -1) {
        db.subscriptions[subIdx].status = "cancelled"
        writeDB(db)
      }

      // Try calling Paye API backend to cancel subscription
      const token = req.cookies.get("paye_token")?.value
      const activeProjectId = req.cookies.get("paye_project_id")?.value

      if (token && activeProjectId) {
        try {
          // Fetch projects to get API key
          const projRes = await fetch(`${BACKEND_URL}/projects`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (projRes.ok) {
            const projData = await projRes.json()
            const projects: import("@/components/project-switcher").Project[] = projData.data || []
            const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0]
            const apiKey = activeProject?.api_key

            if (apiKey) {
              // Call the cancel API on the Paye backend
              const cancelRes = await fetch(
                `${BACKEND_URL}/api/v1/subscriptions/${subscriptionCode}/cancel`,
                {
                  method: "POST",
                  headers: {
                    "X-Paye-API-Key": apiKey,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ token: "" }),
                }
              )
              console.log("Paye Cancel Subscription API Response Status:", cancelRes.status)
            }
          }
        } catch (apiErr) {
          console.error("Failed to call Paye cancel subscription endpoint:", apiErr)
        }
      }

      return NextResponse.json({ status: true, message: "Subscription cancelled successfully" })
    }

    // Force subscribe locally (Mock flow for fast testing without webhook)
    if (action === "subscribe") {
      if (!planCode) {
        return NextResponse.json({ status: false, message: "planCode is required" }, { status: 400 })
      }

      const subIdx = db.subscriptions.findIndex((s) => s.userEmail === email && s.planCode === planCode)
      const mockCode = `SUB_MOCK_${Math.random().toString(36).substring(2, 9)}`
      if (subIdx !== -1) {
        db.subscriptions[subIdx].status = "active"
        db.subscriptions[subIdx].subscriptionCode = mockCode
      } else {
        db.subscriptions.push({
          id: Math.random().toString(36).substring(2, 9),
          userEmail: email,
          planCode,
          status: "active",
          subscriptionCode: mockCode,
          createdAt: new Date().toISOString(),
        })
      }
      writeDB(db)
      return NextResponse.json({ status: true, message: "Subscribed locally" })
    }

    return NextResponse.json({ status: false, message: "Invalid action" }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ status: false, message: err.message }, { status: 500 })
  }
}
