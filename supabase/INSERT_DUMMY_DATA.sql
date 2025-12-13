-- ============================================
--  INSERT DATA DUMMY UNTUK DATABASE KARIRKU
--  Jalankan di Supabase SQL Editor
--  
--  CATATAN PENTING:
--  1. Pastikan sudah ada beberapa user di auth.users
--  2. Untuk profiles, job_listings, dan applications, 
--     UUID akan diambil dari auth.users yang sudah ada
--  3. Jika belum ada user, buat dulu beberapa user via registrasi
--     atau gunakan Supabase Auth untuk membuat user
-- ============================================

-- ============================================
-- STEP 1: INSERT DATA LIVING COSTS (Lebih Banyak Kota)
-- ============================================

INSERT INTO public.living_costs (city, province, avg_rent, avg_food, avg_transport, salary_reference, currency)
VALUES
    -- Kota-kota besar di Indonesia
    ('Jakarta', 'DKI Jakarta', 4500000, 2500000, 800000, 12000000, 'IDR'),
    ('Bandung', 'Jawa Barat', 2500000, 2000000, 600000, 8000000, 'IDR'),
    ('Surabaya', 'Jawa Timur', 3000000, 2200000, 700000, 9000000, 'IDR'),
    ('Yogyakarta', 'DI Yogyakarta', 2000000, 1800000, 500000, 6000000, 'IDR'),
    ('Semarang', 'Jawa Tengah', 2200000, 1900000, 550000, 7000000, 'IDR'),
    ('Medan', 'Sumatera Utara', 2800000, 2100000, 650000, 8500000, 'IDR'),
    ('Makassar', 'Sulawesi Selatan', 2600000, 2000000, 600000, 7500000, 'IDR'),
    ('Palembang', 'Sumatera Selatan', 2400000, 1900000, 580000, 7200000, 'IDR'),
    ('Denpasar', 'Bali', 3200000, 2300000, 750000, 9500000, 'IDR'),
    ('Malang', 'Jawa Timur', 1800000, 1700000, 450000, 5500000, 'IDR'),
    ('Bogor', 'Jawa Barat', 2200000, 1900000, 600000, 7000000, 'IDR'),
    ('Depok', 'Jawa Barat', 2300000, 1950000, 620000, 7200000, 'IDR'),
    ('Tangerang', 'Banten', 2800000, 2100000, 700000, 8500000, 'IDR'),
    ('Bekasi', 'Jawa Barat', 2500000, 2000000, 650000, 7800000, 'IDR'),
    ('Solo', 'Jawa Tengah', 1700000, 1600000, 400000, 5000000, 'IDR')
ON CONFLICT DO NOTHING;

-- ============================================
-- STEP 2: AMBIL UUID DARI AUTH.USERS YANG SUDAH ADA
-- ============================================

-- Query untuk melihat user yang sudah ada (untuk referensi)
-- SELECT id, email FROM auth.users LIMIT 10;

-- ============================================
-- STEP 3: INSERT PROFILES DUMMY
-- ============================================
-- CATATAN: Ganti UUID di bawah dengan UUID dari auth.users yang sudah ada
-- Atau buat user baru terlebih dahulu via registrasi

-- Contoh: Ambil 3 user pertama sebagai recruiter, 5 user berikutnya sebagai jobseeker
-- Jika belum ada user, buat dulu beberapa user via Supabase Auth

DO $$
DECLARE
    recruiter1_id uuid;
    recruiter2_id uuid;
    recruiter3_id uuid;
    jobseeker1_id uuid;
    jobseeker2_id uuid;
    jobseeker3_id uuid;
    jobseeker4_id uuid;
    jobseeker5_id uuid;
    admin_id uuid;
