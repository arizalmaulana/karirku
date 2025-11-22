// src/lib/types.ts

// Tipe untuk peran pengguna yang valid
export type UserRole = 'jobseeker' | 'recruiter' | 'admin';

// Interface untuk data profil
export interface Profile {
    id: string; // UUID dari auth.users
    role: UserRole;
    full_name: string | null;
    created_at: string;
}

// Tipe Database (memudahkan type-checking Supabase Client)
// Ini adalah praktik terbaik (Best Practice) untuk Supabase V2+
export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: Profile;
                Insert: Omit<Profile, 'id' | 'created_at'> & { id: string };
                Update: Partial<Profile>;
                Relationships: [];
            };
            // Tambahkan tabel lain di sini (job_listings, applications, dll.)
        };
        Views: Record<string, never>;
        Functions: Record<string, never>;
        Enums: Record<string, never>;
        CompositeTypes: Record<string, never>;
    };
};