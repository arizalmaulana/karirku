# Troubleshooting Login Issues

## Masalah: Error saat login dan tidak redirect ke dashboard

### Gejala:
- Notifikasi "Berhasil masuk" muncul
- Tapi tidak redirect ke dashboard
- Error di console: `Error fetching profile: {}`

### Penyebab:
Policy RLS di Supabase yang menggunakan `FOR ALL` mengoverride policy lain, sehingga user tidak bisa membaca profil sendiri.

### Solusi:

#### 1. Jalankan SQL Fix di Supabase

Buka **Supabase Dashboard** → **SQL Editor** dan jalankan file:
- `karirku/supabase/fix_admin_policies.sql`

Atau copy-paste SQL berikut:

```sql
-- Hapus policy lama yang konflik
DROP POLICY IF EXISTS "Admin can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can read all applications" ON public.applications;

-- Policy untuk Admin membaca semua profil (tidak mengoverride policy "Public read own profile")
CREATE POLICY "Admin can read all profiles"
ON public.profiles FOR SELECT
USING (
    auth.uid() = id
    OR
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policy untuk Admin mengupdate semua profil
CREATE POLICY "Admin can update all profiles"
ON public.profiles FOR UPDATE
USING (
    auth.uid() = id
    OR
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policy untuk Admin menghapus profil
CREATE POLICY "Admin can delete profiles"
ON public.profiles FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policy untuk Admin membaca semua lamaran
CREATE POLICY "Admin can read all applications"
ON public.applications FOR SELECT
USING (
    auth.uid() = job_seeker_id
    OR
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    EXISTS (
        SELECT 1 FROM public.job_listings jl
        WHERE jl.id = job_id AND jl.recruiter_id = auth.uid()
    )
);
```

#### 2. Verifikasi Policy yang Aktif

Jalankan query berikut di SQL Editor untuk melihat policy yang aktif:

```sql
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
```

Pastikan policy berikut ada:
- `Public read own profile` (FOR SELECT)
- `Users insert own profile` (FOR INSERT)
- `Users update own profile` (FOR UPDATE)
- `Admin can read all profiles` (FOR SELECT)
- `Admin can update all profiles` (FOR UPDATE)
- `Admin can delete profiles` (FOR DELETE)

#### 3. Test Login

Setelah menjalankan SQL fix:
1. Clear browser cache atau gunakan incognito mode
2. Coba login dengan akun yang berbeda (admin, recruiter, jobseeker)
3. Pastikan redirect ke dashboard sesuai role

### Catatan Penting:

- Policy menggunakan **OR logic**, jadi:
  - User bisa membaca profil sendiri (policy "Public read own profile")
  - Admin bisa membaca semua profil (policy "Admin can read all profiles")
  - Tidak ada konflik antara policy

- Jika masih error setelah fix:
  1. Cek console browser untuk error detail
  2. Cek Supabase logs untuk RLS error
  3. Pastikan user sudah memiliki profil di tabel `profiles`

### Debugging:

Jika masih bermasalah, cek:

1. **Apakah profil user ada di database?**
   ```sql
   SELECT * FROM public.profiles WHERE id = 'USER_ID_HERE';
   ```

2. **Apakah RLS policy aktif?**
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';
   ```

3. **Test query dengan user yang login:**
   ```sql
   -- Jalankan sebagai user yang login
   SELECT * FROM public.profiles WHERE id = auth.uid();
   ```

