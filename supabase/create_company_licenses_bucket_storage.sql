-- ============================================
--  Script untuk membuat bucket company_licenses
--  CATATAN: Script ini tidak bisa dijalankan langsung di SQL Editor
--  Anda harus membuat bucket secara manual di Supabase Dashboard
-- ============================================

-- INSTRUKSI MANUAL:
-- 1. Buka Supabase Dashboard (https://app.supabase.com)
-- 2. Pilih project Anda
-- 3. Pergi ke menu "Storage" di sidebar kiri
-- 4. Klik tombol "New bucket"
-- 5. Isi form:
--    - Name: company_licenses
--    - Public bucket: OFF (biarkan private)
--    - File size limit: 10485760 (10MB dalam bytes)
--    - Allowed MIME types: application/pdf,image/jpeg,image/png
-- 6. Klik "Create bucket"
--
-- SETELAN RLS POLICY (akan dibuat otomatis atau bisa ditambahkan manual):
-- - Recruiter bisa upload file mereka sendiri
-- - Admin bisa melihat semua file
-- - File tidak bisa diakses publik

-- CATATAN: Bucket harus dibuat manual di Supabase Dashboard
-- Script di bawah ini untuk membuat RLS policies setelah bucket dibuat

-- Policy untuk authenticated user bisa upload file mereka sendiri
-- File name harus mengandung user ID mereka (format: license_{user_id}_{timestamp}.ext)
-- Menggunakan LIKE untuk match user ID di filename
drop policy if exists "Recruiters can upload their own license files" on storage.objects;
create policy "Recruiters can upload their own license files"
on storage.objects for insert
with check (
    bucket_id = 'company_licenses' and
    auth.uid() is not null and
    (name like '%' || auth.uid()::text || '%')
);

-- Policy untuk authenticated user bisa membaca file mereka sendiri
drop policy if exists "Recruiters can read their own license files" on storage.objects;
create policy "Recruiters can read their own license files"
on storage.objects for select
using (
    bucket_id = 'company_licenses' and
    auth.uid() is not null and
    (name like '%' || auth.uid()::text || '%')
);

-- Policy untuk admin bisa membaca semua file
create policy "Admins can read all license files"
on storage.objects for select
using (
    bucket_id = 'company_licenses' and
    exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'admin'
    )
);

-- Policy untuk admin bisa menghapus file (untuk maintenance)
create policy "Admins can delete license files"
on storage.objects for delete
using (
    bucket_id = 'company_licenses' and
    exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'admin'
    )
);

