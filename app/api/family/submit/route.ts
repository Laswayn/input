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

    // Validate required fields
    const requiredFields = ["rt", "rw", "dusun", "nama_kepala", "alamat", "jumlah_anggota", "jumlah_anggota_15plus"]
    for (const field of requiredFields) {
      if (!data[field] && data[field] !== 0) {
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
    if (data.jumlah_anggota < 1) {
      return NextResponse.json(
        {
          success: false,
          message: "Jumlah anggota keluarga minimal 1",
        },
        { status: 400 },
      )
    }

    if (data.jumlah_anggota_15plus < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Jumlah anggota usia 15+ tidak boleh negatif",
        },
        { status: 400 },
      )
    }

    if (data.jumlah_anggota_15plus > data.jumlah_anggota) {
      return NextResponse.json(
        {
          success: false,
          message: "Jumlah anggota usia 15+ tidak boleh lebih dari jumlah anggota keluarga",
        },
        { status: 400 },
      )
    }

    // Generate family ID
    const timestamp = new Date()
    const familyId = `KEL-${data.rt}${data.rw}-${timestamp.getTime()}`

    // Save family data to database
    await sql`
      INSERT INTO families (
        keluarga_id, rt, rw, dusun, nama_kepala, alamat, 
        jumlah_anggota, jumlah_anggota_15plus
      ) VALUES (
        ${familyId}, ${data.rt}, ${data.rw}, ${data.dusun}, 
        ${data.nama_kepala}, ${data.alamat}, ${data.jumlah_anggota}, 
        ${data.jumlah_anggota_15plus}
      )
    `

    // Determine next step
    if (data.jumlah_anggota_15plus > 0) {
      return NextResponse.json({
        success: true,
        message: "Data keluarga berhasil disimpan. Lanjutkan ke input anggota keluarga.",
        redirect: true,
        redirect_url: `/members?family_id=${familyId}`,
      })
    } else {
      return NextResponse.json({
        success: true,
        message: "Data keluarga berhasil disimpan.",
        redirect: true,
        redirect_url: `/final?family_id=${familyId}`,
      })
    }
  } catch (error) {
    console.error("Error saving family data:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan server",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  if (!(await verifyAuth())) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
  }

  try {
    const families = await sql`
      SELECT f.*, 
             COUNT(m.id) as total_members,
             CASE WHEN s.id IS NOT NULL THEN true ELSE false END as completed
      FROM families f
      LEFT JOIN members m ON f.keluarga_id = m.keluarga_id
      LEFT JOIN surveys s ON f.keluarga_id = s.keluarga_id
      GROUP BY f.id, s.id
      ORDER BY f.created_at DESC
    `

    return NextResponse.json({ data: families })
  } catch (error) {
    console.error("Error fetching families:", error)
    return NextResponse.json({ success: false, message: "Database error" }, { status: 500 })
  }
}
