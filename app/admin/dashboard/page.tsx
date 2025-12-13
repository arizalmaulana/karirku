import { ArrowUpRight, BriefcaseBusiness, FileText, Users, Wallet, CheckCircle2, AlertCircle, Clock, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboardPage() {
    const supabase = await createSupabaseServerClient();

    // Fetch aggregate data in parallel
    const [
        { count: userCount },
        { count: jobCount },
        { count: applicationCount },
        { count: cityCount },
        { data: recentJobsData },
        { data: recentApplicationsData },
        { data: pendingRecruitersData },
        { data: pendingApplicationsData },
    ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("job_listings").select("*", { count: "exact", head: true }),
        supabase.from("applications").select("*", { count: "exact", head: true }),
        supabase.from("living_costs").select("*", { count: "exact", head: true }),
        supabase.from("job_listings")
            .select("id, title, company_name, created_at, recruiter_id")
            .order("created_at", { ascending: false })
            .limit(5),
        supabase.from("applications")
            .select("id, status, submitted_at, profiles(full_name), job_listings(title, company_name)")
            .order("submitted_at", { ascending: false })
            .limit(5),
        supabase.from("profiles")
            .select("id, full_name, email, company_license_url, created_at")
            .eq("role", "recruiter")
            .eq("is_approved", false)
            .order("created_at", { ascending: false })
            .limit(5),
        supabase.from("applications")
            .select("id, status, submitted_at, profiles(full_name), job_listings(title, company_name)")
            .in("status", ["submitted", "review"])
            .order("submitted_at", { ascending: false })
            .limit(5),
    ]);

    // Transform data for display
    const recentJobs = (recentJobsData || []).map((job: any) => ({
        id: job.id,
        title: job.title,
        company: job.company_name,
        submitted: new Date(job.created_at).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        }),
    }));

    const recentApplications = (recentApplicationsData || []).map((app: any) => ({
        id: app.id,
        candidate: app.profiles?.full_name || "Unknown",
        job: app.job_listings?.title || "Unknown",
        company: app.job_listings?.company_name || "Unknown",
        status: app.status || "submitted",
        submitted: new Date(app.submitted_at).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
        }),
    }));

    const pendingRecruiters = (pendingRecruitersData || []).map((recruiter: any) => ({
        id: recruiter.id,
        name: recruiter.full_name || "Unknown",
        email: recruiter.email || "-",
        hasLicense: !!recruiter.company_license_url,
        registered: new Date(recruiter.created_at).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
        }),
    }));

    const pendingApplications = (pendingApplicationsData || []).map((app: any) => ({
        id: app.id,
        candidate: app.profiles?.full_name || "Unknown",
        job: app.job_listings?.title || "Unknown",
        company: app.job_listings?.company_name || "Unknown",
        status: app.status,
        submitted: new Date(app.submitted_at).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
        }),
    }));

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

    const summaryStats = [
        { title: "Total Pengguna", value: userCount ?? 0, icon: Users, delta: undefined },
        { title: "Lowongan Aktif", value: jobCount ?? 0, icon: BriefcaseBusiness, delta: undefined },
        { title: "Total Lamaran", value: applicationCount ?? 0, icon: FileText, delta: undefined },
        { title: "Data Biaya Hidup", value: cityCount ?? 0, icon: Wallet, delta: undefined },
    ];

    return (
        <div className="container mx-auto px-4 py-10 space-y-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-sm font-semibold text-blue-600">Dashboard Admin</p>
                    <h1 className="text-3xl font-semibold text-blue-900 mt-1">Kontrol Sistem Terpadu</h1>
                    <p className="text-gray-500">
                        Pantau metrik utama, verifikasi lowongan baru, dan pastikan data biaya hidup selalu
                        terkini.
                    </p>
                </div>
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-purple-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/30" variant="outline" size="sm" asChild>
                        <Link href="/admin/jobs/new">
                            Tambah Lowongan Baru
                        </Link>
                    </Button>
            </div>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 border border-blue-200 bg-gradient-to-br from-blue-50 to-pink-100/50 shadow-sm rounded-2xl p-6">
                {summaryStats.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">{stat.title}</CardTitle>
                            <stat.icon className="h-5 w-5 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-semibold">{stat.value}</div>
                            {stat.delta && <p className="text-sm text-emerald-600">{stat.delta}</p>}
                        </CardContent>
                    </Card>
                ))}
            </section>

            <section className="grid gap-6 lg:grid-cols-3 border border-blue-200 bg-gradient-to-br from-purple-100 to-blue-100/80 shadow-sm rounded-2xl p-6">
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Lowongan Terbaru</CardTitle>
                            <CardDescription>Lowongan yang baru diajukan oleh recruiter</CardDescription>
                        </div>
                        <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/30" variant="outline" size="sm" asChild>
                            <Link href="/admin/jobs">
                                Lihat Semua
                                <ArrowUpRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {recentJobs.length > 0 ? (
                                recentJobs.map((job: any) => (
                                    <Link key={job.id} href={`/admin/jobs/${job.id}`}>
                                        <div className="flex items-center justify-between rounded-xl border p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900">{job.title}</p>
                                                <p className="text-sm text-gray-500">{job.company}</p>
                                                <p className="text-xs text-gray-400 mt-1">Diajukan pada {job.submitted}</p>
                                            </div>
                                            <ArrowUpRight className="h-4 w-4 text-gray-400" />
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500">Tidak ada lowongan terbaru</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Aktivitas Lamaran</CardTitle>
                            <CardDescription>Lamaran terbaru yang masuk</CardDescription>
                        </div>
                        <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/30" variant="outline" size="sm" asChild>
                            <Link href="/admin/applications">
                                Lihat Semua
                                <ArrowUpRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {recentApplications.length > 0 ? (
                            recentApplications.map((application: any) => (
                                <Link key={application.id} href={`/admin/applications/${application.id}`}>
                                    <div className="rounded-xl border p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                                        <p className="font-semibold text-gray-900">{application.candidate}</p>
                                        <p className="text-sm text-gray-600">
                                            {application.job}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">{application.submitted}</p>
                                        <Badge className="mt-2 w-fit" variant={getStatusBadgeVariant(application.status)}>
                                            {getStatusLabel(application.status)}
                                        </Badge>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500">Tidak ada lamaran terbaru</p>
                        )}
                    </CardContent>
                </Card>
            </section>

            {/* Tugas Prioritas Admin */}
            <Card className="border border-blue-200 bg-gradient-to-br from-pink-50 to-blue-100/50 shadow-sm rounded-2xl p-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-600" />
                        Tugas Prioritas
                    </CardTitle>
                    <CardDescription>Tugas yang memerlukan perhatian segera</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Recruiter Pending Approval */}
                    {pendingRecruiters.length > 0 && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Users className="h-4 w-4 text-amber-600" />
                                        <p className="font-semibold text-gray-900">
                                            {pendingRecruiters.length} Recruiter Menunggu Persetujuan
                                        </p>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-3">
                                        Ada recruiter baru yang perlu diverifikasi dan disetujui
                                    </p>
                                    <div className="space-y-2 mb-3">
                                        {pendingRecruiters.slice(0, 3).map((recruiter: any) => (
                                            <div key={recruiter.id} className="flex items-center justify-between text-sm bg-white rounded-lg p-2">
                                                <div>
                                                    <p className="font-medium">{recruiter.name}</p>
                                                    <p className="text-xs text-gray-500">{recruiter.email}</p>
                                                </div>
                                                <Badge variant={recruiter.hasLicense ? "outline" : "destructive"}>
                                                    {recruiter.hasLicense ? "Ada License" : "Tanpa License"}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                    <Button variant="outline" size="sm" asChild className="w-full">
                                        <Link href="/admin/users?filter=pending">
                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                            Kelola Recruiter ({pendingRecruiters.length})
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Pending Applications */}
                    {pendingApplications.length > 0 && (
                        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="h-4 w-4 text-blue-600" />
                                        <p className="font-semibold text-gray-900">
                                            {pendingApplications.length} Lamaran Menunggu Tindakan
                                        </p>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-3">
                                        Lamaran yang masih dalam status "Dikirim" atau "Dalam Review"
                                    </p>
                                    <div className="space-y-2 mb-3">
                                        {pendingApplications.slice(0, 3).map((app: any) => (
                                            <Link key={app.id} href={`/admin/applications/${app.id}`}>
                                                <div className="flex items-center justify-between text-sm bg-white rounded-lg p-2 hover:bg-gray-50 transition-colors cursor-pointer">
                                                    <div>
                                                        <p className="font-medium">{app.candidate}</p>
                                                        <p className="text-xs text-gray-500">{app.job} • {app.company}</p>
                                                    </div>
                                                    <Badge variant={getStatusBadgeVariant(app.status)}>
                                                        {getStatusLabel(app.status)}
                                                    </Badge>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                    <Button variant="outline" size="sm" asChild className="w-full">
                                        <Link href="/admin/applications?status=submitted,review">
                                            <FileText className="h-4 w-4 mr-2" />
                                            Kelola Lamaran ({pendingApplications.length})
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <p className="font-semibold text-gray-900 mb-3">Aksi Cepat</p>
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/admin/jobs/new">
                                    <BriefcaseBusiness className="h-4 w-4 mr-2" />
                                    Tambah Lowongan
                                </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/admin/living-costs/new">
                                    <Wallet className="h-4 w-4 mr-2" />
                                    Tambah Biaya Hidup
                                </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/admin/users/new">
                                    <Users className="h-4 w-4 mr-2" />
                                    Tambah Pengguna
                                </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/admin/applications">
                                    <FileText className="h-4 w-4 mr-2" />
                                    Semua Lamaran
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Info jika tidak ada tugas prioritas */}
                    {pendingRecruiters.length === 0 && pendingApplications.length === 0 && (
                        <div className="rounded-xl border border-green-200 bg-green-50/50 p-4">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                <div>
                                    <p className="font-semibold text-gray-900">Tidak Ada Tugas Prioritas</p>
                                    <p className="text-sm text-gray-600">Semua tugas sudah ditangani dengan baik!</p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
