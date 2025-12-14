import { RecruiterSidebar } from "@/components/recruiter/sidebar";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRecruiterCompany, canRecruiterAccessFeatures, isCompanyProfileComplete } from "@/lib/utils/recruiterValidation";
import { RecruiterAccessGuard } from "@/components/recruiter/RecruiterAccessGuard";

interface RecruiterLayoutProps {
    children: React.ReactNode;
}

export default async function RecruiterLayout({ children }: RecruiterLayoutProps) {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/");
    }

    // Cek apakah user adalah recruiter
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile || profile.role !== "recruiter") {
        redirect("/");
    }

    // Ambil company profile
    const company = await getRecruiterCompany(user.id);

    // Cek apakah bisa akses fitur (profile lengkap dan approved)
    const canAccess = canRecruiterAccessFeatures(company);
    const isComplete = isCompanyProfileComplete(company);

    return (
        <div className="flex min-h-screen bg-gray-50/50">
            <RecruiterSidebar />
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
                <RecruiterAccessGuard 
                    company={company} 
                    canAccess={canAccess}
                    isComplete={isComplete}
                >
                    {children}
                </RecruiterAccessGuard>
            </main>
        </div>
    );
}

