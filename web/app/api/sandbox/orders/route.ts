import { NextRequest, NextResponse } from "next/server"
import { readDB, writeDB, SandboxOrder } from "@/lib/sandbox-db"
import { BACKEND_URL } from "@/lib/config"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")

  if (!email) {
    return NextResponse.json({ status: false, message: "Email is required" }, { status: 400 })
  }

  const db = readDB()
  const userOrders = db.orders.filter((o) => o.userEmail === email)
  return NextResponse.json({ status: true, data: userOrders })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, items, totalAmount } = body

    if (!email || !items || !items.length || !totalAmount) {
      return NextResponse.json(
        { status: false, message: "Email, items, and totalAmount are required" },
        { status: 400 }
      )
    }

    const db = readDB()
    const newOrder: SandboxOrder = {
      id: Math.random().toString(36).substring(2, 9),
      userEmail: email,
      items,
      totalAmount: parseFloat(totalAmount),
      status: "pending",
      reference: `sandbox_ref_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString(),
    }

    db.orders.push(newOrder)
    writeDB(db)

    return NextResponse.json({ status: true, data: newOrder })
  } catch (err: any) {
    return NextResponse.json({ status: false, message: err.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const reference = searchParams.get("reference")

    if (!reference) {
      return NextResponse.json({ status: false, message: "Reference is required" }, { status: 400 })
    }

    const db = readDB()
    const orderIdx = db.orders.findIndex((o) => o.reference === reference)

    if (orderIdx === -1) {
      return NextResponse.json({ status: false, message: "Order not found" }, { status: 404 })
    }

    // Try calling Paye API backend to verify transaction
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
          const projects = projData.data || []
          const activeProject = projects.find((p: any) => p.id === activeProjectId) || projects[0]
          const apiKey = activeProject?.api_key

          if (apiKey) {
            // Call the verify API on the Paye backend
            const verifyRes = await fetch(
              `${BACKEND_URL}/api/v1/transactions/verify/${reference}`,
              {
                headers: {
                  "X-Paye-API-Key": apiKey,
                },
              }
            )
            if (verifyRes.ok) {
              const verifyData = await verifyRes.json()
              if (verifyData.status && verifyData.data && verifyData.data.status === "success") {
                db.orders[orderIdx].status = "completed"
                writeDB(db)
                return NextResponse.json({ status: true, order: db.orders[orderIdx] })
              }
            }
          }
        }
      } catch (apiErr) {
        console.error("Failed to verify transaction via Paye backend:", apiErr)
      }
    }

    return NextResponse.json({ status: true, order: db.orders[orderIdx] })
  } catch (err: any) {
    return NextResponse.json({ status: false, message: err.message }, { status: 500 })
  }
}

