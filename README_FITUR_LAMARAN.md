# 🎯 Fitur Lamaran - Quick Start Guide

## 📦 Instalasi & Setup

### 1. Jalankan Database Migration

Buka Supabase SQL Editor dan jalankan:

```sql
-- File: supabase/add_application_fields.sql
```

Ini akan menambahkan field baru:
- `notes` - Catatan recruiter
- `rejection_reason` - Alasan penolakan  
- `interview_date` - Jadwal interview
- `interview_location` - Lokasi interview

### 2. Verifikasi Types

Pastikan `lib/types.ts` sudah diupdate dengan field baru (sudah dilakukan).

## ✨ Fitur yang Tersedia

### Untuk Job Seeker:

1. **Form Lamaran dengan Save Draft**
   - Auto-save setiap 30 detik
   - Load draft otomatis
   - Validasi CV (max 5MB) dan Cover Letter (min 50 karakter)

2. **Timeline Tracking**
   - Visual timeline status
   - Menampilkan progress lamaran

3. **Withdraw Application**
   - Tarik lamaran jika status masih `submitted` atau `review`

### Untuk Recruiter:

1. **Update Status dengan Notes**
   - Form update status dengan notes/alasan
   - Auto-parse interview date & location
   - Notes wajib untuk `rejected` dan `interview`

## 🚀 Quick Test

### Test Save Draft:
1. Login sebagai job seeker
2. Buka lowongan dan klik "Lamar"
3. Isi form (tidak perlu lengkap)
4. Klik "Simpan Draft"
5. Refresh halaman - draft harus ter-load

### Test Timeline:
1. Login sebagai job seeker
2. Buka detail lamaran
3. Scroll ke "Timeline Status"
4. Pastikan timeline menampilkan status dengan benar

### Test Update Status:
1. Login sebagai recruiter
2. Buka detail pelamar
3. Update status ke "Interview"
4. Isi notes dengan format: "Tanggal: [tanggal], Lokasi: [lokasi]"
5. Submit - pastikan status terupdate

## 📝 Format Interview Notes

```
Tanggal: 15 Januari 2024, 10:00 WIB
Lokasi: Kantor Jakarta, Jl. Sudirman No. 1
```

Atau untuk online:
```
Tanggal: 15 Januari 2024, 10:00 WIB
Lokasi: Zoom Meeting - Link: https://zoom.us/j/123456789
```

## ⚠️ Troubleshooting

**Draft tidak tersimpan?**
- Pastikan user sudah login
- Cek RLS policies
- Cek console browser

**Tidak bisa withdraw?**
- Hanya bisa jika status `submitted` atau `review`
- Status lain tidak bisa di-withdraw

**Interview date tidak ter-parse?**
- Pastikan format: "Tanggal: [tanggal], Lokasi: [lokasi]"
- Tanggal harus bisa di-parse JavaScript Date

## 📚 Dokumentasi Lengkap

- `FITUR_LAMARAN_ALUR.md` - Alur lengkap fitur
- `IMPLEMENTASI_FITUR_LAMARAN.md` - Dokumentasi implementasi
- `CONTOH_IMPLEMENTASI_LAMARAN.md` - Contoh kode

## ✅ Status Implementasi

- [x] Save as Draft
- [x] Withdraw Application
- [x] Timeline Tracking
- [x] Enhanced Status Update
- [x] Database Migration
- [x] Types Update
- [x] Integrasi ke semua halaman

**Semua fitur Phase 1 dan Phase 2 sudah selesai!** 🎉

