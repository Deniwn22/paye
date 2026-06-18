"use server"

import { redirect } from "next/navigation"
import {
  setToken,
  getToken,
  deleteToken,
  getActiveProjectID,
  setActiveProjectID,
  deleteActiveProjectID,
  getActiveMode,
  setActiveMode,
  setUserName,
  deleteUserName,
} from "@/lib/cookies"
import { BACKEND_URL } from "@/lib/config"
import { revalidatePath } from "next/cache"

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
    if (result.data.name) {
      await setUserName(result.data.name)
    }
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
    if (result.data.name) {
      await setUserName(result.data.name)
    }
  } catch (err: any) {
    return { success: false, error: "Network error. Make sure Go API is running." }
  }

  redirect("/dashboard")
}

export async function signOutAction() {
  await deleteToken()
  await deleteActiveProjectID()
  await deleteUserName()
  redirect("/signin")
}

// --- Helper for Authorized Fetching with Project Scope ---

async function fetchWithAuth(path: string, options: RequestInit = {}) {
  const token = await getToken()
  if (!token) throw new Error("Unauthorized")

  const projectID = await getActiveProjectID()
  const mode = await getActiveMode()
  const isLive = mode === "live"

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "X-Live-Mode": isLive ? "true" : "false",
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

export async function switchModeAction(mode: "live" | "test") {
  await setActiveMode(mode)
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
  const testSecretKey = formData.get("testSecretKey") as string
  const testPublicKey = formData.get("testPublicKey") as string
  const liveSecretKey = formData.get("liveSecretKey") as string
  const livePublicKey = formData.get("livePublicKey") as string
  const metadataStr = formData.get("metadata") as string

  let metadata = {}
  if (metadataStr) {
    try {
      metadata = JSON.parse(metadataStr)
    } catch (e) {}
  }

  if (!label || !providerName) {
    return { success: false, error: "Name and provider type are required" }
  }

  if (!testSecretKey && !liveSecretKey) {
    return { success: false, error: "At least one Secret Key (Test or Live) is required" }
  }

  try {
    const res = await fetchWithAuth("/providers", {
      method: "POST",
      body: JSON.stringify({
        label,
        provider_name: providerName,
        test_secret_key: testSecretKey,
        test_public_key: testPublicKey,
        live_secret_key: liveSecretKey,
        live_public_key: livePublicKey,
        is_active: true,
        metadata: metadata,
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

  if (!providerName) {
    return { success: false, error: "Provider name is required" }
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

// --- Refund Actions ---

export async function refundTransactionAction(reference: string, amount?: number, customerNote?: string, merchantNote?: string) {
  try {
    const res = await fetchWithAuth("/refund", {
      method: "POST",
      body: JSON.stringify({
        transaction_reference: reference,
        amount: amount || undefined,
        customer_note: customerNote || "",
        merchant_note: merchantNote || "",
      }),
    })

    const result = await res.json()
    if (!res.ok || !result.status) {
      return { success: false, error: result.message || "Refund failed" }
    }
    return { success: true, refund: result.data }
  } catch (err) {
    return { success: false, error: "Network error occurred" }
  }
}

// --- Plan & Subscription Actions ---

export async function createPlanAction(name: string, interval: string, amount: number, currency: string, description: string) {
  try {
    const res = await fetchWithAuth("/plans", {
      method: "POST",
      body: JSON.stringify({
        name,
        interval,
        amount,
        currency,
        description,
      }),
    })

    const result = await res.json()
    if (!res.ok || !result.status) {
      return { success: false, error: result.message || "Failed to create plan" }
    }
    return { success: true, plan: result.data }
  } catch (err) {
    return { success: false, error: "Network error occurred" }
  }
}

export async function createSubscriptionAction(customerEmail: string, planCode: string, authorization?: string, startDate?: string) {
  try {
    const res = await fetchWithAuth("/subscriptions", {
      method: "POST",
      body: JSON.stringify({
        customer_email: customerEmail,
        plan_code: planCode,
        authorization: authorization || "",
        start_date: startDate || "",
      }),
    })

    const result = await res.json()
    if (!res.ok || !result.status) {
      return { success: false, error: result.message || "Failed to create subscription" }
    }
    return { success: true, subscription: result.data }
  } catch (err) {
    return { success: false, error: "Network error occurred" }
  }
}

export async function cancelSubscriptionAction(code: string, token?: string) {
  try {
    const res = await fetchWithAuth(`/subscriptions/${code}/cancel`, {
      method: "POST",
      body: JSON.stringify({
        token: token || "",
      }),
    })

    const result = await res.json()
    if (!res.ok || !result.status) {
      return { success: false, error: result.message || "Failed to cancel subscription" }
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: "Network error occurred" }
  }
}

// --- Transfer & Recipient Actions ---

export async function createRecipientAction(name: string, accountNumber: string, bankCode: string, currency: string) {
  try {
    const res = await fetchWithAuth("/recipients", {
      method: "POST",
      body: JSON.stringify({
        name,
        account_number: accountNumber,
        bank_code: bankCode,
        currency,
      }),
    })

    const result = await res.json()
    if (!res.ok || !result.status) {
      return { success: false, error: result.message || "Failed to create transfer recipient" }
    }
    return { success: true, recipient: result.data }
  } catch (err) {
    return { success: false, error: "Network error occurred" }
  }
}

export async function createTransferAction(amount: number, recipientCode: string, reason: string, reference?: string, currency?: string) {
  try {
    const res = await fetchWithAuth("/transfers", {
      method: "POST",
      body: JSON.stringify({
        amount,
        recipient_code: recipientCode,
        reason,
        reference: reference || "",
        currency: currency || "NGN",
      }),
    })

    const result = await res.json()
    if (!res.ok || !result.status) {
      return { success: false, error: result.message || "Failed to initiate transfer" }
    }
    return { success: true, transfer: result.data }
  } catch (err) {
    return { success: false, error: "Network error occurred" }
  }
}

export async function getPaymentProvidersAction() {
  try {
    const res = await fetch(`${BACKEND_URL}/payment-providers`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store"
    })

    const result = await res.json()
    if (!res.ok || !result.status) {
      return { success: false, error: result.message || "Failed to fetch payment providers" }
    }
    return { success: true, data: result.data }
  } catch (err) {
    return { success: false, error: "Network error occurred" }
  }
}

export async function togglePaymentProviderAction(name: string) {
  try {
    const res = await fetchWithAuth(`/payment-providers/${name}/toggle-support`, {
      method: "POST",
    })

    const result = await res.json()
    if (!res.ok || !result.status) {
      return { success: false, error: result.message || "Failed to toggle payment provider support" }
    }

    revalidatePath("/providers")
    return { success: true }
  } catch (err) {
    return { success: false, error: "Network error occurred" }
  }
}

