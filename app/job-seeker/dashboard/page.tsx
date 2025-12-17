import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { EmailConfirmationToast } from "@/components/EmailConfirmationToast";
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
    Clock,
    Sparkles
} from "lucide-react";
import { findMatchingJobs, calculateProfileProgress, calculateMatchScoreFromJobAndProfile } from "@/lib/utils/jobMatching";
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
    let { data, error } = await supabase
        .from("job_listings")
        .select("*")
        .eq("is_closed", false) // Hanya ambil lowongan yang belum ditutup
        .neq("is_hidden", true) // Exclude hidden jobs
        .order("created_at", { ascending: false });
    
    // Fallback if is_hidden column doesn't exist
    if (error) {
        const errorMessage = error.message?.toLowerCase() || "";
        if (errorMessage.includes("column") && errorMessage.includes("does not exist")) {
            const fallbackResult = await supabase
                .from("job_listings")
                .select("*")
                .eq("is_closed", false)
                .order("created_at", { ascending: false });
            
            if (!fallbackResult.error) {
                data = fallbackResult.data;
                error = null;
            }
        }
    }

    if (error) {
        console.error("Error fetching jobs:", error);
        return [];
    }

    const jobs = data as JobListing[];
    
    // Filter out jobs from blocked companies and deleted companies
    const companyNames = [...new Set(jobs.map((job: any) => job.company_name))];
    const { data: companiesData } = await supabase
        .from("companies")
        .select("name, is_blocked")
        .in("name", companyNames);

    // Create maps for company data
    const companyDataMap = new Map<string, any>();
    const blockedCompanies = new Set<string>();
    
    if (companiesData) {
        companiesData.forEach((company: any) => {
            if (company.is_blocked === true) {
                blockedCompanies.add(company.name);
            }
            companyDataMap.set(company.name, {
                is_blocked: company.is_blocked,
            });
        });
    }

    // Check if companies table is being used
    const hasCompaniesTable = companiesData !== null;
    
    // Filter out jobs from blocked companies and deleted companies
    const filteredJobs = jobs.filter((job: any) => {
        // 1. Always exclude if job is explicitly hidden
        if (job.is_hidden === true) {
            return false;
        }

        const companyData = companyDataMap.get(job.company_name);
        
        // 2. If company exists in companies table
        if (companyData) {
            // Exclude if company is blocked
            return companyData.is_blocked !== true;
        }
        
        // 3. If company doesn't exist in companies table:
        //    - If companies table exists and we queried it, exclude (company was deleted)
        //    - If companies table doesn't exist or empty, include for backward compatibility
        if (hasCompaniesTable) {
            // Companies table exists, but company not found = deleted, exclude
            return false;
        }
        
        // 4. Backward compatibility: companies table doesn't exist or not used yet
        return true;
    });
    
    // Hitung match score langsung untuk setiap job dengan 4 variabel
    const jobsWithMatchScore = filteredJobs.map(job => ({
        ...job,
        matchScore: calculateMatchScoreFromJobAndProfile(job, profile)
    }))
    .sort((a, b) => b.matchScore - a.matchScore); // Sort by match score descending
    
    return jobsWithMatchScore.slice(0, 6);
}

