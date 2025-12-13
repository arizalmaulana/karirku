-- ============================================
--  Diagnostic Queries untuk Troubleshooting
--  Jalankan query ini untuk cek masalah
-- ============================================

-- 1. Cek semua profiles dan status mereka
SELECT 
    p.id,
    p.role,
    p.full_name,
    p.email,
    p.is_approved,
    p.company_license_url,
    p.created_at,
    CASE 
        WHEN p.role = 'admin' AND (p.is_approved IS NULL OR p.is_approved = false) THEN '❌ Admin harus approved'
        WHEN p.role = 'jobseeker' AND (p.is_approved IS NULL OR p.is_approved = false) THEN '❌ Jobseeker harus approved'
        WHEN p.role = 'recruiter' AND p.is_approved IS NULL THEN '❌ Recruiter is_approved NULL'
        WHEN p.role = 'recruiter' AND p.is_approved = false AND p.company_license_url IS NULL THEN '⚠️ Recruiter belum upload license'
        WHEN p.role = 'recruiter' AND p.is_approved = false AND p.company_license_url IS NOT NULL THEN '⏳ Recruiter menunggu approval'
        WHEN p.role = 'recruiter' AND p.is_approved = true THEN '✅ Recruiter approved'
        ELSE '✅ OK'
    END as status
FROM public.profiles p
ORDER BY p.created_at DESC;

-- 2. Cek user yang ada di auth.users tapi tidak punya profile
SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data->>'role' as role_from_metadata,
    u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 3. Cek jumlah per role
SELECT 
    role,
    COUNT(*) as total,
    COUNT(CASE WHEN is_approved = true THEN 1 END) as approved,
    COUNT(CASE WHEN is_approved = false THEN 1 END) as not_approved,
    COUNT(CASE WHEN is_approved IS NULL THEN 1 END) as null_approved
FROM public.profiles
GROUP BY role;

-- 4. Cek RLS policies untuk profiles
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'profiles';

-- 5. Test query sebagai user tertentu (ganti user_id)
-- SELECT * FROM public.profiles WHERE id = 'USER_ID_HERE';

