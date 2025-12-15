import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Download } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { ApplicationEditForm } from "@/components/admin/ApplicationEditForm";
import { ApplicationDocumentViewer } from "@/components/admin/ApplicationDocumentViewer";
import { PortfolioViewer } from "@/components/admin/PortfolioViewer";

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
            job_listings!inner(title, company_name, location_city, location_province, employment_type, recruiter_id),
            profiles(full_name, headline, location_city, skills, major, email, phone, bio, experience, education)
        `)
        .eq("id", id)
        .eq("job_listings.recruiter_id", userId)
        .single();

    if (error) {
        console.error("Error fetching application:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        return null;
    }
    
    if (!data) {
        console.log("No data returned for application:", id);
        return null;
    }
    
    // Type assertion untuk data dengan join
    const applicationData = data as any;
    
    // Debug: log the data structure
    console.log("Application data:", {
        id: applicationData.id,
        job_seeker_id: applicationData.job_seeker_id,
        profiles: applicationData.profiles,
        hasProfiles: !!applicationData.profiles,
        profilesFullName: applicationData.profiles?.full_name
    });
    
    return applicationData;
}

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
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
    let profile = application.profiles as any;
    
    // Fallback: Query profiles separately if not included in join
    if (!profile && application.job_seeker_id) {
        const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, headline, location_city, skills, major, email, phone, bio, experience, education")
            .eq("id", application.job_seeker_id)
            .single();
        
        if (profileData) {
            profile = profileData;
        }
    }
    
    // Fallback: Extract name from cover_letter if profiles is still null
    let applicantName = profile?.full_name;
    if (!applicantName && application.cover_letter) {
        try {
            const parsed = JSON.parse(application.cover_letter);
            if (parsed && typeof parsed === 'object' && parsed.namaLengkap) {
                applicantName = parsed.namaLengkap;
            }
        } catch (e) {
            // Not JSON, skip
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" asChild className="hover:bg-gray-50 transition-all border-gray-300">
                    <Link href="/recruiter/applications">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Kembali
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-semibold text-gray-900">Detail Pelamar</h1>
                    <p className="text-gray-500 mt-1">
                        {applicantName || "Unknown"} - {job?.title || "Unknown"}
                    </p>
                </div>
                <Badge variant={getStatusBadgeVariant(application.status)}>
                    {getStatusLabel(application.status)}
                </Badge>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Pelamar</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-500">Nama Lengkap</p>
                                <p className="font-medium">{applicantName || "Tidak ada nama"}</p>
                            </div>
                            {profile?.email && (
                                <div>
                                    <p className="text-sm text-gray-500">Email</p>
                                    <p className="font-medium">{profile.email}</p>
                                </div>
                            )}
                            {profile?.phone && (
                                <div>
                                    <p className="text-sm text-gray-500">Telepon</p>
                                    <p className="font-medium">{profile.phone}</p>
                                </div>
                            )}
                            {profile?.headline && (
                                <div>
                                    <p className="text-sm text-gray-500">Headline</p>
                                    <p className="font-medium">{profile.headline}</p>
                                </div>
                            )}
                            {profile?.location_city && (
                                <div>
                                    <p className="text-sm text-gray-500">Lokasi</p>
                                    <p className="font-medium">{profile.location_city}</p>
                                </div>
                            )}
                            {profile?.major && (
                                <div>
                                    <p className="text-sm text-gray-500">Jurusan</p>
                                    <p className="font-medium">{profile.major}</p>
                                </div>
                            )}
                            {profile?.bio && (
                                <div>
                                    <p className="text-sm text-gray-500">Bio</p>
                                    <p className="font-medium whitespace-pre-wrap">{profile.bio}</p>
                                </div>
                            )}
                            {profile?.experience && (
                                <div>
                                    <p className="text-sm text-gray-500">Pengalaman</p>
                                    <p className="font-medium whitespace-pre-wrap">{profile.experience}</p>
                                </div>
                            )}
                            {profile?.education && (
                                <div>
                                    <p className="text-sm text-gray-500">Pendidikan</p>
                                    <p className="font-medium whitespace-pre-wrap">{profile.education}</p>
                                </div>
                            )}
                            {profile?.skills && profile.skills.length > 0 && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Skills</p>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.skills.map((skill: string, index: number) => (
                                            <Badge key={index} variant="outline">
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {application.cover_letter && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Cover Letter</CardTitle>
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
                                                                <p className="text-sm font-medium">{parsed.namaLengkap}</p>
                                                            </div>
                                                        )}
                                                        {parsed.email && (
                                                            <div>
                                                                <p className="text-xs font-semibold text-gray-500 uppercase">Email</p>
                                                                <p className="text-sm break-words overflow-wrap-anywhere">{parsed.email}</p>
                                                            </div>
                                                        )}
                                                        {parsed.nomorTelepon && (
                                                            <div>
                                                                <p className="text-xs font-semibold text-gray-500 uppercase">Nomor Telepon</p>
                                                                <p className="text-sm break-words overflow-wrap-anywhere">{parsed.nomorTelepon}</p>
                                                            </div>
                                                        )}
                                                        {parsed.domisili && (
                                                            <div>
                                                                <p className="text-xs font-semibold text-gray-500 uppercase">Domisili</p>
                                                                <p className="text-sm break-words overflow-wrap-anywhere">{parsed.domisili}</p>
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
                            </CardContent>
                        </Card>
                    )}

                    <ApplicationDocumentViewer
                        documentUrl={application.cv_url}
                        title="CV / Resume"
                        jobSeekerId={application.job_seeker_id}
                    />

                    <PortfolioViewer
                        portfolioUrl={application.portfolio_url}
                    />
                </div>

                <div className="space-y-6">
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
                                <p className="font-medium">
                                    {job?.location_city || ""}
                                    {job?.location_province && `, ${job.location_province}`}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Tipe Pekerjaan</p>
                                <Badge variant="outline">{job?.employment_type || "-"}</Badge>
                            </div>
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
                        </CardContent>
                    </Card>

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
            </div>
        </div>
    );
}

