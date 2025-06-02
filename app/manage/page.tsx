"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Family {
  id: number
  keluarga_id: string
  rt: string
  rw: string
  dusun: string
  nama_kepala: string
  alamat: string
  jumlah_anggota: number
  jumlah_anggota_15plus: number
  created_at: string
  total_members: number
  completed: boolean
}

export default function ManageData() {
  const [loading, setLoading] = useState(true)
  const [families, setFamilies] = useState<Family[]>([])
  const [filteredFamilies, setFilteredFamilies] = useState<Family[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRT, setFilterRT] = useState("")
  const [filterRW, setFilterRW] = useState("")
  const [filterDusun, setFilterDusun] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const router = useRouter()

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        const response = await fetch("/api/auth/check")
        const data = await response.json()

        if (!data.authenticated) {
          router.push("/")
          return
        }

        // Load families data
        const familiesResponse = await fetch("/api/family/submit")
        const familiesData = await familiesResponse.json()

        if (familiesData.data) {
          setFamilies(familiesData.data)
          setFilteredFamilies(familiesData.data)
        }
      } catch (error) {
        router.push("/")
        return
      }
      setLoading(false)
    }

    checkAuthAndLoadData()
  }, [router])

  // Filter and search logic
  useEffect(() => {
    let filtered = families

    // Search by name
    if (searchTerm) {
      filtered = filtered.filter(
        (family) =>
          family.nama_kepala.toLowerCase().includes(searchTerm.toLowerCase()) ||
          family.keluarga_id.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by RT
    if (filterRT) {
      filtered = filtered.filter((family) => family.rt === filterRT)
    }

    // Filter by RW
    if (filterRW) {
      filtered = filtered.filter((family) => family.rw === filterRW)
    }

    // Filter by Dusun
    if (filterDusun) {
      filtered = filtered.filter((family) => family.dusun === filterDusun)
    }

    // Filter by status
    if (filterStatus) {
      if (filterStatus === "completed") {
        filtered = filtered.filter((family) => family.completed)
      } else if (filterStatus === "incomplete") {
        filtered = filtered.filter((family) => !family.completed)
      }
    }

    setFilteredFamilies(filtered)
  }, [families, searchTerm, filterRT, filterRW, filterDusun, filterStatus])

  const handleDelete = async (familyId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data keluarga ini?")) {
      return
    }

    try {
      const response = await fetch(`/api/family/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ family_id: familyId }),
      })

      const result = await response.json()

      if (result.success) {
        // Remove from local state
        setFamilies(families.filter((f) => f.keluarga_id !== familyId))
        alert("Data keluarga berhasil dihapus")
      } else {
        alert("Gagal menghapus data: " + result.message)
      }
    } catch (error) {
      alert("Terjadi kesalahan saat menghapus data")
    }
  }

  // Get unique values for filters
  const uniqueRT = [...new Set(families.map((f) => f.rt))].sort()
  const uniqueRW = [...new Set(families.map((f) => f.rw))].sort()
  const uniqueDusun = [...new Set(families.map((f) => f.dusun))].sort()

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
              <h1 className="text-2xl font-bold text-gray-900">Kelola Data Sensus</h1>
              <p className="text-sm text-gray-600">Lihat, edit, dan hapus data keluarga</p>
            </div>
            <Link
              href="/dashboard"
              className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali ke Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pencarian dan Filter</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cari Nama/ID</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nama kepala keluarga atau ID..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* RT Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RT</label>
              <select
                value={filterRT}
                onChange={(e) => setFilterRT(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Semua RT</option>
                {uniqueRT.map((rt) => (
                  <option key={rt} value={rt}>
                    RT {rt}
                  </option>
                ))}
              </select>
            </div>

            {/* RW Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RW</label>
              <select
                value={filterRW}
                onChange={(e) => setFilterRW(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Semua RW</option>
                {uniqueRW.map((rw) => (
                  <option key={rw} value={rw}>
                    RW {rw}
                  </option>
                ))}
              </select>
            </div>

            {/* Dusun Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dusun</label>
              <select
                value={filterDusun}
                onChange={(e) => setFilterDusun(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Semua Dusun</option>
                {uniqueDusun.map((dusun) => (
                  <option key={dusun} value={dusun}>
                    {dusun}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Semua Status</option>
                <option value="completed">Selesai</option>
                <option value="incomplete">Belum Selesai</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="mt-4">
            <button
              onClick={() => {
                setSearchTerm("")
                setFilterRT("")
                setFilterRW("")
                setFilterDusun("")
                setFilterStatus("")
              }}
              className="text-sm text-primary-600 hover:text-primary-800 font-medium"
            >
              Hapus Semua Filter
            </button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <p className="text-sm text-gray-600">
            Menampilkan <span className="font-semibold">{filteredFamilies.length}</span> dari{" "}
            <span className="font-semibold">{families.length}</span> keluarga
          </p>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Keluarga
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wilayah
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Anggota
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFamilies.map((family) => (
                  <tr key={family.keluarga_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{family.nama_kepala}</div>
                        <div className="text-sm text-gray-500">{family.keluarga_id}</div>
                        <div className="text-sm text-gray-500">{family.alamat}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        RT {family.rt}/RW {family.rw}
                      </div>
                      <div className="text-sm text-gray-500">{family.dusun}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{family.jumlah_anggota} total</div>
                      <div className="text-sm text-gray-500">{family.jumlah_anggota_15plus} dewasa</div>
                      <div className="text-sm text-gray-500">{family.total_members || 0} terdata</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          family.completed ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {family.completed ? "Selesai" : "Belum Selesai"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(family.created_at).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link
                        href={`/edit/family/${family.keluarga_id}`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Edit
                      </Link>
                      <Link href={`/view/family/${family.keluarga_id}`} className="text-blue-600 hover:text-blue-900">
                        Lihat
                      </Link>
                      <button
                        onClick={() => handleDelete(family.keluarga_id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredFamilies.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada data</h3>
              <p className="mt-1 text-sm text-gray-500">Tidak ada keluarga yang sesuai dengan filter yang dipilih.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
