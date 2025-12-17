# Implementasi Notifikasi Real-Time untuk Signup

## ✅ Fitur yang Telah Diimplementasikan

### 1. Real-Time Notifications Hook
- ✅ Hook `useRealtimeNotifications` untuk subscribe ke perubahan notifikasi
- ✅ Menampilkan toast notification otomatis saat ada notifikasi baru
- ✅ Menampilkan browser push notification (jika user mengizinkan)
- ✅ Auto-load notifikasi yang belum dibaca

**File:** `lib/hooks/useRealtimeNotifications.ts`

### 2. API Route untuk Membuat Notifikasi
- ✅ API route `/api/notifications/create` untuk membuat notifikasi dari client-side
- ✅ Menggunakan service role untuk bypass RLS
- ✅ Validasi input dan error handling

**File:** `app/api/notifications/create/route.ts`

### 3. Notifikasi Selamat Datang saat Signup
- ✅ Modifikasi `RegisterDialog` untuk membuat notifikasi saat signup berhasil
- ✅ Notifikasi berbeda untuk jobseeker dan recruiter
- ✅ Notifikasi muncul langsung di device menggunakan real-time subscription

**File yang dimodifikasi:** `components/RegisterDialog.tsx`

### 4. Realtime Notifications Provider
- ✅ Komponen provider untuk mengintegrasikan real-time notifications di seluruh aplikasi
- ✅ Otomatis subscribe saat user login
- ✅ Update document title dengan unread count

**File:** `components/RealtimeNotificationsProvider.tsx`

### 5. Integrasi di Layout
- ✅ Menambahkan `RealtimeNotificationsProvider` di root layout
- ✅ Notifikasi akan otomatis muncul di seluruh aplikasi

**File yang dimodifikasi:** `app/layout.tsx`

---

## 📋 Langkah Setup

### 1. Enable Realtime untuk Tabel Notifications

Jalankan script SQL berikut di Supabase SQL Editor:

