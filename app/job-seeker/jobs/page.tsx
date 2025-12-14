import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { JobsPageClient } from "@/components/job-seeker/JobsPageClient";
import { fetchJobsFromDatabase, convertJobListingToJob } from "@/lib/utils/jobData";
import type { JobListing } from "@/lib/types";
import type { Job } from "@/types/job";

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

export default async function JobsPage({
    searchParams,
}: {
    searchParams: Promise<{ jobId?: string; company?: string }> | { jobId?: string; company?: string };
}) {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/");
    }

    // Handle searchParams as Promise (Next.js 15) or object (Next.js 14)
    const resolvedParams = searchParams instanceof Promise ? await searchParams : searchParams;

    const profile = await getUserProfile(user.id);
    
    // Fetch jobs from database
    const jobs = await fetchJobsFromDatabase();

    return (
        <JobsPageClient
            jobs={jobs}
            profile={profile}
            userId={user.id}
            initialJobId={resolvedParams.jobId}
            initialCompany={resolvedParams.company}
        />
    );
}
