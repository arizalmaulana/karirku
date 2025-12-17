import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ApplicationEditForm } from "@/components/admin/ApplicationEditForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getApplication(id: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("applications")
        .select(`
            *,
            profiles(full_name, email),
            job_listings(title, company_name)
        `)
        .eq("id", id)
        .single();

    if (error || !data) {
        return null;
    }
    return data as any;
}

export default async function EditApplicationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const application = await getApplication(id);

    if (!application) {
        notFound();
    }

    const profile = application.profiles as any;
    const job = application.job_listings as any;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" asChild className="hover:bg-gray-500 text-gray-700 border-0 bg-gray-400 shadow-sm transition-colors">
                    <Link href={`/admin/applications/${application.id}`}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Kembali ke Detail
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-semibold text-gray-900">Edit Lamaran</h1>
                    <p className="text-gray-500 mt-1">
                        {profile?.full_name || "Unknown"} - {job?.title || "Unknown"}
                    </p>
                </div>
            </div>

            <ApplicationEditForm
                applicationId={application.id}
                initialData={{
                    status: application.status,
                    notes: application.notes,
                    rejection_reason: application.rejection_reason,
                    interview_date: application.interview_date,
                    interview_location: application.interview_location,
                }}
            />
        </div>
    );
}


