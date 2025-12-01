import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

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

async function getApplication(id: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("applications")
        .select(`
            *,
            profiles(full_name, location_city, skills),
            job_listings(title, company_name, location_city, employment_type)
        `)
        .eq("id", id)
        .single();

    if (error || !data) {
        return null;
    }
    return data;
}

export default async function ApplicationDetailPage({ params }: { params: { id: string } }) {
    const application = await getApplication(params.id);

    if (!application) {
        notFound();
    }

    const profile = application.profiles as any;
    const job = application.job_listings as any;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/admin/applications">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Kembali
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-semibold text-gray-900">Detail Lamaran</h1>
                    <p className="text-gray-500 mt-1">
                        {profile?.full_name || "Unknown"} - {job?.title || "Unknown"}
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Pelamar</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-500">Nama</p>
                            <p className="font-medium">{profile?.full_name || "Tidak ada nama"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Lokasi</p>
                            <p className="font-medium">{profile?.location_city || "-"}</p>
                        </div>
                        {profile?.skills && profile.skills.length > 0 && (
                            <div>
                                <p className="text-sm text-gray-500 mb-2">Skills</p>
                                <div className="flex flex-wrap gap-2">
                                    {profile.skills.map((skill: string, index: number) => (
                                        <Badge key={index} variant="outline">{skill}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Lowongan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-500">Judul</p>
                            <p className="font-medium">{job?.title || "Unknown"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Perusahaan</p>
                            <p className="font-medium">{job?.company_name || "Unknown"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Lokasi</p>
                            <p className="font-medium">{job?.location_city || "-"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Tipe Pekerjaan</p>
                            <Badge variant="outline">{job?.employment_type || "-"}</Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Detail Lamaran</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="text-sm text-gray-500 mb-2">Status</p>
                        <Badge variant={getStatusBadgeVariant(application.status)}>
                            {getStatusLabel(application.status)}
                        </Badge>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Tanggal Submit</p>
                        <p className="font-medium">
                            {new Date(application.submitted_at).toLocaleDateString("id-ID", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </p>
                    </div>
                    {application.cover_letter && (
                        <div>
                            <p className="text-sm text-gray-500 mb-2">Cover Letter</p>
                            <p className="text-sm whitespace-pre-wrap">{application.cover_letter}</p>
                        </div>
                    )}
                    {application.cv_url && (
                        <div>
                            <p className="text-sm text-gray-500 mb-2">CV</p>
                            <a
                                href={application.cv_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                            >
                                Lihat CV
                            </a>
                        </div>
                    )}
                    {application.portfolio_url && (
                        <div>
                            <p className="text-sm text-gray-500 mb-2">Portfolio</p>
                            <a
                                href={application.portfolio_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                            >
                                Lihat Portfolio
                            </a>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

