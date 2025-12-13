import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Download, ExternalLink, Pencil, Trash2, Calendar, MapPin, FileText, MessageSquare } from "lucide-react";
import { notFound } from "next/navigation";
import { DeleteApplicationButton } from "@/components/admin/DeleteApplicationButton";
import { ApplicationDocumentViewer } from "@/components/admin/ApplicationDocumentViewer";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
            profiles(full_name, location_city, skills, email, phone, bio, experience, education),
            job_listings(title, company_name, location_city, location_province, employment_type, description)
        `)
        .eq("id", id)
        .single();

    if (error || !data) {
        return null;
    }
    return data as any;
}

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href={`/admin/applications/${application.id}/edit`}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                        </Link>
                    </Button>
                    <DeleteApplicationButton applicationId={application.id} />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Pelamar</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-500">Nama Lengkap</p>
                            <p className="font-medium">{profile?.full_name || "Tidak ada nama"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-medium">{profile?.email || "-"}</p>
                        </div>
                        {profile?.phone && (
                            <div>
                                <p className="text-sm text-gray-500">Nomor Telepon</p>
                                <p className="font-medium">{profile.phone}</p>
                            </div>
                        )}
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
                        {profile?.bio && (
                            <div>
                                <p className="text-sm text-gray-500 mb-2">Bio</p>
                                <p className="text-sm whitespace-pre-wrap">{profile.bio}</p>
                            </div>
                        )}
                        {profile?.experience && (
                            <div>
                                <p className="text-sm text-gray-500 mb-2">Pengalaman</p>
                                <p className="text-sm whitespace-pre-wrap">{profile.experience}</p>
                            </div>
                        )}
                        {profile?.education && (
                            <div>
                                <p className="text-sm text-gray-500 mb-2">Pendidikan</p>
                                <p className="text-sm whitespace-pre-wrap">{profile.education}</p>
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
                                {job?.location_province 
                                    ? `${job.location_city}, ${job.location_province}`
                                    : job?.location_city || "-"}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Tipe Pekerjaan</p>
                            <Badge variant="outline">{job?.employment_type || "-"}</Badge>
                        </div>
                        {job?.description && (
                            <div>
                                <p className="text-sm text-gray-500 mb-2">Deskripsi</p>
                                <p className="text-sm whitespace-pre-wrap line-clamp-4">{job.description}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Status & Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="text-sm text-gray-500 mb-2">Status Lamaran</p>
                        <Badge variant={getStatusBadgeVariant(application.status)} className="text-sm py-1 px-3">
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
                    {application.updated_at && application.updated_at !== application.submitted_at && (
                        <div>
                            <p className="text-sm text-gray-500">Terakhir Diupdate</p>
                            <p className="font-medium">
                                {new Date(application.updated_at).toLocaleDateString("id-ID", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </p>
                        </div>
                    )}
                    {application.interview_date && (
                        <div>
                            <p className="text-sm text-gray-500 mb-1 flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Jadwal Interview
                            </p>
                            <p className="font-medium">
                                {new Date(application.interview_date).toLocaleDateString("id-ID", {
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
                        <div>
                            <p className="text-sm text-gray-500 mb-1 flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                Lokasi Interview
                            </p>
                            <p className="font-medium">{application.interview_location}</p>
                        </div>
                    )}
                    {application.rejection_reason && (
                        <div>
                            <p className="text-sm text-gray-500 mb-2">Alasan Penolakan</p>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-sm text-red-800 whitespace-pre-wrap">{application.rejection_reason}</p>
                            </div>
                        </div>
                    )}
                    {application.notes && (
                        <div>
                            <p className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Catatan
                            </p>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-sm text-blue-800 whitespace-pre-wrap">{application.notes}</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Cover Letter
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {application.cover_letter ? (
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
                                                        <p className="text-sm font-medium">{parsed.namaLengkap}</p>
                                                    </div>
                                                )}
                                                {parsed.email && (
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-500 uppercase">Email</p>
                                                        <p className="text-sm">{parsed.email}</p>
                                                    </div>
                                                )}
                                                {parsed.nomorTelepon && (
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-500 uppercase">Nomor Telepon</p>
                                                        <p className="text-sm">{parsed.nomorTelepon}</p>
                                                    </div>
                                                )}
                                                {parsed.domisili && (
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-500 uppercase">Domisili</p>
                                                        <p className="text-sm">{parsed.domisili}</p>
                                                    </div>
                                                )}
                                                {parsed.pendidikanTerakhir && (
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-500 uppercase">Pendidikan Terakhir</p>
                                                        <p className="text-sm">{parsed.pendidikanTerakhir}</p>
                                                    </div>
                                                )}
                                                {parsed.pengalamanKerja && (
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-500 uppercase">Pengalaman Kerja</p>
                                                        <p className="text-sm whitespace-pre-wrap">{parsed.pengalamanKerja}</p>
                                                    </div>
                                                )}
                                                {parsed.skill && (
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-500 uppercase">Skill</p>
                                                        <p className="text-sm">{parsed.skill}</p>
                                                    </div>
                                                )}
                                                {parsed.portfolio && (
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-500 uppercase">Portfolio</p>
                                                        <p className="text-sm">{parsed.portfolio}</p>
                                                    </div>
                                                )}
                                                {parsed.dokumenTambahan && (
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-500 uppercase">Dokumen Tambahan</p>
                                                        <p className="text-sm text-gray-600">{parsed.dokumenTambahan}</p>
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
                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{application.cover_letter}</p>
                                );
                            })()}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">Cover letter tidak tersedia</p>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                <ApplicationDocumentViewer
                    documentUrl={application.cv_url}
                    title="CV / Resume"
                    type="cv"
                    jobSeekerId={application.job_seeker_id}
                />
                <ApplicationDocumentViewer
                    documentUrl={application.portfolio_url}
                    title="Portfolio"
                    type="portfolio"
                    jobSeekerId={application.job_seeker_id}
                />
            </div>
        </div>
    );
}

