# Alur Fitur Lamaran - KarirKu

## 📋 Ringkasan Alur

### 1. **Alur Job Seeker (Pelamar)**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. MENCARI LOWONGAN                                         │
│    - Browse jobs di halaman /job-seeker/jobs                │
│    - Filter berdasarkan kategori, lokasi, gaji, dll        │
│    - Klik detail lowongan                                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. MELIHAT DETAIL LOWONGAN                                  │
│    - Baca deskripsi lengkap                                 │
│    - Cek requirements dan skills                            │
│    - Lihat informasi gaji dan lokasi                       │
│    - Klik tombol "Lamar Sekarang"                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. MENGISI FORM LAMARAN                                      │
│    - Upload CV (PDF/DOC/DOCX)                               │
│    - Tulis Cover Letter                                     │
│    - Link Portfolio (opsional)                              │
│    - Simpan sebagai Draft (opsional)                        │
│    - Submit Lamaran                                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. TRACKING STATUS LAMARAN                                  │
│    Status: submitted → review → interview → accepted/rejected│
│    - Lihat di /job-seeker/applications                      │
│    - Real-time update status                                │
│    - Notifikasi saat status berubah                         │
│    - Lihat detail lengkap                                   │
└─────────────────────────────────────────────────────────────┘
```

### 2. **Alur Recruiter (Perekrut)**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. MENERIMA LAMARAN                                         │
│    - Notifikasi email/real-time saat ada lamaran baru       │
│    - Lihat di /recruiter/applications                       │
│    - Filter berdasarkan job, status, dll                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. REVIEW LAMARAN                                           │
│    - Baca CV pelamar                                        │
│    - Baca Cover Letter                                      │
│    - Lihat Portfolio (jika ada)                            │
│    - Cek profil pelamar (skills, experience)                │
│    - Bandingkan dengan requirements                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. UPDATE STATUS LAMARAN                                     │
│    - Review: Mulai proses review                            │
│    - Interview: Undang untuk interview                      │
│    - Accepted: Terima pelamar                                │
│    - Rejected: Tolak dengan alasan (opsional)                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. KELOLA LAMARAN                                           │
│    - Export data pelamar                                    │
│    - Kirim email notifikasi ke pelamar                      │
│    - Analytics: jumlah lamaran per status                   │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Status Flow

```
DRAFT → SUBMITTED → REVIEW → INTERVIEW → ACCEPTED
                                    ↓
                                 REJECTED
```

### Penjelasan Status:
- **DRAFT**: Lamaran disimpan tapi belum dikirim
- **SUBMITTED**: Lamaran sudah dikirim, menunggu review
- **REVIEW**: Recruiter sedang meninjau lamaran
- **INTERVIEW**: Pelamar diundang untuk interview
- **ACCEPTED**: Lamaran diterima
- **REJECTED**: Lamaran ditolak

## 🎯 Fitur-Fitur yang Perlu Diimplementasikan

### Untuk Job Seeker:
1. ✅ Form lamaran (sudah ada)
2. ✅ Daftar lamaran dengan filter (sudah ada)
3. ✅ Detail lamaran (sudah ada)
4. ⚠️ **Perlu ditambahkan:**
   - Save as Draft sebelum submit
   - Withdraw/Cancel lamaran (sebelum status review)
   - Notifikasi real-time saat status berubah
   - Timeline tracking status
   - Download CV yang sudah diupload
   - Edit draft lamaran

### Untuk Recruiter:
1. ✅ Daftar pelamar dengan filter (sudah ada)
2. ⚠️ **Perlu ditambahkan:**
   - Detail lengkap pelamar dengan tombol update status
   - Form update status dengan notes/alasan
   - Notifikasi email ke pelamar saat status berubah
   - Analytics dashboard (statistik lamaran)
   - Export data pelamar (CSV/PDF)
   - Bulk actions (update status beberapa sekaligus)
   - Rating/Notes untuk pelamar

### Fitur Umum:
1. ⚠️ **Perlu ditambahkan:**
   - Real-time notifications (toast/popup)
   - Email notifications
   - Activity log/timeline
   - Search dan filter advanced

## 📊 Database Schema (Sudah Ada)

```sql
applications (
  id, job_id, job_seeker_id, status,
  cv_url, portfolio_url, cover_letter,
  submitted_at, updated_at
)
```

**Saran Enhancement:**
- Tambah field `notes` untuk recruiter
- Tambah field `rejection_reason` 
- Tambah field `interview_date` dan `interview_location`
- Tambah field `withdrawn_at` untuk tracking withdraw

## 🚀 Prioritas Implementasi

### Phase 1 (High Priority):
1. ✅ Form lamaran - **DONE**
2. ✅ Daftar lamaran job seeker - **DONE**
3. ✅ Daftar pelamar recruiter - **DONE**
4. ⚠️ Detail lamaran recruiter dengan update status - **TODO**
5. ⚠️ Save as Draft - **TODO**

### Phase 2 (Medium Priority):
1. ⚠️ Notifikasi real-time
2. ⚠️ Timeline tracking
3. ⚠️ Withdraw lamaran
4. ⚠️ Analytics dashboard

### Phase 3 (Nice to Have):
1. ⚠️ Email notifications
2. ⚠️ Export data
3. ⚠️ Bulk actions
4. ⚠️ Rating/Notes

## 💡 Best Practices

1. **Validasi:**
   - Pastikan user tidak bisa apply 2x ke job yang sama
   - Validasi file CV (max size, format)
   - Validasi cover letter (min length)

2. **UX:**
   - Loading states saat submit
   - Success/Error messages
   - Confirmation dialog untuk actions penting
   - Auto-save draft setiap 30 detik

3. **Security:**
   - RLS policies sudah ada
   - Validasi ownership (job seeker hanya bisa lihat lamaran sendiri)
   - Recruiter hanya bisa lihat lamaran untuk job mereka

4. **Performance:**
   - Pagination untuk daftar lamaran
   - Lazy loading untuk CV/Portfolio
   - Caching untuk data yang jarang berubah

