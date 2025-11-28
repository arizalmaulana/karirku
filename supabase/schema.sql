-- ============================================
--  Supabase Schema untuk Platform KarirKu
--  Jalankan per blok menggunakan SQL editor
-- ============================================

-- 1. ENUM untuk status lamaran dan tipe kerja
create type application_status as enum ('draft', 'submitted', 'review', 'interview', 'accepted', 'rejected');
create type employment_type as enum ('fulltime', 'parttime', 'contract', 'internship', 'remote', 'hybrid');

-- 2. Tabel profil pengguna (reference ke auth.users)
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    role text check (role in ('jobseeker', 'recruiter', 'admin')) not null default 'jobseeker',
    full_name text,
    headline text,
    location_city text,
    skills text[] default '{}',
    created_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles enable row level security;

create policy "Public read own profile"
    on public.profiles for select
    using (auth.uid() = id);

create policy "Users insert own profile"
    on public.profiles for insert
    with check (auth.uid() = id);

create policy "Users update own profile"
    on public.profiles for update
    using (auth.uid() = id);

-- 3. Table biaya hidup per kota
create table if not exists public.living_costs (
    id uuid primary key default gen_random_uuid(),
    city text not null,
    province text not null,
    avg_rent integer,
    avg_food integer,
    avg_transport integer,
    salary_reference integer,
    currency char(3) not null default 'IDR',
    updated_at timestamptz not null default timezone('utc', now())
);

alter table public.living_costs enable row level security;

create policy "Admin manage living costs"
    on public.living_costs for all
    using (exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'admin'
    ));

create policy "Everyone can read living costs"
    on public.living_costs for select
    using (true);

-- 4. Table lowongan pekerjaan
create table if not exists public.job_listings (
    id uuid primary key default gen_random_uuid(),
    recruiter_id uuid references public.profiles(id) on delete set null,
    title text not null,
    company_name text not null,
    location_city text not null,
    location_province text,
    employment_type employment_type not null default 'fulltime',
    min_salary integer,
    max_salary integer,
    currency char(3) default 'IDR',
    description text,
    requirements text[],
    skills_required text[],
    living_cost_id uuid references public.living_costs(id),
    featured boolean default false,
    created_at timestamptz not null default timezone('utc', now())
);

alter table public.job_listings enable row level security;

create policy "Recruiter manage own jobs"
    on public.job_listings for all
    using (
        recruiter_id = auth.uid()
        or exists(select 1 from public.profiles where id = auth.uid() and role = 'admin')
    );

create policy "Everyone can read jobs"
    on public.job_listings for select
    using (true);

-- 5. Table lamaran
create table if not exists public.applications (
    id uuid primary key default gen_random_uuid(),
    job_id uuid not null references public.job_listings(id) on delete cascade,
    job_seeker_id uuid not null references public.profiles(id) on delete cascade,
    status application_status not null default 'submitted',
    cv_url text,
    portfolio_url text,
    cover_letter text,
    submitted_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

alter table public.applications enable row level security;

create policy "Owner can manage their applications"
    on public.applications for all
    using (auth.uid() = job_seeker_id);

create policy "Recruiter/Admin view applications for their jobs"
    on public.applications for select
    using (
        auth.uid() = job_seeker_id
        or exists(
            select 1
            from public.job_listings jl
            where jl.id = job_id
            and (jl.recruiter_id = auth.uid() or exists(
                select 1 from public.profiles where id = auth.uid() and role = 'admin'
            ))
        )
    );

-- 6. Sample Data (opsional)
insert into public.living_costs (city, province, avg_rent, avg_food, avg_transport, salary_reference)
values
    ('Jakarta', 'DKI Jakarta', 4500000, 2500000, 800000, 12000000),
    ('Bandung', 'Jawa Barat', 2500000, 2000000, 600000, 8000000),
    ('Surabaya', 'Jawa Timur', 3000000, 2200000, 700000, 9000000)
on conflict do nothing;

-- contoh job listing dasar
insert into public.job_listings
    (recruiter_id, title, company_name, location_city, location_province, employment_type, min_salary, max_salary, description, requirements, skills_required)
values
    (null, 'Frontend Engineer', 'TechCorp Indonesia', 'Jakarta', 'DKI Jakarta', 'fulltime', 12000000, 18000000, 'Membangun interface web modern.', ARRAY['3+ tahun pengalaman', 'Menguasai React'], ARRAY['React', 'TypeScript', 'UI/UX']),
    (null, 'Product Designer', 'Creative Studio', 'Bandung', 'Jawa Barat', 'hybrid', 9000000, 14000000, 'Merancang pengalaman produk end-to-end.', ARRAY['Portfolio kuat', 'Familiar design system'], ARRAY['Figma', 'Design Thinking'])
on conflict do nothing;

