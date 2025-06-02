"use client"

import type React from "react"

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
  members: any[]
}

export default function EditFamily() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [family, setFamily] = useState<FamilyData | null>(null)
  const [formData, setFormData] = useState({
    rt: "",
    rw: "",
    dusun: "",
    nama_kepala: "",
    alamat: "",
    jumlah_anggota: 0,
    jumlah_anggota_15plus: 0,
  })
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
          setFormData({
            rt: familyData.family.rt,
            rw: familyData.family.rw,
            dusun: familyData.family.dusun,
            nama_kepala: familyData.family.nama_kepala,
            alamat: familyData.family.alamat,
            jumlah_anggota: familyData.family.jumlah_anggota,
            jumlah_anggota_15plus: familyData.family.jumlah_anggota_15plus,
          })
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch("/api/family/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          family_id: familyId,
          ...formData,
        }),
      })

      const result = await response.json()

      if (result.success) {
        alert("Data keluarga berhasil diperbarui")
        router.push("/manage")
      } else {
        alert("Gagal memperbarui data: " + result.message)
      }
    } catch (error) {
      alert("Terjadi kesalahan saat menyimpan data")
    }

    setSaving(false)
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Data Keluarga</h1>
              <p className="text-sm text-gray-600">ID: {familyId}</p>
            </div>
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* RT/RW/Dusun */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">RT *</label>
                <input
                  type="text"
                  value={formData.rt}
                  onChange={(e) => setFormData({ ...formData, rt: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">RW *</label>
                <input
                  type="text"
                  value={formData.rw}
                  onChange={(e) => setFormData({ ...formData, rw: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dusun *</label>
                <input
                  type="text"
                  value={formData.dusun}
                  onChange={(e) => setFormData({ ...formData, dusun: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
            </div>

            {/* Nama Kepala Keluarga */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nama Kepala Keluarga *</label>
              <input
                type="text"
                value={formData.nama_kepala}
                onChange={(e) => setFormData({ ...formData, nama_kepala: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            {/* Alamat */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Alamat Lengkap *</label>
              <textarea
                value={formData.alamat}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            {/* Jumlah Anggota */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah Anggota Keluarga *</label>
                <input
                  type="number"
                  min="1"
                  value={formData.jumlah_anggota}
                  onChange={(e) => setFormData({ ...formData, jumlah_anggota: Number.parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah Anggota Usia 15+ Tahun *</label>
                <input
                  type="number"
                  min="0"
                  max={formData.jumlah_anggota}
                  value={formData.jumlah_anggota_15plus}
                  onChange={(e) =>
                    setFormData({ ...formData, jumlah_anggota_15plus: Number.parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Link
                href="/manage"
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-lg font-medium transition-all duration-300 disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>

          {/* Members List */}
          {family?.members && family.members.length > 0 && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Anggota Keluarga (15+ Tahun)</h3>
              <div className="space-y-3">
                {family.members.map((member, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{member.nama}</p>
                      <p className="text-sm text-gray-600">
                        {member.umur} tahun - {member.hubungan} - {member.jenis_kelamin}
                      </p>
                    </div>
                    <Link
                      href={`/edit/member/${member.id}`}
                      className="text-primary-600 hover:text-primary-800 font-medium"
                    >
                      Edit
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
