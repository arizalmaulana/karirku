# Troubleshooting: RLS Policy Error untuk Applications Bucket

## Error yang Terjadi
```
StorageApiError: new row violates row-level security policy
```

## Penyebab
RLS (Row Level Security) policy untuk storage bucket `applications` belum dikonfigurasi dengan benar, sehingga user tidak bisa upload CV dan dokumen lamaran.

## Solusi

### Langkah 1: Pastikan Bucket Sudah Dibuat
1. Buka Supabase Dashboard
2. Pergi ke menu **Storage** di sidebar kiri
3. Pastikan bucket `applications` sudah ada
4. Jika belum, buat bucket baru:
   - **Name**: `applications`
   - **Public bucket**: OFF (biarkan private untuk keamanan)
   - **File size limit**: 5242880 (5MB dalam bytes)
   - **Allowed MIME types**: `application/pdf,image/jpeg,image/jpg`
5. Klik **Create bucket**

### Langkah 2: Jalankan SQL Script untuk RLS Policy

Jalankan script `create_applications_bucket_rls_policy.sql` di Supabase SQL Editor:

1. Buka Supabase Dashboard
2. Pergi ke menu **SQL Editor**
3. Klik **New query**
4. Copy-paste isi file `supabase/create_applications_bucket_rls_policy.sql`
5. Klik **Run** atau tekan `Ctrl+Enter`

### Langkah 3: Verifikasi Policy

Jalankan query berikut untuk memverifikasi policy sudah dibuat:

```sql
SELECT policyname, cmd, schemaname, tablename
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%application%';
```

Hasil yang diharapkan: 7 policy untuk application files
- "Users can upload their own application files" (INSERT)
- "Users can read their own application files" (SELECT)
- "Recruiters can read application files" (SELECT)
- "Admins can read all application files" (SELECT)
- "Users can update their own application files" (UPDATE)
- "Users can delete their own application files" (DELETE)
- "Admins can delete application files" (DELETE)

### Langkah 4: Test Upload

1. Login sebagai jobseeker
2. Buka halaman lowongan
3. Klik "Lamar Sekarang" pada salah satu lowongan
4. Upload CV (format PDF, maks 5MB)
5. Submit form lamaran
6. Jika masih error, cek console browser untuk detail error

## Format Filename yang Didukung

Policy ini mendukung format filename berikut:
- `cv_{user_id}_{timestamp}.pdf` - untuk CV
- `doc_{user_id}_{timestamp}.pdf` - untuk dokumen tambahan (PDF)
- `doc_{user_id}_{timestamp}.jpg` - untuk dokumen tambahan (JPG)

Contoh:
- `cv_123e4567-e89b-12d3-a456-426614174000_1704067200000.pdf`
- `doc_123e4567-e89b-12d3-a456-426614174000_1704067200000.pdf`

## Troubleshooting Lanjutan

### Error: "new row violates row-level security policy"

**Kemungkinan penyebab:**
1. Bucket belum dibuat
2. Policy belum dijalankan
3. Format filename tidak sesuai (tidak mengandung user ID)
4. User belum authenticated

**Solusi:**
1. Pastikan bucket `applications` sudah dibuat
2. Jalankan script SQL policy
3. Pastikan filename mengikuti format: `cv_{user_id}_{timestamp}.pdf`
4. Pastikan user sudah login

### Error: "Bucket not found"

**Penyebab:**
Bucket `applications` belum dibuat di Supabase Storage Dashboard.

**Solusi:**
1. Buka Supabase Dashboard > Storage
2. Klik tombol **"New bucket"** atau **"Create bucket"**
3. Isi form:
   - **Name**: `applications` (harus tepat, huruf kecil, tanpa spasi)
   - **Public bucket**: **OFF** (jangan dicentang, private bucket)
   - **File size limit**: `5242880` (5MB dalam bytes)
   - **Allowed MIME types**: `application/pdf,image/jpeg,image/jpg` (opsional)
4. Klik **"Create bucket"**
5. Verifikasi dengan query: `SELECT * FROM storage.buckets WHERE name = 'applications';`
6. Setelah bucket dibuat, **WAJIB** jalankan script RLS policy (`create_applications_bucket_rls_policy.sql`)

**Lihat panduan lengkap di:** `CREATE_APPLICATIONS_BUCKET.md`

### Error: "File size exceeds limit"

**Solusi:**
1. Pastikan file CV tidak lebih dari 5MB
2. Jika perlu, ubah file size limit di bucket settings

## Catatan Penting

1. **Bucket harus private**: Jangan set bucket sebagai public untuk keamanan data pelamar
2. **Format filename penting**: Filename harus mengandung user ID agar policy bisa bekerja
3. **RLS harus enabled**: Pastikan Row Level Security enabled untuk storage.objects
4. **Recruiter access**: Recruiter bisa membaca file aplikasi untuk lowongan mereka (untuk review CV)

## Verifikasi Setup

Setelah setup selesai, verifikasi dengan query berikut:

```sql
-- Cek bucket
SELECT * FROM storage.buckets WHERE name = 'applications';

-- Cek policies
SELECT policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%application%';
```

Jika semua sudah benar, upload CV seharusnya berfungsi tanpa error.


