import { getToken, getActiveProjectID, getActiveMode } from "@/lib/cookies"
import { BACKEND_URL } from "@/lib/config"

export async function fetchBackend(path: string, options: RequestInit = {}) {
  const token = await getToken()
  const projectID = await getActiveProjectID()
  const mode = await getActiveMode()
  const isLive = mode === "live"

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Live-Mode": isLive ? "true" : "false",
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  if (projectID) {
    headers["X-Project-ID"] = projectID
  }

  if (options.headers) {
    Object.assign(headers, options.headers)
  }

  return fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers,
  })
}
