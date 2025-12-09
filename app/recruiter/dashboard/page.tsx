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
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-sm font-semibold text-purple-600">Dashboard Recruiter</p>
                    <h1 className="text-3xl font-semibold text-purple-900 mt-1">
                        Kelola Pipeline Kandidat
                    </h1>
                    <p className="text-gray-500">
                        Pantau performa lowongan, tindak lanjuti kandidat, dan update status lamaran langsung.
                    </p>
                </div>
                <Button  size="lg" className="w-full lg:w-fit bg-gradient-to-r from- bg-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg shadow-indigo-500/30" asChild>
                    <Link href="/recruiter/jobs/new">
                        <Briefcase className="mr-2 h-4 w-4" />
                        Buat Lowongan Baru
                    </Link>
                </Button>
            </div>

            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {pipelineStats.map((stat) => (
                    <Card key={stat.label} className="border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">
                                {stat.label}
                            </CardTitle>
                            <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-semibold">{stat.value}</div>
                            <p className="text-sm text-gray-500">{stat.subtext}</p>
                        </CardContent>
                    </Card>
                ))}
            </section>

            <section className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2 border border-pink-200 bg-gradient-to-br from-pink-50 to-pink-100/50 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Lowongan Aktif</CardTitle>
                            <CardDescription>
                                Update status tiap lowongan untuk menjaga pipeline rapih
                            </CardDescription>
                        </div>
                        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-purple-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/30" variant="outline" size="sm" asChild>
                            <Link href="/recruiter/jobs">
                                Kelola Semua
                                <ArrowUpRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {jobs.length > 0 ? (
                            jobs.slice(0, 5).map((job) => {
                                const jobApplications = applications.filter(
                                    (app: any) => app.job_id === job.id
                                );
                                return (
                                    <div key={job.id} className="rounded-2xl border p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-gray-900">{job.title}</p>
                                                <p className="text-sm text-gray-500">{job.company_name}</p>
                                            </div>
                                            <Badge variant={job.featured ? "default" : "secondary"}>
                                                {job.featured ? "Featured" : "Aktif"}
                                            </Badge>
                                        </div>
                                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase tracking-wide">
                                                    Pelamar
                                                </p>
                                                <p className="text-lg font-semibold">
                                                    {jobApplications.length} Kandidat
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase tracking-wide">
                                                    Estimasi Gaji
                                                </p>
                                                <p className="text-sm font-medium">
                                                    {job.min_salary && job.max_salary
                                                        ? `${formatCurrency(job.min_salary)} - ${formatCurrency(job.max_salary)}`
                                                        : job.min_salary
                                                        ? `Mulai dari ${formatCurrency(job.min_salary)}`
                                                        : "Tidak disebutkan"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex gap-2">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/recruiter/jobs/${job.id}`}>
                                                    Lihat Detail
                                                </Link>
                                            </Button>
                                            <Button variant="outline" size="sm" asChild>
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
                                <p className="text-gray-500 mb-4">Belum ada lowongan</p>
                                <Button asChild>
                                    <Link href="/recruiter/jobs/new">Buat Lowongan Pertama</Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 shadow-sm">
                    <CardHeader>
                        <CardTitle>Pelamar Terbaru</CardTitle>
                        <CardDescription>Kandidat yang baru mendaftar</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {recentApplications.length > 0 ? (
                            recentApplications.map((app: any) => (
                                <div key={app.id} className="rounded-xl border p-4">
                                    <p className="font-semibold text-gray-900">
                                        {app.profiles?.full_name || "Unknown"}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {app.job_listings?.title || "Unknown"}
                                    </p>
                                    <Badge className="mt-3" variant="outline">
                                        {app.status}
                                    </Badge>
                                    <p className="text-xs text-gray-400 mt-2">
                                        {new Date(app.submitted_at).toLocaleDateString("id-ID")}
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-3 w-full"
                                        asChild
                                    >
                                        <Link href={`/recruiter/applications/${app.id}`}>
                                            Lihat Detail
                                        </Link>
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-4">
                                Belum ada pelamar
                            </p>
                        )}
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
