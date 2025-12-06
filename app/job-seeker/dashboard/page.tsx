import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
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
    const matchingJobs = findMatchingJobs(profile, jobs);
    
    return matchingJobs.slice(0, 6);
}

async function getTopCompanies() {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("job_listings")
        .select("company_name")
        .limit(100);

    if (error) {
        return [];
    }

    // Count occurrences of each company
    const companyCounts: Record<string, number> = {};
    (data || []).forEach((job: any) => {
        companyCounts[job.company_name] = (companyCounts[job.company_name] || 0) + 1;
    });

    // Sort by count and get top 6
    return Object.entries(companyCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
        .map(([name, count]) => ({ name, views: count * 12 })); // Mock views count
}

async function getTrendingJobRoles() {
    const supabase = await createSupabaseServerClient();
    const { data: jobs } = await supabase
        .from("job_listings")
        .select("title")
        .limit(100);

    if (!jobs) return [];

    // Count occurrences of each job title
    const roleCounts: Record<string, number> = {};
    jobs.forEach((job: any) => {
        roleCounts[job.title] = (roleCounts[job.title] || 0) + 1;
    });

    // Get application counts (mock based on job count)
    return Object.entries(roleCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([title, count]) => ({ 
            title, 
            applicants: count * 25 + Math.floor(Math.random() * 100) 
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

    const [totalApplications, applications, recommendedJobs, topCompanies, trendingRoles] = await Promise.all([
        getTotalApplicationsCount(user.id),
        getRecentApplications(user.id),
        getRecommendedJobs(profile),
        getTopCompanies(),
        getTrendingJobRoles(),
    ]);

    const profileProgress = calculateProfileProgress(profile);
    const jobAlertsCount = recommendedJobs.filter((job: any) => job.matchScore >= 70).length;
    
    // Mock data for profile views and unread messages
    const profileViews = Math.floor(totalApplications * 2.5) + 12;
    const unreadMessages = Math.floor(Math.random() * 5);

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

    // Add mock profile view activity
    if (profileViews > 0) {
        recentActivities.unshift({
            type: "viewed",
            message: "Profil Anda dilihat oleh recruiter",
            date: new Date().toISOString(),
        });
    }

    return (
        <div className="space-y-6">
            {/* Bagian 1 - Status Ringkas (4 kartu) */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                    <div>
                                <p className="text-sm text-purple-700 font-medium mb-1">Monitoring Lamaran</p>
                                <p className="text-3xl font-bold text-purple-900">{totalApplications}</p>
                                <p className="text-xs text-purple-600 mt-1">Aplikasi terkirim</p>
                    </div>
                            <div className="p-3 bg-purple-200 rounded-xl">
                                <Send className="h-6 w-6 text-purple-700" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-pink-200 bg-gradient-to-br from-pink-50 to-pink-100/50 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-pink-700 font-medium mb-1">Profile Viewed</p>
                                <p className="text-3xl font-bold text-pink-900">{profileViews}</p>
                                <p className="text-xs text-pink-600 mt-1">Kali dilihat</p>
                            </div>
                            <div className="p-3 bg-pink-200 rounded-xl">
                                <Eye className="h-6 w-6 text-pink-700" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                        <div>
                                <p className="text-sm text-blue-700 font-medium mb-1">Unread Messages</p>
                                <p className="text-3xl font-bold text-blue-900">{unreadMessages}</p>
                                <p className="text-xs text-blue-600 mt-1">Pesan belum dibaca</p>
                            </div>
                            <div className="p-3 bg-blue-200 rounded-xl">
                                <MessageSquare className="h-6 w-6 text-blue-700" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100/50 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-indigo-700 font-medium mb-1">Job Alert</p>
                                <p className="text-3xl font-bold text-indigo-900">{jobAlertsCount}</p>
                                <p className="text-xs text-indigo-600 mt-1">Sesuai skill Anda</p>
                            </div>
                            <div className="p-3 bg-indigo-200 rounded-xl">
                                <Bell className="h-6 w-6 text-indigo-700" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Bagian 2 - Profile Singkat User */}
            <Card className="border shadow-sm">
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                            {profile.full_name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-1">
                                {profile.full_name || "User"}
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                                {profile.headline || "Job Seeker"}
                            </p>
                            <div className="mb-4">
                                <div className="flex justify-between text-sm text-gray-600 mb-2">
                                    <span>Kelengkapan Profil</span>
                                    <span className="font-semibold">{profileProgress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                    <div 
                                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full transition-all duration-300"
                                        style={{ width: `${profileProgress}%` }}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {profile.skills && profile.skills.length > 0 ? (
                                    profile.skills.slice(0, 4).map((skill, index) => (
                                        <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                                            {skill}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-sm text-gray-500">Belum ada skill</span>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bagian 3 - Recent Activities */}
                <Card className="lg:col-span-1 border shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Recent Activities</CardTitle>
                        <CardDescription>Aktivitas terbaru Anda</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {recentActivities.length > 0 ? (
                            recentActivities.slice(0, 5).map((activity, index) => {
                                const Icon = getActivityIcon(activity.type);
                                return (
                                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                                        <div className="p-2 bg-purple-100 rounded-lg">
                                            <Icon className="h-4 w-4 text-purple-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-900">{activity.message}</p>
                                            <p className="text-xs text-gray-500 mt-1">
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
                            <p className="text-sm text-gray-500 text-center py-4">Belum ada aktivitas</p>
                        )}
                    </CardContent>
                </Card>

                {/* Bagian 4 - Job Recommendations */}
                <Card className="lg:col-span-2 border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Job Recommendations</CardTitle>
                            <CardDescription>Rekomendasi pekerjaan untuk Anda</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/job-seeker/jobs">
                                Lihat Semua
                                <ArrowUpRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4">
                        {recommendedJobs.length > 0 ? (
                                recommendedJobs.slice(0, 3).map((job) => (
                                <div
                                    key={job.id}
                                        className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition"
                                >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-900 mb-1">{job.title}</h4>
                                                <p className="text-sm text-gray-600 mb-2">{job.company_name}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
                                            <div className="flex items-center gap-1">
                                                <MapPin className="h-4 w-4" />
                                                <span>{job.location_city}</span>
                                    </div>
                                            <span>•</span>
                                        <span>
                                            {job.min_salary && job.max_salary
                                                ? `${formatCurrency(job.min_salary)} - ${formatCurrency(job.max_salary)}`
                                                : job.min_salary
                                                ? `Mulai dari ${formatCurrency(job.min_salary)}`
                                                    : "Gaji tidak disebutkan"}
                                        </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-xs">
                                                {formatEmploymentType(job.employment_type)}
                                            </Badge>
                                            {job.matchScore >= 70 && (
                                                <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                                                    {job.matchScore}% Match
                                                </Badge>
                                            )}
                                    </div>
                                        <Button className="mt-4 w-full" variant="outline" size="sm" asChild>
                                        <Link href={`/job-seeker/jobs/${job.id}`}>
                                                Lihat Detail
                                                <ArrowUpRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            ))
                        ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 mb-4">Belum ada rekomendasi pekerjaan</p>
                                <Button asChild>
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
                <Card className="border shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Top Companies</CardTitle>
                        <CardDescription>Perusahaan yang paling banyak dilihat</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {topCompanies.length > 0 ? (
                                topCompanies.map((company, index) => (
                                    <div
                                        key={index}
                                        className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition text-center"
                                    >
                                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                            {company.name.charAt(0).toUpperCase()}
                                        </div>
                                        <p className="font-semibold text-sm text-gray-900 mb-1 line-clamp-1">
                                            {company.name}
                                        </p>
                                        <p className="text-xs text-gray-600">{company.views} views</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 col-span-full text-center py-4">
                                    Belum ada data perusahaan
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Bagian 6 - Trending Job Roles */}
                <Card className="border shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Trending Job Roles</CardTitle>
                        <CardDescription>Posisi yang sedang populer</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {trendingRoles.length > 0 ? (
                                trendingRoles.map((role, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-purple-100 rounded-lg">
                                                <TrendingUp className="h-4 w-4 text-purple-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm text-gray-900">{role.title}</p>
                                                <p className="text-xs text-gray-600">{role.applicants} pelamar</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-4">
                                    Belum ada data trending
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bagian 7 - Quick Actions */}
            <Card className="border shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                    <CardDescription>Aksi cepat untuk meningkatkan profil Anda</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-purple-50 hover:border-purple-300" asChild>
                            <Link href="/job-seeker/profile">
                                <Upload className="h-5 w-5 text-purple-600" />
                                <span className="font-medium">Upload CV</span>
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-purple-50 hover:border-purple-300" asChild>
                            <Link href="/job-seeker/profile">
                                <User className="h-5 w-5 text-purple-600" />
                                <span className="font-medium">Update Profile</span>
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-purple-50 hover:border-purple-300" asChild>
                            <Link href="/job-seeker/jobs">
                                <Search className="h-5 w-5 text-purple-600" />
                                <span className="font-medium">Temukan Lowongan Baru</span>
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
