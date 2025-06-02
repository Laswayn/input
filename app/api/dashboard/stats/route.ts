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
    // Overview statistics
    const overviewResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT f.id) as total_families,
        COUNT(DISTINCT fm.id) as total_members,
        COUNT(DISTINCT CASE WHEN f.nama_pencacah IS NOT NULL THEN f.id END) as completed_surveys,
        ROUND(
          (COUNT(DISTINCT CASE WHEN f.nama_pencacah IS NOT NULL THEN f.id END) * 100.0 / 
           NULLIF(COUNT(DISTINCT f.id), 0)), 1
        ) as completion_rate
      FROM families f
      LEFT JOIN family_members fm ON f.id = fm.family_id
    `)

    // Statistics by area
    const areaResult = await pool.query(`
      SELECT 
        rt, rw, dusun,
        COUNT(*) as total_families,
        SUM(jumlah_anggota) as total_residents,
        COUNT(CASE WHEN fm.id IS NOT NULL THEN 1 END) as total_adults
      FROM families f
      LEFT JOIN family_members fm ON f.id = fm.family_id
      GROUP BY rt, rw, dusun
      ORDER BY rt, rw, dusun
    `)

    // Education statistics
    const educationResult = await pool.query(`
      SELECT pendidikan, COUNT(*) as count
      FROM family_members
      GROUP BY pendidikan
      ORDER BY count DESC
    `)

    // Employment statistics
    const employmentResult = await pool.query(`
      SELECT memiliki_pekerjaan, COUNT(*) as count
      FROM family_members
      GROUP BY memiliki_pekerjaan
      ORDER BY count DESC
    `)

    // Age distribution
    const ageResult = await pool.query(`
      SELECT 
        CASE 
          WHEN umur BETWEEN 15 AND 24 THEN '15-24'
          WHEN umur BETWEEN 25 AND 34 THEN '25-34'
          WHEN umur BETWEEN 35 AND 44 THEN '35-44'
          WHEN umur BETWEEN 45 AND 54 THEN '45-54'
          WHEN umur BETWEEN 55 AND 64 THEN '55-64'
          ELSE '65+'
        END as age_group,
        COUNT(*) as count
      FROM family_members
      GROUP BY age_group
      ORDER BY age_group
    `)

    // Recent families
    const recentResult = await pool.query(`
      SELECT 
        keluarga_id, nama_kepala, rt, rw, dusun,
        jumlah_anggota, created_at
      FROM families
      ORDER BY created_at DESC
      LIMIT 10
    `)

    const stats = {
      overview: overviewResult.rows[0],
      by_area: areaResult.rows,
      education: educationResult.rows,
      employment: employmentResult.rows,
      age_distribution: ageResult.rows,
      recent_families: recentResult.rows,
    }

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat mengambil statistik",
      },
      { status: 500 },
    )
  }
}
