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

export async function PUT(request: NextRequest) {
  if (!(await verifyAuth())) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = await request.json()
    const { family_id, ...updateData } = data

    // Validate required fields
    const requiredFields = ["rt", "rw", "dusun", "nama_kepala", "alamat", "jumlah_anggota", "jumlah_anggota_15plus"]
    for (const field of requiredFields) {
      if (!updateData[field] && updateData[field] !== 0) {
        return NextResponse.json(
          {
            success: false,
            message: `Field ${field} wajib diisi`,
          },
          { status: 400 },
        )
      }
    }

    // Additional validation
    if (updateData.jumlah_anggota < 1) {
      return NextResponse.json(
        {
          success: false,
          message: "Jumlah anggota keluarga minimal 1",
        },
        { status: 400 },
      )
    }

    if (updateData.jumlah_anggota_15plus < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Jumlah anggota usia 15+ tidak boleh negatif",
        },
        { status: 400 },
      )
    }

    if (updateData.jumlah_anggota_15plus > updateData.jumlah_anggota) {
      return NextResponse.json(
        {
          success: false,
          message: "Jumlah anggota usia 15+ tidak boleh lebih dari jumlah anggota keluarga",
        },
        { status: 400 },
      )
    }

    // Check if family exists
    const family = await sql`
      SELECT id FROM families WHERE keluarga_id = ${family_id}
    `

    if (family.length === 0) {
      return NextResponse.json({ success: false, message: "Family not found" }, { status: 404 })
    }

    // Update family data
    await sql`
      UPDATE families 
      SET 
        rt = ${updateData.rt},
        rw = ${updateData.rw},
        dusun = ${updateData.dusun},
        nama_kepala = ${updateData.nama_kepala},
        alamat = ${updateData.alamat},
        jumlah_anggota = ${updateData.jumlah_anggota},
        jumlah_anggota_15plus = ${updateData.jumlah_anggota_15plus},
        updated_at = CURRENT_TIMESTAMP
      WHERE keluarga_id = ${family_id}
    `

    return NextResponse.json({
      success: true,
      message: "Data keluarga berhasil diperbarui",
    })
  } catch (error) {
    console.error("Error updating family:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan server",
      },
      { status: 500 },
    )
  }
}
