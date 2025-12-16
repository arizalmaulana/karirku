# Setup Konfigurasi untuk Vercel + Resend

## Informasi Domain
- **Domain Production**: `karirku-gray.vercel.app`
- **Email Provider**: Resend
- **Hosting**: Vercel

## Langkah Setup Lengkap

### 1. Setup Resend (Jika Belum)

#### A. Daftar Resend
1. Buka https://resend.com
2. Daftar dengan email Anda
3. Verifikasi email

#### B. Buat API Key
1. Buka **API Keys** di dashboard Resend
2. Klik **Create API Key**
3. Beri nama: "Supabase SMTP - Karirku"
4. **Copy API key** (hanya muncul sekali!)

#### C. Verifikasi Domain (Opsional untuk Production)
- Untuk testing, bisa gunakan domain Resend default: `onboarding@resend.dev`
- Untuk production, verifikasi domain `karirku-gray.vercel.app` di Resend (jika ingin menggunakan custom domain)

### 2. Setup SMTP di Supabase Dashboard

1. Buka **Supabase Dashboard** → **Project Settings** → **Auth** → **SMTP Settings**
2. Enable **Custom SMTP**
3. Isi konfigurasi berikut:

```
SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP User: resend
SMTP Password: [API Key dari Resend - paste di sini]
Sender Email: onboarding@resend.dev (untuk testing)
             atau noreply@karirku-gray.vercel.app (jika domain sudah diverifikasi)
Sender Name: Karirku
```

4. Klik **Save**

### 3. Whitelist Redirect URL di Supabase

**PENTING**: URL ini HARUS di-whitelist agar email confirmation redirect bekerja!

1. Buka **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Di bagian **Redirect URLs**, tambahkan:

```
https://karirku-gray.vercel.app/auth/callback
https://karirku-gray.vercel.app/auth/callback/*
```

3. Di bagian **Site URL**, isi:

```
https://karirku-gray.vercel.app
```

4. Klik **Save**

### 4. Konfigurasi untuk Development (Local)

Jika Anda juga development di localhost, tambahkan juga:

**Redirect URLs:**
```
http://localhost:3000/auth/callback
http://localhost:3000/auth/callback/*
```

**Site URL:**
```
http://localhost:3000
```

### 5. Verifikasi Konfigurasi

#### A. Test SMTP
1. Setelah setup SMTP, coba signup dengan email baru
2. Cek email inbox (dan spam folder)
3. Email harus masuk dalam beberapa detik

#### B. Test Redirect URL
1. Klik link konfirmasi di email
2. Pastikan redirect ke `https://karirku-gray.vercel.app/auth/callback`
3. Pastikan user otomatis login dan redirect ke dashboard

### 6. Environment Variables di Vercel

Pastikan environment variables berikut sudah di-set di Vercel:

1. Buka **Vercel Dashboard** → Project → **Settings** → **Environment Variables**
2. Pastikan ada:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - (Jika ada) `SUPABASE_SERVICE_ROLE_KEY`

3. Pastikan environment variables ini tersedia untuk:
   - ✅ Production
   - ✅ Preview (opsional)
   - ✅ Development (opsional)

### 7. Deploy ke Vercel

Setelah semua konfigurasi:

1. Commit dan push perubahan ke repository
2. Vercel akan otomatis deploy
3. Atau manual deploy dari Vercel Dashboard

## Troubleshooting

### Email Tidak Terkirim?

1. **Cek SMTP Settings di Supabase**:
   - Pastikan Custom SMTP enabled
   - Pastikan API key Resend benar
   - Pastikan Sender Email valid

2. **Cek Resend Dashboard**:
   - Buka https://resend.com/emails
   - Lihat apakah email terkirim atau ada error
   - Cek delivery status

3. **Cek Spam Folder**:
   - Email mungkin masuk ke spam
   - Pastikan sender email tidak di-blacklist

### Error 500 "Error sending confirmation email"?

1. **Cek SMTP Configuration**:
   - Pastikan SMTP sudah dikonfigurasi dengan benar
   - Pastikan API key Resend masih aktif
   - Cek di Supabase Dashboard → Project Settings → Auth → SMTP Settings

2. **Cek Resend API Key**:
   - Pastikan API key masih valid
   - Buat API key baru jika perlu

### Error 500 saat Redirect?

1. **Cek Redirect URL di Supabase**:
   - Pastikan `https://karirku-gray.vercel.app/auth/callback` sudah di-whitelist
   - Pastikan format URL benar (dengan `https://`)

2. **Cek Callback Route**:
   - Pastikan file `app/auth/callback/route.ts` sudah di-deploy
   - Cek apakah route accessible: `https://karirku-gray.vercel.app/auth/callback`

### Email Terkirim Tapi Link Tidak Bekerja?

1. **Cek Redirect URL**:
   - Pastikan URL sudah di-whitelist di Supabase
   - Pastikan format URL benar

2. **Cek Callback Route**:
   - Pastikan route handler sudah dibuat dan di-deploy
   - Test manual: buka `https://karirku-gray.vercel.app/auth/callback` di browser

## Checklist Setup

- [ ] Resend account dibuat dan API key didapatkan
- [ ] SMTP dikonfigurasi di Supabase Dashboard
- [ ] Redirect URL di-whitelist di Supabase: `https://karirku-gray.vercel.app/auth/callback`
- [ ] Site URL di-set di Supabase: `https://karirku-gray.vercel.app`
- [ ] Environment variables sudah di-set di Vercel
- [ ] Code sudah di-deploy ke Vercel
- [ ] Test signup berhasil
- [ ] Email konfirmasi terkirim
- [ ] Link konfirmasi bekerja dan redirect ke dashboard

## Catatan Penting

1. **Domain Vercel**: `karirku-gray.vercel.app` adalah domain default Vercel. Jika Anda punya custom domain, ganti dengan custom domain Anda.

2. **Resend Free Tier**: 
   - 3,000 emails/month gratis
   - Cukup untuk development dan testing
   - Untuk production tinggi, pertimbangkan upgrade

3. **HTTPS**: Pastikan semua URL menggunakan `https://` (Vercel otomatis menyediakan SSL)

4. **Environment Variables**: Pastikan semua environment variables sudah di-set di Vercel sebelum deploy

## Support

Jika masih ada masalah:
1. Cek Supabase Logs: **Dashboard** → **Logs** → **Auth Logs**
2. Cek Resend Dashboard: https://resend.com/emails
3. Cek Vercel Logs: **Vercel Dashboard** → **Deployments** → **Functions** → **Logs**

