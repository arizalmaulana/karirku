# Solusi Cepat untuk Development - Nonaktifkan Email Confirmation

## Masalah
Error "Error sending confirmation email" terjadi karena SMTP belum dikonfigurasi di Supabase Dashboard.

## Solusi Cepat untuk Development

### Opsi 1: Nonaktifkan Email Confirmation (Paling Cepat - 2 Menit)

**⚠️ PERINGATAN**: Hanya untuk development/testing. Jangan gunakan di production!

#### Langkah-langkah:

1. **Buka Supabase Dashboard**
   - Buka https://app.supabase.com
   - Pilih project Anda

2. **Nonaktifkan Email Confirmation**
   - Buka **Authentication** → **Providers** → **Email**
   - Scroll ke bawah ke bagian **Email Auth**
   - **Disable** opsi **"Confirm email"** (toggle OFF)
   - Klik **Save**

3. **Test Signup**
   - Coba signup dengan email baru
   - User akan langsung bisa login tanpa perlu konfirmasi email
   - Tidak ada email yang dikirim

#### Keuntungan:
- ✅ Signup langsung bekerja
- ✅ User bisa langsung login
- ✅ Tidak perlu setup SMTP untuk development
- ✅ Proses lebih cepat

#### Kekurangan:
- ❌ Tidak aman untuk production
- ❌ User tidak perlu verifikasi email
- ❌ Bisa ada spam signup

---

### Opsi 2: Setup SMTP Resend (Untuk Production - 10 Menit)

Jika Anda ingin email confirmation bekerja dengan benar:

#### Langkah 1: Daftar Resend
1. Buka https://resend.com
2. Klik **Sign Up**
3. Daftar dengan email Anda
4. Verifikasi email Anda

#### Langkah 2: Buat API Key
1. Setelah login, buka **API Keys** di sidebar
2. Klik **Create API Key**
3. Beri nama: "Supabase SMTP"
4. **Copy API key** (hanya muncul sekali! Simpan dengan aman)

#### Langkah 3: Setup SMTP di Supabase
1. Buka **Supabase Dashboard** → **Project Settings** → **Auth** → **SMTP Settings**
2. Enable **Custom SMTP** (toggle ON)
3. Isi form berikut:

```
SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP User: resend
SMTP Password: [Paste API Key dari Resend di sini]
Sender Email: onboarding@resend.dev
Sender Name: Karirku
```

4. Klik **Save**

#### Langkah 4: Whitelist Redirect URL
1. Buka **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Di **Redirect URLs**, tambahkan:
   ```
   https://karirku-gray.vercel.app/auth/callback
   https://karirku-gray.vercel.app/auth/callback/*
   http://localhost:3000/auth/callback
   http://localhost:3000/auth/callback/*
   ```
3. Di **Site URL**, isi:
   ```
   https://karirku-gray.vercel.app
   ```
4. Klik **Save**

#### Langkah 5: Test
1. Coba signup dengan email baru
2. Cek email inbox (dan spam folder)
3. Email harus masuk dalam beberapa detik
4. Klik link konfirmasi
5. User harus otomatis login dan redirect ke dashboard

---

## Troubleshooting

### Masih Error "Error sending confirmation email"?

**Jika menggunakan Opsi 1 (Nonaktifkan Email Confirmation):**
1. Pastikan "Confirm email" sudah **DISABLE** (toggle OFF)
2. Refresh halaman Supabase Dashboard
3. Coba signup lagi
4. Jika masih error, cek apakah ada cache - clear browser cache

**Jika menggunakan Opsi 2 (Setup SMTP):**
1. **Cek API Key Resend**:
   - Pastikan API key benar (copy-paste, tidak ada spasi)
   - Pastikan API key masih aktif di Resend dashboard

2. **Cek SMTP Settings**:
   - Pastikan Custom SMTP **ENABLED** (toggle ON)
   - Pastikan semua field terisi dengan benar
   - Pastikan sudah klik **Save**

3. **Cek Resend Dashboard**:
   - Buka https://resend.com/emails
   - Lihat apakah ada email yang terkirim atau error
   - Cek delivery status

4. **Cek Supabase Logs**:
   - Buka **Supabase Dashboard** → **Logs** → **Auth Logs**
   - Cari error terkait SMTP atau email

### Error "Invalid credentials" atau "Authentication failed"?

- Pastikan SMTP User adalah `resend` (huruf kecil)
- Pastikan SMTP Password adalah API key dari Resend (bukan password account)
- Pastikan tidak ada spasi di awal/akhir API key
- Coba buat API key baru di Resend

### Email Terkirim Tapi Link Tidak Bekerja?

1. **Cek Redirect URL**:
   - Pastikan `https://karirku-gray.vercel.app/auth/callback` sudah di-whitelist
   - Pastikan format URL benar (dengan `https://`)

2. **Cek Callback Route**:
   - Pastikan file `app/auth/callback/route.ts` sudah ada
   - Pastikan sudah di-deploy ke Vercel
   - Test manual: buka `https://karirku-gray.vercel.app/auth/callback` di browser

---

## Rekomendasi

### Untuk Development:
✅ **Gunakan Opsi 1** (Nonaktifkan Email Confirmation)
- Lebih cepat
- Tidak perlu setup SMTP
- User bisa langsung login

### Untuk Production:
✅ **Gunakan Opsi 2** (Setup SMTP Resend)
- Lebih aman
- User perlu verifikasi email
- Professional

---

## Checklist Cepat

### Opsi 1 (Development):
- [ ] Buka Supabase Dashboard → Authentication → Providers → Email
- [ ] Disable "Confirm email"
- [ ] Save
- [ ] Test signup

### Opsi 2 (Production):
- [ ] Daftar Resend dan dapatkan API key
- [ ] Setup SMTP di Supabase Dashboard
- [ ] Whitelist redirect URL
- [ ] Test signup dan cek email

---

## Catatan Penting

1. **Opsi 1 hanya untuk development** - Jangan gunakan di production!
2. **Opsi 2 untuk production** - Setup SMTP wajib untuk production
3. **Resend free tier**: 3,000 emails/month - cukup untuk development dan testing
4. **Domain Vercel**: `karirku-gray.vercel.app` - pastikan sudah di-whitelist di Supabase

