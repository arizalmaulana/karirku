-- ============================================
-- MIGRATION: Tambah Field Baru untuk Applications
-- Jalankan di Supabase SQL Editor
-- ============================================

-- Tambah field notes untuk catatan recruiter
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Tambah field rejection_reason untuk alasan penolakan
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Tambah field interview_date untuk jadwal interview
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS interview_date TIMESTAMPTZ;

-- Tambah field interview_location untuk lokasi interview
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS interview_location TEXT;

-- Tambah field withdrawn_at untuk tracking withdraw (opsional, bisa juga pakai delete)
-- ALTER TABLE public.applications 
-- ADD COLUMN IF NOT EXISTS withdrawn_at TIMESTAMPTZ;

-- Update RLS policies jika perlu (sudah ada di complete_rls_policies.sql)
-- Pastikan recruiter bisa update field-field baru ini

-- Comment untuk dokumentasi
COMMENT ON COLUMN public.applications.notes IS 'Catatan dari recruiter untuk lamaran ini';
COMMENT ON COLUMN public.applications.rejection_reason IS 'Alasan penolakan jika status rejected';
COMMENT ON COLUMN public.applications.interview_date IS 'Jadwal interview jika status interview';
COMMENT ON COLUMN public.applications.interview_location IS 'Lokasi interview jika status interview';

