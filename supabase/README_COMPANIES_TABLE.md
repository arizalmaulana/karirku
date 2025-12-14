# Setup Tabel Companies

## Deskripsi
Tabel `companies` digunakan untuk menyimpan informasi perusahaan secara terpusat. Data perusahaan dapat diisi manual oleh admin atau di-generate dari data `job_listings`.

## Setup

### 1. Buat Tabel Companies
Jalankan script SQL berikut di Supabase SQL Editor:

```sql
-- File: supabase/create_companies_table.sql
```

Script ini akan:
- Membuat tabel `companies` dengan field:
  - `id` (UUID, primary key)
  - `name` (text, unique, required)
  - `logo_url` (text, optional)
  - `industry` (text, optional)
  - `location_city` (text, optional)
  - `location_province` (text, optional)
  - `description` (text, optional)
  - `website_url` (text, optional)
  - `size` (text, optional) - Format: "20-50", "50-100", dll
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
- Mengaktifkan Row Level Security (RLS)
- Membuat policies:
  - Semua orang bisa membaca companies
  - Hanya admin yang bisa mengelola companies
- Membuat trigger untuk auto-update `updated_at`

### 2. Migrasi Data (Opsional)
Jika sudah ada data di `job_listings`, Anda bisa mengisi tabel `companies` dengan:

1. **Manual**: Admin bisa menambahkan data perusahaan melalui Supabase Dashboard atau SQL Editor
2. **Automatic**: Aplikasi akan otomatis menggunakan data dari `job_listings` sebagai fallback jika tabel `companies` kosong

## Field Deskripsi

### `description` (text)
Field ini digunakan untuk menyimpan deskripsi lengkap perusahaan. Jika tidak diisi, aplikasi akan generate deskripsi otomatis berdasarkan nama perusahaan dan job listings.

**Contoh isi:**
```
Perusahaan teknologi terkemuka yang fokus pada pengembangan solusi software enterprise dan cloud computing untuk berbagai industri.
```

## Cara Mengisi Data

### Via SQL Editor
```sql
INSERT INTO public.companies (name, logo_url, industry, location_city, location_province, description, website_url, size)
VALUES (
    'TechCorp Indonesia',
    'https://example.com/logo.png',
    'Technology',
    'Jakarta',
    'DKI Jakarta',
    'Perusahaan teknologi terkemuka yang fokus pada pengembangan solusi software enterprise.',
    'https://techcorp.id',
    '100-250'
);
```

### Via Supabase Dashboard
1. Buka Supabase Dashboard
2. Pilih project Anda
3. Buka Table Editor
4. Pilih tabel `companies`
5. Klik "Insert row" dan isi data

## Catatan Penting

1. **Field `name` harus unique**: Tidak boleh ada dua perusahaan dengan nama yang sama
2. **Field `description` opsional**: Jika tidak diisi, aplikasi akan generate otomatis
3. **Field `logo_url`**: Bisa menggunakan URL dari Supabase Storage atau external URL
4. **Fallback ke job_listings**: Jika tabel `companies` kosong, aplikasi akan aggregate data dari `job_listings`

## RLS Policies

- **Public Read**: Semua orang bisa membaca data companies
- **Admin Only**: Hanya admin yang bisa insert, update, atau delete companies

## Troubleshooting

### Data tidak muncul
1. Pastikan tabel `companies` sudah dibuat
2. Pastikan RLS policies sudah diaktifkan
3. Cek apakah ada data di tabel `companies` atau `job_listings`

### Error saat insert
1. Pastikan field `name` unique (tidak duplikat)
2. Pastikan user yang melakukan insert memiliki role `admin`
3. Cek RLS policies

