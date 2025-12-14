# Cara Membuat Bucket 'applications' di Supabase

## Error yang Terjadi
```
{"statusCode":"404","error":"Bucket not found","message":"Bucket not found"}
```

## Penyebab
Bucket `applications` belum dibuat di Supabase Storage Dashboard.

## Solusi: Buat Bucket 'applications'

### Langkah-langkah Detail:

1. **Buka Supabase Dashboard**
   - Login ke https://app.supabase.com
   - Pilih project Anda

2. **Akses Menu Storage**
   - Di sidebar kiri, klik menu **Storage**
   - Atau langsung ke: `https://app.supabase.com/project/[PROJECT_ID]/storage/buckets`

3. **Buat Bucket Baru**
   - Klik tombol **"New bucket"** atau **"Create bucket"** (biasanya di pojok kanan atas)
   - Atau klik **"Create a new bucket"** jika belum ada bucket sama sekali

4. **Isi Form Bucket**
   - **Name**: `applications` (harus tepat, huruf kecil, tanpa spasi)
   - **Public bucket**: **OFF** (biarkan tidak dicentang, karena ini private bucket untuk keamanan data pelamar)
   - **File size limit**: `5242880` (ini adalah 5MB dalam bytes)
   - **Allowed MIME types**: `application/pdf,image/jpeg,image/jpg` (opsional, tapi disarankan untuk validasi)

5. **Klik "Create bucket"**
   - Tunggu hingga bucket berhasil dibuat
   - Anda akan melihat bucket `applications` muncul di daftar bucket

### Verifikasi Bucket Sudah Dibuat

Setelah bucket dibuat, verifikasi dengan query SQL berikut:

```sql
SELECT * FROM storage.buckets WHERE name = 'applications';
```

Jika query mengembalikan 1 row, berarti bucket sudah berhasil dibuat.

### Langkah Selanjutnya

Setelah bucket dibuat, **WAJIB** jalankan script RLS policy:

1. Buka **SQL Editor** di Supabase Dashboard
2. Jalankan script `create_applications_bucket_rls_policy.sql`
3. Verifikasi policy sudah dibuat (lihat `TROUBLESHOOTING_APPLICATIONS_BUCKET.md`)

## Catatan Penting

- **Nama bucket harus tepat**: `applications` (huruf kecil, tanpa spasi, tanpa karakter khusus)
- **Bucket harus private**: Jangan centang "Public bucket" untuk keamanan data pelamar
- **File size limit**: 5MB (5242880 bytes) sudah cukup untuk CV PDF
- **MIME types**: Bisa dikosongkan, tapi lebih baik diisi untuk validasi

## Screenshot Referensi (Jika Tersedia)

Form bucket biasanya terlihat seperti ini:
```
┌─────────────────────────────────────┐
│ Create a new bucket                 │
├─────────────────────────────────────┤
│ Name: [applications          ]      │
│                                     │
│ ☐ Public bucket                    │
│                                     │
│ File size limit: [5242880    ]     │
│                                     │
│ Allowed MIME types:                 │
│ [application/pdf,image/jpeg,image/jpg]
│                                     │
│         [Cancel]  [Create bucket]   │
└─────────────────────────────────────┘
```

## Troubleshooting

### Error: "Bucket name already exists"
- Bucket `applications` sudah ada
- Cek di daftar bucket, mungkin sudah dibuat sebelumnya
- Jika sudah ada, langsung lanjut ke langkah setup RLS policy

### Error: "Invalid bucket name"
- Pastikan nama bucket: `applications` (huruf kecil, tanpa spasi)
- Tidak boleh menggunakan karakter khusus atau huruf kapital

### Setelah bucket dibuat, masih error "Bucket not found"
- Refresh halaman browser
- Pastikan nama bucket tepat: `applications`
- Cek dengan query SQL: `SELECT * FROM storage.buckets WHERE name = 'applications';`
- Jika query tidak mengembalikan hasil, bucket belum dibuat dengan benar

