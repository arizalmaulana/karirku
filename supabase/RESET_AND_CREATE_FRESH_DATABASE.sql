-- ============================================
--  RESET DAN BUAT DATABASE BARU DARI AWAL
--  WARNING: Script ini akan menghapus SEMUA data!
--  Jalankan di Supabase SQL Editor
--  
--  PENTING: Jalankan script ini SELURUHNYA sekaligus!
--  Jangan jalankan per bagian karena ada dependency antar step.
-- ============================================

-- ============================================
-- STEP 1: HAPUS SEMUA DATA DAN TABEL
-- ============================================

-- Hapus semua RLS policies
DROP POLICY IF EXISTS "Public read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Recruiter manage own jobs" ON public.job_listings;
DROP POLICY IF EXISTS "Everyone can read jobs" ON public.job_listings;
DROP POLICY IF EXISTS "Owner can manage their applications" ON public.applications;
DROP POLICY IF EXISTS "Recruiter/Admin view applications for their jobs" ON public.applications;
DROP POLICY IF EXISTS "Admin manage living costs" ON public.living_costs;
DROP POLICY IF EXISTS "Everyone can read living costs" ON public.living_costs;

-- Hapus trigger dan function terlebih dahulu
DROP TRIGGER IF EXISTS trigger_set_default_is_approved ON public.profiles;
DROP FUNCTION IF EXISTS public.set_default_is_approved() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin(uuid) CASCADE;

-- Hapus semua tabel (dalam urutan yang benar untuk menghindari foreign key constraint)
DROP TABLE IF EXISTS public.applications CASCADE;
DROP TABLE IF EXISTS public.job_listings CASCADE;
DROP TABLE IF EXISTS public.living_costs CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Hapus ENUM types
DROP TYPE IF EXISTS application_status CASCADE;
DROP TYPE IF EXISTS employment_type CASCADE;

-- ============================================
-- STEP 2: BUAT ENUM TYPES
-- ============================================

CREATE TYPE application_status AS ENUM ('draft', 'submitted', 'review', 'interview', 'accepted', 'rejected');
CREATE TYPE employment_type AS ENUM ('fulltime', 'parttime', 'contract', 'internship', 'remote', 'hybrid');

-- ============================================
-- STEP 3: BUAT TABEL PROFILES (DENGAN APPROVAL SYSTEM)
-- ============================================

CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role text CHECK (role IN ('jobseeker', 'recruiter', 'admin')) NOT NULL DEFAULT 'jobseeker',
    full_name text,
    headline text,
    location_city text,
    major text, -- Jurusan pendidikan
    skills text[] DEFAULT '{}',
    avatar_url text, -- URL foto profile
    email text, -- Email
    phone text, -- Nomor telepon
    bio text, -- Bio/deskripsi diri
    experience text, -- Pengalaman kerja
    education text, -- Pendidikan
    company_license_url text, -- URL surat izin perusahaan (untuk recruiter)
    is_approved boolean DEFAULT false, -- Status approval (default false untuk recruiter baru)
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3.5: BUAT HELPER FUNCTION (setelah tabel profiles dibuat)
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

-- RLS Policies untuk profiles
-- User bisa read profile mereka sendiri
CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- User bisa insert profile mereka sendiri
CREATE POLICY "Users insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- User bisa update profile mereka sendiri
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Admin bisa read semua profiles (menggunakan helper function untuk menghindari recursion)
CREATE POLICY "Admin can read all profiles"
    ON public.profiles FOR SELECT
    USING (
        auth.uid() = id 
        OR public.is_admin(auth.uid())
    );

-- Admin bisa update semua profiles (menggunakan helper function)
CREATE POLICY "Admin can update all profiles"
    ON public.profiles FOR UPDATE
    USING (
        auth.uid() = id
        OR public.is_admin(auth.uid())
    )
    WITH CHECK (
        auth.uid() = id
        OR public.is_admin(auth.uid())
    );

-- ============================================
-- STEP 4: BUAT TABEL LIVING COSTS
-- ============================================

CREATE TABLE public.living_costs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    city text NOT NULL,
    province text NOT NULL,
    avg_rent integer,
    avg_food integer,
    avg_transport integer,
    salary_reference integer,
    currency char(3) NOT NULL DEFAULT 'IDR',
    updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.living_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage living costs"
    ON public.living_costs FOR ALL
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Everyone can read living costs"
    ON public.living_costs FOR SELECT
    USING (true);

-- ============================================
-- STEP 5: BUAT TABEL JOB LISTINGS
-- ============================================

