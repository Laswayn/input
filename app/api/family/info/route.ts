import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import pool from "@/lib/database"

function verifyAuth(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value
  if (!token) return false

  try {
    jwt.verify(token, process.env.JWT_SECRET!)
    return true
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const family_id = searchParams.get("family_id")

    if (!family_id) {
      return NextResponse.json(
        {
          success: false,
          message: "Family ID is required",
        },
        { status: 400 },
      )
    }

    // Get family info
    const familyResult = await pool.query("SELECT * FROM families WHERE keluarga_id = $1", [family_id])

    if (familyResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Family not found",
        },
        { status: 404 },
      )
    }

    // Get family members
    const membersResult = await pool.query("SELECT * FROM family_members WHERE keluarga_id = $1 ORDER BY anggota_ke", [
      family_id,
    ])

    const family = familyResult.rows[0]
    family.members = membersResult.rows

    return NextResponse.json({
      success: true,
      family,
    })
  } catch (error) {
    console.error("Error fetching family info:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat mengambil data",
      },
      { status: 500 },
    )
  }
}
