# Troubleshooting: RLS Policy Error untuk Storage Upload

## Error yang Terjadi
```
Gagal mengunggah surat izin: new row violates row-level security policy
```

## Penyebab
RLS (Row Level Security) policy untuk storage bucket `company_licenses` belum dikonfigurasi dengan benar, sehingga user yang baru signup tidak bisa upload file.

## Solusi

### Langkah 1: Pastikan Bucket Sudah Dibuat
1. Buka Supabase Dashboard
2. Pergi ke menu **Storage**
3. Pastikan bucket `company_licenses` sudah ada
4. Jika belum, buat bucket baru:
   - Name: `company_licenses`
   - Public: OFF (private)
   - File size limit: 10485760 (10MB)
   - Allowed MIME types: `application/pdf,image/jpeg,image/png`

### Langkah 2: Jalankan SQL Script untuk Fix RLS Policy

Jalankan script `fix_storage_rls_policy.sql` di Supabase SQL Editor:

```sql
-- Hapus policy lama jika ada
drop policy if exists "Recruiters can upload their own license files" on storage.objects;
drop policy if exists "Recruiters can read their own license files" on storage.objects;

-- Policy untuk authenticated user bisa upload file mereka sendiri
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
```

### Langkah 3: Verifikasi Policy

Cek apakah policy sudah dibuat dengan benar:

```sql
SELECT * 
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%license%';
```

### Langkah 4: Test Upload

1. Coba registrasi sebagai recruiter baru
2. Upload surat izin perusahaan
3. Jika masih error, cek console browser untuk detail error

## Alternatif: Gunakan Bucket Documents

Jika bucket `company_licenses` masih bermasalah, sistem akan otomatis fallback ke bucket `documents`. Pastikan bucket `documents` sudah ada dan memiliki RLS policy yang sesuai.

## Catatan Penting

1. **RLS harus enabled**: Pastikan RLS enabled untuk `storage.objects`
2. **User harus authenticated**: Policy hanya bekerja untuk user yang sudah login (auth.uid() is not null)
3. **Filename format**: File harus mengandung user ID di nama file (format: `license_{user_id}_{timestamp}.ext`)

## Jika Masih Error

1. Cek apakah user sudah authenticated:
   ```sql
   SELECT auth.uid();
   ```

2. Cek apakah bucket ada:
   ```sql
   SELECT * FROM storage.buckets WHERE id = 'company_licenses';
   ```

3. Cek RLS policies yang aktif:
   ```sql
   SELECT * FROM pg_policies 
   WHERE schemaname = 'storage' AND tablename = 'objects';
   ```

4. Test upload manual di Supabase Dashboard > Storage untuk memastikan bucket bisa diakses