```sql
-- File: supabase/enable_realtime_notifications.sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

Atau copy-paste isi file `supabase/enable_realtime_notifications.sql` ke Supabase SQL Editor.

**PENTING:** Pastikan Realtime sudah diaktifkan di Supabase Dashboard:
1. Buka **Supabase Dashboard** → **Project Settings** → **API**
2. Pastikan **Realtime** sudah diaktifkan
3. Jika belum, aktifkan Realtime untuk project Anda

### 2. Verifikasi Realtime di Supabase Dashboard

1. Buka **Supabase Dashboard** → **Database** → **Replication**
2. Pastikan tabel `notifications` muncul di daftar
3. Pastikan status adalah **Active**

### 3. Test Notifikasi Real-Time

1. **Signup dengan email baru**
   - User akan langsung mendapat notifikasi selamat datang
   - Notifikasi muncul sebagai:
     - ✅ Toast notification (di aplikasi)
     - ✅ Browser push notification (jika user mengizinkan)

2. **Cek Browser Notification Permission**
   - Browser akan meminta izin untuk menampilkan notifikasi
   - Klik "Allow" untuk mengaktifkan browser notifications
   - Notifikasi akan muncul di sistem operasi (Windows/Mac/Linux)

---

## 🎯 Cara Kerja

### Flow Notifikasi Real-Time saat Signup

1. **User Signup**
   - User mengisi form registrasi
   - Klik "Daftar"

2. **Signup Berhasil**
   - User dibuat di `auth.users`
   - Profile dibuat di `profiles`
   - **API route dipanggil untuk membuat notifikasi**
   - Notifikasi disimpan di tabel `notifications`

3. **Real-Time Subscription**
   - `RealtimeNotificationsProvider` sudah subscribe ke perubahan notifikasi
   - Saat notifikasi baru ditambahkan, Supabase Realtime mengirim update

4. **Notifikasi Muncul di Device**
   - ✅ **Toast notification** muncul di aplikasi (menggunakan Sonner)
   - ✅ **Browser push notification** muncul di sistem operasi (jika user mengizinkan)
   - ✅ Notifikasi bisa diklik untuk membuka link (jika ada)

---

## 🔔 Tipe Notifikasi

### 1. Toast Notification (In-App)
- Muncul di aplikasi menggunakan Sonner
- Bisa diklik untuk membuka link
- Auto-close setelah 5 detik

### 2. Browser Push Notification (System)
- Muncul di sistem operasi (Windows/Mac/Linux)
- Bisa diklik untuk membuka aplikasi
- Auto-close setelah 5 detik
- **Perlu izin dari user** (akan diminta otomatis)

---

## 📱 Browser Notification Permission

Browser akan meminta izin untuk menampilkan notifikasi saat:
- User pertama kali menggunakan aplikasi
- Hook `useRealtimeNotifications` pertama kali dipanggil

**Status Permission:**
- ✅ **Granted**: Notifikasi akan muncul di sistem operasi
- ⚠️ **Denied**: Hanya toast notification yang muncul (di aplikasi)
- ❓ **Default**: Browser akan meminta izin

**Cara Reset Permission:**
- Chrome: Settings → Privacy → Site Settings → Notifications
- Firefox: Settings → Privacy → Permissions → Notifications
- Safari: Preferences → Websites → Notifications

---

## 🛠️ Membuat Notifikasi Manual

### Dari Client-Side (Browser)

```typescript
const response = await fetch("/api/notifications/create", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    user_id: userId,
    title: "Judul Notifikasi",
    message: "Pesan notifikasi",
    type: "success", // 'success' | 'info' | 'warning' | 'error'
    link: "/path/to/page", // Opsional
  }),
});
```

### Dari Server-Side

```typescript
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const adminClient = createSupabaseAdminClient();
if (adminClient) {
  await adminClient.rpc('create_notification', {
    p_user_id: userId,
    p_title: 'Judul Notifikasi',
    p_message: 'Pesan notifikasi',
    p_type: 'success',
    p_link: '/path/to/page'
  });
}
```

---

## 🎨 Customisasi Notifikasi

### Mengubah Icon Browser Notification

Edit file `lib/hooks/useRealtimeNotifications.ts`:

```typescript
const browserNotification = new Notification(notification.title, {
  body: notification.message,
  icon: "/favicon.ico", // Ganti dengan path icon Anda
  badge: "/favicon.ico",
  // ...
});
```

### Mengubah Durasi Toast

Edit file `lib/hooks/useRealtimeNotifications.ts`:

```typescript
toast[toastType](newNotification.title, {
  description: newNotification.message,
  duration: 5000, // Ubah durasi (dalam milidetik)
  // ...
});
```

---

## 📊 Monitoring Notifikasi

### Cek Notifikasi di Database

```sql
SELECT * FROM public.notifications 
WHERE user_id = 'user-id-here' 
ORDER BY created_at DESC;
```

### Cek Realtime Subscription

1. Buka **Supabase Dashboard** → **Database** → **Replication**
2. Cek status tabel `notifications`
3. Pastikan status adalah **Active**

---

## 🐛 Troubleshooting

### Notifikasi tidak muncul?

1. **Cek Realtime diaktifkan**
   - Pastikan script `enable_realtime_notifications.sql` sudah dijalankan
   - Cek di Supabase Dashboard → Database → Replication

2. **Cek Browser Permission**
   - Pastikan browser notification permission sudah diizinkan
   - Cek di browser settings

3. **Cek Console Log**
   - Buka browser DevTools → Console
   - Cari error terkait Supabase Realtime

4. **Cek Network Tab**
   - Buka browser DevTools → Network
   - Cari request ke Supabase Realtime
   - Pastikan tidak ada error

### Browser notification tidak muncul?

1. **Cek Permission**
   - Pastikan user sudah mengizinkan browser notifications
   - Cek di browser settings

2. **Cek Browser Support**
   - Pastikan browser mendukung Notification API
   - Chrome, Firefox, Edge: ✅ Support
   - Safari: ⚠️ Limited support

3. **Cek HTTPS**
   - Browser notifications hanya bekerja di HTTPS
   - Localhost: ✅ OK
   - HTTP: ❌ Tidak bekerja

### Real-time subscription tidak bekerja?

1. **Cek Supabase Realtime Status**
   - Buka Supabase Dashboard → Project Settings → API
   - Pastikan Realtime sudah diaktifkan

2. **Cek RLS Policies**
   - Pastikan RLS policies untuk tabel notifications sudah benar
   - User harus bisa membaca notifikasi mereka sendiri

3. **Cek Network Connection**
   - Pastikan koneksi internet stabil
   - Supabase Realtime menggunakan WebSocket

---

## ✅ Checklist

- [x] Hook useRealtimeNotifications dibuat
- [x] API route untuk membuat notifikasi dibuat
- [x] RegisterDialog dimodifikasi untuk membuat notifikasi
- [x] RealtimeNotificationsProvider dibuat
- [x] Provider diintegrasikan di layout
- [ ] Script enable_realtime_notifications.sql dijalankan
- [ ] Realtime diaktifkan di Supabase Dashboard
- [ ] Test signup dan verifikasi notifikasi muncul
- [ ] Test browser notification permission

---

## 📚 Referensi

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Browser Notification API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [Sonner Toast Documentation](https://sonner.emilkowal.ski/)

---

## 🎉 Hasil Akhir

Setelah setup selesai, ketika user mendaftar:
1. ✅ Notifikasi selamat datang dibuat di database
2. ✅ Notifikasi muncul langsung di aplikasi (toast)
3. ✅ Notifikasi muncul di sistem operasi (browser push notification)
4. ✅ User bisa klik notifikasi untuk membuka aplikasi
5. ✅ Notifikasi real-time bekerja untuk semua notifikasi berikutnya


