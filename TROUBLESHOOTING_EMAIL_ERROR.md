# Troubleshooting: Error Sending Confirmation Email

## Error yang Terjadi

```
AuthApiError: Error sending confirmation email
Status: 500 Internal Server Error
```

## Penyebab Utama

Error ini terjadi karena **SMTP (email provider) belum dikonfigurasi** atau **konfigurasi SMTP salah** di Supabase Dashboard.

## Solusi

### 1. Cek Status Email Confirmation

1. Buka **Supabase Dashboard** → **Authentication** → **Providers**
2. Pastikan **Email** provider sudah **enabled**
3. Jika disabled, enable dan save

### 2. Konfigurasi SMTP (PENTING!)

Supabase memerlukan SMTP provider untuk mengirim email. Ada 2 opsi:

#### Opsi A: Setup SMTP Provider Eksternal (Recommended untuk Production)

**Langkah 1: Pilih Provider**
- **Resend** (⭐ Recommended - gratis 3,000 emails/month, sangat cepat)
- **SendGrid** (gratis 100 emails/day)
- **Mailgun** (gratis 5,000 emails/month)
- **AWS SES** (pay-as-you-go)

**Langkah 2: Dapatkan API Key**
- Daftar di provider pilihan Anda
- Buat API key
- Copy API key

**Langkah 3: Konfigurasi di Supabase**
1. Buka **Supabase Dashboard** → **Project Settings** → **Auth** → **SMTP Settings**
2. Enable **Custom SMTP**
3. Isi konfigurasi sesuai provider:

**Untuk Resend:**
```
SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP User: resend
SMTP Password: [API Key dari Resend]
Sender Email: onboarding@resend.dev (untuk testing)
             atau noreply@karirku-gray.vercel.app (jika domain sudah diverifikasi)
Sender Name: Karirku
```

**Catatan untuk Vercel**: 
- Domain production: `karirku-gray.vercel.app`
- Untuk testing, gunakan `onboarding@resend.dev`
- Untuk production, verifikasi domain di Resend dan gunakan custom email

**Untuk SendGrid:**
```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Password: [API Key dari SendGrid]
Sender Email: noreply@yourdomain.com
Sender Name: Karirku
```

**Untuk Mailgun:**
```
SMTP Host: smtp.mailgun.org
SMTP Port: 587
SMTP User: [Mailgun SMTP Username]
SMTP Password: [Mailgun SMTP Password]
Sender Email: noreply@yourdomain.com
Sender Name: Karirku
```

4. Klik **Save**
5. Test dengan mengirim email test (jika ada opsi)

#### Opsi B: Nonaktifkan Email Confirmation (Hanya untuk Development)

⚠️ **PERINGATAN**: Hanya untuk development/testing. Jangan gunakan di production!

1. Buka **Supabase Dashboard** → **Authentication** → **Providers** → **Email**
2. Scroll ke bawah ke bagian **Email Auth**
3. **Disable** opsi **"Confirm email"**
4. Save

**Catatan**: 
- Dengan ini, user tidak perlu konfirmasi email
- User bisa langsung login setelah signup
- Tidak aman untuk production

### 3. Cek Email Template

1. Buka **Supabase Dashboard** → **Authentication** → **Email Templates** → **Confirm signup**
2. Pastikan template valid (tidak ada syntax error)
3. Pastikan menggunakan variable yang benar: `{{ .ConfirmationURL }}`

### 4. Cek Rate Limiting

1. Buka **Supabase Dashboard** → **Project Settings** → **Auth** → **Rate Limits**
2. Pastikan rate limit untuk email tidak terlalu ketat
3. Untuk development, bisa nonaktifkan sementara

### 5. Cek Logs di Supabase

1. Buka **Supabase Dashboard** → **Logs** → **Auth Logs**
2. Cari error terkait email
3. Lihat detail error untuk troubleshooting lebih lanjut

## Quick Fix untuk Development

Jika Anda hanya ingin testing tanpa setup SMTP:

1. **Nonaktifkan Email Confirmation** (Opsi B di atas)
2. User bisa langsung login setelah signup
3. Untuk production, tetap perlu setup SMTP

## Setup Resend (Recommended - Paling Mudah)

### Langkah 1: Daftar Resend
1. Buka https://resend.com
2. Daftar dengan email Anda
3. Verifikasi email

### Langkah 2: Buat API Key
1. Buka **API Keys** di dashboard Resend
2. Klik **Create API Key**
3. Beri nama (contoh: "Supabase SMTP")
4. Copy API key (hanya muncul sekali!)

### Langkah 3: Verifikasi Domain (Opsional untuk Production)
- Untuk development, bisa gunakan domain Resend default
- Untuk production, verifikasi domain Anda

### Langkah 4: Setup di Supabase
1. Buka **Supabase Dashboard** → **Project Settings** → **Auth** → **SMTP Settings**
2. Enable **Custom SMTP**
3. Isi:
   ```
   SMTP Host: smtp.resend.com
   SMTP Port: 587
   SMTP User: resend
   SMTP Password: [API Key dari Resend]
   Sender Email: onboarding@resend.dev (untuk testing)
                 atau noreply@karirku-gray.vercel.app (jika domain sudah diverifikasi)
   Sender Name: Karirku
   ```
4. Save

### Langkah 5: Whitelist Redirect URL (PENTING!)
1. Buka **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Tambahkan di **Redirect URLs**:
   ```
   https://karirku-gray.vercel.app/auth/callback
   https://karirku-gray.vercel.app/auth/callback/*
   ```
3. Set **Site URL**:
   ```
   https://karirku-gray.vercel.app
   ```
4. Save

### Langkah 5: Test
1. Coba signup dengan email baru
2. Cek email inbox (dan spam folder)
3. Email harus masuk dalam beberapa detik

## Troubleshooting Lanjutan

### Email Masih Tidak Terkirim Setelah Setup SMTP?

1. **Cek API Key**: Pastikan API key benar dan masih aktif
2. **Cek Sender Email**: Pastikan email sender sudah diverifikasi di provider
3. **Cek Spam Folder**: Email mungkin masuk ke spam
4. **Cek Provider Dashboard**: Lihat error di dashboard provider (Resend/SendGrid/etc)
5. **Cek Supabase Logs**: Lihat detail error di Supabase Dashboard → Logs

### Error "Invalid credentials" atau "Authentication failed"?

- Pastikan SMTP User dan Password benar
- Untuk Resend: User harus `resend`, Password adalah API key
- Untuk SendGrid: User harus `apikey`, Password adalah API key
- Pastikan tidak ada spasi di awal/akhir API key

### Error "Sender email not verified"?

- Verifikasi sender email di provider dashboard
- Atau gunakan email default dari provider untuk testing

## Rekomendasi

✅ **Untuk Development**: 
- Setup Resend (gratis, mudah, cepat)
- Atau nonaktifkan email confirmation sementara

✅ **Untuk Production**:
- **WAJIB** setup SMTP provider (Resend/SendGrid/Mailgun)
- **WAJIB** verifikasi domain
- **WAJIB** monitor email delivery
- Jangan gunakan Supabase default email (sangat lambat)

## Referensi

- [Supabase SMTP Documentation](https://supabase.com/docs/guides/auth/auth-smtp)
- [Resend Documentation](https://resend.com/docs)
- [SendGrid Documentation](https://docs.sendgrid.com/)
- [Mailgun Documentation](https://documentation.mailgun.com/)

