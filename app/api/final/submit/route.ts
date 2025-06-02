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

export async function POST(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
  }

  try {
    const { family_id, nama_pencacah, hp_pencacah, nama_pemberi_jawaban, hp_pemberi_jawaban, catatan } =
      await request.json()

    // Validation
    if (!family_id || !nama_pencacah || !hp_pencacah || !nama_pemberi_jawaban || !hp_pemberi_jawaban) {
      return NextResponse.json(
        {
          success: false,
          message: "Semua field harus diisi",
        },
        { status: 400 },
      )
    }

    // Update family with final information
    const result = await pool.query(
      `UPDATE families 
       SET nama_pencacah = $1, hp_pencacah = $2, nama_pemberi_jawaban = $3, 
           hp_pemberi_jawaban = $4, catatan = $5, updated_at = CURRENT_TIMESTAMP
       WHERE keluarga_id = $6
       RETURNING *`,
      [nama_pencacah, hp_pencacah, nama_pemberi_jawaban, hp_pemberi_jawaban, catatan || null, family_id],
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
      message: "Semua data berhasil disimpan. Terima kasih!",
    })
  } catch (error) {
    console.error("Error saving final data:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat menyimpan data",
      },
      { status: 500 },
    )
  }
}
