import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { cookies } from "next/headers"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

async function verifyAuth() {
  try {
    const token = cookies().get("auth-token")?.value
    if (!token) return false

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")
    await jwtVerify(token, secret)
    return true
  } catch {
    return false
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await verifyAuth())) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
  }

  try {
    const { family_id } = await request.json()

    if (!family_id) {
      return NextResponse.json({ success: false, message: "Family ID required" }, { status: 400 })
    }

    // Check if family exists
    const family = await sql`
      SELECT id FROM families WHERE keluarga_id = ${family_id}
    `

    if (family.length === 0) {
      return NextResponse.json({ success: false, message: "Family not found" }, { status: 404 })
    }

    // Delete related data (cascade should handle this, but let's be explicit)
    await sql`DELETE FROM surveys WHERE keluarga_id = ${family_id}`
    await sql`DELETE FROM members WHERE keluarga_id = ${family_id}`
    await sql`DELETE FROM families WHERE keluarga_id = ${family_id}`

    return NextResponse.json({
      success: true,
      message: "Data keluarga berhasil dihapus",
    })
  } catch (error) {
    console.error("Error deleting family:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan server",
      },
      { status: 500 },
    )
  }
}
