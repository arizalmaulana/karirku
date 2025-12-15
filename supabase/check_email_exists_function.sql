-- ============================================
-- Function untuk mengecek apakah email sudah terdaftar di auth.users
-- Function ini dapat dipanggil dari client untuk mengecek email sebelum signup
-- ============================================

-- Function untuk mengecek apakah email sudah ada di auth.users
-- Menggunakan SECURITY DEFINER untuk mengakses auth.users
CREATE OR REPLACE FUNCTION public.check_email_exists(email_to_check text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Bypass RLS, run with creator's privileges untuk mengakses auth.users
STABLE
AS $$
BEGIN
    -- Cek apakah email sudah ada di auth.users
    RETURN EXISTS (
        SELECT 1 
        FROM auth.users 
        WHERE email = LOWER(TRIM(email_to_check))
    );
END;
$$;

-- Grant execute permission untuk semua user (authenticated dan anon)
GRANT EXECUTE ON FUNCTION public.check_email_exists(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_email_exists(text) TO anon;

-- Comment untuk dokumentasi
COMMENT ON FUNCTION public.check_email_exists(text) IS 
'Function untuk mengecek apakah email sudah terdaftar di auth.users. Dapat dipanggil dari client sebelum signup untuk mencegah duplikasi email.';


