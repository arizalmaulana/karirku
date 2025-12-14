import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, ExternalLink, FileText, CheckCircle2, XCircle, Calendar, MapPin, MessageSquare } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { ApplicationTimeline } from "@/components/ApplicationTimeline";
import { WithdrawApplicationButton } from "@/components/job-seeker/WithdrawApplicationButton";
import { ApplicationDocumentViewer } from "@/components/admin/ApplicationDocumentViewer";
import { PortfolioViewer } from "@/components/admin/PortfolioViewer";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";

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
            id,
            job_id,
            job_seeker_id,
            status,
            cv_url,
            portfolio_url,
            cover_letter,
            notes,
            rejection_reason,
            interview_date,
            interview_location,
            submitted_at,
            updated_at,
            job_listings(id, title, company_name, location_city, location_province, employment_type)
        `)
        .eq("id", id)
        .eq("job_seeker_id", userId)
        .single();

    if (error || !data) {
        return null;
    }
    return data as any;
}

async function getCompanyLogo(companyName: string) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
        .from("companies")
        .select("logo_url")
        .eq("name", companyName)
        .maybeSingle();
    
    if (data && (data as any).logo_url) {
        return (data as any).logo_url;
    }
    
    // Fallback to generated logo
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&size=128&background=6366f1&color=ffffff&bold=true&format=png`;
}

export default async function ApplicationDetailPage({ 
    params 
}: { 
    params: Promise<{ id: string }> | { id: string } 
}) {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/");
    }

    // Handle params as Promise (Next.js 15) or object (Next.js 14)
    const resolvedParams = params instanceof Promise ? await params : params;
    const application = await getApplication(resolvedParams.id, user.id);

    if (!application) {
        notFound();
    }

    const job = application.job_listings as any;
    const companyLogo = job?.company_name ? await getCompanyLogo(job.company_name) : null;

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
                        {companyLogo && (
                            <div className="mb-4">
                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shadow-sm">
                                    <ImageWithFallback
                                        src={companyLogo}
                                        alt={job?.company_name || "Company"}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        )}
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
                        {application.job_id ? (
                            <Button variant="outline" asChild>
                                <Link href={`/job-seeker/jobs/${application.job_id}`}>
                                    Lihat Detail Lowongan
                                    <ExternalLink className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        ) : (
                            <p className="text-sm text-gray-500">Detail lowongan tidak tersedia</p>
                        )}
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
                        {/* Notes jika diterima */}
                        {application.status === "accepted" && application.notes && (
                            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-green-900 mb-1">Catatan Penerimaan</p>
                                        <p className="text-sm text-green-800 whitespace-pre-wrap leading-relaxed">
                                            {application.notes}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Interview info jika status interview */}
                        {application.status === "interview" && (
                            <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                <div className="flex items-start gap-3 mb-3">
                                    <Calendar className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-purple-900 mb-2">Informasi Interview</p>
                                        {application.interview_date && (
                                            <div className="mb-2">
                                                <p className="text-xs text-purple-700 mb-1">Jadwal Interview</p>
                                                <p className="text-sm font-medium text-purple-900">
                                                    {new Date(application.interview_date).toLocaleDateString("id-ID", {
                                                        weekday: "long",
                                                        year: "numeric",
                                                        month: "long",
                                                        day: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </p>
                                            </div>
                                        )}
                                        {application.interview_location && (
                                            <div className="flex items-start gap-2">
                                                <MapPin className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-xs text-purple-700 mb-1">Lokasi</p>
                                                    <p className="text-sm font-medium text-purple-900">
                                                        {application.interview_location}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {application.notes && (
                                            <div className="mt-3 pt-3 border-t border-purple-200">
                                                <p className="text-xs text-purple-700 mb-1">Catatan Tambahan</p>
                                                <p className="text-sm text-purple-800 whitespace-pre-wrap leading-relaxed">
                                                    {application.notes}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Rejection reason jika ditolak */}
                        {application.status === "rejected" && application.rejection_reason && (
                            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <XCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-red-900 mb-1">Alasan Penolakan</p>
                                        <p className="text-sm text-red-800 whitespace-pre-wrap leading-relaxed">
                                            {application.rejection_reason}
                                        </p>
                                    </div>
                                </div>
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
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Cover Letter
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            {(() => {
                                // Coba parse sebagai JSON jika mungkin
                                try {
                                    const parsed = JSON.parse(application.cover_letter);
                                    // Jika berhasil parse dan merupakan object, tampilkan dalam format yang rapi
                                    if (typeof parsed === 'object' && parsed !== null) {
                                        return (
                                            <div className="space-y-3">
                                                {parsed.namaLengkap && (
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-500 uppercase">Nama Lengkap</p>
                                                        <p className="text-sm font-medium text-gray-900">{parsed.namaLengkap}</p>
                                                    </div>
                                                )}
                                                {parsed.email && (
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-500 uppercase">Email</p>
                                                        <p className="text-sm text-gray-900">{parsed.email}</p>
                                                    </div>
                                                )}
                                                {parsed.nomorTelepon && (
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-500 uppercase">Nomor Telepon</p>
                                                        <p className="text-sm text-gray-900">{parsed.nomorTelepon}</p>
                                                    </div>
                                                )}
                                                {parsed.domisili && (
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-500 uppercase">Domisili</p>
                                                        <p className="text-sm text-gray-900">{parsed.domisili}</p>
                                                    </div>
                                                )}
                                                {parsed.pendidikanTerakhir && (
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-500 uppercase">Pendidikan Terakhir</p>
                                                        <p className="text-sm text-gray-900">{parsed.pendidikanTerakhir}</p>
                                                    </div>
                                                )}
                                                {parsed.pengalamanKerja && (
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-500 uppercase">Pengalaman Kerja</p>
                                                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{parsed.pengalamanKerja}</p>
                                                    </div>
                                                )}
                                                {parsed.skill && (
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-500 uppercase">Skill</p>
                                                        <p className="text-sm text-gray-900">{parsed.skill}</p>
                                                    </div>
                                                )}
                                                {parsed.portfolio && (
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-500 uppercase">Portfolio</p>
                                                        <p className="text-sm text-gray-900">{parsed.portfolio}</p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }
                                } catch (e) {
                                    // Bukan JSON, tampilkan sebagai teks biasa
                                }
                                // Tampilkan sebagai teks biasa
                                return (
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{application.cover_letter}</p>
                                );
                            })()}
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                <ApplicationDocumentViewer
                    documentUrl={application.cv_url}
                    title="CV / Resume"
                    jobSeekerId={application.job_seeker_id}
                />
                <PortfolioViewer
                    portfolioUrl={application.portfolio_url}
                />
            </div>

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

