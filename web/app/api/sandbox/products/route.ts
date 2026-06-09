import { NextRequest, NextResponse } from "next/server"
import { readDB, writeDB, SandboxProduct } from "@/lib/sandbox-db"

export async function GET() {
  const db = readDB()
  return NextResponse.json({ status: true, data: db.products })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, price, description, category, image } = body

    if (!name || !price) {
      return NextResponse.json({ status: false, message: "Name and Price are required" }, { status: 400 })
    }

    const db = readDB()
    const newProduct: SandboxProduct = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      price: parseFloat(price),
      category: category || "Apparel",
      image: image || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500",
      description: description || "",
    }

    db.products.push(newProduct)
    writeDB(db)

    return NextResponse.json({ status: true, data: newProduct })
  } catch (err: any) {
    return NextResponse.json({ status: false, message: err.message }, { status: 500 })
  }
}
