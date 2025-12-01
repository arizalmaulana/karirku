import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { Eye, Filter } from "lucide-react";
import { redirect } from "next/navigation";
import { ApplicationsList } from "@/components/recruiter/ApplicationsList";

function getStatusBadgeVariant(status: string) {
    switch (status) {
        case "accepted":
            return "default";
        case "rejected":
            return "destructive";
        case "interview":
            return "secondary";
        case "review":
            return "outline";
        default:
            return "outline";
    }
}

function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
        draft: "Draft",
        submitted: "Dikirim",
        review: "Dalam Review",
        interview: "Interview",
        accepted: "Diterima",
        rejected: "Ditolak",
    };
    return labels[status] || status;
}

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
    const supabase = await createSupabaseServerClient();
    let query = supabase
        .from("applications")
        .select(`
            *,
            job_listings!inner(title, company_name, recruiter_id),
            profiles(full_name, skills, major)
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
    return data || [];
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
    searchParams: { job?: string; status?: string };
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

    const [jobs, applications] = await Promise.all([
        getRecruiterJobs(user.id),
        getApplications(user.id, searchParams.job, searchParams.status),
    ]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-semibold text-gray-900">Pelamar</h1>
                    <p className="text-gray-500 mt-1">
                        Kelola dan tinjau semua lamaran yang masuk untuk lowongan Anda
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Pelamar</CardTitle>
                    <CardDescription>
                        Total {applications.length} lamaran
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ApplicationsList
                        applications={applications}
                        jobs={jobs}
                        initialJobFilter={searchParams.job}
                        initialStatusFilter={searchParams.status}
                    />
                </CardContent>
            </Card>
        </div>
    );
}

