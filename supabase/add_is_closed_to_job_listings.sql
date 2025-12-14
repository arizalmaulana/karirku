-- Menambahkan field is_closed ke tabel job_listings
-- Field ini digunakan untuk menandai apakah lowongan sudah ditutup (terpenuhi)

ALTER TABLE public.job_listings
ADD COLUMN IF NOT EXISTS is_closed BOOLEAN DEFAULT false;

-- Buat index untuk performa query yang lebih baik
CREATE INDEX IF NOT EXISTS idx_job_listings_is_closed 
ON public.job_listings(is_closed);

-- Update RLS policy untuk memastikan recruiter bisa update is_closed
-- Policy yang sudah ada seharusnya sudah mencakup ini, tapi kita pastikan

COMMENT ON COLUMN public.job_listings.is_closed IS 'Menandai apakah lowongan sudah ditutup (terpenuhi)';


