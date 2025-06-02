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
    const { family_id, ...memberData } = data

    // Find family
    const family = await sql`
      SELECT * FROM families WHERE keluarga_id = ${family_id}
    `

    if (family.length === 0) {
      return NextResponse.json({ success: false, message: "Family not found" }, { status: 404 })
    }

    // Validate required fields
    const requiredFields = [
      "nama",
      "umur",
      "hubungan",
      "jenis_kelamin",
      "status_perkawinan",
      "pendidikan",
      "kegiatan",
      "memiliki_pekerjaan",
    ]
    for (const field of requiredFields) {
      if (!memberData[field] && memberData[field] !== 0) {
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
    if (memberData.umur < 15) {
      return NextResponse.json(
        {
          success: false,
          message: "Umur minimal 15 tahun",
        },
        { status: 400 },
      )
    }

    // Get current member count
    const memberCount = await sql`
      SELECT COUNT(*) as count FROM members WHERE keluarga_id = ${family_id}
    `

    const nextMemberNumber = Number.parseInt(memberCount[0].count) + 1

    // Add member to database
    await sql`
      INSERT INTO members (
        family_id, keluarga_id, anggota_ke, nama, umur, hubungan, 
        jenis_kelamin, status_perkawinan, pendidikan, kegiatan, 
        memiliki_pekerjaan, status_pekerjaan_diinginkan, bidang_usaha
      ) VALUES (
        ${family[0].id}, ${family_id}, ${nextMemberNumber}, ${memberData.nama}, 
        ${memberData.umur}, ${memberData.hubungan}, ${memberData.jenis_kelamin}, 
        ${memberData.status_perkawinan}, ${memberData.pendidikan}, ${memberData.kegiatan}, 
        ${memberData.memiliki_pekerjaan}, ${memberData.status_pekerjaan_diinginkan || null}, 
        ${memberData.bidang_usaha || null}
      )
    `

    const remainingMembers = family[0].jumlah_anggota_15plus - nextMemberNumber

    if (remainingMembers > 0) {
      return NextResponse.json({
        success: true,
        message: "Data anggota berhasil disimpan. Lanjutkan ke anggota berikutnya.",
        continue_next_member: true,
        remaining: remainingMembers,
      })
    } else {
      return NextResponse.json({
        success: true,
        message: "Semua data anggota berhasil disimpan.",
        redirect: true,
        redirect_url: `/final?family_id=${family_id}`,
      })
    }
  } catch (error) {
    console.error("Error saving member data:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan server",
      },
      { status: 500 },
    )
  }
}
