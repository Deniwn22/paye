import { NextRequest, NextResponse } from "next/server"
import { readDB, writeDB } from "@/lib/sandbox-db"

export async function GET() {
  const db = readDB()
  return NextResponse.json({ status: true, data: db.webhookLogs })
}

export async function DELETE() {
  const db = readDB()
  db.webhookLogs = []
  writeDB(db)
  return NextResponse.json({ status: true, message: "Webhook logs cleared" })
}
