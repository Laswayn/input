"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

interface MemberData {
  nama: string
  umur: number
  hubungan: string
  jenis_kelamin: string
  status_perkawinan: string
  pendidikan: string
  kegiatan: string
  memiliki_pekerjaan: string
  status_pekerjaan_diinginkan?: string
  bidang_usaha?: string
}

export default function MembersForm() {
  const [memberData, setMemberData] = useState<MemberData>({
    nama: "",
    umur: 15,
    hubungan: "",
    jenis_kelamin: "",
    status_perkawinan: "",
    pendidikan: "",
    kegiatan: "",
    memiliki_pekerjaan: "",
    status_pekerjaan_diinginkan: "",
    bidang_usaha: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [familyInfo, setFamilyInfo] = useState<any>(null)
  const [remainingMembers, setRemainingMembers] = useState(0)

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
            setRemainingMembers(familyData.family.jumlah_anggota_15plus - familyData.family.members.length)
          }
        }
      } catch (error) {
        router.push("/")
      }
    }

    checkAuth()
  }, [router, familyId])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!memberData.nama.trim()) newErrors.nama = "Nama wajib diisi"
    if (memberData.umur < 15) newErrors.umur = "Umur minimal 15 tahun"
    if (!memberData.hubungan) newErrors.hubungan = "Hubungan wajib dipilih"
    if (!memberData.jenis_kelamin) newErrors.jenis_kelamin = "Jenis kelamin wajib dipilih"
    if (!memberData.status_perkawinan) newErrors.status_perkawinan = "Status perkawinan wajib dipilih"
    if (!memberData.pendidikan) newErrors.pendidikan = "Pendidikan wajib dipilih"
    if (!memberData.kegiatan) newErrors.kegiatan = "Kegiatan wajib dipilih"
    if (!memberData.memiliki_pekerjaan) newErrors.memiliki_pekerjaan = "Status pekerjaan wajib dipilih"

    // Conditional validation
    if (memberData.memiliki_pekerjaan === "Tidak" && !memberData.status_pekerjaan_diinginkan) {
      newErrors.status_pekerjaan_diinginkan = "Status pekerjaan yang diinginkan wajib dipilih"
    }

    if (memberData.status_pekerjaan_diinginkan === "Berusaha Sendiri" && !memberData.bidang_usaha) {
      newErrors.bidang_usaha = "Bidang usaha wajib dipilih"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      const response = await fetch("/api/members/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...memberData, family_id: familyId }),
      })

      const data = await response.json()

      if (data.success) {
        if (data.continue_next_member) {
          // Reset form for next member
          setMemberData({
            nama: "",
            umur: 15,
            hubungan: "",
            jenis_kelamin: "",
            status_perkawinan: "",
            pendidikan: "",
            kegiatan: "",
            memiliki_pekerjaan: "",
            status_pekerjaan_diinginkan: "",
            bidang_usaha: "",
          })
          setRemainingMembers(data.remaining)
          setErrors({})
        } else if (data.redirect_url) {
          router.push(data.redirect_url)
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

  const handleInputChange = (field: keyof MemberData, value: string | number) => {
    setMemberData((prev) => ({ ...prev, [field]: value }))
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
      <div className="container mx-auto max-w-2xl">
        <div className="form-card bg-white">
          <div className="form-header">
            <h1 className="text-2xl font-bold text-center">Form Input Data Individu</h1>
            <p className="text-center text-primary-100 mt-1">Anggota Keluarga Usia 15+ Tahun</p>
          </div>

          <div className="p-6">
            {/* Family Info */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">Informasi Keluarga</h3>
              <p className="text-sm text-blue-700">
                <strong>Kepala Keluarga:</strong> {familyInfo.nama_kepala}
                <br />
                <strong>RT/RW:</strong> {familyInfo.rt}/{familyInfo.rw} Dusun {familyInfo.dusun}
                <br />
                <strong>Tersisa:</strong> {remainingMembers} anggota
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="nama" className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  id="nama"
                  value={memberData.nama}
                  onChange={(e) => handleInputChange("nama", e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  className="form-input w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-300"
                />
                {errors.nama && <p className="text-red-500 text-xs mt-1">{errors.nama}</p>}
              </div>

              <div>
                <label htmlFor="umur" className="block text-sm font-medium text-gray-700 mb-1">
                  Umur
                </label>
                <input
                  type="number"
                  id="umur"
                  value={memberData.umur}
                  onChange={(e) => handleInputChange("umur", Number.parseInt(e.target.value) || 15)}
                  min="15"
                  className="form-input w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-300"
                />
                {errors.umur && <p className="text-red-500 text-xs mt-1">{errors.umur}</p>}
              </div>

              <div>
                <label htmlFor="hubungan" className="block text-sm font-medium text-gray-700 mb-1">
                  Hubungan Dengan Kepala Keluarga
                </label>
                <select
                  id="hubungan"
                  value={memberData.hubungan}
                  onChange={(e) => handleInputChange("hubungan", e.target.value)}
                  className="form-input w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-300"
                >
                  <option value="">Pilih hubungan</option>
                  <option value="Kepala Keluarga">1. Kepala Keluarga</option>
                  <option value="Suami/Istri">2. Suami/Istri</option>
                  <option value="Anak">3. Anak</option>
                  <option value="Menantu">4. Menantu</option>
                  <option value="Lainnya">5. Lainnya</option>
                </select>
                {errors.hubungan && <p className="text-red-500 text-xs mt-1">{errors.hubungan}</p>}
              </div>

              <div>
                <label htmlFor="jenis_kelamin" className="block text-sm font-medium text-gray-700 mb-1">
                  Jenis Kelamin
                </label>
                <select
                  id="jenis_kelamin"
                  value={memberData.jenis_kelamin}
                  onChange={(e) => handleInputChange("jenis_kelamin", e.target.value)}
                  className="form-input w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-300"
                >
                  <option value="">Pilih jenis kelamin</option>
                  <option value="Laki-Laki">1. Laki-Laki</option>
                  <option value="Perempuan">2. Perempuan</option>
                </select>
                {errors.jenis_kelamin && <p className="text-red-500 text-xs mt-1">{errors.jenis_kelamin}</p>}
              </div>

              <div>
                <label htmlFor="status_perkawinan" className="block text-sm font-medium text-gray-700 mb-1">
                  Status Perkawinan
                </label>
                <select
                  id="status_perkawinan"
                  value={memberData.status_perkawinan}
                  onChange={(e) => handleInputChange("status_perkawinan", e.target.value)}
                  className="form-input w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-300"
                >
                  <option value="">Pilih status perkawinan</option>
                  <option value="Belum Kawin">1. Belum Kawin</option>
                  <option value="Kawin">2. Kawin</option>
                  <option value="Cerai Hidup">3. Cerai Hidup</option>
                  <option value="Cerai Mati">4. Cerai Mati</option>
                </select>
                {errors.status_perkawinan && <p className="text-red-500 text-xs mt-1">{errors.status_perkawinan}</p>}
              </div>

              <div>
                <label htmlFor="pendidikan" className="block text-sm font-medium text-gray-700 mb-1">
                  Pendidikan Terakhir
                </label>
                <select
                  id="pendidikan"
                  value={memberData.pendidikan}
                  onChange={(e) => handleInputChange("pendidikan", e.target.value)}
                  className="form-input w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-300"
                >
                  <option value="">Pilih pendidikan terakhir</option>
                  <option value="Tidak/Belum Tamat SD">1. Tidak/Belum Tamat SD</option>
                  <option value="SD/MI/SDLB/PAKET A">2. SD/MI/SDLB/PAKET A</option>
                  <option value="SMP/MTS/SMPLB/PAKET B">3. SMP/MTS/SMPLB/PAKET B</option>
                  <option value="SMA/MA/SMK/MAK/SMALB/PAKET C">4. SMA/MA/SMK/MAK/SMALB/PAKET C</option>
                  <option value="PERGURUAN TINGGI">5. PERGURUAN TINGGI</option>
                </select>
                {errors.pendidikan && <p className="text-red-500 text-xs mt-1">{errors.pendidikan}</p>}
              </div>

              <div>
                <label htmlFor="kegiatan" className="block text-sm font-medium text-gray-700 mb-1">
                  Kegiatan Sehari-hari
                </label>
                <select
                  id="kegiatan"
                  value={memberData.kegiatan}
                  onChange={(e) => handleInputChange("kegiatan", e.target.value)}
                  className="form-input w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-300"
                >
                  <option value="">Pilih kegiatan sehari-hari</option>
                  <option value="Bekerja">1. Bekerja</option>
                  <option value="Sekolah">2. Sekolah</option>
                  <option value="Mengurus Rumah Tangga">3. Mengurus Rumah Tangga</option>
                  <option value="Melakukan Kegiatan Lainnya">4. Melakukan Kegiatan Lainnya</option>
                </select>
                {errors.kegiatan && <p className="text-red-500 text-xs mt-1">{errors.kegiatan}</p>}
              </div>

              <div>
                <label htmlFor="memiliki_pekerjaan" className="block text-sm font-medium text-gray-700 mb-1">
                  Apakah {memberData.nama || "NAMA"} Bekerja
                </label>
                <select
                  id="memiliki_pekerjaan"
                  value={memberData.memiliki_pekerjaan}
                  onChange={(e) => handleInputChange("memiliki_pekerjaan", e.target.value)}
                  className="form-input w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-300"
                >
                  <option value="">Pilih jawaban</option>
                  <option value="Ya">Ya</option>
                  <option value="Tidak">Tidak</option>
                </select>
                {errors.memiliki_pekerjaan && <p className="text-red-500 text-xs mt-1">{errors.memiliki_pekerjaan}</p>}
              </div>

              {/* Conditional fields for non-working people */}
              {memberData.memiliki_pekerjaan === "Tidak" && (
                <>
                  <div>
                    <label
                      htmlFor="status_pekerjaan_diinginkan"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Status Pekerjaan yang Diinginkan
                    </label>
                    <select
                      id="status_pekerjaan_diinginkan"
                      value={memberData.status_pekerjaan_diinginkan}
                      onChange={(e) => handleInputChange("status_pekerjaan_diinginkan", e.target.value)}
                      className="form-input w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-300"
                    >
                      <option value="">Pilih status pekerjaan yang diinginkan</option>
                      <option value="Berusaha Sendiri">Berusaha Sendiri</option>
                      <option value="Buruh/Karyawan/Pegawai/Pekerja Bebas">Buruh/Karyawan/Pegawai/Pekerja Bebas</option>
                    </select>
                    {errors.status_pekerjaan_diinginkan && (
                      <p className="text-red-500 text-xs mt-1">{errors.status_pekerjaan_diinginkan}</p>
                    )}
                  </div>

                  {memberData.status_pekerjaan_diinginkan === "Berusaha Sendiri" && (
                    <div>
                      <label htmlFor="bidang_usaha" className="block text-sm font-medium text-gray-700 mb-1">
                        Bidang Usaha yang Diminati
                      </label>
                      <select
                        id="bidang_usaha"
                        value={memberData.bidang_usaha}
                        onChange={(e) => handleInputChange("bidang_usaha", e.target.value)}
                        className="form-input w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-300"
                      >
                        <option value="">Pilih bidang pelatihan</option>
                        <option value="Pelatihan Barista">1. Pelatihan Barista</option>
                        <option value="Pelatihan Pastry">2. Pelatihan Pastry</option>
                        <option value="Pelatihan Perawatan AC">3. Pelatihan Perawatan AC</option>
                        <option value="Pelatihan Menjahit">4. Pelatihan Menjahit</option>
                        <option value="Lainnya">5. Lainnya</option>
                      </select>
                      {errors.bidang_usaha && <p className="text-red-500 text-xs mt-1">{errors.bidang_usaha}</p>}
                    </div>
                  )}
                </>
              )}

              {errors.general && (
                <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
                  {errors.general}
                </div>
              )}

              <div className="pt-4">
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {loading ? "Menyimpan..." : "Simpan & Lanjutkan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
