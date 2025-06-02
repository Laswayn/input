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
    const rt = searchParams.get("rt")
    const rw = searchParams.get("rw")
    const dusun = searchParams.get("dusun")

    // Build WHERE clause for filters
    const whereConditions = []
    const queryParams = []
    let paramIndex = 1

    if (rt) {
      whereConditions.push(`f.rt = $${paramIndex}`)
      queryParams.push(rt)
      paramIndex++
    }

    if (rw) {
      whereConditions.push(`f.rw = $${paramIndex}`)
      queryParams.push(rw)
      paramIndex++
    }

    if (dusun) {
      whereConditions.push(`f.dusun = $${paramIndex}`)
      queryParams.push(dusun)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

    // Get families data
    const familiesQuery = `
      SELECT f.*, 
             COUNT(fm.id) as member_count
      FROM families f
      LEFT JOIN family_members fm ON f.id = fm.family_id
      ${whereClause}
      GROUP BY f.id
      ORDER BY f.created_at DESC
    `

    const familiesResult = await pool.query(familiesQuery, queryParams)

    // Get members data
    const membersQuery = `
      SELECT f.keluarga_id, f.rt, f.rw, f.dusun, f.nama_kepala,
             fm.anggota_ke, fm.nama, fm.umur, fm.hubungan, fm.jenis_kelamin,
             fm.status_perkawinan, fm.pendidikan, fm.kegiatan, fm.memiliki_pekerjaan,
             fm.status_pekerjaan_diinginkan, fm.bidang_usaha
      FROM families f
      INNER JOIN family_members fm ON f.id = fm.family_id
      ${whereClause}
      ORDER BY f.keluarga_id, fm.anggota_ke
    `

    const membersResult = await pool.query(membersQuery, queryParams)

    // Get filter options
    const filterOptionsResult = await pool.query(`
      SELECT DISTINCT rt, rw, dusun
      FROM families
      ORDER BY rt, rw, dusun
    `)

    const data = {
      families: familiesResult.rows,
      members: membersResult.rows,
      filterOptions: filterOptionsResult.rows,
      summary: {
        total_families: familiesResult.rows.length,
        total_members: membersResult.rows.length,
        export_date: new Date().toISOString(),
        filters: { rt, rw, dusun },
      },
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("Error exporting data:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat mengexport data",
      },
      { status: 500 },
    )
  }
}
