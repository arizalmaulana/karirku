-- ============================================
--  Fix RLS Policy untuk Storage Bucket
--  Jalankan di Supabase SQL Editor
-- ============================================
-- 
-- Script ini memperbaiki RLS policy untuk storage bucket company_licenses
-- agar user yang baru signup bisa langsung upload file

-- Hapus semua policy lama jika ada (untuk menghindari konflik)
drop policy if exists "Recruiters can upload their own license files" on storage.objects;
drop policy if exists "Recruiters can read their own license files" on storage.objects;
drop policy if exists "Users can upload their own license files" on storage.objects;
drop policy if exists "Users can read their own license files" on storage.objects;

-- Policy untuk authenticated user bisa upload file mereka sendiri
-- File name harus mengandung user ID mereka (format: license_{user_id}_{timestamp}.ext)
-- Menggunakan LIKE untuk match user ID di filename
create policy "Users can upload their own license files"
on storage.objects for insert
with check (
    bucket_id = 'company_licenses' and
    auth.uid() is not null and
    (name like '%' || auth.uid()::text || '%')
);

-- Policy untuk authenticated user bisa membaca file mereka sendiri
create policy "Users can read their own license files"
on storage.objects for select
using (
    bucket_id = 'company_licenses' and
    auth.uid() is not null and
    (name like '%' || auth.uid()::text || '%')
);

-- Policy untuk admin bisa membaca semua file
drop policy if exists "Admins can read all license files" on storage.objects;
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
drop policy if exists "Admins can delete license files" on storage.objects;
create policy "Admins can delete license files"
on storage.objects for delete
using (
    bucket_id = 'company_licenses' and
    exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'admin'
    )
);

-- ============================================
-- POLICY UNTUK BUCKET DOCUMENTS (untuk fallback)
-- ============================================
-- Policy untuk authenticated user bisa upload ke documents bucket
-- File di folder licenses/ dengan user ID di filename
drop policy if exists "Users can upload license to documents" on storage.objects;
create policy "Users can upload license to documents"
on storage.objects for insert
with check (
    bucket_id = 'documents' and
    auth.uid() is not null and
    name like 'licenses/%' and
    (name like '%' || auth.uid()::text || '%')
);

-- Policy untuk authenticated user bisa membaca file mereka sendiri di documents
drop policy if exists "Users can read license from documents" on storage.objects;
create policy "Users can read license from documents"
on storage.objects for select
using (
    bucket_id = 'documents' and
    auth.uid() is not null and
    name like 'licenses/%' and
    (name like '%' || auth.uid()::text || '%')
);

-- ============================================
-- POLICY UNTUK BUCKET APPLICATIONS (untuk fallback)
-- ============================================
-- Policy untuk authenticated user bisa upload ke applications bucket
-- File di folder licenses/ dengan user ID di filename
drop policy if exists "Users can upload license to applications" on storage.objects;
create policy "Users can upload license to applications"
on storage.objects for insert
with check (
    bucket_id = 'applications' and
    auth.uid() is not null and
    name like 'licenses/%' and
    (name like '%' || auth.uid()::text || '%')
);

-- Policy untuk authenticated user bisa membaca file mereka sendiri di applications
drop policy if exists "Users can read license from applications" on storage.objects;
create policy "Users can read license from applications"
on storage.objects for select
using (
    bucket_id = 'applications' and
    auth.uid() is not null and
    name like 'licenses/%' and
    (name like '%' || auth.uid()::text || '%')
);

-- CATATAN PENTING:
-- 1. Pastikan bucket 'company_licenses' sudah dibuat di Supabase Dashboard
-- 2. Pastikan RLS (Row Level Security) enabled untuk storage.objects
-- 3. Jika masih error, cek apakah user sudah authenticated dengan benar
-- 4. Untuk testing, bisa cek dengan query:
--    SELECT * FROM storage.objects WHERE bucket_id = 'company_licenses';

-- ============================================
-- QUERY UNTUK VERIFIKASI POLICY (Jalankan setelah script di atas)
-- ============================================
-- Cek apakah policy sudah dibuat dengan benar:
-- SELECT policyname, cmd, schemaname, tablename
-- FROM pg_policies 
-- WHERE schemaname = 'storage' 
--   AND tablename = 'objects'
--   AND policyname LIKE '%license%';
--
-- Hasil yang diharapkan: 4 policy untuk license files
-- 1. "Users can upload their own license files" (INSERT)
-- 2. "Users can read their own license files" (SELECT)
-- 3. "Admins can read all license files" (SELECT)
-- 4. "Admins can delete license files" (DELETE)

