# Cek dan Perbaiki Konfigurasi SMTP di Supabase

## Error yang Terjadi
```
Error sending confirmation email
Status: 500 Internal Server Error
```

## Langkah Pengecekan

### 1. Cek Apakah SMTP Sudah Di-Enable

1. Buka **Supabase Dashboard** → **Project Settings** → **Auth** → **SMTP Settings**
2. **PENTING**: Pastikan toggle **"Enable Custom SMTP"** adalah **ON** (biru/hijau)
3. Jika masih OFF, toggle menjadi ON dan isi form di bawah

### 2. Cek Konfigurasi SMTP

Pastikan semua field terisi dengan benar:

```
✅ SMTP Host: smtp.resend.com
✅ SMTP Port: 587
✅ SMTP User: resend (huruf kecil, bukan "Resend" atau "RESEND")
✅ SMTP Password: [Token lengkap dari Resend - dimulai dengan re_]
✅ Sender Email: onboarding@resend.dev
✅ Sender Name: Karirku
```

**Cek Khusus SMTP Password:**
- Pastikan token lengkap (tidak terpotong)
- Pastikan tidak ada spasi di awal/akhir
- Pastikan copy dari Resend Dashboard → API Keys → Klik "KarirKu" → Copy TOKEN

### 3. Test Koneksi SMTP

Setelah mengisi form:
1. Klik **Save**
2. Tunggu beberapa detik
3. Jika ada error message, baca dan perbaiki
4. Jika tidak ada error, coba test signup

### 4. Cek Resend Dashboard

1. Buka https://resend.com/emails
2. Lihat apakah ada email yang terkirim
3. Jika ada error, lihat detail error di Resend Dashboard

### 5. Cek Supabase Logs

1. Buka **Supabase Dashboard** → **Logs** → **Auth Logs**
2. Cari error terkait SMTP atau email
3. Baca detail error untuk troubleshooting

## Troubleshooting Spesifik

### Masalah 1: "Invalid credentials" atau "Authentication failed"

**Solusi:**
1. **Cek SMTP User**: Harus `resend` (huruf kecil)
2. **Cek SMTP Password**: 
   - Pastikan token lengkap dari Resend
   - Pastikan tidak ada spasi
   - Coba copy lagi dari Resend Dashboard
3. **Cek API Key di Resend**:
   - Pastikan API key masih aktif
   - Pastikan permission adalah "Sending access"

### Masalah 2: "Connection timeout" atau "Connection refused"

**Solusi:**
1. **Cek SMTP Host**: Harus `smtp.resend.com` (bukan `resend.com`)
2. **Cek SMTP Port**: Harus `587` (bukan `465` atau `25`)
3. **Cek Firewall**: Pastikan tidak ada firewall yang memblokir koneksi

### Masalah 3: "Sender email not verified"

**Solusi:**
1. Gunakan `onboarding@resend.dev` untuk testing (sudah diverifikasi oleh Resend)
2. Atau verifikasi domain di Resend jika ingin menggunakan custom email

### Masalah 4: Masih Error Setelah Semua Sudah Benar

**Solusi:**
1. **Coba buat API key baru di Resend**:
   - Buka Resend Dashboard → API Keys
   - Buat API key baru
   - Copy token baru
   - Update di Supabase SMTP Settings

2. **Cek Email Confirmation Status**:
   - Buka **Authentication** → **Providers** → **Email**
   - Pastikan "Confirm email" masih **ENABLED** (untuk production)
   - Atau **DISABLE** sementara untuk development

3. **Cek Rate Limiting**:
   - Buka **Project Settings** → **Auth** → **Rate Limits**
   - Pastikan rate limit untuk email tidak terlalu ketat

## Solusi Cepat untuk Development

Jika Anda hanya ingin testing tanpa email confirmation:

1. Buka **Supabase Dashboard** → **Authentication** → **Providers** → **Email**
2. Scroll ke bawah ke **Email Auth**
3. **Disable** toggle **"Confirm email"** (OFF)
4. Klik **Save**
5. Test signup - user bisa langsung login tanpa konfirmasi email

**⚠️ Catatan**: Hanya untuk development. Untuk production, tetap perlu setup SMTP.

## Checklist Perbaikan

- [ ] SMTP Settings dibuka di Supabase Dashboard
- [ ] Custom SMTP di-enable (toggle ON)
- [ ] SMTP Host: `smtp.resend.com` (bukan `resend.com`)
- [ ] SMTP Port: `587` (bukan `465` atau `25`)
- [ ] SMTP User: `resend` (huruf kecil)
- [ ] SMTP Password: Token lengkap dari Resend (tidak terpotong, tidak ada spasi)
- [ ] Sender Email: `onboarding@resend.dev`
- [ ] Sender Name: `Karirku`
- [ ] Klik Save (tidak ada error)
- [ ] Test signup berhasil
- [ ] Email terkirim (cek Resend Dashboard)

## Langkah Perbaikan Step-by-Step

### Step 1: Buka SMTP Settings
1. Supabase Dashboard → Project Settings → Auth → SMTP Settings
2. Pastikan "Enable Custom SMTP" adalah ON

### Step 2: Hapus dan Isi Ulang Form
1. Jika form sudah terisi, hapus semua field
2. Isi ulang dengan benar:
   ```
   SMTP Host: smtp.resend.com
   SMTP Port: 587
   SMTP User: resend
   SMTP Password: [Copy token LENGKAP dari Resend]
   Sender Email: onboarding@resend.dev
   Sender Name: Karirku
   ```

### Step 3: Copy Token dengan Benar
1. Buka Resend Dashboard: https://resend.com/api-keys
2. Klik pada API Key "KarirKu"
3. Di bagian **TOKEN**, klik icon copy atau select all dan copy
4. Pastikan token lengkap (tidak terpotong)
5. Paste di field SMTP Password di Supabase

### Step 4: Save dan Test
1. Klik **Save** di Supabase
2. Tunggu beberapa detik
3. Jika tidak ada error, coba test signup
4. Cek email inbox dan Resend Dashboard

## Jika Masih Error

1. **Cek Resend Dashboard**:
   - Buka https://resend.com/emails
   - Lihat apakah ada email yang terkirim atau error
   - Cek detail error jika ada

2. **Cek Supabase Logs**:
   - Buka **Logs** → **Auth Logs**
   - Cari error terkait SMTP
   - Baca detail error

3. **Coba API Key Baru**:
   - Buat API key baru di Resend
   - Update di Supabase SMTP Settings
   - Test lagi

4. **Nonaktifkan Email Confirmation Sementara**:
   - Untuk development, bisa disable "Confirm email"
   - User bisa langsung login tanpa konfirmasi

## Catatan Penting

1. **Token harus lengkap**: Pastikan copy token lengkap dari Resend (tidak terpotong)
2. **Tidak ada spasi**: Pastikan tidak ada spasi di awal/akhir token
3. **SMTP User harus huruf kecil**: `resend` (bukan "Resend" atau "RESEND")
4. **Port 587**: Gunakan port 587 untuk TLS (bukan 465 untuk SSL)
5. **Host harus lengkap**: `smtp.resend.com` (bukan `resend.com`)

