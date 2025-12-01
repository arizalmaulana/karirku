-- ============================================
--  Fix Infinite Recursion di RLS Policies
--  Jalankan di Supabase SQL Editor
-- ============================================

-- Masalah: Policy "Admin can read all profiles" menyebabkan infinite recursion
-- karena policy tersebut membaca dari tabel profiles untuk mengecek role admin
-- Solusi: Gunakan stored function yang bypass RLS untuk mengecek role admin

-- 1. Buat function untuk mengecek apakah user adalah admin (bypass RLS)
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER -- Bypass RLS
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
$$;

-- 2. Hapus policy yang menyebabkan recursion
DROP POLICY IF EXISTS "Admin can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can delete profiles" ON public.profiles;

-- 3. Buat ulang policy dengan menggunakan function (tidak recursive)
CREATE POLICY "Admin can read all profiles"
ON public.profiles FOR SELECT
USING (
    -- User bisa membaca profil sendiri
    auth.uid() = id
    OR
    -- Admin bisa membaca semua profil (menggunakan function yang bypass RLS)
    public.is_admin(auth.uid())
);

-- Policy: Admin bisa mengupdate semua profil
CREATE POLICY "Admin can update all profiles"
ON public.profiles FOR UPDATE
USING (
    -- User bisa update profil sendiri
    auth.uid() = id
    OR
    -- Admin bisa update semua profil
    public.is_admin(auth.uid())
)
WITH CHECK (
    -- User bisa update profil sendiri
    auth.uid() = id
    OR
    -- Admin bisa update semua profil
    public.is_admin(auth.uid())
);

-- Policy: Admin bisa menghapus profil
CREATE POLICY "Admin can delete profiles"
ON public.profiles FOR DELETE
USING (
    public.is_admin(auth.uid())
);

-- 4. Fix policy untuk applications juga (jika ada recursion)
DROP POLICY IF EXISTS "Admin can read all applications" ON public.applications;

CREATE POLICY "Admin can read all applications"
ON public.applications FOR SELECT
USING (
    -- Job seeker bisa membaca lamaran sendiri
    auth.uid() = job_seeker_id
    OR
    -- Recruiter bisa membaca lamaran untuk job mereka
    EXISTS (
        SELECT 1 FROM public.job_listings jl
        WHERE jl.id = job_id AND jl.recruiter_id = auth.uid()
    )
    OR
    -- Admin bisa membaca semua lamaran (menggunakan function)
    public.is_admin(auth.uid())
);

-- 5. Fix policy untuk job_listings juga
DROP POLICY IF EXISTS "Recruiter manage own jobs" ON public.job_listings;

CREATE POLICY "Recruiter manage own jobs"
ON public.job_listings FOR ALL
USING (
    -- Recruiter bisa mengelola job mereka sendiri
    recruiter_id = auth.uid()
    OR
    -- Admin bisa mengelola semua job (menggunakan function)
    public.is_admin(auth.uid())
)
WITH CHECK (
    -- Recruiter bisa mengelola job mereka sendiri
    recruiter_id = auth.uid()
    OR
    -- Admin bisa mengelola semua job (menggunakan function)
    public.is_admin(auth.uid())
);

-- 6. Fix policy untuk living_costs juga
DROP POLICY IF EXISTS "Admin manage living costs" ON public.living_costs;

CREATE POLICY "Admin manage living costs"
ON public.living_costs FOR ALL
USING (
    public.is_admin(auth.uid())
)
WITH CHECK (
    public.is_admin(auth.uid())
);

-- ============================================
-- VERIFIKASI
-- ============================================

-- Test function
-- SELECT public.is_admin('USER_ID_HERE');

-- Lihat semua policy yang aktif
-- SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;

