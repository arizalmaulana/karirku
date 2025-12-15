import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ApplicationFormPage } from "@/components/job-seeker/ApplicationFormPage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound, redirect } from "next/navigation";
import type { JobListing, Profile } from "@/lib/types";

async function getJob(id: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("job_listings")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !data) {
        return null;
    }

    const jobListing = data as JobListing;

    // Check if company is blocked
    const { data: companyData } = await supabase
        .from("companies")
        .select("is_blocked")
        .eq("name", jobListing.company_name)
        .maybeSingle();

    // If company is blocked, return null (job not accessible)
    if (companyData && (companyData as any).is_blocked === true) {
        return null;
    }

    return jobListing;
}

async function checkExistingApplication(userId: string, jobId: string) {
    const supabase = await createSupabaseServerClient();
    // Cek apakah ada aplikasi yang sudah submitted (bukan draft)
    const { data } = await supabase
        .from("applications")
        .select("id, status")
        .eq("job_seeker_id", userId)
        .eq("job_id", jobId)
        .neq("status", "draft") // Draft tidak dianggap sebagai aplikasi yang sudah ada
        .maybeSingle();

    return data;
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
    return data as Profile;
}

export default async function ApplyJobPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
    // Handle params as Promise (Next.js 15) or object (Next.js 14)
    const resolvedParams = params instanceof Promise ? await params : params;
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/");
    }

    const [job, existingApplication, profile] = await Promise.all([
        getJob(resolvedParams.id),
        checkExistingApplication(user.id, resolvedParams.id),
        getUserProfile(user.id),
    ]);

    if (!job) {
        notFound();
    }

    // Cek apakah lowongan sudah ditutup
    if (job.is_closed) {
        notFound();
    }

    if (existingApplication) {
        redirect(`/job-seeker/jobs/${resolvedParams.id}`);
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-semibold text-gray-900">Lamar Pekerjaan</h1>
                <p className="text-gray-500 mt-1">
                    {job.title} - {job.company_name}
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Form Lamaran Pekerjaan</CardTitle>
                    <CardDescription>
                        Lengkapi form berikut untuk melamar posisi {job.title} di {job.company_name}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ApplicationFormPage 
                        job={job}
                        profile={profile}
                    />
                </CardContent>
            </Card>
        </div>
    );
}

