-- ============================================
--  Tambahan kolom untuk approval perusahaan
--  Jalankan di Supabase SQL Editor
-- ============================================

-- Tambahkan kolom untuk URL surat izin perusahaan
alter table public.profiles
add column if not exists company_license_url text;

-- Tambahkan kolom untuk status approval (default false untuk recruiter baru)
alter table public.profiles
add column if not exists is_approved boolean default false;

-- Set is_approved = true untuk admin dan jobseeker (tidak perlu approval)
-- Hanya update jika is_approved masih null atau false
update public.profiles
set is_approved = true
where role in ('admin', 'jobseeker') 
  and (is_approved is null or is_approved = false);

-- Set is_approved = false untuk recruiter yang belum di-approve
-- Hanya update jika is_approved masih null
update public.profiles
set is_approved = false
where role = 'recruiter' 
  and is_approved is null;

-- Update RLS policy untuk admin bisa melihat semua profiles (termasuk yang belum approved)
-- Policy ini sudah ada di admin_policies.sql, tapi pastikan admin bisa update is_approved
drop policy if exists "Admin can update all profiles" on public.profiles;
create policy "Admin can update all profiles"
    on public.profiles for update
    using (exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'admin'
    ));

-- Policy untuk admin bisa read semua profiles
drop policy if exists "Admin can read all profiles" on public.profiles;
create policy "Admin can read all profiles"
    on public.profiles for select
    using (
        auth.uid() = id 
        or exists (
            select 1 from public.profiles
            where id = auth.uid() and role = 'admin'
        )
    );