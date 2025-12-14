-- ============================================
--  Update Trigger untuk Auto Aktif Semua Role
--  Jalankan di Supabase SQL Editor
-- ============================================
-- 
-- Script ini akan mengupdate trigger agar semua role
-- (jobseeker, recruiter, admin) otomatis aktif (is_approved = true)
-- setelah konfirmasi email

-- ============================================
-- 1. UPDATE FUNCTION set_default_is_approved
-- ============================================

-- Update function agar semua role auto aktif
CREATE OR REPLACE FUNCTION public.set_default_is_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Auto-set is_approved = true untuk semua role
    -- (kecuali jika sudah di-set secara eksplisit)
    IF NEW.is_approved IS NULL THEN
        NEW.is_approved := true;
    END IF;
    RETURN NEW;
END;
$$;

-- ============================================
-- 2. UPDATE SEMUA USER YANG SUDAH ADA
-- ============================================
-- Set is_approved = true untuk semua user yang belum diblokir
-- (jika is_approved masih null, berarti belum pernah di-set oleh admin)

-- Update user yang is_approved masih null menjadi true
UPDATE public.profiles
SET is_approved = true
WHERE is_approved IS NULL;

-- ============================================
-- 3. VERIFIKASI
-- ============================================

-- Cek status semua user
SELECT 
    role,
    COUNT(*) as total,
    COUNT(CASE WHEN is_approved = true THEN 1 END) as aktif,
    COUNT(CASE WHEN is_approved = false THEN 1 END) as diblokir,
    COUNT(CASE WHEN is_approved IS NULL THEN 1 END) as null_status
FROM public.profiles
GROUP BY role
ORDER BY role;

-- ============================================
-- CATATAN:
-- ============================================
-- 1. Trigger akan otomatis set is_approved = true untuk user baru
-- 2. Admin bisa mengubah status aktif/nonaktif di halaman management pengguna
-- 3. User yang diblokir (is_approved = false) tidak bisa login
-- 4. User yang is_approved = null akan dianggap diblokir

