# Implementasi Notifikasi untuk Konfirmasi Email

## ✅ Fitur yang Telah Diimplementasikan

### 1. Tabel Notifikasi di Database
- ✅ Tabel `notifications` untuk menyimpan notifikasi persistent
- ✅ Function `create_notification` untuk membuat notifikasi dari server-side
- ✅ RLS policies untuk keamanan data

**File:** `supabase/create_notifications_table.sql`

### 2. Notifikasi saat Konfirmasi Email Berhasil
- ✅ Modifikasi callback route untuk membuat notifikasi di database
- ✅ Redirect dengan query parameter untuk toast notification
- ✅ Komponen `EmailConfirmationToast` untuk menampilkan toast

**File yang dimodifikasi:**
- `app/auth/callback/route.ts` - Menambahkan pembuatan notifikasi
- `components/EmailConfirmationToast.tsx` - Komponen toast notification

### 3. Integrasi di Dashboard
- ✅ Menambahkan `EmailConfirmationToast` di semua dashboard:
  - Job Seeker Dashboard (`app/job-seeker/dashboard/page.tsx`)
  - Recruiter Dashboard (`app/recruiter/dashboard/page.tsx`)
  - Admin Dashboard (`app/admin/dashboard/page.tsx`)

### 4. Komponen Notifikasi List (Opsional)
- ✅ Komponen `NotificationsList` untuk menampilkan notifikasi dari database
- ✅ Fitur mark as read
- ✅ Tampilan dengan icon dan badge sesuai tipe

**File:** `components/NotificationsList.tsx`

---

## 📋 Langkah Setup

### 1. Buat Tabel Notifikasi di Supabase

Jalankan script SQL berikut di Supabase SQL Editor:

```sql
-- File: supabase/create_notifications_table.sql
```

Atau copy-paste isi file `supabase/create_notifications_table.sql` ke Supabase SQL Editor dan jalankan.

### 2. Pastikan Environment Variables

Pastikan file `.env.local` memiliki:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Untuk membuat notifikasi dari server-side
```

### 3. Test Konfirmasi Email

1. Signup dengan email baru
2. Buka email konfirmasi
3. Klik link konfirmasi
4. Akan di-redirect ke dashboard dengan:
   - ✅ Toast notification muncul
   - ✅ Notifikasi tersimpan di database

---

## 🎯 Cara Kerja

### Flow Konfirmasi Email dengan Notifikasi

1. **User klik link konfirmasi email**
   - Link mengarah ke `/auth/callback?code=...`

2. **Callback route memproses konfirmasi**
   - Exchange code untuk session
   - Verifikasi user
   - **Membuat notifikasi di database** (menggunakan service role)
   - Redirect ke dashboard dengan query parameter `?emailConfirmed=true`

3. **Dashboard menampilkan toast**
   - Komponen `EmailConfirmationToast` membaca query parameter
   - Menampilkan toast notification
   - Menghapus query parameter dari URL

4. **Notifikasi tersimpan di database**
   - Bisa ditampilkan di dashboard menggunakan `NotificationsList`
   - User bisa mark as read
   - Notifikasi persistent (tidak hilang saat refresh)

---

## 📝 Penggunaan Komponen

### EmailConfirmationToast (Sudah Terintegrasi)

Komponen ini sudah ditambahkan di semua dashboard. Tidak perlu melakukan apa-apa lagi.

### NotificationsList (Opsional)

Jika ingin menampilkan daftar notifikasi di dashboard, tambahkan komponen ini:

```tsx
import { NotificationsList } from "@/components/NotificationsList";

// Di dalam dashboard component
<NotificationsList />
```

---

## 🔧 Membuat Notifikasi Manual

Jika ingin membuat notifikasi dari kode lain, gunakan function `create_notification`:

```typescript
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const adminClient = createSupabaseAdminClient();
if (adminClient) {
  await adminClient.rpc('create_notification', {
    p_user_id: userId,
    p_title: 'Judul Notifikasi',
    p_message: 'Pesan notifikasi',
    p_type: 'success', // 'success' | 'info' | 'warning' | 'error'
    p_link: '/path/to/page' // Opsional
  });
}
```

---

## 🎨 Tipe Notifikasi

- **success**: Notifikasi sukses (hijau)
- **info**: Informasi umum (biru)
- **warning**: Peringatan (kuning)
- **error**: Error (merah)

---

## 📊 Database Schema

```sql
notifications (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  title text NOT NULL,
  message text NOT NULL,
  type text CHECK (type IN ('success', 'info', 'warning', 'error')),
  is_read boolean DEFAULT false,
  link text,
  created_at timestamptz DEFAULT now()
)
```

---

## ✅ Checklist

- [x] Tabel notifikasi dibuat di database
- [x] Function create_notification dibuat
- [x] Callback route dimodifikasi
- [x] Komponen EmailConfirmationToast dibuat
- [x] Toast terintegrasi di semua dashboard
- [x] Komponen NotificationsList dibuat (opsional)
- [ ] Test end-to-end flow
- [ ] Tambahkan NotificationsList ke dashboard (opsional)

---

## 🐛 Troubleshooting

### Notifikasi tidak muncul di database?

1. **Cek Service Role Key**
   - Pastikan `SUPABASE_SERVICE_ROLE_KEY` ada di `.env.local`
   - Pastikan key valid

2. **Cek Function create_notification**
   - Pastikan function sudah dibuat di database
   - Test function langsung di Supabase SQL Editor

3. **Cek Logs**
   - Lihat console log di server
   - Cek Supabase Logs → Auth Logs

### Toast tidak muncul?

1. **Cek Query Parameter**
   - Pastikan redirect URL memiliki `?emailConfirmed=true`
   - Cek di browser address bar

2. **Cek Komponen**
   - Pastikan `EmailConfirmationToast` sudah ditambahkan di dashboard
   - Pastikan `Toaster` sudah ada di `app/layout.tsx`

3. **Cek Suspense**
   - Pastikan komponen menggunakan Suspense boundary
   - Cek console untuk error

---

## 📚 Referensi

- [Supabase Auth Callbacks](https://supabase.com/docs/guides/auth/auth-callbacks)
- [Sonner Toast Documentation](https://sonner.emilkowal.ski/)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)

