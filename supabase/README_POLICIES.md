# Panduan Setup RLS Policies

## File SQL yang Tersedia

### 1. `complete_rls_policies.sql` ⭐ **Gunakan File Ini**
File lengkap dengan semua RLS policies yang benar untuk semua tabel.

**Cara menggunakan:**
1. Buka Supabase Dashboard → SQL Editor
2. Copy-paste seluruh isi file `complete_rls_policies.sql`
3. Klik "Run" atau tekan Ctrl+Enter
4. Pastikan tidak ada error

### 2. `fix_admin_policies.sql`
File untuk memperbaiki policy admin saja (jika hanya perlu fix policy admin).

### 3. `admin_policies.sql`
File policy admin versi lama (tidak digunakan lagi).

## Tabel yang Dilindungi RLS

### 1. **profiles**
- ✅ User bisa membaca, membuat, dan mengupdate profil sendiri
- ✅ Admin bisa membaca, mengupdate, dan menghapus semua profil
- ✅ Tidak ada konflik antara policy user dan admin

### 2. **job_listings**
- ✅ Semua orang bisa membaca job listings
- ✅ Recruiter bisa mengelola job mereka sendiri
- ✅ Admin bisa mengelola semua job

### 3. **applications**
- ✅ Job seeker bisa mengelola lamaran mereka sendiri
- ✅ Recruiter bisa melihat dan update status lamaran untuk job mereka
- ✅ Admin bisa melihat dan update semua lamaran

### 4. **living_costs**
- ✅ Semua orang bisa membaca living costs
- ✅ Hanya admin yang bisa mengelola (create, update, delete)

## Verifikasi Policy

Setelah menjalankan SQL, verifikasi dengan query berikut:

```sql
SELECT 
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## Troubleshooting

### Error: "policy already exists"
- File SQL sudah menghapus policy lama dengan `DROP POLICY IF EXISTS`
- Jika masih error, hapus manual policy yang konflik

### Error: "relation does not exist"
- Pastikan tabel sudah dibuat terlebih dahulu
- Jalankan `schema.sql` sebelum `complete_rls_policies.sql`

### User tidak bisa login
- Pastikan policy "Public read own profile" ada dan aktif
- Cek apakah user sudah memiliki profil di tabel `profiles`
- Test dengan query: `SELECT * FROM profiles WHERE id = auth.uid();`

### Admin tidak bisa melihat semua user
- Pastikan policy "Admin can read all profiles" ada
- Pastikan user memiliki role 'admin' di tabel profiles
- Test dengan query sebagai admin: `SELECT * FROM profiles;`

## Catatan Penting

1. **Policy menggunakan OR logic** - Tidak ada konflik antara policy
2. **RLS harus aktif** - File SQL sudah mengaktifkan RLS untuk semua tabel
3. **Test dengan user berbeda** - Pastikan test dengan admin, recruiter, dan jobseeker
4. **Backup database** - Selalu backup sebelum menjalankan SQL besar

## Urutan Eksekusi SQL

1. `schema.sql` - Membuat tabel dan struktur dasar
2. `complete_rls_policies.sql` - Membuat semua RLS policies
3. Test login dan akses dengan user berbeda

