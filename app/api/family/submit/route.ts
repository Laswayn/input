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
    const { rt, rw, dusun, nama_kepala, alamat, jumlah_anggota, jumlah_anggota_15plus } = await request.json()

    // Validation
    if (!rt || !rw || !dusun || !nama_kepala || !alamat || !jumlah_anggota || jumlah_anggota_15plus === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: "Semua field harus diisi",
        },
        { status: 400 },
      )
    }

    if (jumlah_anggota < 1) {
      return NextResponse.json(
        {
          success: false,
          message: "Jumlah anggota keluarga minimal 1",
        },
        { status: 400 },
      )
    }

    if (jumlah_anggota_15plus < 0 || jumlah_anggota_15plus > jumlah_anggota) {
      return NextResponse.json(
        {
          success: false,
          message: "Jumlah anggota usia 15+ tidak valid",
        },
        { status: 400 },
      )
    }

    // Generate family ID
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.]/g, "")
      .slice(0, 14)
    const keluarga_id = `KEL-${rt}${rw}-${timestamp}`

    // Insert family data
    const result = await pool.query(
      `INSERT INTO families (keluarga_id, rt, rw, dusun, nama_kepala, alamat, jumlah_anggota, jumlah_anggota_15plus)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [keluarga_id, rt, rw, dusun, nama_kepala, alamat, jumlah_anggota, jumlah_anggota_15plus],
    )

    if (jumlah_anggota_15plus > 0) {
      return NextResponse.json({
        success: true,
        message: "Data keluarga berhasil disimpan. Lanjutkan ke input anggota keluarga.",
        redirect_url: `/members?family_id=${keluarga_id}`,
      })
    } else {
      return NextResponse.json({
        success: true,
        message: "Data keluarga berhasil disimpan. Lanjutkan ke halaman akhir.",
        redirect_url: `/final?family_id=${keluarga_id}`,
      })
    }
  } catch (error) {
    console.error("Error saving family:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat menyimpan data",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await pool.query(`
      SELECT f.*, 
             COUNT(fm.id) as total_members,
             CASE WHEN COUNT(fm.id) >= f.jumlah_anggota_15plus THEN true ELSE false END as completed
      FROM families f
      LEFT JOIN family_members fm ON f.id = fm.family_id
      GROUP BY f.id
      ORDER BY f.created_at DESC
    `)

    return NextResponse.json({
      success: true,
      data: result.rows,
    })
  } catch (error) {
    console.error("Error fetching families:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat mengambil data",
      },
      { status: 500 },
    )
  }
}
