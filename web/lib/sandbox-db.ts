import fs from "fs"
import path from "path"

const DB_FILE = path.join(process.cwd(), "sandbox_db.json")

export interface SandboxProduct {
  id: string
  name: string
  price: number
  image: string
  category: string
  description: string
}

export interface SandboxUser {
  id: string
  email: string
  name: string
}

export interface SandboxOrder {
  id: string
  userEmail: string
  items: Array<{
    id: string
    name: string
    price: number
    quantity: number
  }>
  totalAmount: number
  status: "pending" | "completed" | "failed"
  reference: string
  createdAt: string
}

export interface SandboxSubscription {
  id: string
  userEmail: string
  planCode: string
  status: "active" | "cancelled" | "expired"
  subscriptionCode: string
  createdAt: string
}

export interface SandboxWebhookLog {
  id: string
  event: string
  payload: any
  receivedAt: string
}

export interface DBData {
  products: SandboxProduct[]
  users: SandboxUser[]
  orders: SandboxOrder[]
  subscriptions: SandboxSubscription[]
  webhookLogs: SandboxWebhookLog[]
}

const defaultData: DBData = {
  products: [
    {
      id: "1",
      name: "Classic Hoodie",
      price: 15000,
      category: "Apparel",
      image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&auto=format&fit=crop&q=60",
      description: "Premium cotton blend streetwear hoodie. Cozy, warm, and highly durable.",
    },
    {
      id: "2",
      name: "Vintage Denim Jacket",
      price: 25000,
      category: "Apparel",
      image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500&auto=format&fit=crop&q=60",
      description: "Authentic retro wash trucker jacket. Crafted from 100% thick rigid denim.",
    },
    {
      id: "3",
      name: "Slim Fit Canvas Chinos",
      price: 12000,
      category: "Apparel",
      image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&auto=format&fit=crop&q=60",
      description: "Comfort-stretch cotton canvas chinos. Tailored silhouette for casual and work wear.",
    },
    {
      id: "4",
      name: "Urban Graphic Print Tee",
      price: 8000,
      category: "Apparel",
      image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60",
      description: "Soft combed cotton tee with artistic modern back print. Relaxed fit.",
    },
  ],
  users: [],
  orders: [],
  subscriptions: [],
  webhookLogs: [],
}

export function readDB(): DBData {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), "utf-8")
      return defaultData
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8")
    return JSON.parse(raw)
  } catch (err) {
    console.error("Error reading sandbox JSON DB:", err)
    return defaultData
  }
}

export function writeDB(data: DBData) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8")
  } catch (err) {
    console.error("Error writing sandbox JSON DB:", err)
  }
}