BEGIN
    -- Ambil user yang sudah ada (ambil 3 pertama sebagai recruiter)
    SELECT id INTO recruiter1_id FROM auth.users ORDER BY created_at LIMIT 1 OFFSET 0;
    SELECT id INTO recruiter2_id FROM auth.users ORDER BY created_at LIMIT 1 OFFSET 1;
    SELECT id INTO recruiter3_id FROM auth.users ORDER BY created_at LIMIT 1 OFFSET 2;
    
    -- Ambil 5 user berikutnya sebagai jobseeker
    SELECT id INTO jobseeker1_id FROM auth.users ORDER BY created_at LIMIT 1 OFFSET 3;
    SELECT id INTO jobseeker2_id FROM auth.users ORDER BY created_at LIMIT 1 OFFSET 4;
    SELECT id INTO jobseeker3_id FROM auth.users ORDER BY created_at LIMIT 1 OFFSET 5;
    SELECT id INTO jobseeker4_id FROM auth.users ORDER BY created_at LIMIT 1 OFFSET 6;
    SELECT id INTO jobseeker5_id FROM auth.users ORDER BY created_at LIMIT 1 OFFSET 7;
    
    -- Ambil 1 user sebagai admin (atau buat manual)
    SELECT id INTO admin_id FROM auth.users ORDER BY created_at LIMIT 1 OFFSET 8;

    -- Insert profiles untuk recruiter (jika belum ada)
    IF recruiter1_id IS NOT NULL THEN
        INSERT INTO public.profiles (id, role, full_name, headline, location_city, email, phone, bio, company_license_url, is_approved)
        VALUES 
            (recruiter1_id, 'recruiter', 'Budi Santoso', 'HR Manager di TechCorp Indonesia', 'Jakarta', 'budi@techcorp.com', '081234567890', 
             'HR profesional dengan pengalaman 10 tahun di bidang rekrutmen teknologi', 'https://example.com/license1.pdf', true)
        ON CONFLICT (id) DO UPDATE SET
            role = 'recruiter',
            full_name = 'Budi Santoso',
            headline = 'HR Manager di TechCorp Indonesia',
            location_city = 'Jakarta',
            is_approved = true;
    END IF;

    IF recruiter2_id IS NOT NULL THEN
        INSERT INTO public.profiles (id, role, full_name, headline, location_city, email, phone, bio, company_license_url, is_approved)
        VALUES 
            (recruiter2_id, 'recruiter', 'Siti Nurhaliza', 'Recruiter di StartupHub', 'Bandung', 'siti@startuphub.com', '081234567891',
             'Spesialis rekrutmen untuk startup teknologi dan digital', 'https://example.com/license2.pdf', true)
        ON CONFLICT (id) DO UPDATE SET
            role = 'recruiter',
            full_name = 'Siti Nurhaliza',
            headline = 'Recruiter di StartupHub',
            location_city = 'Bandung',
            is_approved = true;
    END IF;

    IF recruiter3_id IS NOT NULL THEN
        INSERT INTO public.profiles (id, role, full_name, headline, location_city, email, phone, bio, company_license_url, is_approved)
        VALUES 
            (recruiter3_id, 'recruiter', 'Ahmad Fauzi', 'Talent Acquisition di FinanceApp', 'Surabaya', 'ahmad@financeapp.com', '081234567892',
             'Berpengalaman dalam rekrutmen untuk industri fintech dan perbankan', 'https://example.com/license3.pdf', true)
        ON CONFLICT (id) DO UPDATE SET
            role = 'recruiter',
            full_name = 'Ahmad Fauzi',
            headline = 'Talent Acquisition di FinanceApp',
            location_city = 'Surabaya',
            is_approved = true;
    END IF;

    -- Insert profiles untuk jobseeker (jika belum ada)
    IF jobseeker1_id IS NOT NULL THEN
        INSERT INTO public.profiles (id, role, full_name, headline, location_city, major, skills, email, phone, bio, experience, education, is_approved)
        VALUES 
            (jobseeker1_id, 'jobseeker', 'Rina Wijaya', 'Full Stack Developer', 'Jakarta', 'Teknik Informatika', 
             ARRAY['JavaScript', 'React', 'Node.js', 'PostgreSQL', 'TypeScript'],
             'rina@example.com', '081234567893',
             'Full stack developer dengan 3 tahun pengalaman membangun aplikasi web modern',
             'Software Developer di TechStart (2021-2024)', 'S1 Teknik Informatika - Universitas Indonesia')
        ON CONFLICT (id) DO UPDATE SET
            role = 'jobseeker',
            full_name = 'Rina Wijaya',
            headline = 'Full Stack Developer',
            is_approved = true;
    END IF;

    IF jobseeker2_id IS NOT NULL THEN
        INSERT INTO public.profiles (id, role, full_name, headline, location_city, major, skills, email, phone, bio, experience, education, is_approved)
        VALUES 
            (jobseeker2_id, 'jobseeker', 'Dedi Kurniawan', 'Frontend Developer', 'Bandung', 'Teknik Informatika',
             ARRAY['React', 'Vue.js', 'CSS', 'HTML', 'JavaScript'],
             'dedi@example.com', '081234567894',
             'Frontend developer passionate tentang UI/UX dan user experience',
             'Frontend Developer di Digital Agency (2020-2023)', 'S1 Teknik Informatika - ITB')
        ON CONFLICT (id) DO UPDATE SET
            role = 'jobseeker',
            full_name = 'Dedi Kurniawan',
            headline = 'Frontend Developer',
            is_approved = true;
    END IF;

    IF jobseeker3_id IS NOT NULL THEN
        INSERT INTO public.profiles (id, role, full_name, headline, location_city, major, skills, email, phone, bio, experience, education, is_approved)
        VALUES 
            (jobseeker3_id, 'jobseeker', 'Maya Sari', 'Data Analyst', 'Jakarta', 'Statistika',
             ARRAY['Python', 'SQL', 'Tableau', 'Excel', 'Machine Learning'],
             'maya@example.com', '081234567895',
             'Data analyst dengan keahlian dalam analisis data dan visualisasi',
             'Data Analyst di E-commerce Company (2022-2024)', 'S1 Statistika - IPB')
        ON CONFLICT (id) DO UPDATE SET
            role = 'jobseeker',
            full_name = 'Maya Sari',
            headline = 'Data Analyst',
            is_approved = true;
    END IF;

    IF jobseeker4_id IS NOT NULL THEN
        INSERT INTO public.profiles (id, role, full_name, headline, location_city, major, skills, email, phone, bio, experience, education, is_approved)
        VALUES 
            (jobseeker4_id, 'jobseeker', 'Fajar Pratama', 'Backend Developer', 'Surabaya', 'Teknik Informatika',
             ARRAY['Java', 'Spring Boot', 'PostgreSQL', 'Docker', 'Kubernetes'],
             'fajar@example.com', '081234567896',
             'Backend developer dengan fokus pada scalable system architecture',
             'Backend Developer di Fintech Startup (2021-2024)', 'S1 Teknik Informatika - ITS')
        ON CONFLICT (id) DO UPDATE SET
            role = 'jobseeker',
            full_name = 'Fajar Pratama',
            headline = 'Backend Developer',
            is_approved = true;
    END IF;

    IF jobseeker5_id IS NOT NULL THEN
        INSERT INTO public.profiles (id, role, full_name, headline, location_city, major, skills, email, phone, bio, experience, education, is_approved)
        VALUES 
            (jobseeker5_id, 'jobseeker', 'Lina Permata', 'UI/UX Designer', 'Yogyakarta', 'Desain Komunikasi Visual',
             ARRAY['Figma', 'Adobe XD', 'Sketch', 'User Research', 'Prototyping'],
             'lina@example.com', '081234567897',
             'UI/UX designer dengan passion untuk menciptakan pengalaman pengguna yang luar biasa',
             'UI/UX Designer di Design Studio (2020-2023)', 'S1 Desain Komunikasi Visual - ISI Yogyakarta')
        ON CONFLICT (id) DO UPDATE SET
            role = 'jobseeker',
            full_name = 'Lina Permata',
            headline = 'UI/UX Designer',
            is_approved = true;
    END IF;

    -- Insert admin profile (jika belum ada)
    IF admin_id IS NOT NULL THEN
        INSERT INTO public.profiles (id, role, full_name, headline, location_city, email, is_approved)
        VALUES 
            (admin_id, 'admin', 'Admin KarirKu', 'System Administrator', 'Jakarta', 'admin@karirku.com', true)
        ON CONFLICT (id) DO UPDATE SET
            role = 'admin',
            is_approved = true;
    END IF;

