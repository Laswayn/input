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

export async function POST(request: NextRequest) {
  if (!(await verifyAuth())) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = await request.json()
    const { family_id, ...finalData } = data

    // Find family
    const family = await sql`
      SELECT * FROM families WHERE keluarga_id = ${family_id}
    `

    if (family.length === 0) {
      return NextResponse.json({ success: false, message: "Family not found" }, { status: 404 })
    }

    // Validate required fields
    const requiredFields = ["nama_pencacah", "hp_pencacah", "nama_pemberi_jawaban", "hp_pemberi_jawaban"]
    for (const field of requiredFields) {
      if (!finalData[field] || !finalData[field].trim()) {
        return NextResponse.json(
          {
            success: false,
            message: `Field ${field} wajib diisi`,
          },
          { status: 400 },
        )
      }
    }

    // Save survey completion data
    await sql`
      INSERT INTO surveys (
        family_id, keluarga_id, nama_pencacah, hp_pencacah, 
        nama_pemberi_jawaban, hp_pemberi_jawaban, catatan
      ) VALUES (
        ${family[0].id}, ${family_id}, ${finalData.nama_pencacah}, 
        ${finalData.hp_pencacah}, ${finalData.nama_pemberi_jawaban}, 
        ${finalData.hp_pemberi_jawaban}, ${finalData.catatan || null}
      )
    `

    return NextResponse.json({
      success: true,
      message: "Semua data berhasil disimpan!",
    })
  } catch (error) {
    console.error("Error saving final data:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan server",
      },
      { status: 500 },
    )
  }
}
