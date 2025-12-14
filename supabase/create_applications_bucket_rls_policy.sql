-- ============================================
--  RLS Policy untuk Storage Bucket 'applications'
--  Jalankan di Supabase SQL Editor
-- ============================================
-- 
-- Script ini membuat RLS policy untuk storage bucket applications
-- agar user yang terautentikasi bisa upload CV dan dokumen lamaran mereka

-- CATATAN PENTING:
-- 1. Pastikan bucket 'applications' sudah dibuat di Supabase Dashboard
--    - Name: applications
--    - Public: OFF (private bucket untuk keamanan)
--    - File size limit: 5242880 (5MB dalam bytes)
--    - Allowed MIME types: application/pdf,image/jpeg,image/jpg
-- 2. Pastikan RLS (Row Level Security) enabled untuk storage.objects
-- 3. Format filename: cv_{user_id}_{timestamp}.pdf atau doc_{user_id}_{timestamp}.{ext}

-- ============================================
-- Hapus policy lama jika ada (untuk menghindari konflik)
-- ============================================
DROP POLICY IF EXISTS "Users can upload their own application files" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own application files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own application files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own application files" ON storage.objects;
DROP POLICY IF EXISTS "Recruiters can read application files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read all application files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete application files" ON storage.objects;

-- ============================================
-- POLICY UNTUK UPLOAD (INSERT)
-- ============================================
-- Policy: User terautentikasi bisa upload file aplikasi mereka sendiri
-- Filename harus mengandung user ID mereka (format: cv_{user_id}_{timestamp}.pdf atau doc_{user_id}_{timestamp}.{ext})
CREATE POLICY "Users can upload their own application files"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'applications' AND
    auth.uid() IS NOT NULL AND
    -- Filename harus mengandung user ID (cv_{user_id}_ atau doc_{user_id}_)
    (name LIKE 'cv_' || auth.uid()::text || '_%' OR name LIKE 'doc_' || auth.uid()::text || '_%')
);

-- ============================================
-- POLICY UNTUK READ (SELECT)
-- ============================================
-- Policy: User bisa membaca file aplikasi mereka sendiri
CREATE POLICY "Users can read their own application files"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'applications' AND
    auth.uid() IS NOT NULL AND
    (name LIKE 'cv_' || auth.uid()::text || '_%' OR name LIKE 'doc_' || auth.uid()::text || '_%')
);

-- Policy: Recruiter bisa membaca file aplikasi untuk lowongan mereka
-- (Mereka bisa melihat CV dan dokumen dari pelamar)
CREATE POLICY "Recruiters can read application files"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'applications' AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'recruiter'
    )
);

-- Policy: Admin bisa membaca semua file aplikasi
CREATE POLICY "Admins can read all application files"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'applications' AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ============================================
-- POLICY UNTUK UPDATE
-- ============================================
-- Policy: User bisa update file aplikasi mereka sendiri
CREATE POLICY "Users can update their own application files"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'applications' AND
    auth.uid() IS NOT NULL AND
    (name LIKE 'cv_' || auth.uid()::text || '_%' OR name LIKE 'doc_' || auth.uid()::text || '_%')
)
WITH CHECK (
    bucket_id = 'applications' AND
    auth.uid() IS NOT NULL AND
    (name LIKE 'cv_' || auth.uid()::text || '_%' OR name LIKE 'doc_' || auth.uid()::text || '_%')
);

-- ============================================
-- POLICY UNTUK DELETE
-- ============================================
-- Policy: User bisa menghapus file aplikasi mereka sendiri
CREATE POLICY "Users can delete their own application files"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'applications' AND
    auth.uid() IS NOT NULL AND
    (name LIKE 'cv_' || auth.uid()::text || '_%' OR name LIKE 'doc_' || auth.uid()::text || '_%')
);

-- Policy: Admin bisa menghapus semua file aplikasi (untuk maintenance)
CREATE POLICY "Admins can delete application files"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'applications' AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ============================================
-- QUERY UNTUK VERIFIKASI POLICY
-- ============================================
-- Jalankan query berikut untuk memverifikasi policy sudah dibuat dengan benar:
-- 
-- SELECT policyname, cmd, schemaname, tablename
-- FROM pg_policies 
-- WHERE schemaname = 'storage' 
--   AND tablename = 'objects'
--   AND policyname LIKE '%application%';
--
-- Hasil yang diharapkan: 7 policy untuk application files
-- 1. "Users can upload their own application files" (INSERT)
-- 2. "Users can read their own application files" (SELECT)
-- 3. "Recruiters can read application files" (SELECT)
-- 4. "Admins can read all application files" (SELECT)
-- 5. "Users can update their own application files" (UPDATE)
-- 6. "Users can delete their own application files" (DELETE)
-- 7. "Admins can delete application files" (DELETE)

-- ============================================
-- CATATAN TAMBAHAN
-- ============================================
-- 1. Bucket 'applications' harus dibuat manual di Supabase Dashboard
-- 2. Pastikan bucket tidak public (untuk keamanan data pelamar)
-- 3. Format filename yang didukung:
--    - cv_{user_id}_{timestamp}.pdf
--    - doc_{user_id}_{timestamp}.pdf
--    - doc_{user_id}_{timestamp}.jpg
-- 4. Jika masih error setelah menjalankan script ini:
--    - Pastikan bucket sudah dibuat
--    - Pastikan user sudah authenticated
--    - Cek format filename sesuai dengan policy

