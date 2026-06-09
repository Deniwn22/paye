// web/lib/cookies.ts
import { cookies } from "next/headers"

const TOKEN_KEY = "paye_token"

export async function setToken(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(TOKEN_KEY, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })
}

export async function getToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(TOKEN_KEY)?.value ?? null
}

export async function deleteToken() {
  const cookieStore = await cookies()
  cookieStore.delete(TOKEN_KEY)
}

const PROJECT_ID_KEY = "paye_active_project_id"

export async function setActiveProjectID(projectID: string) {
  const cookieStore = await cookies()
  cookieStore.set(PROJECT_ID_KEY, projectID, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  })
}

export async function getActiveProjectID(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(PROJECT_ID_KEY)?.value ?? null
}

export async function deleteActiveProjectID() {
  const cookieStore = await cookies()
  cookieStore.delete(PROJECT_ID_KEY)
}

const MODE_KEY = "paye_active_mode"

export async function setActiveMode(mode: "live" | "test") {
  const cookieStore = await cookies()
  cookieStore.set(MODE_KEY, mode, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  })
}

export async function getActiveMode(): Promise<"live" | "test"> {
  const cookieStore = await cookies()
  const val = cookieStore.get(MODE_KEY)?.value
  return val === "live" ? "live" : "test"
}
