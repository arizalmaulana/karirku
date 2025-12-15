import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { ApplicantsTable } from "@/components/recruiter/ApplicantsTable";


async function getRecruiterJobs(userId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("job_listings")
        .select("id, title")
        .eq("recruiter_id", userId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching jobs:", error);
        return [];
    }
    return data || [];
}

async function getApplications(userId: string, jobId?: string, status?: string) {
    try {
        const supabase = await createSupabaseServerClient();
        let query = supabase
            .from("applications")
            .select(`
                *,
                job_listings!inner(title, company_name, recruiter_id),
                profiles(full_name, skills, major, phone, email)
            `)
            .eq("job_listings.recruiter_id", userId);

        if (jobId) {
            query = query.eq("job_id", jobId);
        }

        if (status) {
            query = query.eq("status", status);
        }

        const { data, error } = await query.order("submitted_at", { ascending: false });

        if (error) {
            console.error("Error fetching applications:", error);
            return [];
        }
        
        // Debug: Log data structure
        if (data && data.length > 0) {
            console.log("Applications data sample:", {
                total: data.length,
                firstApp: data.length > 0 ? {
                    id: (data[0] as any).id,
                    cv_url: (data[0] as any).cv_url,
                    job_seeker_id: (data[0] as any).job_seeker_id,
                    hasProfiles: !!(data[0] as any).profiles
                } : null
            });
        }
        
        // Fallback: Query profiles separately for applications where profiles is null
        if (data && data.length > 0) {
            const applicationsWithMissingProfiles = data.filter((app: any) => !app.profiles && app.job_seeker_id);
            
            if (applicationsWithMissingProfiles.length > 0) {
                const jobSeekerIds = applicationsWithMissingProfiles.map((app: any) => app.job_seeker_id);
                const { data: profilesData } = await supabase
                    .from("profiles")
                    .select("id, full_name, skills, major, phone, email")
                    .in("id", jobSeekerIds);
                
                if (profilesData) {
                    const profilesMap = new Map(profilesData.map((p: any) => [p.id, p]));
                    data.forEach((app: any) => {
                        if (!app.profiles && app.job_seeker_id && profilesMap.has(app.job_seeker_id)) {
                            app.profiles = profilesMap.get(app.job_seeker_id);
                        }
                    });
                }
            }
        }
        
        return data || [];
    } catch (error) {
        console.error("Unexpected error in getApplications:", error);
        return [];
    }
}

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

export default async function RecruiterApplicationsPage({
    searchParams,
}: {
    searchParams: Promise<{ job?: string; status?: string }> | { job?: string; status?: string };
}) {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/");
    }

    const profile = await getUserProfile(user.id);
    if (!profile || (profile as any).role !== "recruiter") {
        redirect("/");
    }

    // Handle searchParams as Promise (Next.js 15) or object (Next.js 14)
    const params = searchParams instanceof Promise ? await searchParams : searchParams;

    const [jobs, applications] = await Promise.all([
        getRecruiterJobs(user.id),
        getApplications(user.id, params.job, params.status),
    ]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50 shadow-sm rounded-2xl p-6">
                <div>
                    <h1 className="text-3xl font-semibold text-purple-900">Pelamar</h1>
                    <p className="text-gray-600 mt-1">
                        Kelola dan tinjau semua lamaran yang masuk untuk lowongan Anda
                    </p>
                </div>
            </div>

            <Card className="border border-purple-200 bg-gradient-to-br from-white to-purple-50/30 shadow-sm">
                <CardContent className="p-6">
                    <ApplicantsTable
                        applications={applications}
                        jobs={jobs}
                        initialJobFilter={params.job}
                        initialStatusFilter={params.status}
                    />
                </CardContent>
            </Card>
        </div>
    );
}

