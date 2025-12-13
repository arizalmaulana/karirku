# Instruksi Setup Database Baru

## Langkah-langkah Setup

### 1. Reset Database (Hapus Semua Data)
Jalankan script `RESET_AND_CREATE_FRESH_DATABASE.sql` di Supabase SQL Editor.

**WARNING:** Script ini akan menghapus SEMUA data yang ada!

### 2. Setup Storage Buckets
Buka Supabase Dashboard > Storage dan buat bucket berikut:

#### Bucket: `company_licenses`
- Name: `company_licenses`
- Public: OFF (private)
- File size limit: 10485760 (10MB)
- Allowed MIME types: `application/pdf,image/jpeg,image/png`

#### Bucket: `documents` (jika belum ada)
- Name: `documents`
- Public: OFF (private)
- File size limit: sesuai kebutuhan

#### Bucket: `applications` (jika belum ada)
- Name: `applications`
- Public: OFF (private)
- File size limit: sesuai kebutuhan

### 3. Setup Storage RLS Policies
Jalankan script `fix_storage_rls_policy.sql` di Supabase SQL Editor untuk membuat RLS policies untuk storage buckets.

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
- Pastikan RLS policies untuk storage sudah dibuat (jalankan `fix_storage_rls_policy.sql`)
- Cek console browser untuk detail error

## Urutan Eksekusi Script

1. ✅ `RESET_AND_CREATE_FRESH_DATABASE.sql` - Reset dan buat schema baru
2. ✅ Buat storage buckets di Dashboard
3. ✅ `fix_storage_rls_policy.sql` - Setup storage RLS policies
4. ✅ Buat user admin pertama
5. ✅ `INSERT_DUMMY_DATA.sql` - Insert data dummy (opsional, untuk testing)
6. ✅ Test login dan registrasi

## Catatan

- Semua recruiter baru akan otomatis `is_approved = false`
- Admin dan jobseeker harus di-set `is_approved = true` manual atau via trigger
- Recruiter harus upload surat izin saat registrasi
- Admin harus approve recruiter manual di database

