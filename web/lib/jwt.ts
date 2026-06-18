// web/lib/jwt.ts
export interface JWTPayload {
  user_id: string
  user_email: string
  user_api_key: string
  user_public_id: string
  role: string
  exp: number
}

export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null

    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    
    // Support UTF-8 parsing server-side in Node.js
    const buffer = Buffer.from(base64, "base64")
    const payloadStr = buffer.toString("utf-8")
    
    const payload = JSON.parse(payloadStr)
    return {
      user_id: payload.user_id,
      user_email: payload.email,
      user_api_key: payload.api_key,
      user_public_id: payload.public_id || "",
      role: payload.role || "merchant",
      exp: payload.exp,
    }
  } catch (err) {
    return null
  }
}
