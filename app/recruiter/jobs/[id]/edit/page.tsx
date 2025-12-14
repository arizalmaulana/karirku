import { createSupabaseServerClient } from "@/lib/supabase/server";
import { RecruiterJobForm } from "@/components/recruiter/RecruiterJobForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound, redirect } from "next/navigation";

async function getJob(id: string, userId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("job_listings")
        .select("*")
        .eq("id", id)
        .eq("recruiter_id", userId)
        .single();

    if (error || !data) {
        return null;
    }
    return data;
}

export default async function EditRecruiterJobPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
    // Handle params as Promise (Next.js 15) or object (Next.js 14)
    const resolvedParams = params instanceof Promise ? await params : params;
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/");
    }

    const job = await getJob(resolvedParams.id, user.id);

    if (!job) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-semibold text-gray-900">Edit Lowongan</h1>
                <p className="text-gray-500 mt-1">
                    Perbarui informasi lowongan pekerjaan
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Informasi Lowongan</CardTitle>
                    <CardDescription>
                        Perbarui informasi yang diperlukan untuk lowongan pekerjaan
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <RecruiterJobForm initialData={job} jobId={resolvedParams.id} />
                </CardContent>
            </Card>
        </div>
    );
}

