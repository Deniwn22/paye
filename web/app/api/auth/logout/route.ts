import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  cookieStore.delete("paye_token")
  cookieStore.delete("paye_active_project_id")
  return NextResponse.redirect(new URL("/signin", request.url))
}
