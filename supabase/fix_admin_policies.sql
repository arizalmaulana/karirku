-- ============================================
--  Fix Admin Policies - Hapus dan Buat Ulang
--  Jalankan di Supabase SQL Editor
-- ============================================

-- Hapus policy lama yang mungkin konflik
DROP POLICY IF EXISTS "Admin can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can read all applications" ON public.applications;

-- Policy untuk Admin membaca semua profil pengguna
-- Policy ini menggunakan OR dengan policy "Public read own profile" yang sudah ada
-- Jadi admin bisa membaca semua profil, dan semua user bisa membaca profil sendiri
CREATE POLICY "Admin can read all profiles"
ON public.profiles FOR SELECT
USING (
    -- User bisa membaca profil sendiri (sudah ada policy lain, tapi ini untuk admin)
    auth.uid() = id
    OR
    -- Admin bisa membaca semua profil
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policy untuk Admin mengupdate semua profil (tapi tetap bisa update sendiri)
CREATE POLICY "Admin can update all profiles"
ON public.profiles FOR UPDATE
USING (
    -- User bisa update profil sendiri
    auth.uid() = id
    OR
    -- Admin bisa update semua profil
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policy untuk Admin menghapus profil (hanya admin, user tidak bisa hapus profil sendiri)
CREATE POLICY "Admin can delete profiles"
ON public.profiles FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policy untuk Admin membaca semua lamaran
CREATE POLICY "Admin can read all applications"
ON public.applications FOR SELECT
USING (
    -- User bisa membaca lamaran sendiri (sudah ada policy lain)
    auth.uid() = job_seeker_id
    OR
    -- Admin bisa membaca semua lamaran
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- Recruiter bisa membaca lamaran untuk job mereka (sudah ada policy lain)
    EXISTS (
        SELECT 1 FROM public.job_listings jl
        WHERE jl.id = job_id AND jl.recruiter_id = auth.uid()
    )
);

