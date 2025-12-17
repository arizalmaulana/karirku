# Test Notifikasi Real-Time di Localhost

## ✅ Bisa Di-Test di Localhost!

Semua fitur notifikasi real-time **BISA** diuji di localhost:

1. ✅ **Toast Notifications** - Bekerja di localhost
2. ✅ **Browser Push Notifications** - Bekerja di localhost (exception untuk HTTPS requirement)
3. ✅ **Real-time Subscription** - Bekerja di localhost
4. ✅ **Supabase Realtime** - Bekerja di localhost

---

## 🧪 Cara Test di Localhost

### 1. Pastikan Setup Sudah Lengkap

- [x] Tabel `notifications` sudah dibuat di Supabase
- [x] Realtime sudah diaktifkan untuk tabel `notifications`
- [x] Environment variables sudah di-set di `.env.local`
- [x] Aplikasi sudah running di localhost

### 2. Test Flow Lengkap

#### A. Test Signup dengan Notifikasi

1. **Buka aplikasi di browser** (misalnya: `http://localhost:3000`)
2. **Klik "Daftar"** atau buka register dialog
3. **Isi form registrasi** dengan email baru
4. **Klik "Daftar"**

**Yang Harus Terjadi:**
- ✅ Toast notification muncul: "Registrasi berhasil!"
- ✅ Browser akan meminta izin untuk notifications (jika pertama kali)
- ✅ Klik "Allow" untuk mengizinkan browser notifications
- ✅ Browser notification muncul di sistem operasi
- ✅ Notifikasi tersimpan di database

#### B. Test Real-Time Notifications

1. **Login dengan akun yang sudah dibuat**
2. **Buka browser DevTools** → **Console**
3. **Buat notifikasi baru** (bisa melalui API atau langsung di database)
4. **Notifikasi harus muncul real-time** tanpa refresh halaman

---

## 🔍 Verifikasi di Localhost

### 1. Cek Browser Console

Buka **Browser DevTools** → **Console**, cari:
- ✅ Tidak ada error terkait Supabase Realtime
- ✅ Log: "Subscribed to notifications channel"
- ✅ Log: "New notification received"

### 2. Cek Network Tab

Buka **Browser DevTools** → **Network**, cari:
- ✅ WebSocket connection ke Supabase Realtime
- ✅ Status: **101 Switching Protocols** (WebSocket connected)

### 3. Cek Database

Jalankan query di Supabase SQL Editor:

```sql
-- Cek notifikasi yang sudah dibuat
SELECT * FROM public.notifications 
ORDER BY created_at DESC 
LIMIT 10;
```

Pastikan notifikasi muncul di database setelah signup.

---

## 🎯 Test Scenarios

### Scenario 1: Signup dengan Email Baru

**Expected Result:**
1. User berhasil signup
2. Notifikasi "Selamat Datang" dibuat di database
3. Toast notification muncul di aplikasi
4. Browser notification muncul (jika diizinkan)

**Cek:**
- ✅ Database: Notifikasi ada di tabel `notifications`
- ✅ UI: Toast notification muncul
- ✅ Browser: System notification muncul (jika diizinkan)

### Scenario 2: Real-Time Update

**Steps:**
1. Login dengan akun yang sudah ada
2. Buka aplikasi di 2 tab browser berbeda
3. Di tab 1: Buat notifikasi baru (via API atau database)
4. Di tab 2: Notifikasi harus muncul otomatis tanpa refresh

**Expected Result:**
- ✅ Notifikasi muncul real-time di tab 2
- ✅ Tidak perlu refresh halaman
- ✅ Toast notification muncul otomatis

### Scenario 3: Browser Notification Permission

**Steps:**
1. Buka aplikasi di browser
2. Browser akan meminta izin untuk notifications
3. Klik "Allow"

**Expected Result:**
- ✅ Permission granted
- ✅ Browser notifications akan muncul untuk notifikasi berikutnya

**Test dengan Permission Denied:**
1. Klik "Block" atau deny permission
2. Buat notifikasi baru
3. **Expected:** Toast notification masih muncul, tapi browser notification tidak muncul

---

