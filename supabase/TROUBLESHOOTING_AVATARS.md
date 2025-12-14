# Troubleshooting: RLS Policy Error untuk Upload Avatar

## Error yang Terjadi
```
Gagal mengunggah foto: new row violates row-level security policy
```

## Penyebab
RLS (Row Level Security) policy untuk storage bucket `avatars` belum dikonfigurasi dengan benar, sehingga user tidak bisa upload foto profil.

## Solusi

### Langkah 1: Pastikan Bucket Avatars Sudah Dibuat
1. Buka Supabase Dashboard (https://app.supabase.com)
2. Pilih project Anda
3. Pergi ke menu **Storage** di sidebar kiri
4. Pastikan bucket `avatars` sudah ada
5. Jika belum, buat bucket baru:
   - Klik tombol **"New bucket"**
   - Name: `avatars`
   - **Public bucket: ON** (penting! agar foto profil bisa diakses publik)
   - File size limit: `5242880` (5MB dalam bytes)
   - Allowed MIME types: `image/jpeg,image/png,image/jpg,image/webp`
   - Klik **"Create bucket"**

### Langkah 2: Jalankan SQL Script untuk Fix RLS Policy
1. Buka Supabase Dashboard > **SQL Editor**
2. Buka file `supabase/create_avatars_bucket_rls_policy.sql`
3. Copy semua isi file tersebut
4. Paste ke SQL Editor
5. Klik **"Run"** untuk menjalankan script

Script ini akan membuat RLS policies berikut:
- ✅ Users can upload their own avatars (INSERT)
- ✅ Public can read avatars (SELECT)
- ✅ Users can read their own avatars (SELECT)
- ✅ Admins can read all avatars (SELECT)
- ✅ Users can update their own avatars (UPDATE)
- ✅ Users can delete their own avatars (DELETE)
- ✅ Admins can delete avatars (DELETE)

### Langkah 3: Verifikasi Policy
Jalankan query berikut di SQL Editor untuk memastikan policy sudah dibuat:

```sql
SELECT policyname, cmd, schemaname, tablename
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%avatar%'
ORDER BY policyname;
```

Hasil yang diharapkan: 7 policy untuk avatars

### Langkah 4: Test Upload
1. Login sebagai jobseeker
2. Pergi ke halaman profil (`/job-seeker/profile`)
3. Coba upload foto profil
4. Jika masih error, cek console browser untuk detail error

## Format Filename
File yang diupload harus memiliki format: `{user_id}-{timestamp}.{ext}`

Contoh: `123e4567-e89b-12d3-a456-426614174000-1699123456789.jpg`

Format ini sudah otomatis di-handle oleh kode di `ProfileForm.tsx`, jadi tidak perlu khawatir.

## Troubleshooting Lanjutan

### Error: "Bucket not found"
- Pastikan bucket `avatars` sudah dibuat di Dashboard
- Pastikan nama bucket tepat: `avatars` (huruf kecil, tanpa spasi)

### Error: "Permission denied"
- Pastikan user sudah login (terautentikasi)
- Pastikan RLS policy sudah dijalankan
- Cek apakah user ID ada di filename

### Error: "File too large"
- Pastikan file tidak lebih dari 5MB
- Cek file size limit di bucket settings

### Foto tidak muncul setelah upload
- Pastikan bucket `avatars` di-set sebagai **Public bucket: ON**
- Cek URL foto di console browser
- Coba refresh halaman

## Catatan Penting

1. **Bucket harus Public**: Foto profil harus bisa diakses publik, jadi pastikan bucket `avatars` di-set sebagai public bucket.

2. **RLS tetap aktif**: Meskipun bucket public, RLS policy tetap diperlukan untuk kontrol upload/update/delete.

3. **Format filename**: Kode sudah otomatis membuat filename dengan format yang benar, jadi tidak perlu khawatir.

4. **File size**: Maksimal 5MB per file. Jika perlu lebih besar, ubah di bucket settings dan validasi di kode.

## Alternatif: Cek Manual di Database

Jika masih ada masalah, cek langsung di database:

```sql
-- Cek apakah bucket ada
SELECT * FROM storage.buckets WHERE name = 'avatars';

-- Cek file yang sudah diupload
SELECT * FROM storage.objects WHERE bucket_id = 'avatars';

-- Cek RLS policies
SELECT * FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%avatar%';
```

