-- ============================================
--  Auto Hide Jobs Ketika Company Diblokir/Dihapus
--  Jalankan di Supabase SQL Editor
-- ============================================

-- 1. Tambahkan kolom is_hidden ke job_listings
ALTER TABLE public.job_listings
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;

-- Buat index untuk performa query
CREATE INDEX IF NOT EXISTS idx_job_listings_is_hidden 
ON public.job_listings(is_hidden);

-- Buat index composite untuk query yang lebih efisien
CREATE INDEX IF NOT EXISTS idx_job_listings_company_name_hidden 
ON public.job_listings(company_name, is_hidden);

-- Update comment
COMMENT ON COLUMN public.job_listings.is_hidden IS 'Menandai apakah lowongan disembunyikan karena perusahaan diblokir atau dihapus';

-- 2. Buat function untuk hide/show jobs berdasarkan status company
CREATE OR REPLACE FUNCTION public.hide_jobs_for_blocked_company()
RETURNS TRIGGER AS $$
BEGIN
    -- Jika company diblokir (is_blocked = true), hide semua jobs
    IF NEW.is_blocked = true THEN
        UPDATE public.job_listings
        SET is_hidden = true
        WHERE company_name = NEW.name;
    -- Jika company tidak diblokir (is_blocked = false), unhide semua jobs
    ELSIF NEW.is_blocked = false AND (OLD.is_blocked = true OR OLD IS NULL) THEN
        UPDATE public.job_listings
        SET is_hidden = false
        WHERE company_name = NEW.name;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Buat trigger untuk auto-hide jobs ketika company di-block/unblock
DROP TRIGGER IF EXISTS trigger_hide_jobs_on_company_block ON public.companies;

CREATE TRIGGER trigger_hide_jobs_on_company_block
    AFTER UPDATE OF is_blocked ON public.companies
    FOR EACH ROW
    WHEN (OLD.is_blocked IS DISTINCT FROM NEW.is_blocked)
    EXECUTE FUNCTION public.hide_jobs_for_blocked_company();

-- 4. Buat function untuk hide jobs ketika company dihapus
CREATE OR REPLACE FUNCTION public.hide_jobs_on_company_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Hide semua jobs dari company yang dihapus
    UPDATE public.job_listings
    SET is_hidden = true
    WHERE company_name = OLD.name;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Buat trigger untuk auto-hide jobs ketika company dihapus
DROP TRIGGER IF EXISTS trigger_hide_jobs_on_company_delete ON public.companies;

CREATE TRIGGER trigger_hide_jobs_on_company_delete
    BEFORE DELETE ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION public.hide_jobs_on_company_delete();

-- 6. Update existing jobs: hide jobs dari companies yang sudah diblokir
UPDATE public.job_listings jl
SET is_hidden = true
FROM public.companies c
WHERE jl.company_name = c.name
AND c.is_blocked = true;

-- ============================================
-- CATATAN:
-- 1. Ketika company.is_blocked berubah menjadi true, semua job_listings 
--    dengan company_name yang sama akan otomatis di-hide (is_hidden = true)
-- 2. Ketika company.is_blocked berubah menjadi false, semua job_listings 
--    dengan company_name yang sama akan otomatis di-unhide (is_hidden = false)
-- 3. Ketika company dihapus, semua job_listings dengan company_name yang sama 
--    akan otomatis di-hide (is_hidden = true)
-- 4. Query job_listings harus selalu filter dengan .eq("is_hidden", false) 
--    atau .neq("is_hidden", true) untuk exclude hidden jobs

