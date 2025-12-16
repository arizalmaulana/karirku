# Fix Error 403 pada Email Confirmation Callback

## Masalah
Error 403 terjadi ketika user klik link konfirmasi email dan di-redirect ke callback route.

## Penyebab Error 403

1. **Redirect URL belum di-whitelist di Supabase Dashboard** (Paling umum)
2. **Middleware memblokir akses ke callback route**
3. **Session tidak ter-set dengan benar setelah exchange code**

## Solusi yang Sudah Diterapkan

### 1. Perbaikan Callback Route (`app/auth/callback/route.ts`)

✅ **Error Handling yang Lebih Baik**:
- Menangani error dari query parameters (`error`, `error_description`)
- Menangani error 403 secara khusus
- Menangani error saat exchange code
- Menangani error saat get user setelah exchange

✅ **Verifikasi Session**:
- Setelah exchange code, verify session dengan `getUser()`
- Pastikan user benar-benar ter-authenticate sebelum redirect

✅ **Try-Catch untuk Error Handling**:
- Wrap semua operasi dalam try-catch
- Redirect ke home dengan error message yang jelas

### 2. Perbaikan Middleware (`middleware.ts`)

✅ **Skip Middleware untuk Callback Route**:
- Tambahkan `/auth/callback` ke skip list
- Callback route tidak perlu dicek oleh middleware

## Langkah Setup di Supabase Dashboard

### 1. Whitelist Redirect URL (PENTING!)

1. Buka **Supabase Dashboard**: https://app.supabase.com
2. Pilih project Anda
3. Buka **Authentication** → **URL Configuration**
4. Di bagian **Redirect URLs**, tambahkan:

**Untuk Production (Vercel):**
```
https://karirku-gray.vercel.app/auth/callback
https://karirku-gray.vercel.app/auth/callback/*
```

**Untuk Development (Local):**
```
http://localhost:3000/auth/callback
http://localhost:3000/auth/callback/*
```

5. Di bagian **Site URL**, isi:
   ```
   https://karirku-gray.vercel.app
   ```
   (atau `http://localhost:3000` untuk development)

6. Klik **Save**

### 2. Pastikan Email Confirmation Enabled

1. Buka **Authentication** → **Providers** → **Email**
2. Pastikan **"Confirm email"** adalah **ENABLED** (toggle ON)
3. Save

## Testing

### 1. Test Signup
1. Signup dengan email baru
2. Cek email inbox (dan spam folder)
3. Email konfirmasi harus masuk

### 2. Test Email Confirmation
1. Klik link konfirmasi di email
2. Pastikan redirect ke `https://karirku-gray.vercel.app/auth/callback`
3. Pastikan tidak ada error 403
4. Pastikan user otomatis login
5. Pastikan redirect ke dashboard sesuai role

### 3. Test Error Handling
1. Jika ada error, pastikan redirect ke home dengan error message
2. Error message harus jelas dan informatif

## Troubleshooting

### Masih Error 403?

1. **Cek Redirect URL di Supabase**:
   - Pastikan `https://karirku-gray.vercel.app/auth/callback` sudah di-whitelist
   - Pastikan format URL benar (dengan `https://`)
   - Pastikan sudah klik **Save**

2. **Cek Site URL**:
   - Pastikan Site URL sudah di-set: `https://karirku-gray.vercel.app`
   - Pastikan format benar

3. **Cek Supabase Logs**:
   - Buka **Supabase Dashboard** → **Logs** → **Auth Logs**
   - Cari error terkait redirect atau 403

4. **Cek Callback Route**:
   - Pastikan file `app/auth/callback/route.ts` sudah ada
   - Pastikan sudah di-deploy ke Vercel
   - Test manual: buka `https://karirku-gray.vercel.app/auth/callback` di browser

### Error "URL redirect belum di-whitelist"?

- Ini berarti redirect URL belum di-whitelist di Supabase Dashboard
- Ikuti langkah di atas untuk whitelist URL
- Pastikan format URL benar

### Error Lainnya?

1. **Cek Browser Console**:
   - Buka browser console (F12)
   - Lihat error yang muncul
   - Cek network tab untuk request yang gagal

2. **Cek Vercel Logs**:
   - Buka **Vercel Dashboard** → **Deployments** → **Functions** → **Logs**
   - Cari error terkait callback route

3. **Cek Supabase Logs**:
   - Buka **Supabase Dashboard** → **Logs** → **Auth Logs**
   - Cari error terkait auth

## Checklist

- [ ] Redirect URL di-whitelist di Supabase Dashboard
- [ ] Site URL di-set di Supabase Dashboard
- [ ] Email confirmation enabled di Supabase Dashboard
- [ ] Callback route sudah di-deploy ke Vercel
- [ ] Middleware skip untuk `/auth/callback`
- [ ] Test signup berhasil
- [ ] Test email confirmation berhasil
- [ ] Tidak ada error 403

## Catatan Penting

1. **Redirect URL harus exact match** atau menggunakan wildcard `/*` di akhir
2. **Protocol harus lengkap** (http:// atau https://)
3. **Port harus disertakan** untuk development (localhost:3000)
4. **Perubahan bisa memakan waktu beberapa detik** untuk diterapkan
5. **Callback route harus accessible** tanpa authentication (skip middleware)

## Format URL yang Benar

### ✅ Format yang Benar:
```
https://karirku-gray.vercel.app/auth/callback
https://karirku-gray.vercel.app/auth/callback/*
http://localhost:3000/auth/callback
http://localhost:3000/auth/callback/*
```

### ❌ Format yang Salah:
```
/auth/callback                    (tanpa domain)
localhost:3000/auth/callback      (tanpa protocol)
http://localhost:3000/auth/       (tanpa /callback)
karirku-gray.vercel.app/auth/callback (tanpa https://)
```

