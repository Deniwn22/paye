"use server"

import { redirect } from "next/navigation"
import {
  setToken,
  getToken,
  deleteToken,
  getActiveProjectID,
  setActiveProjectID,
  deleteActiveProjectID,
} from "@/lib/cookies"
import { BACKEND_URL } from "@/lib/config"

// --- Auth Actions ---

export async function signUpAction(prevState: any, formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!name || !email || !password) {
    return { success: false, error: "All fields are required" }
  }

  try {
    const res = await fetch(`${BACKEND_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    })

    const result = await res.json()
    if (!res.ok || !result.status) {
      return { success: false, error: result.message || "Signup failed" }
    }

    const token = result.data.token
    await setToken(token)
  } catch (err: any) {
    return { success: false, error: "Network error. Make sure Go API is running." }
  }

  redirect("/dashboard")
}

export async function signInAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { success: false, error: "Email and password are required" }
  }

  try {
    const res = await fetch(`${BACKEND_URL}/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    const result = await res.json()
    if (!res.ok || !result.status) {
      return { success: false, error: result.message || "Login failed" }
    }

    const token = result.data.token
    await setToken(token)
  } catch (err: any) {
    return { success: false, error: "Network error. Make sure Go API is running." }
  }

  redirect("/dashboard")
}

export async function signOutAction() {
  await deleteToken()
  await deleteActiveProjectID()
  redirect("/signin")
}

// --- Helper for Authorized Fetching with Project Scope ---

async function fetchWithAuth(path: string, options: RequestInit = {}) {
  const token = await getToken()
  if (!token) throw new Error("Unauthorized")

  const projectID = await getActiveProjectID()

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }

  if (projectID) {
    headers["X-Project-ID"] = projectID
  }

  const customHeaders = options.headers as Record<string, string> | undefined
  if (customHeaders) {
    Object.assign(headers, customHeaders)
  }

  return fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers,
  })
}

// --- Project Actions ---

export async function createProjectAction(name: string) {
  try {
    const res = await fetchWithAuth("/projects", {
      method: "POST",
      body: JSON.stringify({ name }),
    })

    const result = await res.json()
    if (!res.ok || !result.status) {
      return { success: false, error: result.message || "Failed to create project" }
    }

    // Automatically set this new project as active
    await setActiveProjectID(result.data.id)
    return { success: true, project: result.data }
  } catch (err) {
    return { success: false, error: "Network error occurred" }
  }
}

export async function deleteProjectAction(id: string) {
  try {
    const res = await fetchWithAuth(`/projects/${id}`, {
      method: "DELETE",
    })

    const result = await res.json()
    if (!res.ok || !result.status) {
      return { success: false, error: result.message || "Failed to delete project" }
    }

    // Clear active project cookie if it was deleted
    const activeID = await getActiveProjectID()
    if (activeID === id) {
      const projectsRes = await fetchWithAuth("/projects")
      const projectsData = await projectsRes.json()
      if (projectsRes.ok && projectsData.status && projectsData.data?.length > 0) {
        // Switch to the first project in the list
        await setActiveProjectID(projectsData.data[0].id)
      } else {
        await deleteActiveProjectID()
      }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: "Network error occurred" }
  }
}

export async function switchProjectAction(id: string) {
  await setActiveProjectID(id)
  return { success: true }
}

export async function getProjectsAction() {
  try {
    const res = await fetchWithAuth("/projects")
    const result = await res.json()
    if (!res.ok || !result.status) {
      return { success: false, error: result.message || "Failed to fetch projects" }
    }
    return { success: true, projects: result.data }
  } catch (err) {
    return { success: false, error: "Network error occurred" }
  }
}

// --- Provider Actions ---

export async function addProviderAction(prevState: any, formData: FormData) {
  const label = formData.get("label") as string
  const providerName = formData.get("providerName") as string
  const secretKey = formData.get("secretKey") as string
  const publicKey = formData.get("publicKey") as string

  if (!label || !providerName || !secretKey) {
    return { success: false, error: "Label, provider type, and secret key are required" }
  }

  try {
    const res = await fetchWithAuth("/providers", {
      method: "POST",
      body: JSON.stringify({
        label,
        provider_name: providerName,
        secret_key: secretKey,
        public_key: publicKey,
        is_active: true,
      }),
    })

    const result = await res.json()
    if (!res.ok || !result.status) {
      return { success: false, error: result.message || "Failed to add provider" }
    }

    return { success: true, message: "Provider added successfully" }
  } catch (err) {
    return { success: false, error: "Network error occurred" }
  }
}

export async function deleteProviderAction(id: string) {
  try {
    const res = await fetchWithAuth(`/providers/${id}`, {
      method: "DELETE",
    })

    const result = await res.json()
    if (!res.ok || !result.status) {
      return { success: false, error: result.message || "Failed to delete provider" }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: "Network error occurred" }
  }
}

export async function toggleProviderAction(id: string) {
  try {
    const res = await fetchWithAuth(`/providers/${id}/toggle`, {
      method: "PATCH",
    })

    const result = await res.json()
    if (!res.ok || !result.status) {
      return { success: false, error: result.message || "Failed to toggle provider" }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: "Network error occurred" }
  }
}

// --- Webhook Actions ---

export async function addWebhookAction(prevState: any, formData: FormData) {
  const providerName = formData.get("providerName") as string
  const targetUrl = formData.get("targetUrl") as string
  const slug = formData.get("slug") as string

  if (!providerName || !targetUrl) {
    return { success: false, error: "Provider and target URL are required" }
  }

  try {
    const res = await fetchWithAuth("/webhooks/configs", {
      method: "POST",
      body: JSON.stringify({
        provider_name: providerName,
        target_url: targetUrl,
        paye_webhook_slug: slug || undefined,
      }),
    })

    const result = await res.json()
    if (!res.ok || !result.status) {
      return { success: false, error: result.message || "Failed to add webhook" }
    }

    return { success: true, message: "Webhook configured successfully" }
  } catch (err) {
    return { success: false, error: "Network error occurred" }
  }
}

export async function deleteWebhookAction(id: string) {
  try {
    const res = await fetchWithAuth(`/webhooks/configs/${id}`, {
      method: "DELETE",
    })

    const result = await res.json()
    if (!res.ok || !result.status) {
      return { success: false, error: result.message || "Failed to delete webhook configuration" }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: "Network error occurred" }
  }
}
