"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"

interface FamilyData {
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
  members: any[]
}

export default function ViewFamily() {
  const [loading, setLoading] = useState(true)
  const [family, setFamily] = useState<FamilyData | null>(null)
  const router = useRouter()
  const params = useParams()
  const familyId = params.id as string

  useEffect(() => {
    const loadFamilyData = async () => {
      try {
        const response = await fetch("/api/auth/check")
        const data = await response.json()

        if (!data.authenticated) {
          router.push("/")
          return
        }

        // Load family data
        const familyResponse = await fetch(`/api/family/info?family_id=${familyId}`)
        const familyData = await familyResponse.json()

        if (familyData.success) {
          setFamily(familyData.family)
        } else {
          alert("Data keluarga tidak ditemukan")
          router.push("/manage")
        }
      } catch (error) {
        router.push("/")
        return
      }
      setLoading(false)
    }

    loadFamilyData()
  }, [router, familyId])

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!family) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Data tidak ditemukan</h2>
          <Link href="/manage" className="text-primary-600 hover:text-primary-800 mt-4 inline-block">
            Kembali ke Manajemen Data
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Detail Data Keluarga</h1>
              <p className="text-sm text-gray-600">ID: {family.keluarga_id}</p>
            </div>
            <div className="flex space-x-3">
              <Link
                href={`/edit/family/${familyId}`}
                className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit
              </Link>
              <Link
                href="/manage"
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kembali
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Family Information */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Informasi Keluarga</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500">Nama Kepala Keluarga</label>
              <p className="mt-1 text-lg text-gray-900">{family.nama_kepala}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">ID Keluarga</label>
              <p className="mt-1 text-lg text-gray-900">{family.keluarga_id}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">RT/RW</label>
              <p className="mt-1 text-lg text-gray-900">
                RT {family.rt}/RW {family.rw}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">Dusun</label>
              <p className="mt-1 text-lg text-gray-900">{family.dusun}</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-500">Alamat</label>
              <p className="mt-1 text-lg text-gray-900">{family.alamat}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">Jumlah Anggota Keluarga</label>
              <p className="mt-1 text-lg text-gray-900">{family.jumlah_anggota} orang</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">Anggota Usia 15+ Tahun</label>
              <p className="mt-1 text-lg text-gray-900">{family.jumlah_anggota_15plus} orang</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">Tanggal Input</label>
              <p className="mt-1 text-lg text-gray-900">{new Date(family.created_at).toLocaleDateString("id-ID")}</p>
            </div>
          </div>
        </div>

        {/* Members List */}
        {family.members && family.members.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Anggota Keluarga (15+ Tahun)</h2>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Umur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hubungan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jenis Kelamin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pendidikan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pekerjaan
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {family.members.map((member, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.nama}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.umur} tahun</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.hubungan}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.jenis_kelamin}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.pendidikan}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.memiliki_pekerjaan === "Ya" ? "Bekerja" : "Tidak Bekerja"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(!family.members || family.members.length === 0) && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada data anggota</h3>
              <p className="mt-1 text-sm text-gray-500">Data anggota keluarga usia 15+ tahun belum diinput.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
