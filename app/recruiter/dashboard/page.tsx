import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
    Briefcase, Users, FileText, ArrowUpRight, Mail, FileCheck, CalendarCheck, UserCheck, 
    Building2, AlertCircle, CheckCircle2, XCircle, Clock, TrendingUp, Eye, BarChart3,
    X, Activity
} from "lucide-react";
import { redirect } from "next/navigation";
import type { JobListing, Application, Company } from "@/lib/types";

function formatCurrency(amount: number | null): string {
    if (!amount) return "Tidak disebutkan";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
}

async function getUserProfile(userId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

    if (error || !data) {
        return null;
    }
    return data;
}

async function getCompanyProfile(recruiterId: string): Promise<Company | null> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("recruiter_id", recruiterId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            return null;
        }
        console.error("Error fetching company:", error);
        return null;
    }
    return data as Company;
}

async function getRecruiterJobs(userId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("job_listings")
        .select("*")
        .eq("recruiter_id", userId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching jobs:", error);
        return [];
    }
    return data as JobListing[];
}

async function getApplicationsForRecruiter(userId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("applications")
        .select(`
            *,
            job_listings!inner(recruiter_id, title, id)
        `)
        .eq("job_listings.recruiter_id", userId);

    if (error) {
        console.error("Error fetching applications:", error);
        return [];
    }
    return data || [];
}

function getStatusCounts(applications: any[]) {
    const counts = {
        submitted: 0,
        review: 0,
        interview: 0,
        accepted: 0,
        rejected: 0,
    };

    applications.forEach((app) => {
        if (app.status in counts) {
            counts[app.status as keyof typeof counts]++;
        }
    });

    return counts;
}

function getStatusBadge(status: string | null, isApproved: boolean | null) {
    if (isApproved && status === 'approved') {
        return (
            <Badge className="bg-green-100 text-green-800 border-green-300">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Disetujui
            </Badge>
        );
    } else if (status === 'rejected') {
        return (
            <Badge className="bg-red-100 text-red-800 border-red-300">
                <XCircle className="w-3 h-3 mr-1" />
                Ditolak
            </Badge>
        );
    } else {
        return (
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                <Clock className="w-3 h-3 mr-1" />
                Menunggu Persetujuan
            </Badge>
        );
    }
}

