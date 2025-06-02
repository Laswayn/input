-- Database schema for Desa Sidokepung Census System

-- Families table
CREATE TABLE IF NOT EXISTS families (
    id SERIAL PRIMARY KEY,
    keluarga_id VARCHAR(50) UNIQUE NOT NULL,
    rt VARCHAR(10) NOT NULL,
    rw VARCHAR(10) NOT NULL,
    dusun VARCHAR(100) NOT NULL,
    nama_kepala VARCHAR(255) NOT NULL,
    alamat TEXT NOT NULL,
    jumlah_anggota INTEGER NOT NULL,
    jumlah_anggota_15plus INTEGER NOT NULL,
    nama_pencacah VARCHAR(255),
    hp_pencacah VARCHAR(20),
    nama_pemberi_jawaban VARCHAR(255),
    hp_pemberi_jawaban VARCHAR(20),
    catatan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Family members table
CREATE TABLE IF NOT EXISTS family_members (
    id SERIAL PRIMARY KEY,
    family_id INTEGER REFERENCES families(id) ON DELETE CASCADE,
    keluarga_id VARCHAR(50) NOT NULL,
    anggota_ke INTEGER NOT NULL,
    nama VARCHAR(255) NOT NULL,
    umur INTEGER NOT NULL,
    hubungan VARCHAR(100) NOT NULL,
    jenis_kelamin VARCHAR(20) NOT NULL,
    status_perkawinan VARCHAR(50) NOT NULL,
    pendidikan VARCHAR(100) NOT NULL,
    kegiatan VARCHAR(100) NOT NULL,
    memiliki_pekerjaan VARCHAR(10) NOT NULL,
    status_pekerjaan_diinginkan VARCHAR(100),
    bidang_usaha VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Jobs table for detailed employment information
CREATE TABLE IF NOT EXISTS member_jobs (
    id SERIAL PRIMARY KEY,
    member_id INTEGER REFERENCES family_members(id) ON DELETE CASCADE,
    job_type VARCHAR(20) NOT NULL, -- 'main', 'side1', 'side2'
    bidang_pekerjaan VARCHAR(100),
    status_pekerjaan VARCHAR(100),
    pemasaran_usaha VARCHAR(100),
    penjualan_marketplace VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_families_keluarga_id ON families(keluarga_id);
CREATE INDEX IF NOT EXISTS idx_families_rt_rw ON families(rt, rw);
CREATE INDEX IF NOT EXISTS idx_families_dusun ON families(dusun);
CREATE INDEX IF NOT EXISTS idx_members_family_id ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_members_keluarga_id ON family_members(keluarga_id);
CREATE INDEX IF NOT EXISTS idx_jobs_member_id ON member_jobs(member_id);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_families_updated_at BEFORE UPDATE ON families
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_family_members_updated_at BEFORE UPDATE ON family_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