CREATE TABLE public.job_listings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recruiter_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    title text NOT NULL,
    company_name text NOT NULL,
    location_city text NOT NULL,
    location_province text,
    employment_type employment_type NOT NULL DEFAULT 'fulltime',
    min_salary integer,
    max_salary integer,
    currency char(3) DEFAULT 'IDR',
    description text,
    requirements text[],
    skills_required text[],
    major_required text, -- Jurusan yang dibutuhkan
    category text, -- Kategori pekerjaan
    job_level text, -- Level pekerjaan
    living_cost_id uuid REFERENCES public.living_costs(id),
    featured boolean DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiter manage own jobs"
    ON public.job_listings FOR ALL
    USING (
        recruiter_id = auth.uid()
        OR public.is_admin(auth.uid())
    )
    WITH CHECK (
        recruiter_id = auth.uid()
        OR public.is_admin(auth.uid())
    );

CREATE POLICY "Everyone can read jobs"
    ON public.job_listings FOR SELECT
    USING (true);

-- ============================================
-- STEP 6: BUAT TABEL APPLICATIONS
-- ============================================

CREATE TABLE public.applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid NOT NULL REFERENCES public.job_listings(id) ON DELETE CASCADE,
    job_seeker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status application_status NOT NULL DEFAULT 'submitted',
    cv_url text,
    portfolio_url text,
    cover_letter text,
    submitted_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage their applications"
    ON public.applications FOR ALL
    USING (auth.uid() = job_seeker_id);

CREATE POLICY "Recruiter/Admin view applications for their jobs"
    ON public.applications FOR SELECT
    USING (
        auth.uid() = job_seeker_id
        OR EXISTS (
            SELECT 1
            FROM public.job_listings jl
            WHERE jl.id = job_id
            AND (jl.recruiter_id = auth.uid() OR public.is_admin(auth.uid()))
        )
        OR public.is_admin(auth.uid())
    );

-- Policy untuk recruiter bisa update status lamaran
CREATE POLICY "Recruiter can update applications for their jobs"
    ON public.applications FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.job_listings jl
            WHERE jl.id = job_id AND jl.recruiter_id = auth.uid()
        )
        OR public.is_admin(auth.uid())
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.job_listings jl
            WHERE jl.id = job_id AND jl.recruiter_id = auth.uid()
        )
        OR public.is_admin(auth.uid())
    );

-- ============================================
-- STEP 7: TRIGGER UNTUK AUTO-SET is_approved
-- ============================================

-- Function untuk auto-set is_approved saat insert profile
CREATE OR REPLACE FUNCTION public.set_default_is_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Auto-set is_approved = true untuk admin dan jobseeker
    IF NEW.role IN ('admin', 'jobseeker') THEN
        NEW.is_approved := true;
    -- Auto-set is_approved = false untuk recruiter
    ELSIF NEW.role = 'recruiter' THEN
        NEW.is_approved := false;
    END IF;
    RETURN NEW;
END;
$$;

-- Trigger untuk auto-set is_approved saat insert
DROP TRIGGER IF EXISTS trigger_set_default_is_approved ON public.profiles;
CREATE TRIGGER trigger_set_default_is_approved
    BEFORE INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_default_is_approved();

-- ============================================
-- STEP 8: SAMPLE DATA (OPSIONAL)
-- ============================================

-- Sample living costs
INSERT INTO public.living_costs (city, province, avg_rent, avg_food, avg_transport, salary_reference)
VALUES
    ('Jakarta', 'DKI Jakarta', 4500000, 2500000, 800000, 12000000),
    ('Bandung', 'Jawa Barat', 2500000, 2000000, 600000, 8000000),
    ('Surabaya', 'Jawa Timur', 3000000, 2200000, 700000, 9000000)
ON CONFLICT DO NOTHING;

-- ============================================
-- STEP 9: VERIFIKASI
-- ============================================

-- Cek apakah semua tabel sudah dibuat
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Cek apakah semua policies sudah dibuat
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- CATATAN PENTING:
-- ============================================
-- 1. Setelah script ini, jalankan fix_storage_rls_policy.sql untuk storage policies
-- 2. Buat bucket 'company_licenses' di Supabase Dashboard > Storage
-- 3. Untuk membuat user admin pertama, insert manual:
--    INSERT INTO public.profiles (id, role, is_approved, full_name)
--    VALUES ('USER_ID_DARI_AUTH_USERS', 'admin', true, 'Admin Name');
-- 4. Atau update user yang sudah ada menjadi admin:
--    UPDATE public.profiles SET role = 'admin', is_approved = true WHERE id = 'USER_ID';

