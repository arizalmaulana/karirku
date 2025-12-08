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

async function getApplications(userId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("applications")
        .select(`
            *,
            job_listings(title, company_name, location_city, location_province, employment_type, min_salary, max_salary, currency)
        `)
        .eq("job_seeker_id", userId)
        .order("submitted_at", { ascending: false });

    if (error) {
        console.error("Error fetching applications:", error);
        return [];
    }
    return data || [];
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

