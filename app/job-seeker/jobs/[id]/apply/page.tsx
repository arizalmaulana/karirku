import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ApplicationForm } from "@/components/job-seeker/ApplicationForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound, redirect } from "next/navigation";

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
    return data;
}

async function checkExistingApplication(userId: string, jobId: string) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
        .from("applications")
        .select("id")
        .eq("job_seeker_id", userId)
        .eq("job_id", jobId)
        .maybeSingle();

    return data;
}

export default async function ApplyJobPage({ params }: { params: { id: string } }) {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/");
    }

    const [job, existingApplication] = await Promise.all([
        getJob(params.id),
        checkExistingApplication(user.id, params.id),
    ]);

    if (!job) {
        notFound();
    }

    if (existingApplication) {
        redirect(`/job-seeker/jobs/${params.id}`);
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
                    <CardTitle>Formulir Lamaran</CardTitle>
                    <CardDescription>
                        Lengkapi informasi berikut untuk melamar pekerjaan ini
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ApplicationForm jobId={params.id} jobTitle={job.title} />
                </CardContent>
            </Card>
        </div>
    );
}

