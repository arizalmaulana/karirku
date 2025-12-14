# Instruksi Setup Database Baru

## Langkah-langkah Setup

### 1. Reset Database (Hapus Semua Data)
Jalankan script `RESET_AND_CREATE_FRESH_DATABASE.sql` di Supabase SQL Editor.

**WARNING:** Script ini akan menghapus SEMUA data yang ada!

### 2. Setup Storage Buckets
Buka Supabase Dashboard > Storage dan buat bucket berikut:

#### Bucket: `avatars` (untuk foto profil jobseeker)
- Name: `avatars`
- Public: ON (public, agar foto profil bisa diakses)
- File size limit: 5242880 (5MB)
- Allowed MIME types: `image/jpeg,image/png,image/jpg,image/webp`

#### Bucket: `company_licenses`
- Name: `company_licenses`
- Public: OFF (private)
- File size limit: 10485760 (10MB)
- Allowed MIME types: `application/pdf,image/jpeg,image/png`

#### Bucket: `documents` (jika belum ada)
- Name: `documents`
- Public: OFF (private)
- File size limit: sesuai kebutuhan

#### Bucket: `applications` (untuk CV dan dokumen lamaran)
- Name: `applications`
- Public: OFF (private, untuk keamanan data pelamar)
- File size limit: 5242880 (5MB)
- Allowed MIME types: `application/pdf,image/jpeg,image/jpg`

### 3. Setup Storage RLS Policies
Jalankan script berikut di Supabase SQL Editor untuk membuat RLS policies untuk storage buckets:

1. **`create_avatars_bucket_rls_policy.sql`** - RLS policy untuk bucket avatars (foto profil)
2. **`create_applications_bucket_rls_policy.sql`** - RLS policy untuk bucket applications (CV dan dokumen lamaran)
3. **`fix_storage_rls_policy.sql`** - RLS policy untuk bucket company_licenses dan lainnya

### 4. Buat User Admin Pertama

#### Cara 1: Update User yang Sudah Ada
```sql
-- Ganti USER_ID dengan ID user dari auth.users
UPDATE public.profiles 
SET role = 'admin', is_approved = true 
WHERE id = 'USER_ID';
```

#### Cara 2: Insert Manual (jika user belum punya profile)
```sql
-- Ganti USER_ID dengan ID user dari auth.users
INSERT INTO public.profiles (id, role, is_approved, full_name)
VALUES ('USER_ID', 'admin', true, 'Admin Name');
```

#### Cara 3: Cari User ID
```sql
-- Cari user ID dari email
SELECT id, email FROM auth.users WHERE email = 'admin@example.com';
```

### 5. Insert Data Dummy (Opsional)

Untuk mengisi database dengan data dummy untuk testing, jalankan script `INSERT_DUMMY_DATA.sql` di Supabase SQL Editor.

**PENTING:** Script ini memerlukan beberapa user yang sudah ada di `auth.users`. Jika belum ada user:

1. Buat beberapa user terlebih dahulu via:
   - Registrasi di aplikasi
   - Supabase Dashboard > Authentication > Users > Add User
   - Atau menggunakan Supabase Auth API

2. Setelah ada user, jalankan script `INSERT_DUMMY_DATA.sql`

Script ini akan mengisi:
- 15 kota dengan data living costs
- 3 recruiter profiles
- 5 jobseeker profiles
- 1 admin profile
- 9 job listings
- Beberapa applications dengan berbagai status

**Catatan:** Script ini aman untuk dijalankan berulang kali karena menggunakan `ON CONFLICT DO NOTHING`.

### 6. Verifikasi Setup

Jalankan query berikut untuk verifikasi:

```sql
-- Cek semua tabel
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Cek semua policies
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- Cek profiles
SELECT id, role, is_approved, full_name 
FROM public.profiles;

-- Cek jumlah data dummy (jika sudah dijalankan)
SELECT 'Living Costs' as table_name, COUNT(*) as count FROM public.living_costs
UNION ALL
SELECT 'Profiles', COUNT(*) FROM public.profiles
UNION ALL
SELECT 'Job Listings', COUNT(*) FROM public.job_listings
UNION ALL
SELECT 'Applications', COUNT(*) FROM public.applications;
```

## Troubleshooting

### Error: "relation does not exist"
- Pastikan script `RESET_AND_CREATE_FRESH_DATABASE.sql` sudah dijalankan dengan sukses
- Cek apakah semua tabel sudah dibuat dengan query verifikasi

### Error: "policy already exists"
- Script sudah menggunakan `DROP POLICY IF EXISTS`, jadi seharusnya tidak ada error
- Jika masih error, hapus manual policy yang konflik

### User tidak bisa login
- Pastikan user sudah punya profile di tabel `profiles`
- Pastikan `is_approved = true` untuk admin dan jobseeker
- Cek RLS policies dengan query verifikasi

### Upload file error
- Pastikan bucket sudah dibuat
- Pastikan RLS policies untuk storage sudah dibuat:
  - Untuk foto profil: jalankan `create_avatars_bucket_rls_policy.sql`
  - Untuk CV dan dokumen lamaran: jalankan `create_applications_bucket_rls_policy.sql`
  - Untuk surat izin: jalankan `fix_storage_rls_policy.sql`
- Cek console browser untuk detail error
- Jika error "new row violates row-level security policy", pastikan:
  - Bucket sudah dibuat di Dashboard
  - RLS policy sudah dijalankan di SQL Editor
  - User sudah terautentikasi (sudah login)
  - Format filename sesuai dengan policy (mengandung user ID)

## Urutan Eksekusi Script

1. ✅ `RESET_AND_CREATE_FRESH_DATABASE.sql` - Reset dan buat schema baru
2. ✅ Buat storage buckets di Dashboard (avatars, company_licenses, documents, applications)
3. ✅ `create_avatars_bucket_rls_policy.sql` - Setup RLS policy untuk bucket avatars
4. ✅ `create_applications_bucket_rls_policy.sql` - Setup RLS policy untuk bucket applications
5. ✅ `fix_storage_rls_policy.sql` - Setup RLS policy untuk bucket lainnya
6. ✅ Buat user admin pertama
7. ✅ `INSERT_DUMMY_DATA.sql` - Insert data dummy (opsional, untuk testing)
8. ✅ Test login dan registrasi

## Catatan

- Semua recruiter baru akan otomatis `is_approved = false`
- Admin dan jobseeker harus di-set `is_approved = true` manual atau via trigger
- Recruiter harus upload surat izin saat registrasi
- Admin harus approve recruiter manual di database

