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
    const {
      family_id,
      nama,
      umur,
      hubungan,
      jenis_kelamin,
      status_perkawinan,
      pendidikan,
      kegiatan,
      memiliki_pekerjaan,
      status_pekerjaan_diinginkan,
      bidang_usaha,
    } = await request.json()

    // Validation
    if (
      !family_id ||
      !nama ||
      !umur ||
      !hubungan ||
      !jenis_kelamin ||
      !status_perkawinan ||
      !pendidikan ||
      !kegiatan ||
      !memiliki_pekerjaan
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Semua field harus diisi",
        },
        { status: 400 },
      )
    }

    if (umur < 15) {
      return NextResponse.json(
        {
          success: false,
          message: "Umur minimal 15 tahun",
        },
        { status: 400 },
      )
    }

    // Get family info
    const familyResult = await pool.query("SELECT * FROM families WHERE keluarga_id = $1", [family_id])

    if (familyResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Family not found",
        },
        { status: 404 },
      )
    }

    const family = familyResult.rows[0]

    // Get current member count
    const memberCountResult = await pool.query("SELECT COUNT(*) as count FROM family_members WHERE keluarga_id = $1", [
      family_id,
    ])

    const currentMemberCount = Number.parseInt(memberCountResult.rows[0].count)
    const anggota_ke = currentMemberCount + 1

    // Check if we've reached the limit
    if (currentMemberCount >= family.jumlah_anggota_15plus) {
      return NextResponse.json(
        {
          success: false,
          message: "Sudah mencapai batas maksimal anggota keluarga",
        },
        { status: 400 },
      )
    }

    // Insert member data
    const memberResult = await pool.query(
      `INSERT INTO family_members 
       (family_id, keluarga_id, anggota_ke, nama, umur, hubungan, jenis_kelamin, 
        status_perkawinan, pendidikan, kegiatan, memiliki_pekerjaan, 
        status_pekerjaan_diinginkan, bidang_usaha)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        family.id,
        family_id,
        anggota_ke,
        nama,
        umur,
        hubungan,
        jenis_kelamin,
        status_perkawinan,
        pendidikan,
        kegiatan,
        memiliki_pekerjaan,
        status_pekerjaan_diinginkan || null,
        bidang_usaha || null,
      ],
    )

    const newMemberCount = currentMemberCount + 1
    const remaining = family.jumlah_anggota_15plus - newMemberCount

    if (remaining > 0) {
      return NextResponse.json({
        success: true,
        message: "Data anggota berhasil disimpan. Lanjutkan ke anggota berikutnya.",
        continue_next_member: true,
        remaining,
      })
    } else {
      return NextResponse.json({
        success: true,
        message: "Semua data anggota berhasil disimpan. Lanjutkan ke halaman akhir.",
        redirect_url: `/final?family_id=${family_id}`,
      })
    }
  } catch (error) {
    console.error("Error saving member:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat menyimpan data",
      },
      { status: 500 },
    )
  }
}
