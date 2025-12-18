# Setup Email di Manajemen Pengguna Admin

## Masalah
Email tidak muncul di halaman manajemen pengguna admin setelah deploy ke production.

## Penyebab
Fitur ini memerlukan `SUPABASE_SERVICE_ROLE_KEY` untuk mengakses email dari tabel `auth.users`. Environment variable ini mungkin belum di-set di Vercel.

## Solusi

### 1. Dapatkan Service Role Key dari Supabase

1. Buka **Supabase Dashboard** → Project Anda
2. Klik **Settings** (⚙️) di sidebar kiri
3. Pilih **API** dari menu settings
4. Scroll ke bagian **Project API keys**
5. Copy **`service_role`** key (bukan `anon` key!)
   - ⚠️ **PENTING**: Jangan share key ini ke publik
   - Key ini memiliki akses penuh ke database

### 2. Tambahkan ke Vercel Environment Variables

1. Buka **Vercel Dashboard** → Project Anda
2. Klik **Settings** → **Environment Variables**
3. Klik **Add New**
4. Isi:
   - **Name**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: Paste service_role key yang sudah di-copy
   - **Environment**: Pilih semua (Production, Preview, Development)
5. Klik **Save**

### 3. Redeploy Aplikasi

Setelah menambahkan environment variable:

1. **Opsi A: Automatic Redeploy**
   - Vercel akan otomatis redeploy jika ada perubahan di environment variables
   - Tunggu beberapa menit

2. **Opsi B: Manual Redeploy**
   - Buka **Deployments** tab
   - Klik **⋯** (three dots) pada deployment terbaru
   - Pilih **Redeploy**

### 4. Verifikasi

Setelah redeploy:

1. Buka halaman **Admin → Manajemen Pengguna**
2. Cek apakah kolom email sudah muncul
3. Cek browser console (F12) untuk melihat log:
   - Jika berhasil: Tidak ada warning
   - Jika gagal: Akan muncul warning "⚠️ SUPABASE_SERVICE_ROLE_KEY tidak ditemukan"

## Troubleshooting

### Email Masih Tidak Muncul?

1. **Cek Environment Variable di Vercel**
   - Pastikan `SUPABASE_SERVICE_ROLE_KEY` sudah di-set
   - Pastikan value-nya benar (copy-paste dari Supabase)
   - Pastikan environment scope mencakup Production

2. **Cek Logs di Vercel**
   - Buka **Deployments** → Pilih deployment terbaru → **Logs**
   - Cari warning atau error terkait `SUPABASE_SERVICE_ROLE_KEY`

3. **Cek Browser Console**
   - Buka halaman admin → Manajemen Pengguna
   - Tekan F12 → Console tab
   - Lihat apakah ada warning atau error

4. **Test di Local Development**
   - Tambahkan `SUPABASE_SERVICE_ROLE_KEY` ke `.env.local`
   - Restart development server
   - Test apakah email muncul di local

### Fallback Behavior

Jika `SUPABASE_SERVICE_ROLE_KEY` tidak tersedia:
- Sistem akan menggunakan email dari tabel `profiles` (jika ada)
- Jika tidak ada email di profiles, akan menampilkan "-"
- Warning akan muncul di console untuk debugging

## Keamanan

⚠️ **PENTING**: 
- Jangan commit `SUPABASE_SERVICE_ROLE_KEY` ke git
- Jangan expose key ini ke client-side code
- Key ini hanya untuk server-side operations
- Key ini memiliki akses penuh ke database, jaga kerahasiaannya

## Referensi

- [Supabase Service Role Key Documentation](https://supabase.com/docs/guides/api/api-keys)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

