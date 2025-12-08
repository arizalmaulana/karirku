-- ============================================
--  Tambahan Field untuk Filter dan Search
--  Jalankan di Supabase SQL Editor
-- ============================================

-- 1. Tambahkan ENUM untuk job category
create type job_category as enum ('Technology', 'Design', 'Marketing', 'Business', 'Finance', 'Healthcare', 'Education', 'Other');

-- 2. Tambahkan ENUM untuk job level
create type job_level as enum ('Entry Level', 'Mid Level', 'Senior Level', 'Executive');

-- 3. Tambahkan kolom category dan job_level ke tabel job_listings
alter table public.job_listings
add column if not exists category job_category,
add column if not exists job_level job_level;

-- 4. Update data existing berdasarkan logic yang ada
-- Category: berdasarkan skills_required dan title
update public.job_listings
set category = case
    when title ilike '%developer%' or title ilike '%engineer%' or title ilike '%programmer%' 
         or exists (select 1 from unnest(skills_required) as skill where skill ilike '%react%' or skill ilike '%javascript%' or skill ilike '%python%' or skill ilike '%node%')
    then 'Technology'::job_category
    when title ilike '%designer%' or title ilike '%design%'
         or exists (select 1 from unnest(skills_required) as skill where skill ilike '%figma%' or skill ilike '%ui%' or skill ilike '%ux%')
    then 'Design'::job_category
    when title ilike '%marketing%' or title ilike '%content%' or title ilike '%seo%'
         or exists (select 1 from unnest(skills_required) as skill where skill ilike '%marketing%' or skill ilike '%seo%')
    then 'Marketing'::job_category
    when title ilike '%manager%' or title ilike '%business%' or title ilike '%product%' or title ilike '%sales%'
    then 'Business'::job_category
    when title ilike '%finance%' or title ilike '%accountant%' or title ilike '%fintech%'
    then 'Finance'::job_category
    else 'Technology'::job_category
end
where category is null;

-- Level: berdasarkan title dan requirements
update public.job_listings
set job_level = case
    when title ilike '%senior%' or title ilike '%lead%' or title ilike '%principal%' or title ilike '%head%'
         or exists (select 1 from unnest(requirements) as req where req ilike '%5+%' or req ilike '%senior%')
    then 'Senior Level'::job_level
    when title ilike '%junior%' or title ilike '%entry%' or title ilike '%fresh%'
         or exists (select 1 from unnest(requirements) as req where req ilike '%fresh graduate%' or req ilike '%entry%')
    then 'Entry Level'::job_level
    else 'Mid Level'::job_level
end
where job_level is null;

-- 5. Tambahkan index untuk performa search yang lebih baik
-- Index untuk full-text search pada title
create index if not exists idx_job_listings_title_search 
on public.job_listings using gin(to_tsvector('indonesian', title));

-- Index untuk full-text search pada description
create index if not exists idx_job_listings_description_search 
on public.job_listings using gin(to_tsvector('indonesian', coalesce(description, '')));

-- Index untuk company_name (untuk search)
create index if not exists idx_job_listings_company_name 
on public.job_listings(company_name);

-- Index untuk location (untuk filter location)
create index if not exists idx_job_listings_location 
on public.job_listings(location_city, location_province);

-- Index untuk category dan level (untuk filter)
create index if not exists idx_job_listings_category 
on public.job_listings(category);

create index if not exists idx_job_listings_level 
on public.job_listings(job_level);

-- Index untuk employment_type (untuk filter type)
create index if not exists idx_job_listings_employment_type 
on public.job_listings(employment_type);

-- Index untuk created_at (untuk sorting)
create index if not exists idx_job_listings_created_at 
on public.job_listings(created_at desc);

-- 6. (Opsional) Tambahkan kolom untuk koordinat geografis jika ingin fitur map yang lebih baik
-- alter table public.job_listings
-- add column if not exists location_lat numeric(10, 8),
-- add column if not exists location_lng numeric(11, 8);

-- create index if not exists idx_job_listings_location_coords 
-- on public.job_listings using gist(point(location_lng, location_lat));

-- 7. (Opsional) Tambahkan kolom untuk tags/keywords untuk search yang lebih fleksibel
-- alter table public.job_listings
-- add column if not exists tags text[];

-- create index if not exists idx_job_listings_tags 
-- on public.job_listings using gin(tags);

