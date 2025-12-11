import { ArrowUpRight, BriefcaseBusiness, FileText, Users, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
    const supabase = await createSupabaseServerClient();

    // Fetch aggregate data in parallel
    const [
        { count: userCount },
        { count: jobCount },
        { count: applicationCount },
        { count: cityCount },
        { data: recentJobsData, error: jobsError },
        { data: recentApplicationsData, error: applicationsError },
    ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("job_listings").select("*", { count: "exact", head: true }),
        supabase.from("applications").select("*", { count: "exact", head: true }),
        supabase.from("living_costs").select("*", { count: "exact", head: true }),
        supabase.from("job_listings").select("title, company_name, created_at").order("created_at", { ascending: false }).limit(3),
        supabase.from("applications").select("*, profiles(full_name), job_listings(title)").order("submitted_at", { ascending: false }).limit(3),
    ]);

    // Transform data for display
    const recentJobs = (recentJobsData || []).map((job: any) => ({
        title: job.title,
        company: job.company_name,
        submitted: new Date(job.created_at).toLocaleDateString("id-ID"),
        status: "Aktif",
    }));

    const pendingApplications = (recentApplicationsData || []).map((app: any) => ({
        candidate: app.profiles?.full_name || "Unknown",
        job: app.job_listings?.title || "Unknown",
        company: "Unknown",
        status: app.status || "Pending",
    }));

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

            <section className="grid gap-6 lg:grid-cols-3 border border-blue-00 bg-gradient-to-br from-purple-100 to-blue-100/80 shadow-sm rounded-2xl p-6">
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
                        <div className="space-y-4">
                            {recentJobs.length > 0 ? (
                                recentJobs.map((job: { title: string; company: string; submitted: string; status: string }, index: number) => (
                                    <div key={`${job.title}-${index}`} className="flex items-center justify-between rounded-xl border p-4">
                                        <div>
                                            <p className="font-semibold text-gray-900">{job.title}</p>
                                            <p className="text-sm text-gray-500">{job.company}</p>
                                            <p className="text-xs text-gray-400 mt-1">Diajukan pada {job.submitted}</p>
                                        </div>
                                        <Badge variant={job.status === "Aktif" ? "default" : "secondary"}>{job.status}</Badge>
                                    </div>
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
                            <CardDescription>Follow up lamaran yang masih menunggu tindakan</CardDescription>
                        </div>
                        <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/30" variant="outline" size="sm" asChild>
                            <Link href="/admin/applications">
                                Lihat Semua
                                <ArrowUpRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {pendingApplications.length > 0 ? (
                            pendingApplications.map((application: { candidate: string; job: string; company: string; status: string }, index: number) => (
                                <div key={`${application.candidate}-${index}`} className="rounded-xl border p-4">
                                    <p className="font-semibold text-gray-900">{application.candidate}</p>
                                    <p className="text-sm text-gray-600">
                                        {application.job} • {application.company}
                                    </p>
                                    <Badge className="mt-3 w-fit" variant="outline">
                                        Status: {application.status}
                                    </Badge>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500">Tidak ada lamaran yang menunggu</p>
                        )}
                    </CardContent>
                </Card>
            </section>

            {/* Bagian Checklist Admin bisa tetap statis sebagai pengingat tugas */}
            <Card className="border border-blue-200 bg-gradient-to-br from-pink-50 to-blue-100/50 shadow-sm rounded-2xl p-6">
                <CardHeader>
                    <CardTitle>Checklist Admin</CardTitle>
                    <CardDescription>Tugas prioritas untuk menjaga kualitas platform</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-xl border p-4">
                        <p className="font-semibold">Verifikasi lowongan baru</p>
                        <p className="text-sm text-gray-500">Pastikan detail gaji & biaya hidup sudah terisi</p>
                    </div>
                    <div className="rounded-xl border p-4">
                        <p className="font-semibold">Update dataset kota baru</p>
                        <p className="text-sm text-gray-500">Tambahkan data biaya hidup untuk kota-kota sekunder</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
