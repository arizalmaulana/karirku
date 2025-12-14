import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Briefcase, Users, FileText, ArrowUpRight, Mail, FileCheck, CalendarCheck, UserCheck } from "lucide-react";
import { redirect } from "next/navigation";
import type { JobListing, Application } from "@/lib/types";

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
            job_listings!inner(recruiter_id, title)
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

    const [jobs, applications] = await Promise.all([
        getRecruiterJobs(user.id),
        getApplicationsForRecruiter(user.id),
    ]);

    const statusCounts = getStatusCounts(applications);

    const pipelineStats = [
        {
            label: "Lamaran Masuk",
            value: statusCounts.submitted,
            icon: Mail,
            subtext: "Lamaran baru yang perlu ditinjau",
            color: "text-blue-600",
        },
        {
            label: "Sedang Ditinjau",
            value: statusCounts.review,
            icon: FileCheck,
            subtext: "Dalam proses screening",
            color: "text-yellow-600",
        },
        {
            label: "Interview",
            value: statusCounts.interview,
            icon: CalendarCheck,
            subtext: "Interview dijadwalkan",
            color: "text-purple-600",
        },
        {
            label: "Diterima",
            value: statusCounts.accepted,
            icon: UserCheck,
            subtext: "Kandidat yang diterima",
            color: "text-green-600",
        },
    ];

    // Get recent applications with job seeker info
    const { data: recentApplicationsData } = await supabase
        .from("applications")
        .select(`
            *,
            job_listings!inner(title, recruiter_id),
            profiles(full_name, skills)
        `)
        .eq("job_listings.recruiter_id", user.id)
        .order("submitted_at", { ascending: false })
        .limit(5);

    const recentApplications = recentApplicationsData || [];

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-sm font-semibold text-purple-600 mb-1">Dashboard Recruiter</p>
                    <h1 className="text-3xl font-bold text-gray-900 mt-1">
                        Kelola Pipeline Kandidat
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Pantau performa lowongan, tindak lanjuti kandidat, dan update status lamaran langsung.
                    </p>
                </div>
                <Button size="lg" className="w-full lg:w-fit bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl transition-all" asChild>
                    <Link href="/recruiter/jobs/new">
                        <Briefcase className="mr-2 h-4 w-4" />
                        Buat Lowongan Baru
                    </Link>
                </Button>
            </div>

            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {pipelineStats.map((stat) => {
                    const iconBgClass = {
                        'text-blue-600': 'from-blue-400 to-blue-600',
                        'text-yellow-600': 'from-yellow-400 to-yellow-600',
                        'text-purple-600': 'from-purple-400 to-purple-600',
                        'text-green-600': 'from-green-400 to-green-600',
                    }[stat.color] || 'from-gray-400 to-gray-600';
                    
                    return (
                        <Card key={stat.label} className="border-2 border-purple-200/50 bg-gradient-to-br from-purple-50 via-purple-50/50 to-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
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
                    );
                })}
            </section>

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
                                return (
                                    <div key={job.id} className="rounded-2xl border-2 border-gray-200 p-6 hover:border-purple-300 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-purple-50/30">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <p className="font-bold text-lg text-gray-900 mb-1">{job.title}</p>
                                                <p className="text-sm text-gray-600 font-medium">{job.company_name}</p>
                                            </div>
                                            <Badge variant={job.featured ? "default" : "secondary"} className="shadow-sm">
                                                {job.featured ? "Featured" : "Aktif"}
                                            </Badge>
                                        </div>
                                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                                            <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                                                <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold mb-2">
                                                    Pelamar
                                                </p>
                                                <p className="text-2xl font-bold text-purple-900">
                                                    {jobApplications.length} Kandidat
                                                </p>
                                            </div>
                                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                                                <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold mb-2">
                                                    Estimasi Gaji
                                                </p>
                                                <p className="text-sm font-bold text-blue-900">
                                                    {job.min_salary && job.max_salary
                                                        ? `${formatCurrency(job.min_salary)} - ${formatCurrency(job.max_salary)}`
                                                        : job.min_salary
                                                        ? `Mulai dari ${formatCurrency(job.min_salary)}`
                                                        : "Tidak disebutkan"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-5 flex gap-3">
                                            <Button variant="outline" size="sm" className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-50" asChild>
                                                <Link href={`/recruiter/jobs/${job.id}`}>
                                                    Lihat Detail
                                                </Link>
                                            </Button>
                                            <Button variant="outline" size="sm" className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-50" asChild>
                                                <Link href={`/recruiter/applications?job=${job.id}`}>
                                                    Lihat Pelamar
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
                        {recentApplications.length > 0 ? (
                            recentApplications.map((app: any) => (
                                <div key={app.id} className="rounded-2xl border-2 border-gray-200 p-5 hover:border-purple-300 hover:bg-purple-50/50 transition-all duration-300 shadow-sm hover:shadow-md">
                                    <p className="font-bold text-gray-900 mb-1">
                                        {app.profiles?.full_name || "Unknown"}
                                    </p>
                                    <p className="text-sm text-gray-600 font-medium mb-3">
                                        {app.job_listings?.title || "Unknown"}
                                    </p>
                                    <Badge className="mb-3" variant="outline">
                                        {app.status}
                                    </Badge>
                                    <p className="text-xs text-gray-500 mb-4">
                                        {new Date(app.submitted_at).toLocaleDateString("id-ID")}
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                                        asChild
                                    >
                                        <Link href={`/recruiter/applications/${app.id}`}>
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
