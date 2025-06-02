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

export async function PUT(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
  }

  try {
    const { family_id, rt, rw, dusun, nama_kepala, alamat, jumlah_anggota, jumlah_anggota_15plus } =
      await request.json()

    // Validation
    if (
      !family_id ||
      !rt ||
      !rw ||
      !dusun ||
      !nama_kepala ||
      !alamat ||
      !jumlah_anggota ||
      jumlah_anggota_15plus === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Semua field harus diisi",
        },
        { status: 400 },
      )
    }

    // Update family data
    const result = await pool.query(
      `UPDATE families 
       SET rt = $1, rw = $2, dusun = $3, nama_kepala = $4, alamat = $5, 
           jumlah_anggota = $6, jumlah_anggota_15plus = $7, updated_at = CURRENT_TIMESTAMP
       WHERE keluarga_id = $8
       RETURNING *`,
      [rt, rw, dusun, nama_kepala, alamat, jumlah_anggota, jumlah_anggota_15plus, family_id],
    )

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
      message: "Data keluarga berhasil diperbarui",
      family: result.rows[0],
    })
  } catch (error) {
    console.error("Error updating family:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat memperbarui data",
      },
      { status: 500 },
    )
  }
}
