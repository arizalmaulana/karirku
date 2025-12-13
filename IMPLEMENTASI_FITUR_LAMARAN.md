# Implementasi Fitur Lamaran - KarirKu

Dokumen ini menjelaskan fitur-fitur lamaran yang telah diimplementasikan dan cara menggunakannya.

## ✅ Fitur yang Telah Diimplementasikan

### 1. **Save as Draft**
- ✅ Form lamaran bisa disimpan sebagai draft sebelum submit
- ✅ Auto-save setiap 30 detik
- ✅ Load draft otomatis saat membuka form
- ✅ Validasi CV (max 5MB) dan Cover Letter (min 50 karakter)

### 2. **Withdraw Application**
- ✅ Job seeker bisa menarik lamaran jika status masih `submitted` atau `review`
- ✅ Konfirmasi dialog sebelum withdraw
- ✅ Auto redirect setelah withdraw

### 3. **Timeline Tracking**
- ✅ Visual timeline status lamaran
- ✅ Menampilkan status yang sudah dilalui
- ✅ Highlight status saat ini
- ✅ Menampilkan tanggal untuk setiap status

### 4. **Enhanced Status Update (Recruiter)**
- ✅ Form update status dengan notes/alasan
- ✅ Notes wajib untuk status `rejected` dan `interview`
- ✅ Auto-parse interview date dan location dari notes
- ✅ Menampilkan interview info dan rejection reason di detail lamaran

## 📁 File yang Telah Dibuat/Diupdate

### Komponen Baru:
1. `components/job-seeker/ApplicationFormEnhanced.tsx` - Form dengan save draft
2. `components/job-seeker/WithdrawApplicationButton.tsx` - Tombol withdraw
3. `components/recruiter/ApplicationStatusFormEnhanced.tsx` - Form update status dengan notes
4. `components/ApplicationTimeline.tsx` - Timeline visual status

### Halaman yang Diupdate:
1. `app/job-seeker/jobs/[id]/apply/page.tsx` - Menggunakan ApplicationFormEnhanced
2. `app/job-seeker/applications/[id]/page.tsx` - Menambahkan timeline dan withdraw button
3. `app/recruiter/applications/[id]/page.tsx` - Menggunakan ApplicationStatusFormEnhanced

### Database:
1. `supabase/add_application_fields.sql` - Migration untuk field baru
2. `lib/types.ts` - Update Application interface

## 🗄️ Database Migration

Jalankan migration berikut di Supabase SQL Editor:

```sql
-- File: supabase/add_application_fields.sql
-- Tambah field notes, rejection_reason, interview_date, interview_location
```

**Field Baru:**
- `notes` (TEXT) - Catatan dari recruiter
- `rejection_reason` (TEXT) - Alasan penolakan
- `interview_date` (TIMESTAMPTZ) - Jadwal interview
- `interview_location` (TEXT) - Lokasi interview

## 🚀 Cara Menggunakan

### Untuk Job Seeker:

#### 1. Melamar Pekerjaan dengan Save Draft
1. Buka halaman detail lowongan
2. Klik "Lamar Sekarang"
3. Isi form lamaran:
   - Upload CV (wajib, max 5MB)
   - Tulis Cover Letter (wajib, min 50 karakter)
   - Link Portfolio (opsional)
4. Klik "Simpan Draft" untuk menyimpan tanpa submit
5. Draft akan auto-save setiap 30 detik
6. Klik "Kirim Lamaran" untuk submit

#### 2. Melihat Timeline Status
1. Buka halaman "Riwayat Lamaran" (`/job-seeker/applications`)
2. Klik "Lihat Detail" pada lamaran yang ingin dilihat
3. Scroll ke bagian "Timeline Status" untuk melihat progress

#### 3. Menarik Lamaran
1. Buka detail lamaran
2. Scroll ke bagian "Aksi"
3. Klik "Tarik Lamaran"
4. Konfirmasi di dialog
5. Lamaran akan dihapus dan Anda bisa melamar lagi

### Untuk Recruiter:

