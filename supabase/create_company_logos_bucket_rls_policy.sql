-- ============================================
--  RLS Policy untuk Storage Bucket 'company_logos'
--  Jalankan di Supabase SQL Editor
-- ============================================
-- 
-- Script ini membuat RLS policy untuk storage bucket company_logos
-- agar recruiter bisa upload dan membaca logo perusahaan mereka

-- CATATAN PENTING:
-- 1. Pastikan bucket 'company_logos' sudah dibuat di Supabase Dashboard
--    - Name: company_logos
--    - Public: ON (agar logo bisa diakses publik)
--    - File size limit: 5242880 (5MB dalam bytes)
--    - Allowed MIME types: image/jpeg,image/png,image/jpg,image/webp
-- 2. Pastikan RLS (Row Level Security) enabled untuk storage.objects
-- 3. Format filename: logo_{user_id}_{timestamp}.{ext}

-- ============================================
-- Hapus policy lama jika ada (untuk menghindari konflik)
-- ============================================
DROP POLICY IF EXISTS "Recruiters can upload their own company logos" ON storage.objects;
DROP POLICY IF EXISTS "Recruiters can read their own company logos" ON storage.objects;
DROP POLICY IF EXISTS "Recruiters can update their own company logos" ON storage.objects;
DROP POLICY IF EXISTS "Recruiters can delete their own company logos" ON storage.objects;
DROP POLICY IF EXISTS "Public can read company logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read all company logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete company logos" ON storage.objects;

-- ============================================
-- POLICY UNTUK UPLOAD (INSERT)
-- ============================================
-- Policy: Recruiter terautentikasi bisa upload logo perusahaan mereka sendiri
-- Filename harus mengandung user ID mereka (format: logo_{user_id}_{timestamp}.{ext})
CREATE POLICY "Recruiters can upload their own company logos"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'company_logos' AND
    auth.uid() IS NOT NULL AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'recruiter'
    ) AND
    -- Filename harus mengandung user ID
    (name LIKE 'logo_' || auth.uid()::text || '_%' OR name LIKE 'company_logo_' || auth.uid()::text || '_%')
);

-- ============================================
-- POLICY UNTUK READ (SELECT)
-- ============================================
-- Policy: Semua orang bisa membaca logo perusahaan (karena bucket public)
CREATE POLICY "Public can read company logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'company_logos');

-- Policy: Recruiter bisa membaca logo mereka sendiri
CREATE POLICY "Recruiters can read their own company logos"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'company_logos' AND
    auth.uid() IS NOT NULL AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'recruiter'
    ) AND
    (name LIKE 'logo_' || auth.uid()::text || '_%' OR name LIKE 'company_logo_' || auth.uid()::text || '_%')
);

-- ============================================
-- POLICY UNTUK UPDATE (UPDATE)
-- ============================================
-- Policy: Recruiter bisa update logo mereka sendiri
CREATE POLICY "Recruiters can update their own company logos"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'company_logos' AND
    auth.uid() IS NOT NULL AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'recruiter'
    ) AND
    (name LIKE 'logo_' || auth.uid()::text || '_%' OR name LIKE 'company_logo_' || auth.uid()::text || '_%')
);

-- ============================================
-- POLICY UNTUK DELETE
-- ============================================
-- Policy: Recruiter bisa menghapus logo mereka sendiri
CREATE POLICY "Recruiters can delete their own company logos"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'company_logos' AND
    auth.uid() IS NOT NULL AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'recruiter'
    ) AND
    (name LIKE 'logo_' || auth.uid()::text || '_%' OR name LIKE 'company_logo_' || auth.uid()::text || '_%')
);

-- Policy: Admin bisa membaca semua logo
CREATE POLICY "Admins can read all company logos"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'company_logos' AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policy: Admin bisa menghapus semua logo (untuk maintenance)
CREATE POLICY "Admins can delete company logos"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'company_logos' AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ============================================
-- CATATAN:
-- 1. Bucket company_logos harus dibuat manual di Supabase Dashboard
-- 2. Bucket harus public agar logo bisa diakses oleh semua orang
-- 3. Jika bucket company_logos belum dibuat, sistem akan fallback ke bucket avatars
-- 4. Format filename: logo_{user_id}_{timestamp}.{ext} atau company_logo_{user_id}_{timestamp}.{ext}
-- ============================================
