import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Eye, ArrowUpRight } from "lucide-react";
import { redirect } from "next/navigation";

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

async function getApplications(userId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("applications")
        .select(`
            *,
            job_listings(title, company_name, location_city)
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

    const applications = await getApplications(user.id);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-semibold text-gray-900">Status Lamaran</h1>
                    <p className="text-gray-500 mt-1">
                        Pantau semua lamaran yang telah Anda kirim
                    </p>
                </div>
                <Button size="lg" asChild>
                    <Link href="/job-seeker/jobs">
                        Cari Lowongan Baru
                        <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Lamaran</CardTitle>
                    <CardDescription>
                        Total {applications.length} lamaran
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {applications.length > 0 ? (
                        <div className="space-y-4">
                            {applications.map((app: any) => (
                                <div
                                    key={app.id}
                                    className="rounded-xl border p-6 hover:border-blue-500 transition"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {app.job_listings?.title || "Unknown"}
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {app.job_listings?.company_name || "Unknown"}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {app.job_listings?.location_city || ""}
                                            </p>
                                        </div>
                                        <Badge variant={getStatusBadgeVariant(app.status)}>
                                            {getStatusLabel(app.status)}
                                        </Badge>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between">
                                        <p className="text-sm text-gray-500">
                                            Dikirim pada{" "}
                                            {new Date(app.submitted_at).toLocaleDateString("id-ID", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            })}
                                        </p>
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/job-seeker/applications/${app.id}`}>
                                                <Eye className="h-4 w-4 mr-2" />
                                                Lihat Detail
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-500 mb-4">
                                Belum ada lamaran yang dikirim
                            </p>
                            <Button asChild>
                                <Link href="/job-seeker/jobs">Cari Lowongan</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