#### 1. Update Status Lamaran
1. Buka halaman "Pelamar" (`/recruiter/applications`)
2. Klik "Detail" pada pelamar yang ingin diupdate
3. Scroll ke bagian "Update Status"
4. Pilih status baru:
   - **Review**: Mulai proses review
   - **Interview**: Wajib isi informasi interview
     - Format: "Tanggal: [tanggal], Lokasi: [lokasi]"
     - Contoh: "Tanggal: 15 Januari 2024, 10:00 WIB, Lokasi: Kantor Jakarta"
   - **Accepted**: Opsional isi catatan
   - **Rejected**: Wajib isi alasan penolakan
5. Klik "Perbarui Status"

#### 2. Melihat Informasi Interview/Rejection
- Informasi interview (tanggal & lokasi) akan otomatis di-parse dari notes
- Alasan penolakan akan ditampilkan di detail lamaran job seeker

## 📋 Format Notes untuk Interview

Untuk auto-parse interview date dan location, gunakan format:

```
Tanggal: [tanggal dan waktu]
Lokasi: [lokasi interview]
```

**Contoh:**
```
Tanggal: 15 Januari 2024, 10:00 WIB
Lokasi: Kantor Jakarta, Jl. Sudirman No. 1
```

Atau untuk online interview:
```
Tanggal: 15 Januari 2024, 10:00 WIB
Lokasi: Zoom Meeting - Link: https://zoom.us/j/123456789
```

## 🔒 Security & Permissions

- **Job Seeker**: Hanya bisa melihat dan mengelola lamaran sendiri
- **Recruiter**: Hanya bisa melihat dan update lamaran untuk job mereka
- **Admin**: Bisa melihat dan mengelola semua lamaran
- **RLS Policies**: Sudah dikonfigurasi dengan benar

## 🐛 Troubleshooting

### Draft tidak tersimpan
- Pastikan user sudah login
- Cek console browser untuk error
- Pastikan RLS policies sudah benar

### Tidak bisa withdraw
- Hanya bisa withdraw jika status `submitted` atau `review`
- Status `interview`, `accepted`, atau `rejected` tidak bisa di-withdraw

### Interview date tidak ter-parse
- Pastikan format notes sesuai: "Tanggal: [tanggal], Lokasi: [lokasi]"
- Tanggal harus dalam format yang bisa di-parse JavaScript Date

## 📝 Catatan Penting

1. **Draft vs Submitted**: Draft tidak dianggap sebagai aplikasi yang sudah ada, jadi user bisa membuat draft baru meskipun sudah ada draft sebelumnya
2. **Auto-save**: Draft akan auto-save setiap 30 detik jika ada perubahan
3. **Validation**: CV wajib diupload dan Cover Letter minimal 50 karakter sebelum submit
4. **Withdraw**: Setelah withdraw, lamaran akan dihapus dan user bisa melamar lagi

## 🎯 Next Steps (Opsional)

Fitur yang bisa ditambahkan di masa depan:
- Email notifications saat status berubah
- Analytics dashboard untuk recruiter
- Export data pelamar (CSV/PDF)
- Bulk actions (update status beberapa sekaligus)
- Rating/Notes untuk pelamar
- Real-time notifications dengan toast

## ✅ Checklist Implementasi

- [x] Migration database untuk field baru
- [x] Update types.ts
- [x] ApplicationFormEnhanced dengan save draft
- [x] WithdrawApplicationButton
- [x] ApplicationTimeline
- [x] ApplicationStatusFormEnhanced dengan notes
- [x] Integrasi ke halaman apply
- [x] Integrasi ke halaman detail job seeker
- [x] Integrasi ke halaman detail recruiter
- [x] Test semua fitur
- [x] Pastikan tidak ada error

## 📞 Support

Jika ada masalah atau pertanyaan, silakan cek:
- `FITUR_LAMARAN_ALUR.md` - Dokumentasi alur fitur
- `CONTOH_IMPLEMENTASI_LAMARAN.md` - Contoh implementasi detail

