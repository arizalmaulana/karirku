import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ApplicationsPageClient } from "@/components/job-seeker/ApplicationsPageClient";

async function getUserProfile(userId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

    if (error || !data) {
        return null;
    }
    return data;
}

async function getCompanyLogo(companyName: string) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
        .from("companies")
        .select("logo_url")
        .eq("name", companyName)
        .maybeSingle();
    
    if (data && (data as any).logo_url) {
        return (data as any).logo_url;
    }
    
    // Fallback to generated logo
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&size=128&background=6366f1&color=ffffff&bold=true&format=png`;
}

async function getApplications(userId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("applications")
        .select(`
            id,
            job_id,
            job_seeker_id,
            status,
            cv_url,
            portfolio_url,
            cover_letter,
            submitted_at,
            updated_at,
            job_listings(id, title, company_name, location_city, location_province, employment_type, min_salary, max_salary, currency)
        `)
        .eq("job_seeker_id", userId)
        .order("submitted_at", { ascending: false });

    if (error) {
        console.error("Error fetching applications:", error);
        return [];
    }

    if (!data) {
        return [];
    }

    // Fetch company logos for all applications
    const applicationsWithLogos = await Promise.all(
        data.map(async (app: any) => {
            const companyName = app.job_listings?.company_name;
            if (companyName) {
                const logo = await getCompanyLogo(companyName);
                return { ...app, companyLogo: logo };
            }
            return app;
        })
    );

    return applicationsWithLogos;
}

export default async function ApplicationsPage() {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/");
    }

    const [applications, profile] = await Promise.all([
        getApplications(user.id),
        getUserProfile(user.id),
    ]);

    return (
        <ApplicationsPageClient
            initialApplications={applications}
            profile={profile}
            userId={user.id}
        />
    );
}