export default async function RecruiterDashboardPage() {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/");
    }

    const profile = await getUserProfile(user.id);
    if (!profile || (profile as any).role !== "recruiter") {
        redirect("/");
    }

    const [jobs, applications, company] = await Promise.all([
        getRecruiterJobs(user.id),
        getApplicationsForRecruiter(user.id),
        getCompanyProfile(user.id),
    ]);

    const statusCounts = getStatusCounts(applications);
    const totalApplications = applications.length;
    const totalJobs = jobs.length;
    const acceptedCount = statusCounts.accepted;
    const conversionRate = totalApplications > 0 
        ? ((acceptedCount / totalApplications) * 100).toFixed(1) 
        : "0.0";

    // Get recent applications with better fallback
    const recentApplicationsWithFallback = await Promise.all(
        applications.slice(0, 5).map(async (app: any) => {
            let applicantName = app.profiles?.full_name;
            
            // Fallback: Query profiles separately if not included
            if (!applicantName && app.job_seeker_id) {
                const { data: profileData } = await supabase
                    .from("profiles")
                    .select("full_name")
                    .eq("id", app.job_seeker_id)
                    .single();
                if (profileData) {
                    applicantName = profileData.full_name;
                }
            }

            // Fallback: Extract from cover_letter JSON
            if (!applicantName && app.cover_letter) {
                try {
                    const parsed = typeof app.cover_letter === 'string' 
                        ? JSON.parse(app.cover_letter) 
                        : app.cover_letter;
                    if (parsed && typeof parsed === 'object' && parsed.namaLengkap) {
                        applicantName = parsed.namaLengkap;
                    }
                } catch (e) {
                    // Ignore parse errors
                }
            }

            return {
                ...app,
                applicantName: applicantName || "Unknown",
            };
        })
    );

    const pipelineStats = [
        {
            label: "Total Lowongan",
            value: totalJobs,
            icon: Briefcase,
            subtext: "Lowongan aktif",
            color: "text-indigo-600",
            link: "/recruiter/jobs",
        },
        {
            label: "Lamaran Masuk",
            value: statusCounts.submitted,
            icon: Mail,
            subtext: "Lamaran baru yang perlu ditinjau",
            color: "text-blue-600",
            link: "/recruiter/applications?status=submitted",
        },
        {
            label: "Interview",
            value: statusCounts.interview,
            icon: CalendarCheck,
            subtext: "Interview dijadwalkan",
            color: "text-purple-600",
            link: "/recruiter/applications?status=interview",
        },
        {
            label: "Diterima",
            value: acceptedCount,
            icon: UserCheck,
            subtext: `Conversion: ${conversionRate}%`,
            color: "text-green-600",
            link: "/recruiter/applications?status=accepted",
        },
    ];

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 py-6">
            {/* Header Section */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-sm font-semibold text-purple-600 mb-1">Dashboard Recruiter</p>
                    <h1 className="text-3xl font-bold text-gray-900 mt-1">
                        Selamat Datang, {profile.full_name || "Recruiter"}!
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Pantau performa lowongan, tindak lanjuti kandidat, dan update status lamaran langsung.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                        size="lg" 
                        className="w-full sm:w-fit bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl transition-all" 
                        asChild
                    >
                        <Link href="/recruiter/jobs/new">
                            <Briefcase className="mr-2 h-4 w-4" />
                            Buat Lowongan Baru
                        </Link>
                    </Button>
                    <Button 
                        size="lg" 
                        variant="outline"
                        className="w-full sm:w-fit border-purple-300 text-purple-700 hover:bg-purple-50" 
                        asChild
                    >
                        <Link href="/recruiter/applications">
                            <Users className="mr-2 h-4 w-4" />
                            Lihat Semua Pelamar
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Company Profile Status Alert */}
            {company && (
                <Card className={`border-2 ${
                    company.is_approved && company.status === 'approved' 
                        ? 'border-green-200 bg-green-50' 
                        : company.status === 'rejected'
                        ? 'border-red-200 bg-red-50'
                        : 'border-yellow-200 bg-yellow-50'
                }`}>
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-xl ${
                                company.is_approved && company.status === 'approved'
                                    ? 'bg-green-100'
                                    : company.status === 'rejected'
                                    ? 'bg-red-100'
                                    : 'bg-yellow-100'
                            }`}>
                                <Building2 className={`h-6 w-6 ${
                                    company.is_approved && company.status === 'approved'
                                        ? 'text-green-700'
                                        : company.status === 'rejected'
                                        ? 'text-red-700'
                                        : 'text-yellow-700'
                                }`} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-bold text-lg text-gray-900">
                                        {company.name}
                                    </h3>
                                    {getStatusBadge(company.status, company.is_approved)}
                                </div>
                                {company.is_approved && company.status === 'approved' ? (
                                    <p className="text-sm text-green-700 mb-3">
                                        Profile perusahaan Anda sudah disetujui dan dapat dilihat oleh publik.
                                    </p>
                                ) : company.status === 'rejected' ? (
                                    <p className="text-sm text-red-700 mb-3">
                                        Profile perusahaan ditolak. Silakan perbaiki dan kirim ulang untuk persetujuan.
                                    </p>
                                ) : (
                                    <p className="text-sm text-yellow-700 mb-3">
                                        Profile perusahaan sedang menunggu persetujuan admin. Setelah disetujui, profile akan terlihat oleh publik.
                                    </p>
                                )}
                                <Button variant="outline" size="sm" asChild className="border-purple-300 text-purple-700 hover:bg-purple-50">
                                    <Link href="/recruiter/company/profile">
                                        <Building2 className="h-4 w-4 mr-2" />
                                        Kelola Profile Perusahaan
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {!company && (
                <Card className="border-2 border-amber-200 bg-amber-50">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-xl bg-amber-100">
                                <AlertCircle className="h-6 w-6 text-amber-700" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-amber-900 mb-2">
                                    Profile Perusahaan Belum Dilengkapi
                                </h3>
                                <p className="text-sm text-amber-700 mb-3">
                                    Lengkapi profile perusahaan Anda untuk meningkatkan kredibilitas dan memudahkan pengisian lowongan pekerjaan.
                                </p>
                                <Button variant="outline" size="sm" asChild className="border-amber-300 text-amber-700 hover:bg-amber-100">
                                    <Link href="/recruiter/company/profile">
                                        <Building2 className="h-4 w-4 mr-2" />
                                        Lengkapi Profile Perusahaan
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Statistics Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {pipelineStats.map((stat) => {
                    const iconBgClass = {
                        'text-indigo-600': 'from-indigo-400 to-indigo-600',
                        'text-blue-600': 'from-blue-400 to-blue-600',
                        'text-purple-600': 'from-purple-400 to-purple-600',
                        'text-green-600': 'from-green-400 to-green-600',
                    }[stat.color] || 'from-gray-400 to-gray-600';
                    
                    return (
                        <Link key={stat.label} href={stat.link || "#"} className="block">
                            <Card className="border-2 border-purple-200/50 bg-gradient-to-br from-purple-50 via-purple-50/50 to-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer h-full">
                                <CardHeader className="flex flex-row items-center justify-between pb-3">
                                    <CardTitle className="text-sm font-semibold text-gray-600">
                                        {stat.label}
                                    </CardTitle>
                                    <div className={`p-3 rounded-xl shadow-md bg-gradient-to-br ${iconBgClass}`}>
                                        <stat.icon className="h-5 w-5 text-white" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-bold text-gray-900 mb-1">{stat.value}</div>
                                    <p className="text-sm text-gray-600 font-medium">{stat.subtext}</p>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </section>

            {/* Additional Stats Row */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-2 border-gray-200/50 shadow-lg">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Total Pelamar
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{totalApplications}</div>
                        <p className="text-sm text-gray-600">Semua lamaran</p>
                    </CardContent>
                </Card>
                <Card className="border-2 border-gray-200/50 shadow-lg">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Conversion Rate
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{conversionRate}%</div>
                        <p className="text-sm text-gray-600">Tingkat penerimaan</p>
                    </CardContent>
                </Card>
                <Card className="border-2 border-gray-200/50 shadow-lg">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            Sedang Ditinjau
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{statusCounts.review}</div>
                        <p className="text-sm text-gray-600">Dalam proses screening</p>
                    </CardContent>
                </Card>
            </section>

            {/* Main Content Grid */}
            <section className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2 border-2 border-gray-200/50 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div>
                            <CardTitle className="text-xl font-bold">Lowongan Aktif</CardTitle>
                            <CardDescription>
                                Update status tiap lowongan untuk menjaga pipeline rapih
                            </CardDescription>
                        </div>
                        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all" variant="outline" size="sm" asChild>
                            <Link href="/recruiter/jobs">
                                Kelola Semua
                                <ArrowUpRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {jobs.length > 0 ? (
                            jobs.slice(0, 5).map((job) => {
                                const jobApplications = applications.filter(
                                    (app: any) => app.job_id === job.id
                                );
                                const acceptedInJob = jobApplications.filter(
                                    (app: any) => app.status === 'accepted'
                                ).length;
                                const jobConversionRate = jobApplications.length > 0
                                    ? ((acceptedInJob / jobApplications.length) * 100).toFixed(1)
                                    : "0.0";

                                return (
                                    <div key={job.id} className="rounded-2xl border-2 border-gray-200 p-6 hover:border-purple-300 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-purple-50/30">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex-1">
                                                <p className="font-bold text-lg text-gray-900 mb-1">{job.title}</p>
                                                <p className="text-sm text-gray-600 font-medium">{job.company_name}</p>
                                            </div>
                                            <Badge variant={job.featured ? "default" : "secondary"} className="shadow-sm">
                                                {job.featured ? "Featured" : "Aktif"}
                                            </Badge>
                                        </div>
                                        <div className="mt-5 grid gap-4 md:grid-cols-3">
                                            <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                                                <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold mb-2">
                                                    Pelamar
                                                </p>
                                                <p className="text-2xl font-bold text-purple-900">
                                                    {jobApplications.length}
                                                </p>
                                            </div>
                                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                                                <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold mb-2">
                                                    Diterima
                                                </p>
                                                <p className="text-2xl font-bold text-blue-900">
                                                    {acceptedInJob}
                                                </p>
                                            </div>
                                            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                                                <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold mb-2">
                                                    Conversion
                                                </p>
                                                <p className="text-2xl font-bold text-green-900">
                                                    {jobConversionRate}%
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-5 flex gap-3">
                                            <Button variant="outline" size="sm" className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-50" asChild>
                                                <Link href={`/recruiter/jobs/${job.id}`}>
                                                    <Eye className="h-3 w-3 mr-1" />
                                                    Detail
                                                </Link>
                                            </Button>
                                            <Button variant="outline" size="sm" className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-50" asChild>
                                                <Link href={`/recruiter/applications?job=${job.id}`}>
                                                    <Users className="h-3 w-3 mr-1" />
                                                    Pelamar
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-12">
                                <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 mb-4 font-medium">Belum ada lowongan</p>
                                <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white" asChild>
                                    <Link href="/recruiter/jobs/new">Buat Lowongan Pertama</Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-2 border-gray-200/50 shadow-lg">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xl font-bold">Pelamar Terbaru</CardTitle>
                        <CardDescription>Kandidat yang baru mendaftar</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {recentApplicationsWithFallback.length > 0 ? (
                            recentApplicationsWithFallback.map((app: any) => (
                                <div key={app.id} className="rounded-2xl border-2 border-gray-200 p-5 hover:border-purple-300 hover:bg-purple-50/50 transition-all duration-300 shadow-sm hover:shadow-md">
                                    <p className="font-bold text-gray-900 mb-1">
                                        {app.applicantName}
                                    </p>
                                    <p className="text-sm text-gray-600 font-medium mb-3">
                                        {app.job_listings?.title || "Unknown"}
                                    </p>
                                    <Badge className="mb-3" variant="outline">
                                        {app.status}
                                    </Badge>
                                    <p className="text-xs text-gray-500 mb-4">
                                        {new Date(app.submitted_at).toLocaleDateString("id-ID", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                                        asChild
                                    >
                                        <Link href={`/recruiter/applications/${app.id}`}>
                                            <Eye className="h-3 w-3 mr-1" />
                                            Lihat Detail
                                        </Link>
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-sm text-gray-500">
                                    Belum ada pelamar
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
