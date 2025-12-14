-- ============================================
--  RLS Policy untuk Storage Bucket 'avatars'
--  Jalankan di Supabase SQL Editor
-- ============================================
-- 
-- Script ini membuat RLS policy untuk storage bucket avatars
-- agar user yang terautentikasi bisa upload dan membaca foto profil mereka

-- CATATAN PENTING:
-- 1. Pastikan bucket 'avatars' sudah dibuat di Supabase Dashboard
--    - Name: avatars
--    - Public: ON (agar foto profil bisa diakses publik)
--    - File size limit: 5242880 (5MB dalam bytes)
--    - Allowed MIME types: image/jpeg,image/png,image/jpg,image/webp
-- 2. Pastikan RLS (Row Level Security) enabled untuk storage.objects
-- 3. Format filename: {user_id}-{timestamp}.{ext}

-- ============================================
-- Hapus policy lama jika ada (untuk menghindari konflik)
-- ============================================
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read all avatars" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete avatars" ON storage.objects;

-- ============================================
-- POLICY UNTUK UPLOAD (INSERT)
-- ============================================
-- Policy: User terautentikasi bisa upload avatar mereka sendiri
-- Filename harus mengandung user ID mereka (format: {user_id}-{timestamp}.{ext})
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid() IS NOT NULL AND
    -- Filename harus dimulai dengan user ID
    (name LIKE auth.uid()::text || '-%')
);

-- ============================================
-- POLICY UNTUK READ (SELECT)
-- ============================================
-- Policy: Semua orang bisa membaca avatar (karena bucket public)
-- Tapi kita tetap buat policy untuk kontrol lebih baik
CREATE POLICY "Public can read avatars"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'avatars'
);

-- Policy: User bisa membaca avatar mereka sendiri
CREATE POLICY "Users can read their own avatars"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'avatars' AND
    auth.uid() IS NOT NULL AND
    (name LIKE auth.uid()::text || '-%')
);

-- Policy: Admin bisa membaca semua avatar
CREATE POLICY "Admins can read all avatars"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'avatars' AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ============================================
-- POLICY UNTUK UPDATE
-- ============================================
-- Policy: User bisa update avatar mereka sendiri
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars' AND
    auth.uid() IS NOT NULL AND
    (name LIKE auth.uid()::text || '-%')
)
WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid() IS NOT NULL AND
    (name LIKE auth.uid()::text || '-%')
);

-- ============================================
-- POLICY UNTUK DELETE
-- ============================================
-- Policy: User bisa menghapus avatar mereka sendiri
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars' AND
    auth.uid() IS NOT NULL AND
    (name LIKE auth.uid()::text || '-%')
);

-- Policy: Admin bisa menghapus semua avatar (untuk maintenance)
CREATE POLICY "Admins can delete avatars"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars' AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ============================================
-- QUERY UNTUK VERIFIKASI POLICY
-- ============================================
-- Cek apakah policy sudah dibuat dengan benar:
-- SELECT policyname, cmd, schemaname, tablename
-- FROM pg_policies 
-- WHERE schemaname = 'storage' 
--   AND tablename = 'objects'
--   AND policyname LIKE '%avatar%'
-- ORDER BY policyname;
--
-- Hasil yang diharapkan: 7 policy untuk avatars
-- 1. "Users can upload their own avatars" (INSERT)
-- 2. "Public can read avatars" (SELECT)
-- 3. "Users can read their own avatars" (SELECT)
-- 4. "Admins can read all avatars" (SELECT)
-- 5. "Users can update their own avatars" (UPDATE)
-- 6. "Users can delete their own avatars" (DELETE)
-- 7. "Admins can delete avatars" (DELETE)

-- ============================================
-- INSTRUKSI SETUP BUCKET (Manual di Dashboard)
-- ============================================
-- 1. Buka Supabase Dashboard (https://app.supabase.com)
-- 2. Pilih project Anda
-- 3. Pergi ke menu "Storage" di sidebar kiri
-- 4. Klik tombol "New bucket"
-- 5. Isi form:
--    - Name: avatars
--    - Public bucket: ON (agar foto profil bisa diakses publik)
--    - File size limit: 5242880 (5MB dalam bytes)
--    - Allowed MIME types: image/jpeg,image/png,image/jpg,image/webp
-- 6. Klik "Create bucket"
-- 7. Setelah bucket dibuat, jalankan script SQL ini di SQL Editor

