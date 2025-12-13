# Sistem Approval Perusahaan untuk Recruiter

## Ringkasan
Sistem ini memastikan bahwa recruiter harus mengupload surat izin perusahaan dan menunggu persetujuan admin sebelum bisa mengakses dashboard recruiter.

## Fitur yang Diimplementasikan

### 1. Database Schema
- Kolom `company_license_url` (text) - menyimpan URL surat izin perusahaan
- Kolom `is_approved` (boolean) - status approval dari admin
- Default: `is_approved = false` untuk recruiter baru
- Default: `is_approved = true` untuk admin dan jobseeker

### 2. Alur Login
- Recruiter yang belum upload surat izin → redirect ke `/recruiter/upload-license`
- Recruiter yang sudah upload tapi belum approved → pesan "menunggu persetujuan admin"
- Recruiter yang sudah approved → bisa login normal ke dashboard

### 3. Middleware Protection
- Middleware memblokir akses recruiter ke semua route `/recruiter/*` kecuali `/recruiter/upload-license`
- Jika belum upload → redirect ke upload page
- Jika sudah upload tapi belum approved → redirect ke home dengan pesan

### 4. Halaman Upload
- Route: `/recruiter/upload-license`
- Fitur:
  - Upload file PDF, JPG, atau PNG (maksimal 10MB)
  - Preview untuk file gambar
  - Validasi file type dan size
  - Simpan URL ke database setelah upload

## Instalasi

### Langkah 1: Jalankan SQL Scripts

1. **Jalankan `create_company_licenses_bucket.sql`** di Supabase SQL Editor:
   ```sql
   -- Script ini menambahkan kolom dan update data existing
   ```

2. **Buat Storage Bucket** (Manual di Dashboard):
   - Buka Supabase Dashboard > Storage
   - Klik "New bucket"
   - Nama: `company_licenses`
   - Public: OFF (private bucket)
   - File size limit: 10485760 (10MB)
   - Allowed MIME types: `application/pdf,image/jpeg,image/png`

3. **Jalankan `create_company_licenses_bucket_storage.sql`** untuk membuat RLS policies:
   ```sql
   -- Script ini membuat policies untuk storage bucket
   ```

### Langkah 2: Verifikasi

1. Cek kolom baru di tabel `profiles`:
   ```sql
   SELECT id, role, company_license_url, is_approved 
   FROM profiles 
   WHERE role = 'recruiter';
   ```

2. Test alur:
   - Register sebagai recruiter baru
   - Login → harus redirect ke upload page
   - Upload surat izin
   - Coba akses dashboard → harus diblokir dengan pesan "menunggu approval"
   - Admin approve di database:
     ```sql
     UPDATE profiles 
     SET is_approved = true 
     WHERE id = 'user-id-here';
     ```
   - Login lagi → harus bisa akses dashboard

## Untuk Admin: Cara Approve Recruiter

### Via SQL Editor:
```sql
-- Approve satu recruiter
UPDATE profiles 
SET is_approved = true 
WHERE id = 'user-id-recruiter';

-- Approve semua recruiter yang sudah upload
UPDATE profiles 
SET is_approved = true 
WHERE role = 'recruiter' 
  AND company_license_url IS NOT NULL 
  AND is_approved = false;
```

### Via Dashboard (jika ada):
- Buka tabel `profiles`
- Filter `role = 'recruiter'` dan `is_approved = false`
- Update `is_approved` menjadi `true` untuk recruiter yang sudah upload

## File yang Dimodifikasi

1. `lib/types.ts` - Menambahkan field `company_license_url` dan `is_approved` ke interface Profile
2. `components/LoginDialog.tsx` - Menambahkan check approval status saat login
3. `middleware.ts` - Menambahkan protection untuk route recruiter
4. `app/recruiter/upload-license/page.tsx` - Halaman baru untuk upload surat izin
5. `supabase/create_company_licenses_bucket.sql` - SQL untuk kolom dan policies
6. `supabase/add_company_approval_fields.sql` - SQL alternatif (sama dengan di atas)
7. `supabase/create_company_licenses_bucket_storage.sql` - SQL untuk storage policies

## Catatan Penting

1. **Storage Bucket**: Harus dibuat manual di Supabase Dashboard. Script SQL tidak bisa membuat bucket secara otomatis.

2. **RLS Policies**: Pastikan policies untuk storage bucket sudah dibuat agar recruiter bisa upload file mereka sendiri.

3. **Fallback**: Jika bucket `company_licenses` tidak ditemukan, sistem akan mencoba menggunakan bucket `documents` sebagai fallback.

4. **Security**: File di bucket `company_licenses` adalah private. Hanya recruiter pemilik file dan admin yang bisa mengakses.

## Troubleshooting

### Recruiter tidak bisa upload file
- Cek apakah bucket `company_licenses` sudah dibuat
- Cek RLS policies untuk storage bucket
- Cek console browser untuk error message

### Recruiter sudah upload tapi masih diblokir
- Cek apakah `company_license_url` sudah terisi di database
- Cek apakah `is_approved` masih `false` (harus di-set `true` oleh admin)

### Middleware redirect loop
- Pastikan route `/recruiter/upload-license` tidak diblokir
- Cek logic di middleware untuk path yang diizinkan

