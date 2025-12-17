    -- ============================================
    --  Enable Realtime untuk Tabel Notifications
    --  Jalankan di Supabase SQL Editor
    -- ============================================

    -- Enable Realtime untuk tabel notifications
    -- Ini memungkinkan aplikasi menerima update real-time saat ada notifikasi baru
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

    -- Verifikasi bahwa Realtime sudah diaktifkan
    -- Cek di Supabase Dashboard → Database → Replication
    -- Pastikan tabel "notifications" muncul di daftar

    -- Catatan:
    -- 1. Realtime harus diaktifkan di Supabase Dashboard → Project Settings → API
    -- 2. Pastikan Realtime sudah diaktifkan untuk project Anda
    -- 3. Setelah menjalankan script ini, aplikasi akan menerima update real-time
    --    saat ada notifikasi baru yang ditambahkan ke tabel notifications


