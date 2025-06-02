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

  try {
    const { searchParams } = new URL(request.url)
    const rt = searchParams.get("rt")
    const rw = searchParams.get("rw")
    const dusun = searchParams.get("dusun")

    // Build WHERE clause for filtering
    let whereClause = "WHERE 1=1"
    const params: any[] = []
    let paramIndex = 1

    if (rt) {
      whereClause += ` AND f.rt = $${paramIndex}`
      params.push(rt)
      paramIndex++
    }
    if (rw) {
      whereClause += ` AND f.rw = $${paramIndex}`
      params.push(rw)
      paramIndex++
    }
    if (dusun) {
      whereClause += ` AND f.dusun = $${paramIndex}`
      params.push(dusun)
      paramIndex++
    }

    // Get families data
    const familiesQuery = `
      SELECT 
        f.keluarga_id,
        f.rt,
        f.rw,
        f.dusun,
        f.nama_kepala,
        f.alamat,
        f.jumlah_anggota,
        f.jumlah_anggota_15plus,
        f.created_at,
        s.nama_pencacah,
        s.hp_pencacah,
        s.tanggal_pencacah,
        s.nama_pemberi_jawaban,
        s.hp_pemberi_jawaban,
        s.tanggal_pemberi_jawaban,
        s.catatan
      FROM families f
      LEFT JOIN surveys s ON f.keluarga_id = s.keluarga_id
      ${whereClause}
      ORDER BY f.rt, f.rw, f.keluarga_id
    `

    const families = await sql(familiesQuery, params)

    // Get members data
    const membersQuery = `
      SELECT 
        m.*,
        f.rt,
        f.rw,
        f.dusun,
        f.nama_kepala
      FROM members m
      JOIN families f ON m.keluarga_id = f.keluarga_id
      ${whereClause.replace("f.", "f.")}
      ORDER BY m.keluarga_id, m.anggota_ke
    `

    const members = await sql(membersQuery, params)

    // Get filter options for frontend
    const filterOptions = await sql`
      SELECT DISTINCT rt, rw, dusun 
      FROM families 
      ORDER BY rt, rw, dusun
    `

    return NextResponse.json({
      success: true,
      data: {
        families,
        members,
        filterOptions,
        summary: {
          total_families: families.length,
          total_members: members.length,
          export_date: new Date().toISOString(),
          filters: { rt, rw, dusun },
        },
      },
    })
  } catch (error) {
    console.error("Error exporting data:", error)
    return NextResponse.json({ success: false, message: "Database error" }, { status: 500 })
  }
}
