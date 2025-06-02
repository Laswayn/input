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

export async function DELETE(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
  }

  try {
    const { family_id } = await request.json()

    if (!family_id) {
      return NextResponse.json(
        {
          success: false,
          message: "Family ID is required",
        },
        { status: 400 },
      )
    }

    // Delete family (cascade will delete members and jobs)
    const result = await pool.query("DELETE FROM families WHERE keluarga_id = $1 RETURNING *", [family_id])

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Family not found",
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Data keluarga berhasil dihapus",
    })
  } catch (error) {
    console.error("Error deleting family:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat menghapus data",
      },
      { status: 500 },
    )
  }
}
