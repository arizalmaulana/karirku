# Langkah Setup SMTP di Supabase dengan API Key Resend

## ✅ API Key Resend Sudah Dibuat
- **Nama**: KarirKu
- **Permission**: Sending access
- **Token**: `re_SRqPpWd2...` (gunakan token lengkapnya)

## Langkah Setup SMTP di Supabase Dashboard

### 1. Buka SMTP Settings di Supabase

1. Buka **Supabase Dashboard**: https://app.supabase.com
2. Pilih project Anda
3. Buka **Project Settings** (icon gear di sidebar kiri)
4. Klik **Auth** di menu kiri
5. Scroll ke bawah, klik **SMTP Settings**

### 2. Enable Custom SMTP

1. Toggle **"Enable Custom SMTP"** menjadi **ON** (biru/hijau)
2. Form SMTP akan muncul

### 3. Isi Konfigurasi SMTP

Copy dan paste konfigurasi berikut:

```
SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP User: resend
SMTP Password: [Paste API Key dari Resend di sini - token yang dimulai dengan re_]
Sender Email: onboarding@resend.dev
Sender Name: Karirku
```

**Cara mendapatkan API Key:**
1. Buka Resend Dashboard: https://resend.com/api-keys
2. Klik pada API Key "KarirKu" yang baru dibuat
3. Copy **TOKEN** lengkapnya (yang dimulai dengan `re_`)
4. Paste di field **SMTP Password** di Supabase

**PENTING:**
- Jangan copy nama API Key ("KarirKu")
- Copy **TOKEN** lengkapnya (contoh: `re_SRqPpWd2...` - pastikan lengkap sampai akhir)
- Tidak ada spasi di awal/akhir token

### 4. Save Konfigurasi

1. Klik **Save** di bagian bawah form
2. Tunggu beberapa detik
3. Pastikan tidak ada error message

### 5. Whitelist Redirect URL (PENTING!)

Setelah SMTP setup, pastikan redirect URL juga di-whitelist:

1. Buka **Authentication** → **URL Configuration** (di sidebar kiri)
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

### 6. Test Signup

1. Buka aplikasi Anda: https://karirku-gray.vercel.app
2. Coba signup dengan email baru
3. Cek email inbox (dan spam folder)
4. Email konfirmasi harus masuk dalam beberapa detik

## Troubleshooting

### Masih Error "Error sending confirmation email"?

1. **Cek API Key**:
   - Pastikan token yang di-copy lengkap (tidak terpotong)
   - Pastikan tidak ada spasi di awal/akhir
   - Coba copy lagi dari Resend Dashboard

2. **Cek SMTP Settings**:
   - Pastikan Custom SMTP **ENABLED** (toggle ON)
   - Pastikan semua field terisi
   - Pastikan SMTP User adalah `resend` (huruf kecil)
   - Pastikan SMTP Port adalah `587`

3. **Cek Resend Dashboard**:
   - Buka https://resend.com/emails
   - Lihat apakah ada email yang terkirim atau error
   - Cek "TOTAL USES" - harus bertambah setelah signup

4. **Cek Supabase Logs**:
   - Buka **Supabase Dashboard** → **Logs** → **Auth Logs**
   - Cari error terkait SMTP atau email

### Error "Invalid credentials" atau "Authentication failed"?

- Pastikan SMTP User adalah `resend` (huruf kecil, bukan "Resend" atau "RESEND")
- Pastikan SMTP Password adalah token lengkap dari Resend (bukan nama API Key)
- Pastikan tidak ada spasi di token
- Coba buat API key baru di Resend jika masih error

### Email Terkirim Tapi Link Tidak Bekerja?

1. **Cek Redirect URL**:
   - Pastikan `https://karirku-gray.vercel.app/auth/callback` sudah di-whitelist
   - Pastikan format URL benar (dengan `https://`)

2. **Cek Callback Route**:
   - Pastikan file `app/auth/callback/route.ts` sudah ada
   - Pastikan sudah di-deploy ke Vercel

## Checklist Setup

- [ ] API Key Resend sudah dibuat (✅ Sudah - "KarirKu")
- [ ] SMTP Settings dibuka di Supabase Dashboard
- [ ] Custom SMTP di-enable (toggle ON)
- [ ] SMTP Host: `smtp.resend.com`
- [ ] SMTP Port: `587`
- [ ] SMTP User: `resend`
- [ ] SMTP Password: [Token lengkap dari Resend]
- [ ] Sender Email: `onboarding@resend.dev`
- [ ] Sender Name: `Karirku`
- [ ] Klik Save
- [ ] Redirect URL di-whitelist: `https://karirku-gray.vercel.app/auth/callback`
- [ ] Site URL di-set: `https://karirku-gray.vercel.app`
- [ ] Test signup berhasil
- [ ] Email konfirmasi terkirim

## Catatan Penting

1. **Token harus lengkap**: Pastikan copy token lengkap dari Resend (tidak terpotong)
2. **Tidak ada spasi**: Pastikan tidak ada spasi di awal/akhir token
3. **SMTP User harus huruf kecil**: `resend` (bukan "Resend" atau "RESEND")
4. **Port 587**: Gunakan port 587 untuk TLS (bukan 465 untuk SSL)
5. **Sender Email**: Untuk testing, gunakan `onboarding@resend.dev`. Untuk production, verifikasi domain dulu.

## Langkah Selanjutnya

Setelah SMTP setup selesai:
1. Test signup dengan email baru
2. Cek email inbox
3. Klik link konfirmasi
4. Pastikan user otomatis login dan redirect ke dashboard

Jika masih ada masalah, cek bagian Troubleshooting di atas atau lihat `TROUBLESHOOTING_EMAIL_ERROR.md`.

