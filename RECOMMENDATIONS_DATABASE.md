# Rekomendasi Penambahan Field Database untuk Filter dan Search

## Analisis Fitur Filter dan Search di Landing Page

### Fitur Filter yang Ada:
1. **Filter Type** (Full-time, Part-time, Remote, Freelance) ✅ **SUDAH ADA**
   - Field: `employment_type` (enum: fulltime, parttime, contract, internship, remote, hybrid)
   - Status: Sudah terintegrasi dengan database

2. **Filter Category** (Technology, Design, Marketing, Business) ⚠️ **PERLU DITAMBAHKAN**
   - Saat ini: Di-generate otomatis dari `skills_required` dan `title`
   - Masalah: Tidak akurat, tidak konsisten, tidak bisa di-filter di level database
   - Rekomendasi: Tambahkan field `category` (enum)

3. **Filter Level** (Entry Level, Mid Level, Senior Level) ⚠️ **PERLU DITAMBAHKAN**
   - Saat ini: Di-generate otomatis dari `title` dan `requirements`
   - Masalah: Tidak akurat, tidak konsisten, tidak bisa di-filter di level database
   - Rekomendasi: Tambahkan field `job_level` (enum)

### Fitur Search yang Ada:
1. **Search by Title** ✅ **SUDAH ADA**
   - Field: `title` (text)
   - Status: Sudah terintegrasi

2. **Search by Company** ✅ **SUDAH ADA**
   - Field: `company_name` (text)
   - Status: Sudah terintegrasi

3. **Search by Location** ✅ **SUDAH ADA**
   - Field: `location_city`, `location_province` (text)
   - Status: Sudah terintegrasi

## Rekomendasi Penambahan

### 1. Field yang WAJIB Ditambahkan (Untuk Akurasi Filter)

#### A. Field `category` (ENUM)
```sql
create type job_category as enum (
    'Technology', 
    'Design', 
    'Marketing', 
    'Business', 
    'Finance', 
    'Healthcare', 
    'Education', 
    'Other'
);

alter table public.job_listings
add column category job_category;
```

**Manfaat:**
- Filter lebih akurat (tidak bergantung pada heuristik)
- Bisa filter di level database (lebih cepat)
- Konsistensi data lebih baik
- Recruiter bisa pilih category saat membuat job

#### B. Field `job_level` (ENUM)
```sql
create type job_level as enum (
    'Entry Level', 
    'Mid Level', 
    'Senior Level', 
    'Executive'
);

alter table public.job_listings
add column job_level job_level;
```

**Manfaat:**
- Filter lebih akurat
- Bisa filter di level database
- Konsistensi data lebih baik
- Recruiter bisa pilih level saat membuat job

### 2. Index untuk Performa (SANGAT DISARANKAN)

#### A. Index untuk Full-Text Search
```sql
-- Index untuk search di title
create index idx_job_listings_title_search 
on public.job_listings using gin(to_tsvector('indonesian', title));

-- Index untuk search di description
create index idx_job_listings_description_search 
on public.job_listings using gin(to_tsvector('indonesian', coalesce(description, '')));
```

**Manfaat:**
- Search lebih cepat, terutama untuk banyak data
- Mendukung full-text search yang lebih powerful

#### B. Index untuk Filter
```sql
-- Index untuk filter category
create index idx_job_listings_category on public.job_listings(category);

-- Index untuk filter level
create index idx_job_listings_level on public.job_listings(job_level);

-- Index untuk filter employment_type
create index idx_job_listings_employment_type on public.job_listings(employment_type);

-- Index untuk filter location
create index idx_job_listings_location on public.job_listings(location_city, location_province);

-- Index untuk company_name (untuk search)
create index idx_job_listings_company_name on public.job_listings(company_name);
```

**Manfaat:**
- Query filter lebih cepat
- Sorting lebih cepat

### 3. Field Opsional (Untuk Fitur Lanjutan)

#### A. Koordinat Geografis (untuk Map yang lebih akurat)
```sql
alter table public.job_listings
add column location_lat numeric(10, 8),
add column location_lng numeric(11, 8);

create index idx_job_listings_location_coords 
on public.job_listings using gist(point(location_lng, location_lat));
```

**Manfaat:**
- Map lebih akurat
- Bisa filter berdasarkan radius/jarak
- Bisa sorting berdasarkan jarak

#### B. Tags/Keywords (untuk Search yang lebih fleksibel)
```sql
alter table public.job_listings
add column tags text[];

create index idx_job_listings_tags 
on public.job_listings using gin(tags);
```

**Manfaat:**
- Search lebih fleksibel
- Bisa tag multiple keywords
- Bisa filter berdasarkan tag

## File SQL yang Sudah Dibuat

File `supabase/add_filter_fields.sql` sudah berisi:
1. ✅ ENUM untuk `job_category` dan `job_level`
2. ✅ ALTER TABLE untuk menambahkan field `category` dan `job_level`
3. ✅ UPDATE data existing berdasarkan logic yang ada
4. ✅ Index untuk performa search dan filter
5. ✅ (Opsional) Koordinat geografis dan tags

## Cara Menggunakan

1. Buka Supabase Dashboard → SQL Editor
2. Copy-paste isi file `supabase/add_filter_fields.sql`
3. Jalankan query
4. Update form recruiter untuk menambahkan field `category` dan `job_level`
5. Code sudah di-update untuk menggunakan field dari database jika ada, atau fallback ke logic lama

## Catatan Penting

- Field `category` dan `job_level` adalah **nullable** (bisa null)
- Code sudah di-update untuk **fallback** ke logic lama jika field null (backward compatible)
- Data existing akan di-update otomatis berdasarkan logic yang ada
- Recruiter bisa update field ini saat membuat/edit job

