-- ============================================
--  Tambah Kolom Blokir Perusahaan
--  Jalankan di Supabase SQL Editor
-- ============================================

-- Tambahkan kolom untuk blokir perusahaan
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS blocked_reason text;

-- Buat index untuk performa query
CREATE INDEX IF NOT EXISTS idx_companies_is_blocked ON public.companies(is_blocked);

-- Update comment
COMMENT ON COLUMN public.companies.is_blocked IS 'Status blokir perusahaan. Jika true, recruiter tidak bisa login';
COMMENT ON COLUMN public.companies.blocked_reason IS 'Alasan perusahaan diblokir';

