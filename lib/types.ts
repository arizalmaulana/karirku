// src/lib/types.ts

// Tipe peran pengguna yang valid
export type UserRole = 'jobseeker' | 'recruiter' | 'admin';

export type EmploymentType = 'fulltime' | 'parttime' | 'contract' | 'internship' | 'remote' | 'hybrid';
export type ApplicationStatus = 'draft' | 'submitted' | 'review' | 'interview' | 'accepted' | 'rejected';

// Interface tabel profil
export interface Profile {
    id: string; // UUID dari auth.users
    role: UserRole;
    full_name: string | null;
    headline: string | null;
    location_city: string | null;
    major: string | null; // Jurusan pendidikan
    skills: string[];
    avatar_url: string | null; // URL foto profile
    email: string | null; // Email (dari auth.users atau manual)
    phone: string | null; // Nomor telepon
    bio: string | null; // Bio/deskripsi diri
    experience: string | null; // Pengalaman kerja
    education: string | null; // Pendidikan
    company_license_url: string | null; // URL surat izin perusahaan (untuk recruiter)
    is_approved: boolean | null; // Status approval (untuk recruiter)
    created_at: string;
}

export interface LivingCost {
    id: string;
    city: string;
    province: string;
    avg_rent: number | null;
    avg_food: number | null;
    avg_transport: number | null;
    salary_reference: number | null;
    currency: string;
    updated_at: string;
}

export type JobCategory = 'Technology' | 'Design' | 'Marketing' | 'Business' | 'Finance' | 'Healthcare' | 'Education' | 'Other';
export type JobLevel = 'Entry Level' | 'Mid Level' | 'Senior Level' | 'Executive';

export interface JobListing {
    id: string;
    recruiter_id: string | null;
    title: string;
    company_name: string;
    location_city: string;
    location_province: string | null;
    employment_type: EmploymentType;
    min_salary: number | null;
    max_salary: number | null;
    currency: string | null;
    description: string | null;
    requirements: string[] | null;
    skills_required: string[] | null;
    major_required: string | null; // Jurusan yang dibutuhkan (opsional)
    category: JobCategory | null; // Kategori pekerjaan (untuk filter)
    job_level: JobLevel | null; // Level pekerjaan (untuk filter)
    living_cost_id: string | null;
    featured: boolean | null;
    is_closed: boolean | null; // Menandai apakah lowongan sudah ditutup (terpenuhi)
    is_hidden: boolean | null; // Menandai apakah lowongan disembunyikan karena perusahaan diblokir/dihapus
    created_at: string;
}

export interface Application {
    id: string;
    job_id: string;
    job_seeker_id: string;
    status: ApplicationStatus;
    cv_url: string | null;
    portfolio_url: string | null;
    cover_letter: string | null;
    notes: string | null; // Catatan dari recruiter
    rejection_reason: string | null; // Alasan penolakan
    interview_date: string | null; // Jadwal interview
    interview_location: string | null; // Lokasi interview
    submitted_at: string;
    updated_at: string;
}

export interface Company {
    id: string;
    name: string;
    logo_url: string | null;
    industry: string | null;
    location_city: string | null;
    location_province: string | null;
    address: string | null; // Alamat lengkap perusahaan
    description: string | null;
    website_url: string | null;
    size: string | null;
    recruiter_id: string | null; // ID recruiter yang memiliki perusahaan ini
    license_url: string | null; // URL surat izin perusahaan dari bucket company_licenses
    is_approved: boolean | null; // Status approval dari admin
    status: 'pending' | 'approved' | 'rejected' | null; // Status approval
    is_blocked: boolean | null; // Status blokir perusahaan
    blocked_reason: string | null; // Alasan perusahaan diblokir
    created_at: string;
    updated_at: string;
    // Computed fields (tidak ada di database)
    logo?: string; // Generated logo URL
    location?: string; // Combined location
    openPositions?: number; // Count dari job_listings
}

// Tipe Database Supabase
export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: Profile;
                Insert: Omit<Profile, 'created_at'>;
                Update: Partial<Profile>;
                Relationships: [
                    {
                        foreignKeyName: 'profiles_id_fkey';
                        columns: ['id'];
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    }
                ];
            };
            living_costs: {
                Row: LivingCost;
                Insert: Omit<LivingCost, 'id' | 'updated_at'> & { id?: string };
                Update: Partial<LivingCost>;
                Relationships: [];
            };
            job_listings: {
                Row: JobListing;
                Insert: Omit<JobListing, 'id' | 'created_at'> & { id?: string };
                Update: Partial<JobListing>;
                Relationships: [
                    {
                        foreignKeyName: 'job_listings_recruiter_id_fkey';
                        columns: ['recruiter_id'];
                        referencedRelation: 'profiles';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'job_listings_living_cost_id_fkey';
                        columns: ['living_cost_id'];
                        referencedRelation: 'living_costs';
                        referencedColumns: ['id'];
                    }
                ];
            };
            applications: {
                Row: Application;
                Insert: Omit<Application, 'id' | 'submitted_at' | 'updated_at'> & { id?: string };
                Update: Partial<Application>;
                Relationships: [
                    {
                        foreignKeyName: 'applications_job_id_fkey';
                        columns: ['job_id'];
                        referencedRelation: 'job_listings';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'applications_job_seeker_id_fkey';
                        columns: ['job_seeker_id'];
                        referencedRelation: 'profiles';
                        referencedColumns: ['id'];
                    }
                ];
            };
        };
        Views: Record<string, never>;
        Functions: Record<string, never>;
        Enums: Record<string, never>;
        CompositeTypes: Record<string, never>;
    };
};