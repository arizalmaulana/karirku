import { createSupabaseServerClient } from "@/lib/supabase/server";
import { JobForm } from "@/components/admin/JobForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";

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

export default async function EditJobPage({ params }: { params: { id: string } }) {
    const job = await getJob(params.id);

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
                    <JobForm initialData={job} jobId={params.id} />
                </CardContent>
            </Card>
        </div>
    );
}

