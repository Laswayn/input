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

export async function GET(request: NextRequest) {
  if (!(await verifyAuth())) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const familyId = searchParams.get("family_id")

  if (!familyId) {
    return NextResponse.json({ success: false, message: "Family ID required" }, { status: 400 })
  }

  try {
    const family = await sql`
      SELECT * FROM families 
      WHERE keluarga_id = ${familyId}
    `

    if (family.length === 0) {
      return NextResponse.json({ success: false, message: "Family not found" }, { status: 404 })
    }

    // Get members for this family
    const members = await sql`
      SELECT * FROM members 
      WHERE keluarga_id = ${familyId}
      ORDER BY anggota_ke
    `

    return NextResponse.json({
      success: true,
      family: {
        ...family[0],
        members: members,
      },
    })
  } catch (error) {
    console.error("Error fetching family info:", error)
    return NextResponse.json({ success: false, message: "Database error" }, { status: 500 })
  }
}
