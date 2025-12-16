# Setup Redirect URL di Supabase untuk Email Confirmation

## Masalah: Error 500 saat Signup

Jika Anda mengalami error **500 Internal Server Error** saat melakukan signup, kemungkinan besar penyebabnya adalah:

**URL `emailRedirectTo` belum di-whitelist di Supabase Dashboard**

Supabase memerlukan semua redirect URL untuk di-whitelist di Authentication settings untuk keamanan.

## Solusi: Whitelist Redirect URL

### Langkah 1: Buka Supabase Dashboard

1. Buka [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda
3. Buka **Authentication** → **URL Configuration**

### Langkah 2: Tambahkan Redirect URL

Di bagian **Redirect URLs**, tambahkan URL berikut:

#### Untuk Development (Local):
```
http://localhost:3000/auth/callback
http://localhost:3000/auth/callback/*
```

#### Untuk Production (Vercel):
```
https://karirku-gray.vercel.app/auth/callback
https://karirku-gray.vercel.app/auth/callback/*
```

**Catatan**: 
- Ganti dengan domain production Anda jika berbeda
- Gunakan `/*` di akhir untuk mengizinkan semua query parameters
- Untuk Vercel, domain biasanya: `yourproject.vercel.app`

### Langkah 3: Tambahkan Site URL (Opsional tapi Disarankan)

Di bagian **Site URL**, pastikan sudah diisi dengan:
- **Development**: `http://localhost:3000`
- **Production**: `https://karirku-gray.vercel.app` (atau domain production Anda)

### Langkah 4: Simpan dan Test

1. Klik **Save** untuk menyimpan perubahan
2. Tunggu beberapa detik untuk perubahan diterapkan
3. Coba signup lagi

## Format URL yang Benar

### ✅ Format yang Benar:
```
http://localhost:3000/auth/callback
https://yourdomain.com/auth/callback
http://localhost:3000/auth/callback?next=/job-seeker/dashboard
```

### ❌ Format yang Salah:
```
/auth/callback                    (tanpa domain)
localhost:3000/auth/callback      (tanpa protocol)
http://localhost:3000/auth/       (tanpa /callback)
```

## Troubleshooting

### Masih Error 500?

1. **Cek URL di Code**: Pastikan URL yang digunakan di code sama dengan yang di-whitelist
   - File: `components/RegisterDialog.tsx` (baris ~158)
   - Format: `${baseUrl}/auth/callback?next=...`

2. **Cek Base URL**: Pastikan `baseUrl` di code benar
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`

3. **Cek Supabase Logs**: 
   - Buka **Supabase Dashboard** → **Logs** → **Auth Logs**
   - Cari error terkait redirect URL

4. **Nonaktifkan emailRedirectTo Sementara**:
   - Jika masih error, kode sudah memiliki fallback yang akan mencoba tanpa `emailRedirectTo`
   - Tapi user akan di-redirect ke default Supabase confirmation page

### Error Lainnya?

- **Error 400**: URL format salah
- **Error 403**: URL tidak di-whitelist
- **Error 500**: Server error (bisa karena URL tidak di-whitelist atau masalah server)

## Catatan Penting

1. **URL harus exact match** atau menggunakan wildcard `/*` di akhir
2. **Protocol harus lengkap** (http:// atau https://)
3. **Port harus disertakan** untuk development (localhost:3000)
4. **Perubahan bisa memakan waktu beberapa detik** untuk diterapkan

## Alternatif: Nonaktifkan emailRedirectTo

Jika Anda tidak ingin menggunakan custom redirect URL, Anda bisa:

1. Hapus atau comment bagian `emailRedirectTo` di `components/RegisterDialog.tsx`
2. User akan di-redirect ke default Supabase confirmation page
3. Setelah konfirmasi, user perlu login manual

**Tapi ini tidak disarankan** karena:
- User experience kurang baik
- Proses lebih lambat
- User perlu login manual setelah konfirmasi

## Rekomendasi

✅ **Gunakan emailRedirectTo dengan URL yang di-whitelist** untuk:
- User experience yang lebih baik
- Proses yang lebih cepat
- Auto-login setelah konfirmasi email

