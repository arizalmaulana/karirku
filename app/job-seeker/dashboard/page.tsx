import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { 
    Send, 
    ArrowUpRight, 
    MapPin, 
    Eye, 
    Bell, 
    MessageSquare, 
    User, 
    Upload,
    Search,
    TrendingUp,
    CheckCircle2,
    XCircle,
    Clock
} from "lucide-react";
import { findMatchingJobs, calculateProfileProgress, calculateMatchScore } from "@/lib/utils/jobMatching";
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

function formatEmploymentType(type: string): string {
    const types: Record<string, string> = {
        fulltime: "Full Time",
        parttime: "Part Time",
        contract: "Contract",
        internship: "Internship",
        remote: "Remote",
        hybrid: "Hybrid",
    };
    return types[type] || type;
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

async function getTotalApplicationsCount(userId: string) {
    const supabase = await createSupabaseServerClient();
    const { count } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("job_seeker_id", userId);
    
    return count || 0;
}

async function getSavedJobsCount(userId: string) {
    // Get saved jobs from localStorage equivalent - we'll use a simple count
    // In a real app, this would come from a database table
    // For now, we'll return 0 or fetch from a saved_jobs table if it exists
    const supabase = await createSupabaseServerClient();
    
    // Check if there's a saved_jobs table or similar
    // For now, return 0 as placeholder - this should be implemented based on your saved jobs mechanism
    return 0;
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
        .limit(5);

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
    
    // Hitung match score langsung untuk setiap job (sama seperti di halaman jobs)
    const jobsWithMatchScore = jobs.map(job => ({
        ...job,
        matchScore: calculateMatchScore(
            profile.skills || [],
            job.skills_required || null,
            profile.major || null,
            job.major_required || null
        )
    }))
    .sort((a, b) => b.matchScore - a.matchScore); // Sort by match score descending
    
    return jobsWithMatchScore.slice(0, 6);
}

async function getTopCompanies() {
    const supabase = await createSupabaseServerClient();
    
    // Get all job listings with company names
    const { data: jobsData, error: jobsError } = await supabase
        .from("job_listings")
        .select("id, company_name")
        .limit(1000);

    if (jobsError || !jobsData) {
        return [];
    }

    // Count job listings per company (this represents open positions/views)
    const companyCounts: Record<string, number> = {};
    jobsData.forEach((job: any) => {
        companyCounts[job.company_name] = (companyCounts[job.company_name] || 0) + 1;
    });

    // Get real application counts per company from applications table
    const { data: applicationsData } = await supabase
        .from("applications")
        .select(`
            id,
            job_listings!inner(company_name)
        `);

    // Count applications per company
    const companyApplicationCounts: Record<string, number> = {};
    if (applicationsData) {
        applicationsData.forEach((app: any) => {
            const companyName = app.job_listings?.company_name;
            if (companyName) {
                companyApplicationCounts[companyName] = (companyApplicationCounts[companyName] || 0) + 1;
            }
        });
    }

    // Sort by job count and get top 6
    return Object.entries(companyCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
        .map(([name, jobCount]) => ({ 
            name, 
            views: jobCount, // Real job count = views/open positions
            applications: companyApplicationCounts[name] || 0 // Real application count
        }));
}

async function getTrendingJobRoles() {
    const supabase = await createSupabaseServerClient();
    
    // Get all job listings with titles
    const { data: jobs, error: jobsError } = await supabase
        .from("job_listings")
        .select("id, title")
        .limit(1000);

    if (jobsError || !jobs) return [];

    // Count occurrences of each job title
    const roleCounts: Record<string, number> = {};
    jobs.forEach((job: any) => {
        roleCounts[job.title] = (roleCounts[job.title] || 0) + 1;
    });

    // Get real application counts per job title from applications table
    const { data: applicationsData } = await supabase
        .from("applications")
        .select(`
            id,
            job_listings!inner(title)
        `);

    // Count applications per job title
    const titleApplicationCounts: Record<string, number> = {};
    if (applicationsData) {
        applicationsData.forEach((app: any) => {
            const jobTitle = app.job_listings?.title;
            if (jobTitle) {
                titleApplicationCounts[jobTitle] = (titleApplicationCounts[jobTitle] || 0) + 1;
            }
        });
    }

    // Get top 5 trending roles
    return Object.entries(roleCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([title, jobCount]) => ({ 
            title, 
            applicants: titleApplicationCounts[title] || 0 // Real application count
        }));
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

function getActivityIcon(type: string) {
    switch (type) {
        case "application":
            return Send;
        case "viewed":
            return Eye;
        case "accepted":
            return CheckCircle2;
        case "rejected":
            return XCircle;
        default:
            return Clock;
    }
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

    const [totalApplications, applications, recommendedJobs, topCompanies, trendingRoles, savedJobsCount] = await Promise.all([
        getTotalApplicationsCount(user.id),
        getRecentApplications(user.id),
        getRecommendedJobs(profile),
        getTopCompanies(),
        getTrendingJobRoles(),
        getSavedJobsCount(user.id),
    ]);

    const profileProgress = calculateProfileProgress(profile);
    const jobAlertsCount = recommendedJobs.filter((job: any) => job.matchScore >= 70).length;

    // Prepare recent activities
    const recentActivities = applications.map((app: any) => {
        if (app.status === "accepted") {
            return {
                type: "accepted",
                message: `Lamaran Anda diterima di ${app.job_listings?.company_name || "Perusahaan"}`,
                date: app.submitted_at,
            };
        } else if (app.status === "rejected") {
            return {
                type: "rejected",
                message: `Lamaran Anda ditolak di ${app.job_listings?.company_name || "Perusahaan"}`,
                date: app.submitted_at,
            };
        } else {
            return {
                type: "application",
                message: `Anda melamar di ${app.job_listings?.company_name || "Perusahaan"}`,
                date: app.submitted_at,
            };
        }
    });


    return (
        <div className="space-y-8 px-4 py-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-sm font-semibold text-purple-600 mb-1">Dashboard Job Seeker</p>
                    <h1 className="text-3xl font-bold text-gray-900">Selamat Datang Kembali!</h1>
                    <p className="text-gray-600 mt-2">
                        Pantau lamaran Anda, temukan pekerjaan yang sesuai, dan tingkatkan profil Anda
                    </p>
                </div>
                <Button className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 text-white shadow-lg shadow-purple-500/30" asChild>
                    <Link href="/job-seeker/jobs">
                        <Search className="mr-2 h-4 w-4" />
                        Cari Lowongan
                    </Link>
                </Button>
            </div>

            {/* Bagian 1 - Status Ringkas (3 kartu) */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="border-2 border-purple-200/50 bg-gradient-to-br from-purple-50 via-purple-50/50 to-white shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className="text-sm text-purple-700 font-semibold mb-2">Monitoring Lamaran</p>
                                <p className="text-4xl font-bold text-purple-900 mb-1">{totalApplications}</p>
                                <p className="text-xs text-purple-600">Aplikasi terkirim</p>
                            </div>
                            <Link href="/job-seeker/applications" className="p-4 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl shadow-lg hover:from-purple-500 hover:to-purple-700 transition-all cursor-pointer">
                                <Send className="h-7 w-7 text-white" />
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-2 border-indigo-200/50 bg-gradient-to-br from-indigo-50 via-indigo-50/50 to-white shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className="text-sm text-indigo-700 font-semibold mb-2">Job Alert</p>
                                <p className="text-4xl font-bold text-indigo-900 mb-1">{jobAlertsCount}</p>
                                <p className="text-xs text-indigo-600">Sesuai skill Anda</p>
                            </div>
                            <Link href="/job-seeker/jobs?tab=matched" className="p-4 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-2xl shadow-lg hover:from-indigo-500 hover:to-indigo-700 transition-all cursor-pointer">
                                <Bell className="h-7 w-7 text-white" />
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-2 border-green-200/50 bg-gradient-to-br from-green-50 via-green-50/50 to-white shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className="text-sm text-green-700 font-semibold mb-2">Kelengkapan Profil</p>
                                <p className="text-4xl font-bold text-green-900 mb-1">{profileProgress}%</p>
                                <p className="text-xs text-green-600">Profil Anda</p>
                            </div>
                            <Link href="/job-seeker/profile" className="p-4 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl shadow-lg hover:from-green-500 hover:to-green-700 transition-all cursor-pointer">
                                <User className="h-7 w-7 text-white" />
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Bagian 2 - Profile Singkat User */}
            <Card className="border-2 border-gray-200/50 shadow-lg bg-gradient-to-br from-white to-purple-50/30">
                <CardContent className="p-8">
                    <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center text-white text-3xl font-bold">
                                {profile.avatar_url ? (
                                    <ImageWithFallback
                                        src={profile.avatar_url}
                                        alt={profile.full_name || "User"}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    profile.full_name?.charAt(0).toUpperCase() || "U"
                                )}
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-green-500 rounded-full border-4 border-white shadow-lg"></div>
                        </div>
                        <div className="flex-1 w-full">
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                {profile.full_name || "User"}
                            </h3>
                            <p className="text-base text-gray-600 mb-6">
                                {profile.headline || "Job Seeker"}
                            </p>
                            <div className="mb-6">
                                <div className="flex justify-between text-sm font-medium text-gray-700 mb-3">
                                    <span>Kelengkapan Profil</span>
                                    <span className="font-bold text-purple-600">{profileProgress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                                    <div 
                                        className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 h-3 rounded-full transition-all duration-500 shadow-md"
                                        style={{ width: `${profileProgress}%` }}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {profile.skills && profile.skills.length > 0 ? (
                                    profile.skills.slice(0, 4).map((skill, index) => (
                                        <Badge key={index} variant="secondary" className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-300 shadow-sm px-3 py-1">
                                            {skill}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-sm text-gray-500">Belum ada skill</span>
                                )}
                            </div>
                            <div className="mt-6">
                                <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50" asChild>
                                    <Link href="/job-seeker/profile">
                                        <User className="mr-2 h-4 w-4" />
                                        Lengkapi Profil
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bagian 3 - Recent Activities */}
                <Card className="lg:col-span-1 border-2 border-gray-200/50 shadow-lg">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xl font-bold">Recent Activities</CardTitle>
                        <CardDescription>Aktivitas terbaru Anda</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {recentActivities.length > 0 ? (
                            recentActivities.slice(0, 5).map((activity, index) => {
                                const Icon = getActivityIcon(activity.type);
                                return (
                                    <div key={index} className="flex items-start gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-purple-300 hover:bg-purple-50/50 transition-all duration-300 shadow-sm hover:shadow-md">
                                        <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl shadow-sm">
                                            <Icon className="h-5 w-5 text-purple-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                                            <p className="text-xs text-gray-500 mt-2">
                                                {new Date(activity.date).toLocaleDateString("id-ID", {
                                                    day: "numeric",
                                                    month: "short",
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-8">
                                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-sm text-gray-500">Belum ada aktivitas</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Bagian 4 - Job Recommendations */}
                <Card className="lg:col-span-2 border-2 border-gray-200/50 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div>
                            <CardTitle className="text-xl font-bold">Job Recommendations</CardTitle>
                            <CardDescription>Rekomendasi pekerjaan untuk Anda</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" className="border-purple-300 text-purple-700 hover:bg-purple-50" asChild>
                            <Link href="/job-seeker/jobs">
                                Lihat Semua
                                <ArrowUpRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-5">
                        {recommendedJobs.length > 0 ? (
                                recommendedJobs.slice(0, 3).map((job) => (
                                <div
                                    key={job.id}
                                        className="p-6 border-2 border-gray-200 rounded-2xl hover:border-purple-300 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-purple-50/30"
                                >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-lg text-gray-900 mb-2">{job.title}</h4>
                                                <p className="text-base text-gray-600 font-medium mb-3">{job.company_name}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-purple-600" />
                                                <span className="font-medium">{job.location_city}</span>
                                            </div>
                                            <span className="text-gray-400">•</span>
                                            <span className="font-medium">
                                                {job.min_salary && job.max_salary
                                                    ? `${formatCurrency(job.min_salary)} - ${formatCurrency(job.max_salary)}`
                                                    : job.min_salary
                                                    ? `Mulai dari ${formatCurrency(job.min_salary)}`
                                                        : "Gaji tidak disebutkan"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <Badge variant="outline" className="text-xs border-gray-300">
                                                {formatEmploymentType(job.employment_type)}
                                            </Badge>
                                            {job.matchScore >= 70 && (
                                                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-xs shadow-md">
                                                    {job.matchScore}% Match
                                                </Badge>
                                            )}
                                        </div>
                                        <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-md" variant="outline" size="sm" asChild>
                                        <Link href={`/job-seeker/jobs/${job.id}`}>
                                                Lihat Detail
                                                <ArrowUpRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            ))
                        ) : (
                                <div className="text-center py-12">
                                    <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500 mb-4 font-medium">Belum ada rekomendasi pekerjaan</p>
                                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white" asChild>
                                    <Link href="/job-seeker/profile">Lengkapi Profil</Link>
                                </Button>
                            </div>
                        )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bagian 5 - Top Companies */}
                <Card className="border-2 border-gray-200/50 shadow-lg">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xl font-bold">Top Companies</CardTitle>
                        <CardDescription>Perusahaan yang paling banyak dilihat</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {topCompanies.length > 0 ? (
                                topCompanies.map((company, index) => (
                                    <div
                                        key={index}
                                        className="p-5 border-2 border-gray-200 rounded-2xl hover:border-purple-300 hover:shadow-xl transition-all duration-300 text-center bg-gradient-to-br from-white to-purple-50/30"
                                    >
                                        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                            {company.name.charAt(0).toUpperCase()}
                                        </div>
                                        <p className="font-bold text-sm text-gray-900 mb-2 line-clamp-1">
                                            {company.name}
                                        </p>
                                        <p className="text-xs text-gray-600 font-medium">{company.views} posisi terbuka</p>
                                        {company.applications !== undefined && company.applications > 0 && (
                                            <p className="text-xs text-purple-600 font-medium mt-1">{company.applications} pelamar</p>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-8">
                                    <p className="text-sm text-gray-500">Belum ada data perusahaan</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Bagian 6 - Trending Job Roles */}
                <Card className="border-2 border-gray-200/50 shadow-lg">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xl font-bold">Trending Job Roles</CardTitle>
                        <CardDescription>Posisi yang sedang populer</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {trendingRoles.length > 0 ? (
                                trendingRoles.map((role, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50/50 transition-all duration-300 shadow-sm hover:shadow-md"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl shadow-sm">
                                                <TrendingUp className="h-5 w-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-gray-900">{role.title}</p>
                                                <p className="text-xs text-gray-600 font-medium mt-1">{role.applicants} pelamar</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-sm text-gray-500">Belum ada data trending</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bagian 7 - Quick Actions */}
            <Card className="border-2 border-gray-200/50 shadow-lg bg-gradient-to-br from-white to-purple-50/30">
                <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold">Quick Actions</CardTitle>
                    <CardDescription>Aksi cepat untuk meningkatkan profil Anda</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <Button variant="outline" className="h-auto p-6 flex flex-col items-center gap-3 hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 hover:border-purple-400 transition-all duration-300 shadow-md hover:shadow-xl border-2" asChild>
                            <Link href="/job-seeker/profile">
                                <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
                                    <Upload className="h-6 w-6 text-purple-600" />
                                </div>
                                <span className="font-bold text-base">Upload CV</span>
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-auto p-6 flex flex-col items-center gap-3 hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 hover:border-purple-400 transition-all duration-300 shadow-md hover:shadow-xl border-2" asChild>
                            <Link href="/job-seeker/profile">
                                <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
                                    <User className="h-6 w-6 text-purple-600" />
                                </div>
                                <span className="font-bold text-base">Update Profile</span>
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-auto p-6 flex flex-col items-center gap-3 hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 hover:border-purple-400 transition-all duration-300 shadow-md hover:shadow-xl border-2" asChild>
                            <Link href="/job-seeker/jobs">
                                <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
                                    <Search className="h-6 w-6 text-purple-600" />
                                </div>
                                <span className="font-bold text-base">Temukan Lowongan Baru</span>
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
