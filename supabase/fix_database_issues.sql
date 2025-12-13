-- ============================================
--  Script untuk Fix Database Issues
--  Jalankan di Supabase SQL Editor
-- ============================================
-- 
-- Script ini akan:
-- 1. Cek dan perbaiki data profile yang rusak
-- 2. Pastikan semua user punya profile
-- 3. Pastikan is_approved ter-set dengan benar
-- 4. Reset data jika perlu

-- ============================================
-- 1. CEK DATA YANG RUSAK
-- ============================================
-- Jalankan query ini dulu untuk melihat masalahnya:
SELECT 
    p.id,
    p.role,
    p.full_name,
    p.is_approved,
    p.company_license_url,
    CASE 
        WHEN p.role = 'admin' AND p.is_approved IS NULL THEN 'Admin tanpa is_approved'
        WHEN p.role = 'jobseeker' AND p.is_approved IS NULL THEN 'Jobseeker tanpa is_approved'
        WHEN p.role = 'recruiter' AND p.is_approved IS NULL THEN 'Recruiter tanpa is_approved'
        WHEN p.role = 'recruiter' AND p.is_approved = false AND p.company_license_url IS NULL THEN 'Recruiter tanpa license'
        ELSE 'OK'
    END as status
FROM public.profiles p
ORDER BY p.created_at DESC;

-- ============================================
-- 2. PERBAIKI DATA PROFILE
-- ============================================

-- Pastikan semua admin dan jobseeker punya is_approved = true
UPDATE public.profiles
SET is_approved = true
WHERE role IN ('admin', 'jobseeker')
  AND (is_approved IS NULL OR is_approved = false);

-- Pastikan recruiter yang belum upload license punya is_approved = false
UPDATE public.profiles
SET is_approved = false
WHERE role = 'recruiter'
  AND company_license_url IS NULL
  AND (is_approved IS NULL OR is_approved = true);

-- Pastikan recruiter yang sudah upload license tetap is_approved = false (tunggu admin approve)
-- Jangan ubah yang sudah di-approve admin
UPDATE public.profiles
SET is_approved = false
WHERE role = 'recruiter'
  AND company_license_url IS NOT NULL
  AND is_approved IS NULL;

-- ============================================
-- 3. BUAT PROFILE UNTUK USER YANG BELUM PUNYA
-- ============================================

-- Insert profile untuk user yang ada di auth.users tapi belum punya profile
INSERT INTO public.profiles (id, role, is_approved, created_at)
SELECT 
    u.id,
    COALESCE((u.raw_user_meta_data->>'role')::text, 'jobseeker')::text as role,
    CASE 
        WHEN COALESCE((u.raw_user_meta_data->>'role')::text, 'jobseeker') IN ('admin', 'jobseeker') THEN true
        ELSE false
    END as is_approved,
    u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 4. VERIFIKASI HASIL
-- ============================================

-- Cek hasil perbaikan
SELECT 
    role,
    COUNT(*) as total,
    COUNT(CASE WHEN is_approved = true THEN 1 END) as approved,
    COUNT(CASE WHEN is_approved = false THEN 1 END) as not_approved,
    COUNT(CASE WHEN is_approved IS NULL THEN 1 END) as null_approved
FROM public.profiles
GROUP BY role;

-- Cek recruiter yang bermasalah
SELECT 
    id,
    full_name,
    email,
    is_approved,
    company_license_url,
    created_at
FROM public.profiles
WHERE role = 'recruiter'
  AND (is_approved IS NULL OR (is_approved = false AND company_license_url IS NULL))
ORDER BY created_at DESC;

-- ============================================
-- 5. RESET DATA JIKA PERLU (HATI-HATI!)
-- ============================================
-- UNCOMMENT BARIS DI BAWAH INI HANYA JIKA INGIN RESET SEMUA DATA RECRUITER
-- WARNING: Ini akan reset semua recruiter menjadi belum approved!

-- UPDATE public.profiles
-- SET is_approved = false
-- WHERE role = 'recruiter';

-- ============================================
-- 6. FIX RLS POLICY JIKA PERLU
-- ============================================

-- Pastikan user bisa read profile mereka sendiri
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Pastikan user bisa update profile mereka sendiri
-- Note: Untuk mencegah user mengubah is_approved, kita perlu trigger atau handle di aplikasi
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

