"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import * as XLSX from "xlsx"

interface ExportData {
  families: any[]
  members: any[]
  filterOptions: Array<{ rt: string; rw: string; dusun: string }>
  summary: {
    total_families: number
    total_members: number
    export_date: string
    filters: { rt?: string; rw?: string; dusun?: string }
  }
}

export default function ExportPage() {
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [data, setData] = useState<ExportData | null>(null)
  const [filters, setFilters] = useState({
    rt: "",
    rw: "",
    dusun: "",
  })
  const router = useRouter()

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        const response = await fetch("/api/auth/check")
        const authData = await response.json()

        if (!authData.authenticated) {
          router.push("/")
          return
        }

        await loadData()
      } catch (error) {
        router.push("/")
        return
      }
      setLoading(false)
    }

    checkAuthAndLoadData()
  }, [router])

  const loadData = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.rt) params.append("rt", filters.rt)
      if (filters.rw) params.append("rw", filters.rw)
      if (filters.dusun) params.append("dusun", filters.dusun)

      const response = await fetch(`/api/export/excel?${params}`)
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      }
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const applyFilters = () => {
    setLoading(true)
    loadData().finally(() => setLoading(false))
  }

  const exportToExcel = () => {
    if (!data) return

    setExporting(true)

    try {
      // Create workbook
      const wb = XLSX.utils.book_new()

      // Sheet 1: Summary
      const summaryData = [
        ["LAPORAN DATA SENSUS DESA SIDOKEPUNG"],
        [""],
        ["Tanggal Export:", new Date(data.summary.export_date).toLocaleString("id-ID")],
        ["Total Keluarga:", data.summary.total_families],
        ["Total Anggota 15+ Tahun:", data.summary.total_members],
        [""],
        ["Filter yang Diterapkan:"],
        ["RT:", data.summary.filters.rt || "Semua"],
        ["RW:", data.summary.filters.rw || "Semua"],
        ["Dusun:", data.summary.filters.dusun || "Semua"],
      ]
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(wb, summaryWs, "Ringkasan")

      // Sheet 2: Data Keluarga
      const familyHeaders = [
        "ID Keluarga",
        "RT",
        "RW",
        "Dusun",
        "Nama Kepala Keluarga",
        "Alamat",
        "Jumlah Anggota",
        "Anggota 15+ Tahun",
        "Tanggal Input",
        "Nama Pencacah",
        "HP Pencacah",
        "Nama Pemberi Jawaban",
        "HP Pemberi Jawaban",
        "Catatan",
      ]

      const familyData = data.families.map((family) => [
        family.keluarga_id,
        family.rt,
        family.rw,
        family.dusun,
        family.nama_kepala,
        family.alamat,
        family.jumlah_anggota,
        family.jumlah_anggota_15plus,
        new Date(family.created_at).toLocaleDateString("id-ID"),
        family.nama_pencacah || "",
        family.hp_pencacah || "",
        family.nama_pemberi_jawaban || "",
        family.hp_pemberi_jawaban || "",
        family.catatan || "",
      ])

      const familyWs = XLSX.utils.aoa_to_sheet([familyHeaders, ...familyData])
      XLSX.utils.book_append_sheet(wb, familyWs, "Data Keluarga")

      // Sheet 3: Data Anggota
      const memberHeaders = [
        "ID Keluarga",
        "RT",
        "RW",
        "Dusun",
        "Kepala Keluarga",
        "Anggota Ke-",
        "Nama",
        "Umur",
        "Hubungan",
        "Jenis Kelamin",
        "Status Perkawinan",
        "Pendidikan",
        "Kegiatan",
        "Memiliki Pekerjaan",
        "Status Pekerjaan Diinginkan",
        "Bidang Usaha",
      ]

      const memberData = data.members.map((member) => [
        member.keluarga_id,
        member.rt,
        member.rw,
        member.dusun,
        member.nama_kepala,
        member.anggota_ke,
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
      ])

      const memberWs = XLSX.utils.aoa_to_sheet([memberHeaders, ...memberData])
      XLSX.utils.book_append_sheet(wb, memberWs, "Data Anggota")

      // Generate filename
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-")
      const filterSuffix =
        data.summary.filters.rt || data.summary.filters.rw || data.summary.filters.dusun
          ? `_${data.summary.filters.rt || "ALL"}-${data.summary.filters.rw || "ALL"}-${data.summary.filters.dusun || "ALL"}`
          : ""
      const filename = `Data_Sensus_Sidokepung_${timestamp}${filterSuffix}.xlsx`

      // Download file
      XLSX.writeFile(wb, filename)
    } catch (error) {
      console.error("Error exporting to Excel:", error)
      alert("Terjadi kesalahan saat export data")
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Export Data Sensus</h1>
              <p className="text-sm text-gray-600">Download data dalam format Excel</p>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300"
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Data Export</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">RT</label>
              <select
                value={filters.rt}
                onChange={(e) => handleFilterChange("rt", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Semua RT</option>
                {Array.from(new Set(data?.filterOptions.map((f) => f.rt))).map((rt) => (
                  <option key={rt} value={rt}>
                    {rt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">RW</label>
              <select
                value={filters.rw}
                onChange={(e) => handleFilterChange("rw", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Semua RW</option>
                {Array.from(new Set(data?.filterOptions.map((f) => f.rw))).map((rw) => (
                  <option key={rw} value={rw}>
                    {rw}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dusun</label>
              <select
                value={filters.dusun}
                onChange={(e) => handleFilterChange("dusun", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Semua Dusun</option>
                {Array.from(new Set(data?.filterOptions.map((f) => f.dusun))).map((dusun) => (
                  <option key={dusun} value={dusun}>
                    {dusun}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={applyFilters}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300"
              >
                Terapkan Filter
              </button>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan Data</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">{data?.summary.total_families || 0}</div>
              <div className="text-sm text-gray-600">Total Keluarga</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{data?.summary.total_members || 0}</div>
              <div className="text-sm text-gray-600">Total Anggota 15+</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {data?.summary.total_families
                  ? Math.round((data.summary.total_members / data.summary.total_families) * 100) / 100
                  : 0}
              </div>
              <div className="text-sm text-gray-600">Rata-rata Anggota/Keluarga</div>
            </div>
          </div>
        </div>

        {/* Export Button */}
        <div className="text-center">
          <button
            onClick={exportToExcel}
            disabled={exporting || !data}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:transform-none disabled:cursor-not-allowed"
          >
            {exporting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Mengexport...
              </div>
            ) : (
              <div className="flex items-center">
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download Excel ({data?.summary.total_families || 0} keluarga)
              </div>
            )}
          </button>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-blue-600 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h4 className="text-lg font-semibold text-blue-900 mb-2">Informasi Export</h4>
              <ul className="text-blue-800 space-y-1">
                <li>• File Excel akan berisi 3 sheet: Ringkasan, Data Keluarga, dan Data Anggota</li>
                <li>• Data yang diexport sesuai dengan filter yang dipilih</li>
                <li>• File akan otomatis terdownload ke folder Downloads</li>
                <li>• Format nama file: Data_Sensus_Sidokepung_[tanggal]_[filter].xlsx</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
