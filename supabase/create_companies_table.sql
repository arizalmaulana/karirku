-- ============================================
--  Script untuk membuat tabel companies
--  Jalankan di Supabase SQL Editor
-- ============================================

-- Hapus tabel jika sudah ada (untuk development)
DROP TABLE IF EXISTS public.companies CASCADE;

-- Buat tabel companies
CREATE TABLE public.companies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    logo_url text,
    industry text,
    location_city text,
    location_province text,
    description text,
    website_url text,
    size text, -- Format: "20-50", "50-100", "100-250", dll
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Policy: Semua orang bisa membaca companies
CREATE POLICY "Everyone can read companies"
ON public.companies FOR SELECT
USING (true);

-- Policy: Admin bisa mengelola companies
CREATE POLICY "Admin can manage companies"
ON public.companies FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policy: Recruiter bisa update company mereka sendiri (jika recruiter_id ada di job_listings)
-- Note: Untuk sekarang, hanya admin yang bisa manage companies
-- Recruiter akan menggunakan company_name di job_listings

-- Trigger untuk update updated_at
CREATE OR REPLACE FUNCTION update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION update_companies_updated_at();

-- ============================================
-- CATATAN:
-- 1. Tabel companies akan diisi dari data job_listings (aggregate)
-- 2. Atau bisa diisi manual oleh admin
-- 3. Field logo_url bisa diisi dengan URL dari storage atau external URL
-- 4. Field description bisa diisi manual atau di-generate dari job_listings
-- ============================================

