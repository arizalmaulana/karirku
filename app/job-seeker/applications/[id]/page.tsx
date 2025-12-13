import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { ApplicationTimeline } from "@/components/ApplicationTimeline";
import { WithdrawApplicationButton } from "@/components/job-seeker/WithdrawApplicationButton";

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

async function getApplication(id: string, userId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("applications")
        .select(`
            *,
            job_listings(title, company_name, location_city, location_province, employment_type)
        `)
        .eq("id", id)
        .eq("job_seeker_id", userId)
        .single();

    if (error || !data) {
        return null;
    }
    return data;
}

export default async function ApplicationDetailPage({ params }: { params: { id: string } }) {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/");
    }

    const application = await getApplication(params.id, user.id);

    if (!application) {
        notFound();
    }

    const job = application.job_listings as any;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/job-seeker/applications">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Kembali
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-semibold text-gray-900">Detail Lamaran</h1>
                    <p className="text-gray-500 mt-1">
                        {job?.title || "Unknown"} - {job?.company_name || "Unknown"}
                    </p>
                </div>
                <Badge variant={getStatusBadgeVariant(application.status)}>
                    {getStatusLabel(application.status)}
                </Badge>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Lowongan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-500">Judul Pekerjaan</p>
                            <p className="font-medium">{job?.title || "Unknown"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Perusahaan</p>
                            <p className="font-medium">{job?.company_name || "Unknown"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Lokasi</p>
                            <p className="font-medium">
                                {job?.location_city || ""}
                                {job?.location_province && `, ${job.location_province}`}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Tipe Pekerjaan</p>
                            <Badge variant="outline">{job?.employment_type || "-"}</Badge>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href={`/job-seeker/jobs/${application.job_id}`}>
                                Lihat Detail Lowongan
                                <ExternalLink className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Detail Lamaran</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <Badge variant={getStatusBadgeVariant(application.status)} className="mt-1">
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
                        {application.updated_at !== application.submitted_at && (
                            <div>
                                <p className="text-sm text-gray-500">Terakhir Diupdate</p>
                                <p className="font-medium">
                                    {new Date(application.updated_at).toLocaleDateString("id-ID", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </p>
                            </div>
                        )}
                        {/* Interview info jika status interview */}
                        {application.status === "interview" && (application as any).interview_date && (
                            <div>
                                <p className="text-sm text-gray-500">Jadwal Interview</p>
                                <p className="font-medium">
                                    {new Date((application as any).interview_date).toLocaleDateString("id-ID", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </p>
                                {(application as any).interview_location && (
                                    <p className="text-sm text-gray-600 mt-1">
                                        Lokasi: {(application as any).interview_location}
                                    </p>
                                )}
                            </div>
                        )}
                        {/* Rejection reason jika ditolak */}
                        {application.status === "rejected" && (application as any).rejection_reason && (
                            <div>
                                <p className="text-sm text-gray-500">Alasan Penolakan</p>
                                <p className="font-medium text-red-600">
                                    {(application as any).rejection_reason}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Timeline */}
            <Card>
                <CardHeader>
                    <CardTitle>Timeline Status</CardTitle>
                    <CardDescription>
                        Pantau perkembangan status lamaran Anda
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ApplicationTimeline
                        currentStatus={application.status}
                        submittedAt={application.submitted_at}
                        updatedAt={application.updated_at}
                    />
                </CardContent>
            </Card>

            {application.cover_letter && (
                <Card>
                    <CardHeader>
                        <CardTitle>Cover Letter</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="whitespace-pre-wrap text-sm">{application.cover_letter}</p>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Dokumen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {application.cv_url ? (
                        <div>
                            <p className="text-sm text-gray-500 mb-2">CV / Resume</p>
                            <Button variant="outline" asChild>
                                <a href={application.cv_url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Lihat CV
                                </a>
                            </Button>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">CV tidak diunggah</p>
                    )}

                    {application.portfolio_url ? (
                        <div>
                            <p className="text-sm text-gray-500 mb-2">Portfolio</p>
                            <Button variant="outline" asChild>
                                <a href={application.portfolio_url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Lihat Portfolio
                                </a>
                            </Button>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">Portfolio tidak diunggah</p>
                    )}
                </CardContent>
            </Card>

            {/* Withdraw Button */}
            {application.status !== "draft" && (
                <Card>
                    <CardHeader>
                        <CardTitle>Aksi</CardTitle>
                        <CardDescription>
                            Tarik lamaran jika Anda tidak lagi tertarik dengan posisi ini
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <WithdrawApplicationButton 
                            applicationId={application.id} 
                            currentStatus={application.status} 
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

