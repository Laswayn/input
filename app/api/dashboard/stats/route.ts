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
    // Get total families
    const totalFamilies = await sql`
      SELECT COUNT(*) as count FROM families
    `

    // Get total members
    const totalMembers = await sql`
      SELECT COUNT(*) as count FROM members
    `

    // Get completed surveys
    const completedSurveys = await sql`
      SELECT COUNT(*) as count FROM surveys WHERE completed = true
    `

    // Get statistics by RT/RW
    const statsByRTRW = await sql`
      SELECT 
        rt, rw, dusun,
        COUNT(*) as total_families,
        SUM(jumlah_anggota) as total_residents,
        SUM(jumlah_anggota_15plus) as total_adults
      FROM families 
      GROUP BY rt, rw, dusun 
      ORDER BY rt, rw
    `

    // Get statistics by education level
    const educationStats = await sql`
      SELECT 
        pendidikan,
        COUNT(*) as count
      FROM members 
      GROUP BY pendidikan 
      ORDER BY count DESC
    `

    // Get employment statistics
    const employmentStats = await sql`
      SELECT 
        memiliki_pekerjaan,
        COUNT(*) as count
      FROM members 
      GROUP BY memiliki_pekerjaan
    `

    // Get age distribution
    const ageDistribution = await sql`
      SELECT 
        CASE 
          WHEN umur BETWEEN 15 AND 25 THEN '15-25'
          WHEN umur BETWEEN 26 AND 35 THEN '26-35'
          WHEN umur BETWEEN 36 AND 45 THEN '36-45'
          WHEN umur BETWEEN 46 AND 55 THEN '46-55'
          WHEN umur BETWEEN 56 AND 65 THEN '56-65'
          ELSE '65+'
        END as age_group,
        COUNT(*) as count
      FROM members 
      GROUP BY age_group 
      ORDER BY age_group
    `

    // Get recent families (last 10)
    const recentFamilies = await sql`
      SELECT 
        keluarga_id, nama_kepala, rt, rw, dusun, 
        jumlah_anggota, created_at
      FROM families 
      ORDER BY created_at DESC 
      LIMIT 10
    `

    return NextResponse.json({
      success: true,
      stats: {
        overview: {
          total_families: Number.parseInt(totalFamilies[0].count),
          total_members: Number.parseInt(totalMembers[0].count),
          completed_surveys: Number.parseInt(completedSurveys[0].count),
          completion_rate:
            totalFamilies[0].count > 0 ? Math.round((completedSurveys[0].count / totalFamilies[0].count) * 100) : 0,
        },
        by_area: statsByRTRW,
        education: educationStats,
        employment: employmentStats,
        age_distribution: ageDistribution,
        recent_families: recentFamilies,
      },
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json({ success: false, message: "Database error" }, { status: 500 })
  }
}
