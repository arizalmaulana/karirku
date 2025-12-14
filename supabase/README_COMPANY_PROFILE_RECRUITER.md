# Profile Perusahaan untuk Recruiter

## Deskripsi
Fitur ini memungkinkan recruiter untuk membuat dan mengelola profile perusahaan yang mereka wakili. Profile perusahaan harus melalui persetujuan admin sebelum dapat ditampilkan ke publik.

## Aturan
1. **1 Recruiter = 1 Perusahaan**: Setiap recruiter hanya boleh memiliki satu perusahaan (enforced by UNIQUE constraint pada `recruiter_id`)
2. **Persetujuan Admin**: Profile perusahaan harus disetujui admin sebelum ditampilkan ke publik
3. **Surat Izin Wajib**: Recruiter harus mengunggah surat izin perusahaan (SIUP, NPWP, atau dokumen legal lainnya) ke bucket `company_licenses`

## Setup

### 1. Update Database Schema
Jalankan script SQL berikut di Supabase SQL Editor:

```sql
-- File: supabase/update_companies_for_recruiter.sql
```

Script ini akan:
- Menambahkan kolom `recruiter_id` (unique, foreign key ke profiles)
- Menambahkan kolom `license_url` (URL surat izin dari bucket)
- Menambahkan kolom `is_approved` (boolean, default false)
- Menambahkan kolom `status` (pending, approved, rejected)
- Membuat RLS policies untuk recruiter dan admin

### 2. Pastikan Bucket `company_licenses` Sudah Dibuat
Bucket `company_licenses` harus sudah dibuat di Supabase Storage dengan RLS policies yang sesuai. Lihat file:
- `supabase/create_company_licenses_bucket_storage.sql`

## Fitur

### Untuk Recruiter
1. **Menu Sidebar**: Menu "Profile Perusahaan" ditambahkan di sidebar recruiter
2. **Form Profile**: Form lengkap untuk mengisi data perusahaan:
   - Nama perusahaan (wajib)
   - Industri
   - Lokasi (kota, provinsi)
   - Website
   - Ukuran perusahaan
   - Deskripsi
   - Logo URL
   - Surat izin perusahaan (wajib, upload ke bucket `company_licenses`)
3. **Status Approval**: Recruiter dapat melihat status persetujuan:
   - Menunggu Persetujuan (pending)
   - Disetujui (approved)
   - Ditolak (rejected)
4. **Update Profile**: Recruiter dapat mengupdate profile perusahaan mereka (hanya jika belum approved atau ditolak)

### Untuk Admin
Admin dapat:
- Melihat semua profile perusahaan (termasuk yang belum approved)
- Menyetujui atau menolak profile perusahaan
- Mengelola semua data perusahaan

## File yang Dibuat/Dimodifikasi

### File Baru
1. `supabase/update_companies_for_recruiter.sql` - SQL script untuk update schema
2. `components/recruiter/CompanyProfileForm.tsx` - Component form profile perusahaan
3. `app/recruiter/company/profile/page.tsx` - Halaman form profile perusahaan
4. `supabase/README_COMPANY_PROFILE_RECRUITER.md` - Dokumentasi ini

### File yang Dimodifikasi
1. `lib/types.ts` - Update interface Company dengan field baru
2. `components/recruiter/sidebar.tsx` - Tambah menu "Profile Perusahaan"

## RLS Policies

### Companies Table
- **Public Read (Approved Only)**: Semua orang bisa membaca companies yang sudah approved
- **Recruiter Read Own**: Recruiter bisa membaca company mereka sendiri (meskipun belum approved)
- **Recruiter Create**: Recruiter bisa membuat company mereka sendiri (hanya 1 perusahaan)
- **Recruiter Update Own**: Recruiter bisa update company mereka sendiri (hanya jika belum approved atau ditolak)
- **Admin Manage All**: Admin bisa mengelola semua companies

### Storage Bucket `company_licenses`
- Recruiter bisa upload file mereka sendiri (filename harus mengandung user ID)
- Recruiter bisa membaca file mereka sendiri
- Admin bisa membaca dan menghapus semua file

## Status Approval

### Pending (Default)
- Status default ketika recruiter membuat atau update profile
- Profile tidak ditampilkan ke publik
- Recruiter bisa mengupdate profile

### Approved
- Profile sudah disetujui admin
- Profile ditampilkan ke publik
- Recruiter tidak bisa mengupdate profile (harus request admin)

### Rejected
- Profile ditolak admin
- Profile tidak ditampilkan ke publik
- Recruiter bisa mengupdate dan kirim ulang

## Cara Menggunakan

### Untuk Recruiter
1. Login sebagai recruiter
2. Klik menu "Profile Perusahaan" di sidebar
3. Isi form profile perusahaan
4. Upload surat izin perusahaan (PDF, JPG, atau PNG, maks. 10MB)
5. Klik "Simpan Profile Perusahaan"
6. Tunggu persetujuan admin

### Untuk Admin
1. Login sebagai admin
2. Buka halaman manajemen companies (jika ada)
3. Review profile perusahaan yang pending
4. Setujui atau tolak profile perusahaan

## Troubleshooting

### Error: "Anda sudah memiliki perusahaan"
- Satu recruiter hanya boleh memiliki satu perusahaan
- Jika perlu mengubah perusahaan, update profile yang sudah ada

### Error: "Bucket 'company_licenses' belum dibuat"
- Pastikan bucket `company_licenses` sudah dibuat di Supabase Storage
- Pastikan RLS policies sudah dikonfigurasi

### Profile tidak muncul di public
- Pastikan status approval sudah "approved"
- Pastikan `is_approved = true` di database

## Catatan Penting

1. **Surat Izin Wajib**: Form tidak bisa disubmit tanpa surat izin
2. **1 Recruiter = 1 Perusahaan**: Enforced by database constraint
3. **Approval Required**: Profile harus disetujui admin sebelum publik
4. **Update Restrictions**: Recruiter tidak bisa update profile yang sudah approved (harus request admin)

