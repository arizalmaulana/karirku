import { ArrowUpRight, BriefcaseBusiness, FileText, Users, Wallet, CheckCircle2, AlertCircle, Clock, XCircle, Building2, Lock } from "lucide-react";
import { formatDateDayMonth } from "@/lib/utils/dateFormat";
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
        { data: pendingCompaniesData },
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
        supabase.from("companies")
            .select("id, name, industry, location_city, status, is_approved, is_blocked, blocked_reason, created_at, profiles!companies_recruiter_id_fkey(full_name, email)")
            .or("status.eq.pending,is_approved.is.null,is_approved.eq.false")
            .order("created_at", { ascending: false })
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

    const pendingCompanies = (pendingCompaniesData || []).map((company: any) => ({
        id: company.id,
        name: company.name || "Unknown",
        industry: company.industry || "-",
        location: company.location_city || "-",
        status: company.status || "pending",
        isApproved: company.is_approved || false,
        isBlocked: company.is_blocked || false,
        blockedReason: company.blocked_reason || null,
        recruiterName: company.profiles?.full_name || "-",
        recruiterEmail: company.profiles?.email || "-",
        created: formatDateDayMonth(company.created_at),
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
        <div className="container mx-auto px-4 py-8 space-y-8 max-w-7xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-sm font-semibold text-blue-600 mb-1">Dashboard Admin</p>
                    <h1 className="text-3xl font-bold text-gray-900 mt-1">Kontrol Sistem Terpadu</h1>
                    <p className="text-gray-600 mt-2">
                        Pantau metrik utama, verifikasi lowongan baru, dan pastikan data biaya hidup selalu
                        terkini.
                    </p>
                </div>
            </div>

            <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {summaryStats.map((stat) => (
                    <Card key={stat.title} className="border-2 border-blue-200/50 bg-gradient-to-br from-blue-100 via-blue-50/50 to-blue shadow-lg text-black-700 hover:bg-purple-200 hover:shadow-xl transition-all duration-300 hover:scale-105">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                            <CardTitle className="text-sm font-semibold text-gray-600">{stat.title}</CardTitle>
                            <div className="p-3 bg-gradient-to-br from-purple-400 to-blue-600 rounded-xl shadow-md hover:bg-pink-600 hover:shadow-xl transition-all duration-300 hover:scale-105">
                                <stat.icon className="h-5 w-5 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                            {stat.delta && <p className="text-sm text-emerald-600 font-medium">{stat.delta}</p>}
                        </CardContent>
                    </Card>
                ))}
            </section>

            <section className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2 border-2 shadow-lg border-blue-300 text-black-700 hover:bg-blue-50">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div>
                            <CardTitle className="text-xl font-bold">Lowongan Terbaru</CardTitle>
                            <CardDescription>Lowongan yang baru diajukan oleh recruiter</CardDescription>
                        </div>
                        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-purple-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all" variant="outline" size="sm" asChild>
                            <Link href="/admin/jobs">
                                Lihat Semua
                                <ArrowUpRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentJobs.length > 0 ? (
                                recentJobs.map((job: any) => (
                                    <Link key={job.id} href={`/admin/jobs/${job.id}`}>
                                        <div className="flex items-center justify-between rounded-2xl border-2 border-blue-200 p-5 hover:border-purple-200 hover:bg-purple-50/50 to-blue-50/50 text-black-700 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md mb-2">
                                            <div className="flex-1">
                                                <p className="font-bold text-gray-900 mb-1">{job.title}</p>
                                                <p className="text-sm text-gray-600 font-medium mb-2">{job.company}</p>
                                                <p className="text-xs text-gray-500">Diajukan pada {job.submitted}</p>
                                            </div>
                                            <ArrowUpRight className="h-5 w-5 text-blue-600" />
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <BriefcaseBusiness className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-sm text-gray-500">Tidak ada lowongan terbaru</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-2 border-blue-200/50 shadow-lg border-blue-300 text-black-700 hover:bg-blue-50">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div>
                            <CardTitle className="text-xl font-bold">Aktivitas Lamaran</CardTitle>
                            <CardDescription>Lamaran terbaru yang masuk</CardDescription>
                        </div>
                        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-purple-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all" variant="outline" size="sm" asChild>
                            <Link href="/admin/applications">
                                Lihat Semua
                                <ArrowUpRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4 text-black-700">
                        {recentApplications.length > 0 ? (
                            recentApplications.map((application: any) => (
                                <Link key={application.id} href={`/admin/applications/${application.id}`}>
                                    <div className="rounded-2xl border-2 border-gray-200 p-4 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md">
                                        <p className="font-bold text-gray-900 mb-1">{application.candidate}</p>
                                        <p className="text-sm text-gray-600 font-medium mb-2">
                                            {application.job}
                                        </p>
                                        <p className="text-xs text-gray-500 mb-3">{application.submitted}</p>
                                        <Badge className="w-fit" variant={getStatusBadgeVariant(application.status)}>
                                            {getStatusLabel(application.status)}
                                        </Badge>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-sm text-gray-500">Tidak ada lamaran terbaru</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </section>

            {/* Validasi Perusahaan */}
            <Card className="border-2 border-amber-200/50 bg-gradient-to-br from-amber-50/50 to-blue-50/50 shadow-lg">
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-xl font-bold">
                        <div className="p-2 bg-amber-100 rounded-xl">
                            <Building2 className="h-5 w-5 text-amber-600" />
                        </div>
                        Validasi Perusahaan
                    </CardTitle>
                    <CardDescription>Perusahaan yang perlu divalidasi dan disetujui</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Pending Companies */}
                    {pendingCompanies.length > 0 ? (
                        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Building2 className="h-4 w-4 text-amber-600" />
                                        <p className="font-semibold text-gray-900">
                                            {pendingCompanies.length} Perusahaan Menunggu Validasi
                                        </p>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-3">
                                        Perusahaan baru yang perlu diverifikasi dan disetujui oleh admin
                                    </p>
                                    <div className="space-y-2 mb-3">
                                        {pendingCompanies.slice(0, 5).map((company: any) => (
                                            <Link key={company.id} href={`/admin/companies/${company.id}`}>
                                                <div className="flex items-center justify-between text-sm bg-white rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="font-medium text-gray-900">{company.name}</p>
                                                            {company.isBlocked && (
                                                                <Badge variant="destructive" className="text-xs">
                                                                    <Lock className="h-3 w-3 mr-1" />
                                                                    Diblokir
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        {company.isBlocked && company.blockedReason && (
                                                            <div className="mb-2 rounded bg-red-50 border border-red-200 p-2">
                                                                <p className="text-xs font-semibold text-red-900 mb-1">Alasan diblokir:</p>
                                                                <p className="text-xs text-red-700">{company.blockedReason}</p>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-3 mt-1">
                                                            {company.industry && (
                                                                <p className="text-xs text-gray-500">{company.industry}</p>
                                                            )}
                                                            {company.location && (
                                                                <p className="text-xs text-gray-500">📍 {company.location}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <p className="text-xs text-gray-500">
                                                                Recruiter: {company.recruiterName}
                                                            </p>
                                                            {company.recruiterEmail && (
                                                                <p className="text-xs text-gray-400">• {company.recruiterEmail}</p>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-400 mt-1">Didaftarkan: {formatDateDayMonth(company.created)}</p>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        <Badge 
                                                            variant={company.status === "pending" ? "outline" : company.status === "approved" ? "default" : "destructive"}
                                                        >
                                                            {company.status === "pending" ? "Menunggu" : company.status === "approved" ? "Disetujui" : "Ditolak"}
                                                        </Badge>
                                                        <ArrowUpRight className="h-4 w-4 text-gray-400" />
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                    <Button variant="outline" size="sm" asChild className="w-full">
                                        <Link href="/admin/companies?filter=pending">
                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                            Kelola Perusahaan ({pendingCompanies.length})
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-green-200 bg-green-50/50 p-4">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                <div>
                                    <p className="font-semibold text-gray-900">Tidak Ada Perusahaan yang Perlu Divalidasi</p>
                                    <p className="text-sm text-gray-600">Semua perusahaan sudah divalidasi dengan baik!</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                        <p className="font-semibold text-gray-900 mb-3">Aksi Cepat</p>
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/admin/companies">
                                    <Building2 className="h-4 w-4 mr-2" />
                                    Semua Perusahaan
                                </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/admin/jobs/new">
                                    <BriefcaseBusiness className="h-4 w-4 mr-2" />
                                    Tambah Lowongan
                                </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/admin/living-costs/new">
                                    <Wallet className="h-2 w-2 mr-2" />
                                    Tambah Biaya Hidup
                                </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/admin/users">
                                    <Users className="h-4 w-4 mr-2" />
                                    Kelola Pengguna
                                </Link>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
