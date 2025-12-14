-- ============================================
--  Tambah Field Address ke Tabel Companies
--  Jalankan di Supabase SQL Editor
-- ============================================

-- Tambahkan kolom address jika belum ada
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Comment untuk dokumentasi
COMMENT ON COLUMN public.companies.address IS 'Alamat lengkap perusahaan (opsional)';

-- ============================================
-- CATATAN:
-- Field address adalah opsional dan bisa diisi dengan alamat lengkap kantor perusahaan
-- ============================================
