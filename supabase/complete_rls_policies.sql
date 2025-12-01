-- ============================================
--  Complete RLS Policies untuk Platform KarirKu
--  Jalankan di Supabase SQL Editor
--  Pastikan tabel sudah dibuat terlebih dahulu
-- ============================================

-- ============================================
-- 0. CREATE HELPER FUNCTION (Bypass RLS untuk cek admin)
-- ============================================

-- Function untuk mengecek apakah user adalah admin
-- Menggunakan SECURITY DEFINER untuk bypass RLS dan menghindari infinite recursion
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER -- Bypass RLS, run with creator's privileges
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id AND role = 'admin'
    );
$$;

-- ============================================
-- 1. PROFILES TABLE POLICIES
-- ============================================

-- Pastikan RLS aktif
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Hapus semua policy lama jika ada
DROP POLICY IF EXISTS "Public read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;

-- Policy: User bisa membaca profil sendiri
CREATE POLICY "Public read own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Policy: User bisa membuat profil sendiri
CREATE POLICY "Users insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy: User bisa mengupdate profil sendiri
CREATE POLICY "Users update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: Admin bisa membaca semua profil
-- Menggunakan function is_admin() untuk menghindari infinite recursion
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
    -- Admin bisa update semua profil (menggunakan function yang bypass RLS)
    public.is_admin(auth.uid())
)
WITH CHECK (
    -- User bisa update profil sendiri
    auth.uid() = id
    OR
    -- Admin bisa update semua profil (menggunakan function yang bypass RLS)
    public.is_admin(auth.uid())
);

-- Policy: Admin bisa menghapus profil (user tidak bisa hapus profil sendiri)
CREATE POLICY "Admin can delete profiles"
ON public.profiles FOR DELETE
USING (
    public.is_admin(auth.uid())
);

-- ============================================
-- 2. JOB_LISTINGS TABLE POLICIES
-- ============================================

-- Pastikan RLS aktif
ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;

-- Hapus semua policy lama jika ada
DROP POLICY IF EXISTS "Recruiter manage own jobs" ON public.job_listings;
DROP POLICY IF EXISTS "Everyone can read jobs" ON public.job_listings;

-- Policy: Recruiter dan Admin bisa mengelola job mereka
CREATE POLICY "Recruiter manage own jobs"
ON public.job_listings FOR ALL
USING (
    -- Recruiter bisa mengelola job mereka sendiri
    recruiter_id = auth.uid()
    OR
    -- Admin bisa mengelola semua job (menggunakan function yang bypass RLS)
    public.is_admin(auth.uid())
)
WITH CHECK (
    -- Recruiter bisa mengelola job mereka sendiri
    recruiter_id = auth.uid()
    OR
    -- Admin bisa mengelola semua job (menggunakan function yang bypass RLS)
    public.is_admin(auth.uid())
);

-- Policy: Semua orang bisa membaca job listings
CREATE POLICY "Everyone can read jobs"
ON public.job_listings FOR SELECT
USING (true);

-- ============================================
-- 3. APPLICATIONS TABLE POLICIES
-- ============================================

-- Pastikan RLS aktif
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Hapus semua policy lama jika ada
DROP POLICY IF EXISTS "Owner can manage their applications" ON public.applications;
DROP POLICY IF EXISTS "Recruiter/Admin view applications for their jobs" ON public.applications;
DROP POLICY IF EXISTS "Admin can read all applications" ON public.applications;

-- Policy: Job seeker bisa mengelola lamaran mereka sendiri
CREATE POLICY "Owner can manage their applications"
ON public.applications FOR ALL
USING (auth.uid() = job_seeker_id)
WITH CHECK (auth.uid() = job_seeker_id);

-- Policy: Recruiter bisa melihat dan update lamaran untuk job mereka
CREATE POLICY "Recruiter can view and update applications for their jobs"
ON public.applications FOR SELECT
USING (
    -- Job seeker bisa melihat lamaran sendiri
    auth.uid() = job_seeker_id
    OR
    -- Recruiter bisa melihat lamaran untuk job mereka
    EXISTS (
        SELECT 1 FROM public.job_listings jl
        WHERE jl.id = job_id AND jl.recruiter_id = auth.uid()
    )
    OR
    -- Admin bisa melihat semua lamaran
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policy: Recruiter bisa update status lamaran untuk job mereka
CREATE POLICY "Recruiter can update applications for their jobs"
ON public.applications FOR UPDATE
USING (
    -- Recruiter bisa update lamaran untuk job mereka
    EXISTS (
        SELECT 1 FROM public.job_listings jl
        WHERE jl.id = job_id AND jl.recruiter_id = auth.uid()
    )
    OR
    -- Admin bisa update semua lamaran (menggunakan function yang bypass RLS)
    public.is_admin(auth.uid())
)
WITH CHECK (
    -- Recruiter bisa update lamaran untuk job mereka
    EXISTS (
        SELECT 1 FROM public.job_listings jl
        WHERE jl.id = job_id AND jl.recruiter_id = auth.uid()
    )
    OR
    -- Admin bisa update semua lamaran (menggunakan function yang bypass RLS)
    public.is_admin(auth.uid())
);

-- Policy: Admin bisa membaca semua lamaran (untuk admin dashboard)
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
    -- Admin bisa membaca semua lamaran (menggunakan function yang bypass RLS)
    public.is_admin(auth.uid())
);

-- ============================================
-- 4. LIVING_COSTS TABLE POLICIES
-- ============================================

-- Pastikan RLS aktif
ALTER TABLE public.living_costs ENABLE ROW LEVEL SECURITY;

-- Hapus semua policy lama jika ada
DROP POLICY IF EXISTS "Admin manage living costs" ON public.living_costs;
DROP POLICY IF EXISTS "Everyone can read living costs" ON public.living_costs;

-- Policy: Admin bisa mengelola living costs
CREATE POLICY "Admin manage living costs"
ON public.living_costs FOR ALL
USING (
    public.is_admin(auth.uid())
)
WITH CHECK (
    public.is_admin(auth.uid())
);

-- Policy: Semua orang bisa membaca living costs
CREATE POLICY "Everyone can read living costs"
ON public.living_costs FOR SELECT
USING (true);

-- ============================================
-- VERIFIKASI POLICIES
-- ============================================

-- Query untuk melihat semua policy yang aktif
-- Uncomment untuk melihat hasilnya
/*
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
*/

-- ============================================
-- CATATAN PENTING
-- ============================================
-- 1. Pastikan semua tabel sudah dibuat sebelum menjalankan script ini
-- 2. Pastikan user sudah login sebelum test policy
-- 3. Policy menggunakan OR logic, jadi tidak akan konflik
-- 4. Jika ada error, cek apakah tabel dan kolom sudah ada
-- 5. Test dengan user yang berbeda (admin, recruiter, jobseeker)

