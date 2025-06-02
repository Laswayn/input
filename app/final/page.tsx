"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import * as XLSX from "xlsx"

interface FinalData {
  nama_pencacah: string
  hp_pencacah: string
  nama_pemberi_jawaban: string
  hp_pemberi_jawaban: string
  catatan: string
}

export default function FinalPage() {
  const [finalData, setFinalData] = useState<FinalData>({
    nama_pencacah: "",
    hp_pencacah: "",
    nama_pemberi_jawaban: "",
    hp_pemberi_jawaban: "",
    catatan: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [familyInfo, setFamilyInfo] = useState<any>(null)
  const [success, setSuccess] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const familyId = searchParams.get("family_id")

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check")
        const data = await response.json()

        if (!data.authenticated) {
          router.push("/")
          return
        }

        // Get family info
        if (familyId) {
          const familyResponse = await fetch(`/api/family/info?family_id=${familyId}`)
          const familyData = await familyResponse.json()
          if (familyData.success) {
            setFamilyInfo(familyData.family)
          }
        }
      } catch (error) {
        router.push("/")
      }
    }

    checkAuth()

    // Set current date and time
    const now = new Date()
    const currentDateTime =
      now.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }) +
      " " +
      now.toLocaleTimeString("id-ID")

    setFinalData((prev) => ({
      ...prev,
      tanggal_pencacah: currentDateTime,
      tanggal_pemberi_jawaban: currentDateTime,
    }))
  }, [router, familyId])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!finalData.nama_pencacah.trim()) newErrors.nama_pencacah = "Nama pencacah wajib diisi"
    if (!finalData.hp_pencacah.trim()) newErrors.hp_pencacah = "HP pencacah wajib diisi"
    if (!finalData.nama_pemberi_jawaban.trim()) newErrors.nama_pemberi_jawaban = "Nama pemberi jawaban wajib diisi"
    if (!finalData.hp_pemberi_jawaban.trim()) newErrors.hp_pemberi_jawaban = "HP pemberi jawaban wajib diisi"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const generateExcel = () => {
    if (!familyInfo) return

    const workbook = XLSX.utils.book_new()
    const worksheetData = []

    // Add header row
    const headers = [
      "Timestamp",
      "ID Keluarga",
      "RT",
      "RW",
      "Dusun",
      "Nama Kepala Keluarga",
      "Alamat",
      "Jumlah Anggota Keluarga",
      "Jumlah Anggota Usia 15+",
      "Anggota Ke",
      "Nama Anggota",
      "Umur",
      "Hubungan dengan Kepala Keluarga",
      "Jenis Kelamin",
      "Status Perkawinan",
      "Pendidikan Terakhir",
      "Kegiatan Sehari-hari",
      "Apakah Memiliki Pekerjaan",
      "Status Pekerjaan yang Diinginkan",
      "Bidang Usaha yang Diminati",
      "Nama Pencacah",
      "HP Pencacah",
      "Tanggal Pencacah",
      "Nama Pemberi Jawaban",
      "HP Pemberi Jawaban",
      "Tanggal Pemberi Jawaban",
      "Catatan",
    ]
    worksheetData.push(headers)

    // Add head of family row
    const headRow = [
      familyInfo.timestamp,
      familyInfo.keluarga_id,
      familyInfo.rt,
      familyInfo.rw,
      familyInfo.dusun,
      familyInfo.nama_kepala,
      familyInfo.alamat,
      familyInfo.jumlah_anggota,
      familyInfo.members?.length || 0,
      1,
      familyInfo.nama_kepala,
      "",
      "Kepala Keluarga",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      finalData.nama_pencacah,
      finalData.hp_pencacah,
      new Date().toLocaleDateString("id-ID"),
      finalData.nama_pemberi_jawaban,
      finalData.hp_pemberi_jawaban,
      new Date().toLocaleDateString("id-ID"),
      finalData.catatan,
    ]
    worksheetData.push(headRow)

    // Add member rows
    if (familyInfo.members) {
      familyInfo.members.forEach((member: any, index: number) => {
        const memberRow = [
          familyInfo.timestamp,
          familyInfo.keluarga_id,
          familyInfo.rt,
          familyInfo.rw,
          familyInfo.dusun,
          familyInfo.nama_kepala,
          familyInfo.alamat,
          familyInfo.jumlah_anggota,
          familyInfo.members.length,
          index + 2,
          member.nama,
          member.umur,
          member.hubungan,
          member.jenis_kelamin,
          member.status_perkawinan,
          member.pendidikan,
          member.kegiatan,
          member.memiliki_pekerjaan,
          member.status_pekerjaan_diinginkan || "",
          member.bidang_usaha || "",
          finalData.nama_pencacah,
          finalData.hp_pencacah,
          new Date().toLocaleDateString("id-ID"),
          finalData.nama_pemberi_jawaban,
          finalData.hp_pemberi_jawaban,
          new Date().toLocaleDateString("id-ID"),
          finalData.catatan,
        ]
        worksheetData.push(memberRow)
      })
    }

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Sensus")

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-")
    const filename = `data_sensus_${timestamp}.xlsx`

    XLSX.writeFile(workbook, filename)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      const response = await fetch("/api/final/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...finalData, family_id: familyId }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        generateExcel()

        setTimeout(() => {
          router.push("/dashboard")
        }, 3000)
      } else {
        setErrors({ general: data.message || "Terjadi kesalahan" })
      }
    } catch (error) {
      setErrors({ general: "Terjadi kesalahan pada server" })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof FinalData, value: string) => {
    setFinalData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  if (!familyInfo) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-primary-50 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6">
            <h1 className="text-2xl font-bold text-center">Halaman Akhir</h1>
            <p className="text-center text-primary-100 mt-1 text-sm">
              Data Petugas Pencacah, Pemberi Jawaban, dan Catatan
            </p>
          </div>

          {/* Family Summary */}
          <div className="bg-blue-50 p-4 border-b">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">Ringkasan Data Keluarga</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">ID Keluarga:</span> {familyInfo.keluarga_id}
              </div>
              <div>
                <span className="font-medium">RT/RW:</span> {familyInfo.rt}/{familyInfo.rw}
              </div>
              <div>
                <span className="font-medium">Dusun:</span> {familyInfo.dusun}
              </div>
              <div>
                <span className="font-medium">Kepala Keluarga:</span> {familyInfo.nama_kepala}
              </div>
              <div className="col-span-2">
                <span className="font-medium">Alamat:</span> {familyInfo.alamat}
              </div>
              <div>
                <span className="font-medium">Jumlah Anggota:</span> {familyInfo.jumlah_anggota}
              </div>
              <div>
                <span className="font-medium">Anggota Usia 15+:</span> {familyInfo.members?.length || 0}
              </div>
            </div>
          </div>

          {/* Members Summary */}
          {familyInfo.members && familyInfo.members.length > 0 && (
            <div className="bg-gray-50 p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Data Anggota Keluarga</h2>
              {familyInfo.members.map((member: any, index: number) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Anggota Ke {index + 1}: {member.nama}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Umur:</span> {member.umur} tahun
                    </div>
                    <div>
                      <span className="font-medium">Jenis Kelamin:</span> {member.jenis_kelamin}
                    </div>
                    <div>
                      <span className="font-medium">Hubungan:</span> {member.hubungan}
                    </div>
                    <div>
                      <span className="font-medium">Status Perkawinan:</span> {member.status_perkawinan}
                    </div>
                    <div>
                      <span className="font-medium">Pendidikan:</span> {member.pendidikan}
                    </div>
                    <div>
                      <span className="font-medium">Kegiatan:</span> {member.kegiatan}
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Memiliki Pekerjaan:</span> {member.memiliki_pekerjaan}
                    </div>
                    {member.status_pekerjaan_diinginkan && (
                      <div className="col-span-2">
                        <span className="font-medium">Status Pekerjaan Diinginkan:</span>{" "}
                        {member.status_pekerjaan_diinginkan}
                      </div>
                    )}
                    {member.bidang_usaha && (
                      <div className="col-span-2">
                        <span className="font-medium">Bidang Usaha Diminati:</span> {member.bidang_usaha}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Petugas Pencacah */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h2 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Petugas Pencacah
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Petugas <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={finalData.nama_pencacah}
                    onChange={(e) => handleInputChange("nama_pencacah", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
                    required
                  />
                  {errors.nama_pencacah && <p className="text-red-500 text-xs mt-1">{errors.nama_pencacah}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor HP <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={finalData.hp_pencacah}
                    onChange={(e) => handleInputChange("hp_pencacah", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
                    required
                  />
                  {errors.hp_pencacah && <p className="text-red-500 text-xs mt-1">{errors.hp_pencacah}</p>}
                </div>
              </div>
            </div>

            {/* Pemberi Jawaban */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h2 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Pemberi Jawaban
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={finalData.nama_pemberi_jawaban}
                    onChange={(e) => handleInputChange("nama_pemberi_jawaban", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
                    required
                  />
                  {errors.nama_pemberi_jawaban && (
                    <p className="text-red-500 text-xs mt-1">{errors.nama_pemberi_jawaban}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor HP <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={finalData.hp_pemberi_jawaban}
                    onChange={(e) => handleInputChange("hp_pemberi_jawaban", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
                    required
                  />
                  {errors.hp_pemberi_jawaban && (
                    <p className="text-red-500 text-xs mt-1">{errors.hp_pemberi_jawaban}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Catatan */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Catatan
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Tambahan</label>
                <textarea
                  value={finalData.catatan}
                  onChange={(e) => handleInputChange("catatan", e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-300 focus:border-primary-300 resize-none"
                  placeholder="Masukkan catatan tambahan jika ada..."
                />
              </div>
            </div>

            {errors.general && (
              <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg">{errors.general}</div>
            )}

            {success && (
              <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Semua data berhasil disimpan! File Excel telah diunduh. Mengalihkan ke dashboard...
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium py-3 px-4 rounded-lg transition duration-300 flex items-center justify-center disabled:opacity-50"
              >
                {loading ? (
                  <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
                {loading ? "Menyimpan..." : "Selesai & Simpan Semua Data"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
