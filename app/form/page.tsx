"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface FamilyData {
  rt: string
  rw: string
  dusun: string
  nama_kepala: string
  alamat: string
  jumlah_anggota: number
  jumlah_anggota_15plus: number
}

export default function FamilyForm() {
  const [formData, setFormData] = useState<FamilyData>({
    rt: "",
    rw: "",
    dusun: "",
    nama_kepala: "",
    alamat: "",
    jumlah_anggota: 0,
    jumlah_anggota_15plus: 0,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check")
        const data = await response.json()

        if (!data.authenticated) {
          router.push("/")
        }
      } catch (error) {
        router.push("/")
      }
    }

    checkAuth()
  }, [router])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.rt.trim()) newErrors.rt = "RT wajib diisi"
    if (!formData.rw.trim()) newErrors.rw = "RW wajib diisi"
    if (!formData.dusun.trim()) newErrors.dusun = "Dusun wajib diisi"
    if (!formData.nama_kepala.trim()) newErrors.nama_kepala = "Nama kepala keluarga wajib diisi"
    if (!formData.alamat.trim()) newErrors.alamat = "Alamat wajib diisi"
    if (formData.jumlah_anggota < 1) newErrors.jumlah_anggota = "Jumlah anggota minimal 1"
    if (formData.jumlah_anggota_15plus < 0) newErrors.jumlah_anggota_15plus = "Tidak boleh negatif"
    if (formData.jumlah_anggota_15plus > formData.jumlah_anggota) {
      newErrors.jumlah_anggota_15plus = "Tidak boleh lebih dari jumlah anggota keluarga"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      const response = await fetch("/api/family/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        if (data.redirect_url) {
          setTimeout(() => {
            router.push(data.redirect_url)
          }, 2000)
        }
      } else {
        setErrors({ general: data.message || "Terjadi kesalahan" })
      }
    } catch (error) {
      setErrors({ general: "Terjadi kesalahan pada server" })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof FamilyData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <div className="min-h-screen bg-primary-50 py-8 px-4 flex items-center justify-center">
      <div className="container mx-auto max-w-2xl">
        <div className="form-card bg-white">
          <div className="form-header">
            <h1 className="text-2xl font-bold text-center">Form Input Data Desa Sidokepung</h1>
            <p className="text-center text-primary-100 mt-1 text-sm">Silakan isi data dengan lengkap dan benar</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* RT/RW/Dusun Fields */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="rt" className="block text-sm font-medium text-gray-700 mb-1">
                  RT
                </label>
                <input
                  type="text"
                  id="rt"
                  value={formData.rt}
                  onChange={(e) => handleInputChange("rt", e.target.value)}
                  placeholder="Contoh: 01"
                  className="form-input w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-300"
                />
                {errors.rt && <p className="text-red-500 text-xs mt-1">{errors.rt}</p>}
              </div>

              <div>
                <label htmlFor="rw" className="block text-sm font-medium text-gray-700 mb-1">
                  RW
                </label>
                <input
                  type="text"
                  id="rw"
                  value={formData.rw}
                  onChange={(e) => handleInputChange("rw", e.target.value)}
                  placeholder="Contoh: 03"
                  className="form-input w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-300"
                />
                {errors.rw && <p className="text-red-500 text-xs mt-1">{errors.rw}</p>}
              </div>

              <div>
                <label htmlFor="dusun" className="block text-sm font-medium text-gray-700 mb-1">
                  Dusun
                </label>
                <input
                  type="text"
                  id="dusun"
                  value={formData.dusun}
                  onChange={(e) => handleInputChange("dusun", e.target.value)}
                  placeholder="Contoh: Melati"
                  className="form-input w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-300"
                />
                {errors.dusun && <p className="text-red-500 text-xs mt-1">{errors.dusun}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="nama_kepala" className="block text-sm font-medium text-gray-700 mb-1">
                Nama Kepala Keluarga
              </label>
              <input
                type="text"
                id="nama_kepala"
                value={formData.nama_kepala}
                onChange={(e) => handleInputChange("nama_kepala", e.target.value)}
                placeholder="Masukkan nama kepala keluarga"
                className="form-input w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-300"
              />
              {errors.nama_kepala && <p className="text-red-500 text-xs mt-1">{errors.nama_kepala}</p>}
            </div>

            <div>
              <label htmlFor="alamat" className="block text-sm font-medium text-gray-700 mb-1">
                Alamat Lengkap
              </label>
              <textarea
                id="alamat"
                value={formData.alamat}
                onChange={(e) => handleInputChange("alamat", e.target.value)}
                rows={3}
                placeholder="Jalan/Gang dan Nomor Rumah"
                className="form-input w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-300 resize-none"
              />
              {errors.alamat && <p className="text-red-500 text-xs mt-1">{errors.alamat}</p>}
            </div>

            {/* Jumlah Anggota Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="jumlah_anggota" className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah Anggota Keluarga
                </label>
                <input
                  type="number"
                  id="jumlah_anggota"
                  value={formData.jumlah_anggota || ""}
                  onChange={(e) => handleInputChange("jumlah_anggota", Number.parseInt(e.target.value) || 0)}
                  min="1"
                  placeholder="Contoh: 4"
                  className="form-input w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-300"
                />
                {errors.jumlah_anggota && <p className="text-red-500 text-xs mt-1">{errors.jumlah_anggota}</p>}
              </div>

              <div>
                <label htmlFor="jumlah_anggota_15plus" className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah Anggota Usia 15+
                </label>
                <input
                  type="number"
                  id="jumlah_anggota_15plus"
                  value={formData.jumlah_anggota_15plus || ""}
                  onChange={(e) => handleInputChange("jumlah_anggota_15plus", Number.parseInt(e.target.value) || 0)}
                  min="0"
                  max={formData.jumlah_anggota}
                  placeholder="Contoh: 3"
                  className="form-input w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-300"
                />
                {errors.jumlah_anggota_15plus && (
                  <p className="text-red-500 text-xs mt-1">{errors.jumlah_anggota_15plus}</p>
                )}
              </div>
            </div>

            {errors.general && (
              <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg">{errors.general}</div>
            )}

            {success && (
              <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded-lg">
                Data berhasil disimpan! Mengalihkan ke halaman berikutnya...
              </div>
            )}

            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="submit-btn w-full text-white font-medium py-3 px-4 rounded-lg transition duration-300 flex items-center justify-center disabled:opacity-50"
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
                      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                    />
                  </svg>
                )}
                {loading ? "Menyimpan..." : "Simpan Data"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