END $$;

-- ============================================
-- STEP 4: INSERT JOB LISTINGS DUMMY
-- ============================================

DO $$
DECLARE
    recruiter1_id uuid;
    recruiter2_id uuid;
    recruiter3_id uuid;
    jakarta_living_cost_id uuid;
    bandung_living_cost_id uuid;
    surabaya_living_cost_id uuid;
    yogyakarta_living_cost_id uuid;
BEGIN
    -- Ambil recruiter IDs
    SELECT id INTO recruiter1_id FROM public.profiles WHERE role = 'recruiter' LIMIT 1 OFFSET 0;
    SELECT id INTO recruiter2_id FROM public.profiles WHERE role = 'recruiter' LIMIT 1 OFFSET 1;
    SELECT id INTO recruiter3_id FROM public.profiles WHERE role = 'recruiter' LIMIT 1 OFFSET 2;
    
    -- Ambil living cost IDs
    SELECT id INTO jakarta_living_cost_id FROM public.living_costs WHERE city = 'Jakarta' LIMIT 1;
    SELECT id INTO bandung_living_cost_id FROM public.living_costs WHERE city = 'Bandung' LIMIT 1;
    SELECT id INTO surabaya_living_cost_id FROM public.living_costs WHERE city = 'Surabaya' LIMIT 1;
    SELECT id INTO yogyakarta_living_cost_id FROM public.living_costs WHERE city = 'Yogyakarta' LIMIT 1;

    -- Insert job listings jika recruiter ada
    IF recruiter1_id IS NOT NULL THEN
        INSERT INTO public.job_listings (
            recruiter_id, title, company_name, location_city, location_province,
            employment_type, min_salary, max_salary, currency, description,
            requirements, skills_required, major_required, category, job_level,
            living_cost_id, featured
        ) VALUES
        (
            recruiter1_id, 
            'Senior Full Stack Developer',
            'TechCorp Indonesia',
            'Jakarta',
            'DKI Jakarta',
            'fulltime',
            12000000,
            20000000,
            'IDR',
            'Kami mencari Senior Full Stack Developer yang berpengalaman untuk bergabung dengan tim teknologi kami. Anda akan bertanggung jawab untuk mengembangkan dan memelihara aplikasi web modern menggunakan teknologi terbaru.',
            ARRAY['Minimal 3 tahun pengalaman sebagai Full Stack Developer', 'Menguasai JavaScript/TypeScript', 'Pengalaman dengan React dan Node.js', 'Familiar dengan database PostgreSQL', 'Memahami cloud infrastructure (AWS/GCP)'],
            ARRAY['JavaScript', 'TypeScript', 'React', 'Node.js', 'PostgreSQL', 'AWS'],
            'Teknik Informatika',
            'Software Engineering',
            'Senior',
            jakarta_living_cost_id,
            true
        ),
        (
            recruiter1_id,
            'Frontend Developer',
            'TechCorp Indonesia',
            'Jakarta',
            'DKI Jakarta',
            'fulltime',
            8000000,
            15000000,
            'IDR',
            'Bergabunglah dengan tim frontend kami untuk membangun user interface yang menarik dan responsif. Kami mencari developer yang passionate tentang UI/UX dan modern web technologies.',
            ARRAY['Minimal 2 tahun pengalaman sebagai Frontend Developer', 'Menguasai React atau Vue.js', 'Memahami CSS dan styling modern', 'Pengalaman dengan state management'],
            ARRAY['React', 'Vue.js', 'JavaScript', 'CSS', 'HTML', 'TypeScript'],
            'Teknik Informatika',
            'Software Engineering',
            'Mid',
            jakarta_living_cost_id,
            false
        ),
        (
            recruiter1_id,
            'Backend Developer (Remote)',
            'TechCorp Indonesia',
            'Jakarta',
            'DKI Jakarta',
            'remote',
            10000000,
            18000000,
            'IDR',
            'Posisi remote untuk Backend Developer yang berpengalaman. Anda akan bekerja dari rumah dan fokus pada pengembangan API dan sistem backend yang scalable.',
            ARRAY['Minimal 3 tahun pengalaman sebagai Backend Developer', 'Menguasai Node.js atau Java', 'Pengalaman dengan microservices architecture', 'Familiar dengan Docker dan Kubernetes'],
            ARRAY['Node.js', 'Java', 'PostgreSQL', 'Docker', 'Kubernetes', 'REST API'],
            'Teknik Informatika',
            'Software Engineering',
            'Senior',
            jakarta_living_cost_id,
            true
        );
    END IF;

    IF recruiter2_id IS NOT NULL THEN
        INSERT INTO public.job_listings (
            recruiter_id, title, company_name, location_city, location_province,
            employment_type, min_salary, max_salary, currency, description,
            requirements, skills_required, major_required, category, job_level,
            living_cost_id, featured
        ) VALUES
        (
            recruiter2_id,
            'UI/UX Designer',
            'StartupHub',
            'Bandung',
            'Jawa Barat',
            'fulltime',
            7000000,
            12000000,
            'IDR',
            'Kami mencari UI/UX Designer yang kreatif untuk membantu merancang produk digital yang user-friendly. Anda akan bekerja sama dengan tim product dan engineering.',
            ARRAY['Minimal 2 tahun pengalaman sebagai UI/UX Designer', 'Menguasai Figma atau Adobe XD', 'Memahami prinsip design thinking', 'Portfolio yang kuat'],
            ARRAY['Figma', 'Adobe XD', 'User Research', 'Prototyping', 'Design System'],
            'Desain Komunikasi Visual',
            'Design',
            'Mid',
            bandung_living_cost_id,
            false
        ),
        (
            recruiter2_id,
            'Data Analyst',
            'StartupHub',
            'Bandung',
            'Jawa Barat',
            'fulltime',
            8000000,
            14000000,
            'IDR',
            'Bergabunglah dengan tim data analytics kami untuk menganalisis data bisnis dan memberikan insights yang actionable. Anda akan bekerja dengan berbagai tools analytics modern.',
            ARRAY['Minimal 2 tahun pengalaman sebagai Data Analyst', 'Menguasai SQL dan Python', 'Pengalaman dengan data visualization tools', 'Memahami statistik dan business intelligence'],
            ARRAY['SQL', 'Python', 'Tableau', 'Excel', 'Data Analysis', 'Statistics'],
            'Statistika',
            'Data & Analytics',
            'Mid',
            bandung_living_cost_id,
            false
        ),
        (
            recruiter2_id,
            'Product Manager',
            'StartupHub',
            'Bandung',
            'Jawa Barat',
            'hybrid',
            15000000,
            25000000,
            'IDR',
            'Kami mencari Product Manager yang berpengalaman untuk memimpin pengembangan produk digital. Anda akan bertanggung jawab untuk product roadmap dan strategi produk.',
            ARRAY['Minimal 4 tahun pengalaman sebagai Product Manager', 'Memahami agile methodology', 'Strong analytical skills', 'Excellent communication skills'],
            ARRAY['Product Management', 'Agile', 'Analytics', 'Strategy', 'Stakeholder Management'],
            'Manajemen',
            'Product',
            'Senior',
            bandung_living_cost_id,
            true
        );
    END IF;

    IF recruiter3_id IS NOT NULL THEN
        INSERT INTO public.job_listings (
            recruiter_id, title, company_name, location_city, location_province,
            employment_type, min_salary, max_salary, currency, description,
            requirements, skills_required, major_required, category, job_level,
            living_cost_id, featured
        ) VALUES
        (
            recruiter3_id,
            'Full Stack Developer',
            'FinanceApp',
            'Surabaya',
            'Jawa Timur',
            'fulltime',
            9000000,
            16000000,
            'IDR',
            'Bergabunglah dengan tim development FinanceApp untuk membangun aplikasi fintech yang inovatif. Kami mencari developer yang passionate tentang teknologi finansial.',
            ARRAY['Minimal 2 tahun pengalaman sebagai Full Stack Developer', 'Menguasai JavaScript/TypeScript', 'Pengalaman dengan React dan Node.js', 'Memahami security best practices'],
            ARRAY['JavaScript', 'TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Security'],
            'Teknik Informatika',
            'Software Engineering',
            'Mid',
            surabaya_living_cost_id,
            false
        ),
        (
            recruiter3_id,
            'DevOps Engineer',
            'FinanceApp',
            'Surabaya',
            'Jawa Timur',
            'fulltime',
            11000000,
            19000000,
            'IDR',
            'Kami mencari DevOps Engineer untuk mengelola infrastructure dan CI/CD pipeline. Anda akan memastikan sistem berjalan dengan lancar dan scalable.',
            ARRAY['Minimal 3 tahun pengalaman sebagai DevOps Engineer', 'Menguasai Docker dan Kubernetes', 'Pengalaman dengan cloud platforms (AWS/GCP)', 'Familiar dengan CI/CD tools'],
            ARRAY['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Terraform', 'Monitoring'],
            'Teknik Informatika',
            'DevOps',
            'Senior',
            surabaya_living_cost_id,
            true
        ),
        (
            recruiter3_id,
            'Mobile Developer (React Native)',
            'FinanceApp',
            'Surabaya',
            'Jawa Timur',
            'contract',
            8500000,
            15000000,
            'IDR',
            'Posisi kontrak untuk Mobile Developer yang berpengalaman dengan React Native. Anda akan mengembangkan aplikasi mobile untuk platform iOS dan Android.',
            ARRAY['Minimal 2 tahun pengalaman sebagai Mobile Developer', 'Menguasai React Native', 'Pengalaman dengan native modules', 'Memahami mobile app architecture'],
            ARRAY['React Native', 'JavaScript', 'iOS', 'Android', 'Mobile Development'],
            'Teknik Informatika',
            'Software Engineering',
            'Mid',
            surabaya_living_cost_id,
            false
        );
    END IF;

