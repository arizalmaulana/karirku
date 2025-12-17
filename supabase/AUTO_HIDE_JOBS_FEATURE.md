# Auto Hide Jobs Ketika Company Diblokir/Dihapus

## Deskripsi
Fitur ini secara otomatis menyembunyikan (hide) semua lowongan pekerjaan dari perusahaan yang diblokir atau dihapus oleh admin.

## Setup

### 1. Jalankan SQL Migration
Jalankan script SQL berikut di Supabase SQL Editor:

```sql
-- File: supabase/auto_hide_jobs_on_company_block.sql
```

Script ini akan:
- Menambahkan kolom `is_hidden` ke tabel `job_listings`
- Membuat trigger database yang otomatis:
  - Hide semua jobs ketika `companies.is_blocked` berubah menjadi `true`
  - Unhide semua jobs ketika `companies.is_blocked` berubah menjadi `false`
  - Hide semua jobs ketika company dihapus

### 2. Update Kode Aplikasi
Kode aplikasi sudah diupdate untuk:
- Exclude jobs dengan `is_hidden = true` dari query public
- Check `is_hidden` pada halaman detail job
- Update type definition untuk include `is_hidden` field

## Cara Kerja

### Ketika Company Diblokir
1. Admin memblokir company melalui `CompanyBlockButton`
2. Database trigger otomatis mengupdate semua `job_listings` dengan `company_name` yang sama:
   - Set `is_hidden = true` untuk semua jobs dari company tersebut
3. Query aplikasi otomatis exclude jobs dengan `is_hidden = true`
4. Jobs dari company yang diblokir tidak akan muncul di:
   - Halaman daftar jobs
   - Halaman detail job
   - Dashboard job seeker
   - Pencarian jobs

### Ketika Company Dibuka Kembali (Unblock)
1. Admin membuka blokir company melalui `CompanyBlockButton`
2. Database trigger otomatis mengupdate semua `job_listings`:
   - Set `is_hidden = false` untuk semua jobs dari company tersebut
3. Jobs kembali muncul di aplikasi

### Ketika Company Dihapus
1. Admin menghapus company dari database
2. Database trigger otomatis mengupdate semua `job_listings`:
   - Set `is_hidden = true` untuk semua jobs dari company yang dihapus
3. Jobs tidak akan muncul di aplikasi

## Catatan Penting

### Untuk Developer
- **Selalu filter dengan `.neq("is_hidden", true)`** saat mengambil jobs untuk public access
- Admin dan recruiter masih bisa melihat jobs yang hidden melalui query khusus mereka
- Jobs yang hidden tidak akan muncul di statistik atau pencarian

### Untuk Admin
- Ketika memblokir/unblock company, semua jobs akan otomatis hide/unhide
- Tidak perlu manual hide/unhide individual jobs
- Jobs yang di-hide masih tersimpan di database dan bisa di-unhide jika company dibuka kembali

### Database Triggers
- Trigger berjalan otomatis di level database
- Menggunakan `SECURITY DEFINER` untuk bypass RLS
- Trigger tidak memerlukan perubahan pada kode aplikasi frontend

## File yang Diupdate

### SQL Migration
- `supabase/auto_hide_jobs_on_company_block.sql` - Migration script

### Type Definitions
- `lib/types.ts` - Added `is_hidden` to `JobListing` interface

### Query Updates
- `lib/utils/jobData.ts` - Exclude hidden jobs from public queries
- `lib/utils/companyData.ts` - Exclude hidden jobs from company aggregations
- `app/job-seeker/jobs/[id]/page.tsx` - Check `is_hidden` on job detail
- `app/job-seeker/jobs/[id]/apply/page.tsx` - Check `is_hidden` on apply page
- `app/job-seeker/dashboard/page.tsx` - Exclude hidden jobs from dashboard

## Testing

Setelah migration:
1. Blokir sebuah company melalui admin panel
2. Verifikasi semua jobs dari company tersebut tidak muncul di halaman jobs
3. Buka blokir company
4. Verifikasi semua jobs kembali muncul
5. Hapus sebuah company (jika perlu)
6. Verifikasi semua jobs dari company yang dihapus tidak muncul

