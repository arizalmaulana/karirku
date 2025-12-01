import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { Briefcase, Send, ArrowUpRight, MapPin, CheckCircle, Compass } from "lucide-react";
import { findMatchingJobs, calculateProfileProgress } from "@/lib/utils/jobMatching";
import { redirect } from "next/navigation";
import type { JobListing, Profile } from "@/lib/types";

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
    return data as Profile;
}

async function getRecentApplications(userId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("applications")
        .select(`
            *,
            job_listings(title, company_name)
        `)
        .eq("job_seeker_id", userId)
        .order("submitted_at", { ascending: false })
        .limit(3);

    if (error) {
        console.error("Error fetching applications:", error);
        return [];
    }
    return data || [];
}

async function getRecommendedJobs(profile: Profile) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("job_listings")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching jobs:", error);
        return [];
    }

    const jobs = data as JobListing[];
    const matchingJobs = findMatchingJobs(profile, jobs);
    
    return matchingJobs.slice(0, 6); // Ambil 6 rekomendasi teratas
}

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

export default async function JobSeekerDashboardPage() {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/");
    }

    const profile = await getUserProfile(user.id);
    if (!profile) {
        redirect("/");
    }

    const [applications, recommendedJobs] = await Promise.all([
        getRecentApplications(user.id),
        getRecommendedJobs(profile),
    ]);

    const profileProgress = calculateProfileProgress(profile);

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-sm font-semibold text-blue-600">
                        Selamat datang kembali 👋
                    </p>
                    <h1 className="text-3xl font-semibold text-gray-900 mt-1">
                        Dashboard Pencari Kerja
                    </h1>
                    <p className="text-gray-500">
                        Monitor status lamaran, lengkapi profil, dan temukan rekomendasi kerja paling relevan.
                    </p>
                </div>
                <Button size="lg" className="w-full lg:w-fit" asChild>
                    <Link href="/job-seeker/jobs">
                        <Send className="mr-2 h-4 w-4" />
                        Cari Lowongan
                    </Link>
                </Button>
            </div>

            <section className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Progress Profil Anda</CardTitle>
                        <CardDescription>
                            Lengkapi profil untuk meningkatkan peluang matching
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <div className="flex justify-between text-sm text-gray-500 mb-2">
                                <span>Kelengkapan Profil</span>
                                <span>{profileProgress}%</span>
                            </div>
                            <Progress value={profileProgress} />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-xl border p-4">
                                <p className="font-semibold text-gray-900">Skill & Sertifikat</p>
                                <p className="text-sm text-gray-500">
                                    {profile.skills && profile.skills.length > 0
                                        ? `${profile.skills.length} skill terdaftar`
                                        : "Tambahkan skill untuk meningkatkan matching"}
                                </p>
                            </div>
                            <div className="rounded-xl border p-4">
                                <p className="font-semibold text-gray-900">Lokasi</p>
                                <p className="text-sm text-gray-500">
                                    {profile.location_city || "Belum ditentukan"}
                                </p>
                            </div>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href="/job-seeker/profile">
                                Lengkapi Profil
                                <ArrowUpRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Status Lamaran Terbaru</CardTitle>
                            <CardDescription>Pantau update tanpa ketinggalan</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/job-seeker/applications">
                                Lihat Semua
                                <ArrowUpRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {applications.length > 0 ? (
                            applications.map((app: any) => (
                                <div key={app.id} className="rounded-xl border p-4">
                                    <p className="font-semibold">{app.job_listings?.title || "Unknown"}</p>
                                    <p className="text-sm text-gray-500">
                                        {app.job_listings?.company_name || "Unknown"}
                                    </p>
                                    <Badge className="mt-3" variant={getStatusBadgeVariant(app.status)}>
                                        {getStatusLabel(app.status)}
                                    </Badge>
                                    <p className="text-xs text-gray-400 mt-2">
                                        {new Date(app.submitted_at).toLocaleDateString("id-ID")}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-4">
                                Belum ada lamaran
                            </p>
                        )}
                    </CardContent>
                </Card>
            </section>

            <section className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Rekomendasi Untuk Anda</CardTitle>
                            <CardDescription>
                                Hasil pencocokan otomatis berdasarkan skill
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/job-seeker/jobs">
                                Lihat Semua
                                <ArrowUpRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {recommendedJobs.length > 0 ? (
                            recommendedJobs.map((job) => (
                                <div
                                    key={job.id}
                                    className="rounded-2xl border p-4 hover:border-blue-500 transition"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-gray-900">{job.title}</p>
                                            <p className="text-sm text-gray-500">
                                                {job.company_name} • {job.location_city}
                                                {job.location_province && `, ${job.location_province}`}
                                            </p>
                                        </div>
                                        <Badge variant={job.matchScore >= 50 ? "default" : "outline"}>
                                            {job.matchScore}% Match
                                        </Badge>
                                    </div>
                                    {job.skills_required && job.skills_required.length > 0 && (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {job.skills_required.slice(0, 3).map((skill, index) => (
                                                <Badge key={index} variant="secondary">
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                    <div className="mt-4 flex flex-col gap-1 text-sm text-gray-500">
                                        <span>
                                            Estimasi Gaji:{" "}
                                            {job.min_salary && job.max_salary
                                                ? `${formatCurrency(job.min_salary)} - ${formatCurrency(job.max_salary)}`
                                                : job.min_salary
                                                ? `Mulai dari ${formatCurrency(job.min_salary)}`
                                                : "Tidak disebutkan"}
                                        </span>
                                        <span>Jenis Kerja: {job.employment_type}</span>
                                    </div>
                                    <Button className="mt-4 w-full" variant="secondary" asChild>
                                        <Link href={`/job-seeker/jobs/${job.id}`}>
                                            <Briefcase className="mr-2 h-4 w-4" />
                                            Lihat Detail & Lamar
                                        </Link>
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-gray-500 mb-4">
                                    Belum ada rekomendasi pekerjaan
                                </p>
                                <Button asChild>
                                    <Link href="/job-seeker/profile">Lengkapi Profil</Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Tips Cepat</CardTitle>
                        <CardDescription>Insight singkat dari tim KarirKu</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-xl border p-4">
                            <p className="font-semibold">Sesuaikan CV dengan kata kunci skill</p>
                            <p className="text-sm text-gray-500">
                                Sistem kami mendeteksi skill yang cocok dengan lowongan.
                            </p>
                        </div>
                        <div className="rounded-xl border p-4">
                            <p className="font-semibold">Lengkapi profil untuk matching lebih baik</p>
                            <p className="text-sm text-gray-500">
                                Profil lengkap meningkatkan akurasi rekomendasi pekerjaan.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