END $$;

-- ============================================
-- STEP 5: INSERT APPLICATIONS DUMMY
-- ============================================

DO $$
DECLARE
    job1_id uuid;
    job2_id uuid;
    job3_id uuid;
    job4_id uuid;
    jobseeker1_id uuid;
    jobseeker2_id uuid;
    jobseeker3_id uuid;
    jobseeker4_id uuid;
    jobseeker5_id uuid;
BEGIN
    -- Ambil job IDs
    SELECT id INTO job1_id FROM public.job_listings ORDER BY created_at LIMIT 1 OFFSET 0;
    SELECT id INTO job2_id FROM public.job_listings ORDER BY created_at LIMIT 1 OFFSET 1;
    SELECT id INTO job3_id FROM public.job_listings ORDER BY created_at LIMIT 1 OFFSET 2;
    SELECT id INTO job4_id FROM public.job_listings ORDER BY created_at LIMIT 1 OFFSET 3;
    
    -- Ambil jobseeker IDs
    SELECT id INTO jobseeker1_id FROM public.profiles WHERE role = 'jobseeker' LIMIT 1 OFFSET 0;
    SELECT id INTO jobseeker2_id FROM public.profiles WHERE role = 'jobseeker' LIMIT 1 OFFSET 1;
    SELECT id INTO jobseeker3_id FROM public.profiles WHERE role = 'jobseeker' LIMIT 1 OFFSET 2;
    SELECT id INTO jobseeker4_id FROM public.profiles WHERE role = 'jobseeker' LIMIT 1 OFFSET 3;
    SELECT id INTO jobseeker5_id FROM public.profiles WHERE role = 'jobseeker' LIMIT 1 OFFSET 4;

    -- Insert applications jika job dan jobseeker ada
    IF job1_id IS NOT NULL AND jobseeker1_id IS NOT NULL THEN
        INSERT INTO public.applications (job_id, job_seeker_id, status, cover_letter, cv_url, portfolio_url)
        VALUES 
            (job1_id, jobseeker1_id, 'submitted', 
             'Saya sangat tertarik dengan posisi Senior Full Stack Developer di TechCorp Indonesia. Dengan pengalaman 3 tahun sebagai Full Stack Developer, saya yakin dapat memberikan kontribusi yang berarti untuk tim.',
             'https://example.com/cv/rina.pdf', 'https://github.com/rina'),
            (job1_id, jobseeker2_id, 'review',
             'Saya ingin melamar posisi ini karena sesuai dengan passion saya di bidang frontend development.',
             'https://example.com/cv/dedi.pdf', 'https://github.com/dedi');
    END IF;

    IF job2_id IS NOT NULL AND jobseeker2_id IS NOT NULL THEN
        INSERT INTO public.applications (job_id, job_seeker_id, status, cover_letter, cv_url)
        VALUES 
            (job2_id, jobseeker2_id, 'submitted',
             'Saya tertarik dengan posisi Frontend Developer karena sesuai dengan skill dan passion saya.',
             'https://example.com/cv/dedi.pdf');
    END IF;

    IF job3_id IS NOT NULL AND jobseeker3_id IS NOT NULL THEN
        INSERT INTO public.applications (job_id, job_seeker_id, status, cover_letter, cv_url)
        VALUES 
            (job3_id, jobseeker3_id, 'interview',
             'Dengan latar belakang sebagai Data Analyst, saya yakin dapat memberikan value untuk tim analytics StartupHub.',
             'https://example.com/cv/maya.pdf');
    END IF;

    IF job4_id IS NOT NULL AND jobseeker4_id IS NOT NULL THEN
        INSERT INTO public.applications (job_id, job_seeker_id, status, cover_letter, cv_url, portfolio_url)
        VALUES 
            (job4_id, jobseeker4_id, 'submitted',
             'Saya sangat tertarik dengan posisi Backend Developer remote di TechCorp. Pengalaman saya dengan Node.js dan microservices sangat sesuai dengan requirement.',
             'https://example.com/cv/fajar.pdf', 'https://github.com/fajar');
    END IF;

    -- Beberapa aplikasi dengan status berbeda
    IF job1_id IS NOT NULL AND jobseeker5_id IS NOT NULL THEN
        INSERT INTO public.applications (job_id, job_seeker_id, status, cover_letter, cv_url, portfolio_url)
        VALUES 
            (job1_id, jobseeker5_id, 'rejected',
             'Saya melamar posisi ini meskipun background saya lebih ke design, karena saya ingin belajar lebih banyak tentang development.',
             'https://example.com/cv/lina.pdf', 'https://behance.net/lina');
    END IF;

