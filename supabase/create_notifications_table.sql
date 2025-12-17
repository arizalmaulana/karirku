-- ============================================
--  Script untuk membuat tabel notifications
--  Jalankan di Supabase SQL Editor
-- ============================================

-- Buat tabel notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    message text NOT NULL,
    type text CHECK (type IN ('success', 'info', 'warning', 'error')) NOT NULL DEFAULT 'info',
    is_read boolean DEFAULT false,
    link text, -- URL untuk redirect jika notifikasi diklik
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Buat index untuk performa query
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: User hanya bisa membaca notifikasi mereka sendiri
CREATE POLICY "Users can read own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

-- Policy: User hanya bisa update notifikasi mereka sendiri (untuk mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: System bisa insert notifikasi (menggunakan service role)
-- Note: Untuk insert dari server-side, gunakan service role key
-- Atau bisa buat function dengan SECURITY DEFINER

-- Function untuk membuat notifikasi (bisa dipanggil dari server-side)
CREATE OR REPLACE FUNCTION public.create_notification(
    p_user_id uuid,
    p_title text,
    p_message text,
    p_type text DEFAULT 'info',
    p_link text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER -- Bypass RLS untuk insert
AS $$
DECLARE
    v_notification_id uuid;
BEGIN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (p_user_id, p_title, p_message, p_type, p_link)
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$;

-- Comment untuk dokumentasi
COMMENT ON TABLE public.notifications IS 'Tabel untuk menyimpan notifikasi pengguna';
COMMENT ON COLUMN public.notifications.type IS 'Tipe notifikasi: success, info, warning, error';
COMMENT ON COLUMN public.notifications.is_read IS 'Status apakah notifikasi sudah dibaca';
COMMENT ON COLUMN public.notifications.link IS 'URL untuk redirect jika notifikasi diklik';

