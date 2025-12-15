# Instruksi Setup: Pengecekan Email di auth.users

## Deskripsi
Fitur ini menambahkan pengecekan email di tabel `auth.users` sebelum melakukan signup. Ini memastikan bahwa email yang sudah terdaftar tidak bisa digunakan untuk registrasi ulang, baik sebagai jobseeker maupun recruiter.

## Langkah Setup

### 1. Jalankan SQL Function di Supabase

Buka Supabase Dashboard → SQL Editor, lalu jalankan script berikut:

**File**: `supabase/check_email_exists_function.sql`

Script ini akan membuat function `check_email_exists` yang dapat dipanggil dari client untuk mengecek apakah email sudah terdaftar di `auth.users`.

### 2. Verifikasi Function

Setelah menjalankan script, verifikasi bahwa function sudah dibuat dengan menjalankan query berikut:

```sql
SELECT proname, proargnames, prosrc 
FROM pg_proc 
WHERE proname = 'check_email_exists';
```

Atau test function dengan:

```sql
SELECT public.check_email_exists('test@example.com');
```

### 3. Update Code (Sudah Dilakukan)

File `components/RegisterDialog.tsx` sudah diupdate untuk:
- Memanggil function `check_email_exists` sebelum signup
- Menampilkan error jika email sudah terdaftar
- Mencegah signup jika email sudah ada di auth.users

## Cara Kerja

1. **Sebelum SignUp**: 
   - System memanggil `check_email_exists()` untuk mengecek email di `auth.users`
   - Jika email sudah ada, tampilkan error dan stop proses

2. **Backup Check**:
   - System juga mengecek di tabel `profiles` sebagai backup
   - Ini memastikan tidak ada email yang terlewat

3. **Error Handling**:
   - Jika function belum tersedia (untuk backward compatibility), system akan lanjut dengan pengecekan lain
   - Error ditampilkan dengan jelas kepada user

## Testing

1. Coba registrasi dengan email yang sudah terdaftar
   - Seharusnya muncul error: "Email ini sudah terdaftar. Silakan gunakan email lain atau masuk dengan email ini."
   - Tidak ada email verifikasi yang terkirim

2. Coba registrasi dengan email baru
   - Seharusnya proses signup berjalan normal
   - Email verifikasi terkirim

3. Coba registrasi dengan email yang sama untuk role berbeda (jobseeker → recruiter)
   - Seharusnya tetap error karena email sudah terdaftar di auth.users

## Catatan Penting

- Function menggunakan `SECURITY DEFINER` untuk mengakses `auth.users` (yang tidak bisa diakses langsung dari client)
- Function diberikan permission untuk `authenticated` dan `anon` role
- Function bersifat `STABLE` untuk optimasi query

## Troubleshooting

Jika function tidak ditemukan:
1. Pastikan script SQL sudah dijalankan di Supabase SQL Editor
2. Pastikan function dibuat di schema `public`
3. Cek permission dengan: `\df+ public.check_email_exists` di psql

Jika error "function does not exist":
- Pastikan function sudah dibuat dengan benar
- Cek nama function dan parameter (case-sensitive)
- Pastikan grant permission sudah diberikan