END $$;

-- ============================================
-- STEP 6: VERIFIKASI DATA
-- ============================================

-- Cek jumlah data yang sudah diinsert
SELECT 'Living Costs' as table_name, COUNT(*) as count FROM public.living_costs
UNION ALL
SELECT 'Profiles', COUNT(*) FROM public.profiles
UNION ALL
SELECT 'Job Listings', COUNT(*) FROM public.job_listings
UNION ALL
SELECT 'Applications', COUNT(*) FROM public.applications;

-- Tampilkan beberapa data untuk verifikasi
SELECT '=== LIVING COSTS ===' as info;
SELECT city, province, salary_reference FROM public.living_costs ORDER BY city LIMIT 5;

SELECT '=== PROFILES ===' as info;
SELECT role, full_name, headline, location_city FROM public.profiles ORDER BY role, full_name LIMIT 10;

SELECT '=== JOB LISTINGS ===' as info;
SELECT title, company_name, location_city, employment_type, min_salary, max_salary FROM public.job_listings ORDER BY created_at LIMIT 10;

SELECT '=== APPLICATIONS ===' as info;
SELECT status, COUNT(*) as count FROM public.applications GROUP BY status;

-- ============================================
-- CATATAN PENTING:
-- ============================================
-- 1. Script ini akan otomatis mengambil user dari auth.users
-- 2. Jika belum ada user di auth.users, buat dulu beberapa user via:
--    - Registrasi di aplikasi
--    - Supabase Dashboard > Authentication > Users > Add User
--    - Atau menggunakan Supabase Auth API
-- 3. Untuk membuat user admin, jalankan:
--    UPDATE public.profiles SET role = 'admin', is_approved = true WHERE id = 'USER_ID';
-- 4. Data dummy ini akan diinsert dengan ON CONFLICT, jadi aman untuk dijalankan berulang kali
-- 5. Jika ingin menambah lebih banyak data, copy-paste dan modifikasi bagian INSERT

