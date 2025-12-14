-- ============================================
--  Fix Infinite Recursion in Companies RLS Policy
--  Jalankan di Supabase SQL Editor
-- ============================================

-- Drop policy yang menyebabkan recursion
DROP POLICY IF EXISTS "Recruiters can create their own company" ON public.companies;
DROP POLICY IF EXISTS "Recruiters can update their own company" ON public.companies;

-- Buat function untuk check role (menggunakan SECURITY DEFINER untuk bypass RLS)
CREATE OR REPLACE FUNCTION public.is_recruiter()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'recruiter'
    );
$$;

-- Buat function untuk check admin (menggunakan SECURITY DEFINER untuk bypass RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;

-- Policy: Recruiter bisa insert company mereka sendiri
-- Hapus NOT EXISTS check karena sudah ada UNIQUE constraint di database
CREATE POLICY "Recruiters can create their own company"
ON public.companies FOR INSERT
WITH CHECK (
    recruiter_id = auth.uid() AND
    public.is_recruiter()
);

-- Policy: Recruiter bisa update company mereka sendiri (hanya jika belum approved)
CREATE POLICY "Recruiters can update their own company"
ON public.companies FOR UPDATE
USING (
    recruiter_id = auth.uid() AND
    public.is_recruiter() AND
    (is_approved = false OR status = 'pending' OR status = 'rejected')
)
WITH CHECK (
    recruiter_id = auth.uid() AND
    public.is_recruiter()
);

-- Update policy untuk admin juga menggunakan function
DROP POLICY IF EXISTS "Admin can manage all companies" ON public.companies;

CREATE POLICY "Admin can manage all companies"
ON public.companies FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Update policy untuk recruiter read juga menggunakan function
DROP POLICY IF EXISTS "Recruiters can read their own company" ON public.companies;

CREATE POLICY "Recruiters can read their own company"
ON public.companies FOR SELECT
USING (
    recruiter_id = auth.uid() AND
    public.is_recruiter()
);

-- ============================================
-- CATATAN:
-- 1. Menggunakan SECURITY DEFINER function untuk bypass RLS saat check role
-- 2. Menghapus NOT EXISTS check dari INSERT policy karena sudah ada UNIQUE constraint
-- 3. UNIQUE constraint di database akan mencegah duplicate recruiter_id
-- ============================================
