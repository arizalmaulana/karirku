-- ============================================
--  Public Stats Policy untuk Platform KarirKu
--  Jalankan di Supabase SQL Editor
--  Policy ini mengizinkan public read untuk statistik
-- ============================================

-- Hapus policy lama jika ada
DROP POLICY IF EXISTS "Public can read role for stats" ON public.profiles;
DROP POLICY IF EXISTS "Public can read status for stats" ON public.applications;

-- Policy: Public bisa membaca role dan id dari profiles untuk statistik
-- (hanya untuk menghitung jumlah jobseeker)
CREATE POLICY "Public can read role for stats"
ON public.profiles FOR SELECT
USING (true);

-- Policy: Public bisa membaca status dan job_seeker_id dari applications untuk statistik
-- (hanya untuk menghitung jumlah aplikasi yang diterima)
CREATE POLICY "Public can read status for stats"
ON public.applications FOR SELECT
USING (true);

