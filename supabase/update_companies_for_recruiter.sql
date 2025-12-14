-- ============================================
--  Script untuk update tabel companies
--  Menambahkan support untuk recruiter profile perusahaan
--  Jalankan di Supabase SQL Editor
-- ============================================

-- Tambahkan kolom baru jika belum ada
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS recruiter_id uuid UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS license_url text,
ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Buat index untuk recruiter_id untuk performa query
CREATE INDEX IF NOT EXISTS idx_companies_recruiter_id ON public.companies(recruiter_id);

-- Drop policy lama jika ada
DROP POLICY IF EXISTS "Admin can manage companies" ON public.companies;
DROP POLICY IF EXISTS "Everyone can read companies" ON public.companies;

-- Policy: Semua orang bisa membaca companies yang sudah approved
CREATE POLICY "Everyone can read approved companies"
ON public.companies FOR SELECT
USING (is_approved = true AND status = 'approved');

-- Policy: Recruiter bisa membaca company mereka sendiri (meskipun belum approved)
CREATE POLICY "Recruiters can read their own company"
ON public.companies FOR SELECT
USING (
    recruiter_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'recruiter'
    )
);

-- Policy: Recruiter bisa insert company mereka sendiri (hanya 1 perusahaan per recruiter)
CREATE POLICY "Recruiters can create their own company"
ON public.companies FOR INSERT
WITH CHECK (
    recruiter_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'recruiter'
    ) AND
    NOT EXISTS (
        SELECT 1 FROM public.companies
        WHERE recruiter_id = auth.uid()
    )
);

-- Policy: Recruiter bisa update company mereka sendiri (hanya jika belum approved)
-- Note: Untuk mencegah recruiter mengubah is_approved dan status, kita gunakan trigger
CREATE POLICY "Recruiters can update their own company"
ON public.companies FOR UPDATE
USING (
    recruiter_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'recruiter'
    ) AND
    (is_approved = false OR status = 'pending' OR status = 'rejected')
)
WITH CHECK (
    recruiter_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'recruiter'
    )
);

-- Policy: Admin bisa mengelola semua companies
CREATE POLICY "Admin can manage all companies"
ON public.companies FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Trigger untuk mencegah recruiter mengubah is_approved dan status
CREATE OR REPLACE FUNCTION prevent_recruiter_approval_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Jika user adalah recruiter (bukan admin), jaga is_approved dan status tetap sama
    IF EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'recruiter'
    ) AND NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        -- Kembalikan nilai is_approved dan status ke nilai lama
        NEW.is_approved = OLD.is_approved;
        NEW.status = OLD.status;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger jika sudah ada
DROP TRIGGER IF EXISTS trigger_prevent_recruiter_approval_change ON public.companies;

-- Buat trigger
CREATE TRIGGER trigger_prevent_recruiter_approval_change
    BEFORE UPDATE ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION prevent_recruiter_approval_change();

-- ============================================
-- CATATAN:
-- 1. Satu recruiter hanya bisa memiliki 1 perusahaan (enforced by UNIQUE constraint)
-- 2. Recruiter bisa membuat dan update company mereka sendiri
-- 3. Company harus melalui approval admin sebelum ditampilkan ke public
-- 4. Status: pending (default), approved, rejected
-- 5. license_url menyimpan URL surat izin dari bucket company_licenses
-- ============================================