## 🐛 Troubleshooting di Localhost

### Browser Notification Tidak Muncul?

**Kemungkinan Penyebab:**
1. **Permission belum diizinkan**
   - Solusi: Klik icon 🔔 di address bar → Allow notifications
   - Atau: Settings → Site Settings → Notifications → Allow

2. **Browser tidak support**
   - Chrome, Firefox, Edge: ✅ Support
   - Safari: ⚠️ Limited support
   - Solusi: Gunakan Chrome atau Firefox untuk testing

3. **Do Not Disturb Mode**
   - Windows: Cek Notification Settings
   - Mac: Cek Do Not Disturb settings
   - Solusi: Matikan Do Not Disturb mode

### Real-Time Tidak Bekerja?

**Kemungkinan Penyebab:**
1. **Realtime belum diaktifkan**
   - Solusi: Jalankan script `enable_realtime_notifications.sql`

2. **WebSocket blocked**
   - Solusi: Cek firewall atau antivirus
   - Cek browser console untuk error

3. **User belum login**
   - Realtime hanya bekerja untuk authenticated users
   - Solusi: Pastikan user sudah login

### Toast Notification Tidak Muncul?

**Kemungkinan Penyebab:**
1. **Toaster belum di-render**
   - Solusi: Pastikan `<Toaster />` ada di `app/layout.tsx`

2. **Component belum di-mount**
   - Solusi: Pastikan `RealtimeNotificationsProvider` sudah di-render

3. **Error di console**
   - Solusi: Cek browser console untuk error

---

## 📊 Checklist Test di Localhost

### Pre-Test Checklist
- [ ] Aplikasi running di localhost (misalnya: `http://localhost:3000`)
- [ ] Environment variables sudah di-set
- [ ] Tabel `notifications` sudah dibuat
- [ ] Realtime sudah diaktifkan
- [ ] Browser console tidak ada error

### Test Checklist
- [ ] Signup berhasil membuat notifikasi di database
- [ ] Toast notification muncul saat signup
- [ ] Browser notification permission diminta
- [ ] Browser notification muncul setelah permission granted
- [ ] Real-time subscription bekerja (notifikasi muncul tanpa refresh)
- [ ] Notifikasi bisa di-mark as read
- [ ] Multiple tabs menerima notifikasi real-time

---

## 🎯 Tips Testing di Localhost

### 1. Gunakan Multiple Browser Tabs
- Buka aplikasi di 2-3 tab berbeda
- Test apakah notifikasi muncul di semua tab secara real-time

### 2. Test dengan Different Browsers
- Chrome: Full support
- Firefox: Full support
- Edge: Full support
- Safari: Limited support

### 3. Monitor Network Activity
- Buka DevTools → Network
- Filter: WS (WebSocket)
- Pastikan WebSocket connection aktif

### 4. Test Permission States
- Test dengan permission: Granted, Denied, Default
- Pastikan aplikasi handle semua states dengan benar

---

## 🚀 Next Steps Setelah Test di Localhost

Setelah semua test di localhost berhasil:

1. **Deploy ke Production**
   - Pastikan environment variables sudah di-set di production
   - Test lagi di production environment

2. **Monitor di Production**
   - Cek Supabase Dashboard → Logs
   - Monitor WebSocket connections
   - Cek error logs

3. **User Testing**
   - Test dengan real users
   - Collect feedback
   - Monitor notification delivery rate

---

## ✅ Kesimpulan

**Ya, semua fitur notifikasi real-time BISA diuji di localhost!**

- ✅ Toast notifications: Bekerja
- ✅ Browser push notifications: Bekerja (localhost adalah exception untuk HTTPS)
- ✅ Real-time subscription: Bekerja
- ✅ Supabase Realtime: Bekerja

**Tidak ada perbedaan** antara localhost dan production untuk testing notifikasi, kecuali:
- Production memerlukan HTTPS untuk browser notifications (localhost adalah exception)
- Production mungkin memiliki rate limiting yang berbeda

---

## 📚 Referensi

- [Browser Notification API - Localhost Exception](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [Supabase Realtime - Local Development](https://supabase.com/docs/guides/realtime)

