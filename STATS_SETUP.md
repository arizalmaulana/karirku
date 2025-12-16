# Setup Statistik untuk Halaman About

## Masalah
Statistik "Pencari Kerja" dan "Sukses Diterima" menampilkan 0 karena RLS (Row Level Security) policy membatasi akses ke tabel `profiles` dan `applications`.

## Solusi

### Opsi 1: Menggunakan Service Role Key (Disarankan)

1. Buka Supabase Dashboard > Settings > API
2. Copy **service_role** key (bukan anon key!)
3. Tambahkan ke file `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here
   ```
4. Restart development server

### Opsi 2: Menggunakan Public Policy

1. Buka Supabase SQL Editor
2. Jalankan file `supabase/public_stats_policy.sql`
3. Policy ini akan mengizinkan public read untuk statistik

## Verifikasi

Setelah setup, cek console log di terminal untuk melihat:
- "Using admin client: true/false"
- "Jobseekers found: [jumlah]"
- "Accepted applications found: [jumlah]"

Jika masih 0, pastikan:
1. Ada data jobseeker di tabel `profiles` dengan `role = 'jobseeker'`
2. Ada data aplikasi dengan `status = 'accepted'` di tabel `applications`
3. Service role key sudah benar atau public policy sudah dijalankan



