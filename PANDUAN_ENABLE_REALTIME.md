# Panduan Enable Realtime untuk Notifikasi

## ⚠️ Perbedaan: Replication vs Realtime

### 1. **Replication (External Destinations)**
- Untuk mengirim data ke external data warehouses (BigQuery, Iceberg, dll)
- **TIDAK diperlukan** untuk real-time notifications
- Halaman yang Anda lihat di screenshot adalah untuk fitur ini

### 2. **Realtime (Database Changes)**
- Untuk menerima update real-time dari database
- **DIPERLUKAN** untuk notifikasi real-time
- Enable melalui SQL script atau Database → Replication (tabel level)

---

## ✅ Cara Enable Realtime untuk Notifikasi

### Opsi 1: Menggunakan SQL Script (Paling Mudah)

1. **Buka Supabase Dashboard** → **SQL Editor**
2. **Copy-paste script berikut:**

```sql
-- Enable Realtime untuk tabel notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

3. **Klik "Run"** untuk menjalankan script
4. **Selesai!** Realtime sudah diaktifkan untuk tabel notifications

### Opsi 2: Melalui Database → Replication (UI)

1. **Buka Supabase Dashboard** → **Database** → **Replication**
2. **Scroll ke bawah** ke bagian "Tables" atau "Realtime"
3. **Cari tabel `notifications`** di daftar
4. **Toggle ON** untuk enable realtime pada tabel notifications
5. **Save**

**Catatan:** Jika tabel `notifications` tidak muncul di daftar, gunakan Opsi 1 (SQL Script).

---

## 🔍 Verifikasi Realtime Sudah Aktif

### Cara 1: Cek di SQL Editor

Jalankan query berikut di SQL Editor:

```sql
-- Cek apakah tabel notifications sudah di-enable untuk Realtime
SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND schemaname = 'public' 
            AND tablename = 'notifications'
        ) THEN 'Enabled'
        ELSE 'Disabled'
    END as realtime_status
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'notifications';
```

Jika hasilnya `Enabled`, berarti Realtime sudah aktif!

**Atau query yang lebih sederhana:**

```sql
-- Cek langsung apakah notifications ada di supabase_realtime publication
SELECT 
    schemaname,
    tablename
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND schemaname = 'public' 
AND tablename = 'notifications';
```

Jika query mengembalikan 1 baris (dengan schemaname='public' dan tablename='notifications'), berarti Realtime sudah aktif!

### Cara 2: Cek di Database → Replication

1. Buka **Database** → **Replication**
2. Scroll ke bagian yang menampilkan daftar tabel
3. Cari tabel `notifications`
4. Pastikan status menunjukkan **Active** atau **Enabled**

---

## 🎯 Yang Perlu Diaktifkan

Untuk notifikasi real-time, Anda hanya perlu:

✅ **Enable Realtime untuk tabel `notifications`**
- Gunakan SQL script di atas
- Atau toggle di Database → Replication

❌ **TIDAK perlu** setup external replication (BigQuery, Iceberg, dll)
- Fitur ini untuk data warehouses
- Tidak diperlukan untuk real-time notifications

---

## 🐛 Troubleshooting

### Tabel notifications tidak muncul di Replication?

**Solusi:** Gunakan SQL script (Opsi 1) - lebih reliable.

### Error "relation does not exist"?

**Solusi:** Pastikan tabel `notifications` sudah dibuat. Jalankan script:
```sql
-- File: supabase/create_notifications_table.sql
```

### Realtime tidak bekerja setelah enable?

1. **Refresh halaman** aplikasi
2. **Cek console** browser untuk error
3. **Pastikan** user sudah login (Realtime hanya bekerja untuk authenticated users)
4. **Cek** Supabase Dashboard → Project Settings → API → Realtime (pastikan enabled)

---

## 📝 Checklist

- [ ] Tabel `notifications` sudah dibuat
- [ ] Script `enable_realtime_notifications.sql` sudah dijalankan
- [ ] Realtime sudah diaktifkan untuk tabel `notifications`
- [ ] Test signup dan verifikasi notifikasi muncul real-time
- [ ] Browser notification permission sudah diizinkan

---

## 🎉 Setelah Enable Realtime

Setelah Realtime diaktifkan:
1. ✅ Notifikasi akan muncul **real-time** saat ada notifikasi baru
2. ✅ Tidak perlu refresh halaman
3. ✅ Browser notification akan muncul otomatis
4. ✅ Toast notification akan muncul di aplikasi

---

## 📚 Referensi

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Enable Realtime for Tables](https://supabase.com/docs/guides/realtime/postgres-changes)