async function getTopCompanies() {
    const supabase = await createSupabaseServerClient();
    
    // Get all job listings with company names (exclude hidden jobs)
    let { data: jobsData, error: jobsError } = await supabase
        .from("job_listings")
        .select("id, company_name")
        .neq("is_hidden", true) // Exclude hidden jobs
        .limit(1000);
    
    // Fallback if is_hidden column doesn't exist
    if (jobsError) {
        const errorMessage = jobsError.message?.toLowerCase() || "";
        if (errorMessage.includes("column") && errorMessage.includes("does not exist")) {
            const fallbackResult = await supabase
                .from("job_listings")
                .select("id, company_name")
                .limit(1000);
            
            if (!fallbackResult.error) {
                jobsData = fallbackResult.data;
            }
        }
    }

    if (jobsError || !jobsData) {
        return [];
    }

    // Filter out jobs from blocked companies
    const companyNamesFromJobs = [...new Set(jobsData.map((job: any) => job.company_name))];
    const { data: companiesDataCheck } = await supabase
        .from("companies")
        .select("name, is_blocked")
        .in("name", companyNamesFromJobs);

    const blockedCompanyNames = new Set<string>();
    const validCompanyNames = new Set<string>();
    
    if (companiesDataCheck) {
        companiesDataCheck.forEach((company: any) => {
            if (company.is_blocked === true) {
                blockedCompanyNames.add(company.name);
            } else {
                validCompanyNames.add(company.name);
            }
        });
    }

    // Filter out jobs from blocked companies before counting
    const validJobsData = jobsData.filter((job: any) => {
        // Exclude if company is blocked
        if (blockedCompanyNames.has(job.company_name)) {
            return false;
        }
        
        // If companies table exists and has data, only include jobs from valid companies
        if (companiesDataCheck !== null && companiesDataCheck.length > 0) {
            return validCompanyNames.has(job.company_name);
        }
        
        // Backward compatibility: if companies table is empty or doesn't exist, include all
        return true;
    });

    // Count job listings per company (this represents open positions/views)
    const companyCounts: Record<string, number> = {};
    validJobsData.forEach((job: any) => {
        companyCounts[job.company_name] = (companyCounts[job.company_name] || 0) + 1;
    });

    // Get real application counts per company from applications table (only from valid companies)
    const { data: applicationsData } = await supabase
        .from("applications")
        .select(`
            id,
            job_listings!inner(company_name)
        `);

    // Count applications per company (only count for valid companies)
    const companyApplicationCounts: Record<string, number> = {};
    if (applicationsData) {
        applicationsData.forEach((app: any) => {
            const companyName = app.job_listings?.company_name;
            if (companyName && !blockedCompanyNames.has(companyName)) {
                companyApplicationCounts[companyName] = (companyApplicationCounts[companyName] || 0) + 1;
            }
        });
    }

    // Get top company names (only from valid companies)
    const topCompanyNames = Object.entries(companyCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
        .map(([name]) => name);

    // Fetch company logos from companies table (only valid companies)
    const { data: companiesData } = await supabase
        .from("companies")
        .select("name, logo_url")
        .in("name", topCompanyNames)
        .neq("is_blocked", true); // Ensure no blocked companies

    // Create map for company logos
    const companyLogoMap = new Map<string, string | null>();
    if (companiesData) {
        companiesData.forEach((company: any) => {
            companyLogoMap.set(company.name, company.logo_url);
        });
    }

    // Sort by job count and get top 6 with logo
    return Object.entries(companyCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
        .map(([name, jobCount]) => ({ 
            name, 
            logo_url: companyLogoMap.get(name) || null,
            views: jobCount, // Real job count = views/open positions
            applications: companyApplicationCounts[name] || 0 // Real application count
        }));
}

async function getTrendingJobRoles() {
    const supabase = await createSupabaseServerClient();
    
    // Get all job listings with titles (exclude hidden jobs)
    let { data: jobs, error: jobsError } = await supabase
        .from("job_listings")
        .select("id, title")
        .neq("is_hidden", true) // Exclude hidden jobs
        .limit(1000);
    
    // Fallback if is_hidden column doesn't exist
    if (jobsError) {
        const errorMessage = jobsError.message?.toLowerCase() || "";
        if (errorMessage.includes("column") && errorMessage.includes("does not exist")) {
            const fallbackResult = await supabase
                .from("job_listings")
                .select("id, title")
                .limit(1000);
            
            if (!fallbackResult.error) {
                jobs = fallbackResult.data;
            }
        }
    }

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
        <>
            <EmailConfirmationToast />
            <div className="space-y-6 sm:space-y-8 px-3 sm:px-4 py-4 sm:py-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-xs sm:text-sm font-semibold text-purple-600 mb-1">Dashboard Job Seeker</p>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Selamat Datang Kembali!</h1>
                    <p className="text-gray-600 mt-2 text-sm sm:text-base">
                        Pantau lamaran Anda, temukan pekerjaan yang sesuai, dan tingkatkan profil Anda
                    </p>
                </div>
                <Button className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-lg shadow-indigo-500/30 transition-all duration-500 ease-in-out w-full sm:w-auto" asChild>
                    <Link href="/job-seeker/jobs">
                        <Search className="mr-2 h-4 w-4" />
                        Cari Lowongan
                    </Link>
                </Button>
            </div>

            {/* Bagian 1 - Status Ringkas (3 kartu) */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <Card className="border-0purple-50/50 bg-gradient-to-br from-purple-50 via-purple-50/60 to-white shadow-md hover:shadow-lg transition-all duration-500 ease-in-out hover:scale-[1.02]">
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className="text-xs sm:text-sm text-purple-700 font-semibold mb-2">Monitoring Lamaran</p>
                                <p className="text-3xl sm:text-4xl font-bold text-purple-800 mb-1">{totalApplications}</p>
                                <p className="text-xs text-purple-600">Aplikasi terkirim</p>
                            </div>
                            <Link href="/job-seeker/applications" className="p-3 sm:p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-500 ease-in-out cursor-pointer shrink-0">
                                <Send className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0indigo-200/20 bg-gradient-to-br from-indigo-50 via-indigo-50/60 to-white shadow-md hover:shadow-lg transition-all duration-500 ease-in-out hover:scale-[1.02]">
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className="text-xs sm:text-sm text-indigo-700 font-semibold mb-2">Job Alert</p>
                                <p className="text-3xl sm:text-4xl font-bold text-indigo-800 mb-1">{jobAlertsCount}</p>
                                <p className="text-xs text-indigo-600">Sesuai skill Anda</p>
                            </div>
                            <Link href="/job-seeker/jobs?tab=matched" className="p-3 sm:p-4 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-lg hover:from-indigo-600 hover:to-indigo-700 transition-all duration-500 ease-in-out cursor-pointer shrink-0">
                                <Bell className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0green-200/20 bg-gradient-to-br from-green-50 via-green-50/60 to-white shadow-md hover:shadow-lg transition-all duration-500 ease-in-out hover:scale-[1.02]">
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className="text-xs sm:text-sm text-green-700 font-semibold mb-2">Kelengkapan Profil</p>
                                <p className="text-3xl sm:text-4xl font-bold text-green-800 mb-1">{profileProgress}%</p>
                                <p className="text-xs text-green-600">Profil Anda</p>
                            </div>
                            <Link href="/job-seeker/profile" className="p-3 sm:p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg hover:from-green-600 hover:to-green-700 transition-all duration-500 ease-in-out cursor-pointer shrink-0">
                                <User className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Bagian 2 - Profile Singkat User */}
            <Card className="border-0gray-200/20 shadow-lg bg-gradient-to-br from-white to-purple-50/30">
                <CardContent className="p-4 sm:p-6 lg:p-8">
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 lg:gap-8 items-start sm:items-center">
                        <div className="relative shrink-0">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-white/60 shadow-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold">
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
                            <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-green-500 rounded-full border-2 border-white/60 shadow-lg"></div>
                        </div>
                        <div className="flex-1 w-full min-w-0">
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 truncate">
                                {profile.full_name || "User"}
                            </h3>
                            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 truncate">
                                {profile.headline || "Job Seeker"}
                            </p>
                            <div className="mb-4 sm:mb-6">
                                <div className="flex justify-between text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                                    <span>Kelengkapan Profil</span>
                                    <span className="font-bold text-purple-600">{profileProgress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                                    <div 
                                        className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-3 rounded-full transition-all duration-700 ease-in-out shadow-md"
                                        style={{ width: `${profileProgress}%` }}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {profile.skills && profile.skills.length > 0 ? (
                                    profile.skills.slice(0, 4).map((skill, index) => {
                                        const badgeColors = [
                                            { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200/20" },
                                            { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200/20" },
                                            { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200/20" },
                                            { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200/20" },
                                            { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200/20" },
                                            { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200/20" },
                                        ];
                                        const colors = badgeColors[index % badgeColors.length];
                                        return (
                                            <Badge key={index} className={`${colors.bg} ${colors.text} border-0 shadow-sm px-3 py-1 transition-all duration-300`}>
                                                {skill}
                                            </Badge>
                                        );
                                    })
                                ) : (
                                    <span className="text-sm text-gray-500">Belum ada skill</span>
                                )}
                            </div>
                            <div className="mt-6">
                                <Button variant="outline" className="border-purple-300/20 text-purple-700 hover:bg-purple-50 bg-white transition-all duration-300" asChild>
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
                <Card className="lg:col-span-1 border-0gray-200/20 shadow-lg">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xl font-bold text-gray-900">Recent Activities</CardTitle>
                        <CardDescription className="text-gray-600">Aktivitas terbaru Anda</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {recentActivities.length > 0 ? (
                            recentActivities.slice(0, 5).map((activity, index) => {
                                const Icon = getActivityIcon(activity.type);
                                return (
                                    <div key={index} className="flex items-start gap-4 p-4 rounded-xl border-0 bg-gradient-to-br from-white to-purple-50/30 hover:bg-purple-50/50 transition-all duration-500 ease-in-out shadow-sm hover:shadow-md">
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
                            <div className="text-center py-12">
                                <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-sm text-gray-500">Belum ada aktivitas</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Bagian 4 - Job Recommendations */}
                <Card className="lg:col-span-2 border-0gray-200/20 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div>
                            <CardTitle className="text-xl font-bold text-gray-900">Job Recommendations</CardTitle>
                            <CardDescription className="text-gray-600">Rekomendasi pekerjaan untuk Anda</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" className="border-purple-300/20 text-purple-700 hover:bg-purple-50 bg-white transition-all duration-300" asChild>
                            <Link href="/job-seeker/jobs">
                                Lihat Semua
                                <ArrowUpRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-5">
                        {recommendedJobs.length > 0 ? (
                                recommendedJobs.slice(0, 2).map((job) => (
                                <div
                                    key={job.id}
                                        className="p-6 border-0gray-200/20 rounded-2xl hover:border-purple-300/30 hover:shadow-lg transition-all duration-500 ease-in-out bg-white"
                                >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-lg text-gray-900 mb-2">{job.title}</h4>
                                                <p className="text-base text-gray-600 mb-3">{job.company_name}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-4">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-purple-600" />
                                                <span>{job.location_city}</span>
                                            </div>
                                            <span className="text-gray-400">•</span>
                                            <span>
                                                {job.min_salary && job.max_salary
                                                    ? `${formatCurrency(job.min_salary)} - ${formatCurrency(job.max_salary)}`
                                                    : job.min_salary
                                                    ? `Mulai dari ${formatCurrency(job.min_salary)}`
                                                        : "Gaji tidak disebutkan"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-4">
                                            {(() => {
                                                const employmentTypeColors: Record<string, { bg: string; text: string; border: string }> = {
                                                    "Full Time": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200/20" },
                                                    "Part Time": { bg: "bg-green-50", text: "text-green-700", border: "border-green-200/20" },
                                                    "Contract": { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200/20" },
                                                    "Internship": { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200/20" },
                                                    "Remote": { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200/20" },
                                                    "Hybrid": { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200/20" },
                                                };
                                                const employmentType = formatEmploymentType(job.employment_type);
                                                const colors = employmentTypeColors[employmentType] || { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200/20" };
                                                return (
                                                    <Badge className={`text-xs ${colors.bg} ${colors.text} border-0`}>
                                                        {employmentType}
                                                    </Badge>
                                                );
                                            })()}
                                            {job.matchScore !== undefined && job.matchScore !== null && (
                                                <Badge className="bg-indigo-500 text-white border-0 text-xs shadow-md font-semibold">
                                                    <Sparkles className="w-3 h-3 mr-1 inline" />
                                                    {job.matchScore}% Match
                                                </Badge>
                                            )}
                                        </div>
                                        <Button className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-md transition-all duration-500 ease-in-out" size="sm" asChild>
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
                                <Button className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white transition-all duration-500" asChild>
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
                <Card className="border-0gray-200/20 shadow-lg">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xl font-bold text-gray-900">Top Companies</CardTitle>
                        <CardDescription className="text-gray-600">Perusahaan yang paling banyak dilihat</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {topCompanies.length > 0 ? (
                                topCompanies.map((company, index) => (
                                    <div
                                        key={index}
                                        className="p-5 border-0gray-200/20 rounded-2xl hover:border-purple-300/30 hover:shadow-lg transition-all duration-500 ease-in-out text-center bg-gradient-to-br from-white to-purple-50/30"
                                    >
                                        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl shadow-lg overflow-hidden">
                                            {company.logo_url ? (
                                                <ImageWithFallback
                                                    src={company.logo_url}
                                                    alt={company.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                company.name.charAt(0).toUpperCase()
                                            )}
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
                <Card className="border-0gray-200/20 shadow-lg">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xl font-bold text-gray-900">Trending Job Roles</CardTitle>
                        <CardDescription className="text-gray-600">Posisi yang sedang populer</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {trendingRoles.length > 0 ? (
                                trendingRoles.map((role, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-4 border-0gray-200/20 rounded-xl hover:border-purple-300/30 hover:bg-purple-50/50 transition-all duration-500 ease-in-out shadow-sm hover:shadow-md"
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
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/30">
                <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold text-gray-900">Quick Actions</CardTitle>
                    <CardDescription className="text-gray-600">Aksi cepat untuk meningkatkan profil Anda</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <Button variant="outline" className="h-auto p-6 flex flex-col items-center gap-3 hover:bg-gray-300 transition-all duration-500 ease-in-out shadow-md hover:shadow-lg border-0 bg-gray-200" asChild>
                            <Link href="/job-seeker/profile">
                                <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
                                    <Upload className="h-6 w-6 text-purple-600" />
                                </div>
                                <span className="font-bold text-base text-gray-900">Upload CV</span>
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-auto p-6 flex flex-col items-center gap-3 hover:bg-gray-300 transition-all duration-500 ease-in-out shadow-md hover:shadow-lg border-0 bg-gray-200" asChild>
                            <Link href="/job-seeker/profile">
                                <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
                                    <User className="h-6 w-6 text-purple-600" />
                                </div>
                                <span className="font-bold text-base text-gray-900">Update Profile</span>
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-auto p-6 flex flex-col items-center gap-3 hover:bg-gray-300 transition-all duration-500 ease-in-out shadow-md hover:shadow-lg border-0 bg-gray-200" asChild>
                            <Link href="/job-seeker/jobs">
                                <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
                                    <Search className="h-6 w-6 text-purple-600" />
                                </div>
                                <span className="font-bold text-base text-gray-900">Temukan Lowongan Baru</span>
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
        </>
    );
}
