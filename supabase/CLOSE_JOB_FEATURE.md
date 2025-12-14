# Fitur Menutup Lowongan Pekerjaan

Fitur ini memungkinkan recruiter untuk menutup lowongan pekerjaan ketika lowongan sudah terpenuhi. Lowongan yang ditutup tidak akan ditampilkan di landing page dan halaman jobseeker, tetapi masih dapat dilihat dan dikelola di dashboard recruiter.

## Setup Database

Jalankan SQL migration untuk menambahkan field `is_closed` ke tabel `job_listings`:

```bash
# Di Supabase SQL Editor, jalankan:
supabase/add_is_closed_to_job_listings.sql
```

Atau copy-paste isi file `supabase/add_is_closed_to_job_listings.sql` ke Supabase SQL Editor dan jalankan.

## Fitur

### 1. Field Database
- **Field**: `is_closed` (BOOLEAN, default: false)
- **Index**: `idx_job_listings_is_closed` untuk performa query yang lebih baik

### 2. Komponen UI
- **CloseJobButton**: Komponen untuk menutup/membuka kembali lowongan
  - Lokasi: `components/recruiter/CloseJobButton.tsx`
  - Fitur:
    - Tombol dengan icon Lock/Unlock
    - Dialog konfirmasi sebelum menutup/membuka
    - Toast notification untuk feedback

### 3. Filtering
Lowongan yang ditutup (`is_closed = true`) akan difilter di:
- ✅ Landing page (`app/page.tsx` via `fetchJobsFromDatabase()`)
- ✅ Halaman jobseeker jobs (`app/job-seeker/jobs/page.tsx` via `fetchJobsFromDatabase()`)
- ✅ Dashboard jobseeker (`app/job-seeker/dashboard/page.tsx` via `getRecommendedJobs()`)

### 4. Halaman Recruiter
- **Halaman Jobs** (`app/recruiter/jobs/page.tsx`):
  - Menampilkan badge "Ditutup" untuk lowongan yang ditutup
  - Tombol CloseJobButton untuk menutup/membuka kembali lowongan
  - Recruiter dapat melihat semua lowongan mereka, termasuk yang ditutup

## Cara Menggunakan

1. **Menutup Lowongan**:
   - Buka halaman `/recruiter/jobs`
   - Klik tombol Lock (🔒) pada lowongan yang ingin ditutup
   - Konfirmasi di dialog yang muncul
   - Lowongan akan disembunyikan dari landing page dan halaman jobseeker

2. **Membuka Kembali Lowongan**:
   - Buka halaman `/recruiter/jobs`
   - Klik tombol Unlock (🔓) pada lowongan yang ditutup
   - Konfirmasi di dialog yang muncul
   - Lowongan akan kembali ditampilkan di landing page dan halaman jobseeker

## Catatan

- Lowongan yang ditutup masih dapat dilihat di dashboard recruiter
- Lowongan yang ditutup masih dapat dikelola (edit, hapus, lihat pelamar)
- Lowongan yang ditutup tidak akan muncul di hasil pencarian jobseeker
- Field `is_closed` default adalah `false` untuk backward compatibility



