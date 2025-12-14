import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Company } from "@/lib/types";

/**
 * Cek apakah company profile sudah lengkap
 * Profile dianggap lengkap jika memiliki:
 * - name (nama perusahaan)
 * - license_url (surat izin)
 */
export function isCompanyProfileComplete(company: Company | null): boolean {
    if (!company) return false;
    
    // Cek field wajib
    const hasName = !!company.name && company.name.trim().length > 0;
    const hasLicense = !!company.license_url && company.license_url.trim().length > 0;
    
    return hasName && hasLicense;
}

/**
 * Cek apakah company profile sudah disetujui admin
 */
export function isCompanyProfileApproved(company: Company | null): boolean {
    if (!company) return false;
    return company.is_approved === true && company.status === 'approved';
}

/**
 * Cek apakah recruiter bisa mengakses fitur (bisa tambah lowongan, dll)
 * Harus: profile lengkap DAN sudah disetujui admin
 */
export function canRecruiterAccessFeatures(company: Company | null): boolean {
    return isCompanyProfileComplete(company) && isCompanyProfileApproved(company);
}

/**
 * Fetch company profile untuk recruiter (server-side)
 */
export async function getRecruiterCompany(recruiterId: string): Promise<Company | null> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("recruiter_id", recruiterId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            return null; // Tidak ada data, bukan error
        }
        console.error("Error fetching company:", error);
        return null;
    }

    return data as Company;
}

