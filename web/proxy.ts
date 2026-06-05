// proxy.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const TOKEN_KEY = "paye_token"

export function proxy(request: NextRequest) {
  const token = request.cookies.get(TOKEN_KEY)?.value
  const { pathname } = request.nextUrl

  // Protected paths
  const protectedPaths = ["/dashboard", "/transactions", "/providers", "/webhooks", "/api-key"]
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path))

  // Redirect to signin if accessing a protected path without a token
  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/signin", request.url))
  }

  // Redirect to dashboard if logged in and trying to access signin/signup
  if ((pathname.startsWith("/signin") || pathname.startsWith("/signup")) && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

// Controls where the proxy middleware runs
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/transactions/:path*",
    "/providers/:path*",
    "/webhooks/:path*",
    "/api-key/:path*",
    "/signin",
    "/signup",
  ],
}
