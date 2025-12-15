-- ============================================
--  Update RLS Policy untuk mengizinkan recruiter
--  mengupdate company yang sudah approved
--  Jalankan di Supabase SQL Editor
-- ============================================
-- 
-- Script ini akan memperbarui policy agar recruiter
-- bisa mengedit profile perusahaan yang sudah approved
-- tanpa harus meminta persetujuan admin kembali.
-- Status dan is_approved akan tetap sama (dijaga oleh trigger)

-- ============================================
-- 1. DROP POLICY LAMA
-- ============================================
DROP POLICY IF EXISTS "Recruiters can update their own company" ON public.companies;

-- ============================================
-- 2. BUAT POLICY BARU
-- ============================================
-- Policy: Recruiter bisa update company mereka sendiri
-- (termasuk yang sudah approved - status tetap sama karena trigger)
CREATE POLICY "Recruiters can update their own company"
ON public.companies FOR UPDATE
USING (
    recruiter_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'recruiter'
    )
)
WITH CHECK (
    recruiter_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'recruiter'
    )
);

-- ============================================
-- 3. PASTIKAN TRIGGER SUDAH ADA
-- ============================================
-- Trigger ini akan menjaga is_approved dan status tetap sama
-- saat recruiter melakukan update (tidak bisa diubah oleh recruiter)

-- Pastikan function sudah ada
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

-- Pastikan trigger sudah ada
DROP TRIGGER IF EXISTS trigger_prevent_recruiter_approval_change ON public.companies;

CREATE TRIGGER trigger_prevent_recruiter_approval_change
    BEFORE UPDATE ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION prevent_recruiter_approval_change();

-- ============================================
-- CATATAN:
-- ============================================
-- 1. Recruiter sekarang bisa mengupdate company mereka sendiri
--    bahkan jika sudah approved
-- 2. Status dan is_approved akan tetap sama (dijaga oleh trigger)
-- 3. Hanya admin yang bisa mengubah status approval
-- 4. Recruiter bisa mengubah data perusahaan lainnya seperti:
--    - name, industry, location, address, description
--    - website_url, size, logo_url, license_url
-- ============================================

