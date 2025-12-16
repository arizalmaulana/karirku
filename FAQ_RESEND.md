# FAQ: Apakah Perlu Install Resend?

## ❌ TIDAK Perlu Install Resend di Project

**Resend TIDAK perlu di-install sebagai package di Next.js project Anda.**

## Penjelasan

### Bagaimana Resend Digunakan?

Resend digunakan sebagai **SMTP provider** di **Supabase Dashboard**, bukan di code Next.js Anda.

**Alur kerja:**
1. User signup di aplikasi Next.js Anda
2. Next.js memanggil Supabase Auth API
3. Supabase menggunakan konfigurasi SMTP (Resend) untuk mengirim email
4. Email dikirim melalui Resend SMTP server

Jadi, **Supabase yang berkomunikasi dengan Resend**, bukan aplikasi Next.js Anda.

### Yang Perlu Dilakukan

#### ✅ Sudah Dilakukan:
- [x] Daftar di Resend
- [x] Buat API Key Resend ("KarirKu")

#### ❌ Belum Perlu:
- [ ] Install package Resend di Next.js (TIDAK PERLU)
- [ ] Import Resend di code (TIDAK PERLU)
- [ ] Setup Resend di code (TIDAK PERLU)

#### ✅ Yang Perlu Dilakukan Sekarang:
- [ ] Setup SMTP di **Supabase Dashboard** menggunakan API key Resend
- [ ] Whitelist redirect URL di Supabase Dashboard

## Langkah Setup yang Benar

### 1. Setup SMTP di Supabase Dashboard (Bukan di Code)

1. Buka **Supabase Dashboard**: https://app.supabase.com
2. Pilih project Anda
3. Buka **Project Settings** → **Auth** → **SMTP Settings**
4. Enable **Custom SMTP** (toggle ON)
5. Isi konfigurasi:
   ```
   SMTP Host: smtp.resend.com
   SMTP Port: 587
   SMTP User: resend
   SMTP Password: [API Key dari Resend]
   Sender Email: onboarding@resend.dev
   Sender Name: Karirku
   ```
6. Klik **Save**

### 2. Whitelist Redirect URL

1. Buka **Authentication** → **URL Configuration**
2. Tambahkan redirect URL:
   ```
   https://karirku-gray.vercel.app/auth/callback
   https://karirku-gray.vercel.app/auth/callback/*
   ```
3. Set Site URL:
   ```
   https://karirku-gray.vercel.app
   ```
4. Klik **Save**

## Kapan Perlu Install Resend Package?

**Hanya jika** Anda ingin mengirim email **langsung dari Next.js code** (bukan melalui Supabase Auth).

Contoh kasus:
- Mengirim email notifikasi custom
- Mengirim email marketing
- Mengirim email dari API route custom

**Tapi untuk email confirmation signup, TIDAK PERLU** karena sudah ditangani oleh Supabase.

## Kesimpulan

### ❌ TIDAK Perlu:
```bash
npm install resend  # TIDAK PERLU
```

### ✅ Yang Perlu:
1. Setup SMTP di Supabase Dashboard
2. Whitelist redirect URL di Supabase Dashboard

## Checklist Setup

- [x] Daftar Resend dan dapatkan API key
- [ ] Setup SMTP di Supabase Dashboard (menggunakan API key Resend)
- [ ] Whitelist redirect URL di Supabase Dashboard
- [ ] Test signup

**Tidak perlu install package apapun di Next.js project!**

