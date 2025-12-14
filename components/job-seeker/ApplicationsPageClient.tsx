"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Search, 
    MapPin, 
    Clock, 
    DollarSign,
    Calendar,
    Eye,
    Briefcase,
    CheckCircle2,
    XCircle,
    Hourglass,
    FileSearch,
    RefreshCw
} from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Application, Profile } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ApplicationWithJob extends Application {
    job_listings?: {
        title: string;
        company_name: string;
        location_city: string;
        location_province?: string;
        employment_type: string;
        min_salary: number | null;
        max_salary: number | null;
        currency: string | null;
    };
}

interface ApplicationsPageClientProps {
    initialApplications: ApplicationWithJob[];
    profile: Profile | null;
    userId: string;
}

function formatCurrency(amount: number | null, currency: string | null = "IDR"): string {
    if (!amount) return "Tidak disebutkan";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: currency || "IDR",
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

function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        draft: "Draft",
        submitted: "Menunggu",
        review: "Direview",
        interview: "Interview",
        accepted: "Diterima",
        rejected: "Ditolak",
    };
    return labels[status] || status;
}

function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
        draft: "bg-gray-100 text-gray-700 border-gray-300",
        submitted: "bg-yellow-100 text-yellow-700 border-yellow-300",
        review: "bg-blue-100 text-blue-700 border-blue-300",
        interview: "bg-purple-100 text-purple-700 border-purple-300",
        accepted: "bg-green-100 text-green-700 border-green-300",
        rejected: "bg-red-100 text-red-700 border-red-300",
    };
    return colors[status] || "bg-gray-100 text-gray-700 border-gray-300";
}

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
        return "Hari ini";
    } else if (diffInDays === 1) {
        return "1 hari lalu";
    } else if (diffInDays < 7) {
        return `${diffInDays} hari lalu`;
    } else if (diffInDays < 30) {
        const weeks = Math.floor(diffInDays / 7);
        return `${weeks} minggu lalu`;
    } else if (diffInDays < 365) {
        const months = Math.floor(diffInDays / 30);
        return `${months} bulan lalu`;
    } else {
        const years = Math.floor(diffInDays / 365);
        return `${years} tahun lalu`;
    }
}

export function ApplicationsPageClient({ 
    initialApplications, 
    profile, 
    userId 
}: ApplicationsPageClientProps) {
    const [applications, setApplications] = useState<ApplicationWithJob[]>(initialApplications);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeStatus, setActiveStatus] = useState<string>("all");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const supabase = createBrowserClient();

    // Refresh applications from database
    const refreshApplications = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("applications")
                .select(`
                    id,
                    job_id,
                    job_seeker_id,
                    status,
                    cv_url,
                    portfolio_url,
                    cover_letter,
                    submitted_at,
                    updated_at,
                    job_listings(id, title, company_name, location_city, location_province, employment_type, min_salary, max_salary, currency)
                `)
                .eq("job_seeker_id", userId)
                .order("submitted_at", { ascending: false });

            if (error) throw error;
            if (data) {
                setApplications(data as ApplicationWithJob[]);
            }
        } catch (error) {
            console.error("Error fetching applications:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Set up real-time subscription and polling
    useEffect(() => {
        if (!userId) return;

        // Real-time subscription
        const channel = supabase
            .channel(`applications_changes_${userId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "applications",
                    filter: `job_seeker_id=eq.${userId}`,
                },
                (payload) => {
                    console.log("Real-time update:", payload);
                    refreshApplications();
                }
            )
            .subscribe((status) => {
                console.log("Subscription status:", status);
            });

        // Polling fallback - refresh every 10 seconds (only if page is visible)
        const pollInterval = setInterval(() => {
            if (document.visibilityState === "visible") {
                refreshApplications();
            }
        }, 10000);

        // Also listen for custom events (when application is submitted from other tabs)
        const handleApplicationSubmitted = () => {
            console.log("Application submitted event received");
            setTimeout(() => refreshApplications(), 1000); // Wait 1 second for DB to update
        };

        window.addEventListener("application-submitted", handleApplicationSubmitted);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(pollInterval);
            window.removeEventListener("application-submitted", handleApplicationSubmitted);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    // Refresh on mount and when page becomes visible or focused
    useEffect(() => {
        refreshApplications();

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                refreshApplications();
            }
        };

        const handleFocus = () => {
            refreshApplications();
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("focus", handleFocus);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("focus", handleFocus);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Filter applications
    const filteredApplications = useMemo(() => {
        return applications.filter((app) => {
            const matchesSearch =
                !searchQuery.trim() ||
                app.job_listings?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                app.job_listings?.company_name?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus =
                activeStatus === "all" ||
                (activeStatus === "submitted" && app.status === "submitted") ||
                (activeStatus === "review" && app.status === "review") ||
                (activeStatus === "interview" && app.status === "interview") ||
                (activeStatus === "accepted" && app.status === "accepted") ||
                (activeStatus === "rejected" && app.status === "rejected");

            return matchesSearch && matchesStatus;
        });
    }, [applications, searchQuery, activeStatus]);

    // Calculate statistics
    const stats = useMemo(() => {
        return {
            total: applications.length,
            submitted: applications.filter((a) => a.status === "submitted").length,
            review: applications.filter((a) => a.status === "review").length,
            interview: applications.filter((a) => a.status === "interview").length,
            accepted: applications.filter((a) => a.status === "accepted").length,
            rejected: applications.filter((a) => a.status === "rejected").length,
        };
    }, [applications]);

    const statusTabs = [
        { value: "all", label: "Semua", count: stats.total },
        { value: "submitted", label: "Menunggu", count: stats.submitted },
        { value: "review", label: "Direview", count: stats.review },
        { value: "interview", label: "Interview", count: stats.interview },
        { value: "accepted", label: "Diterima", count: stats.accepted },
        { value: "rejected", label: "Ditolak", count: stats.rejected },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-semibold text-gray-900 mb-2">Riwayat Lamaran</h1>
                    <p className="text-gray-600">Kelola dan pantau status lamaran pekerjaan Anda</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshApplications}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                    type="text"
                    placeholder="Cari posisi atau perusahaan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 border-2 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
            </div>

            {/* Status Tabs */}
            <div className="flex flex-wrap gap-2">
                {statusTabs.map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => setActiveStatus(tab.value)}
                        className={`
                            px-4 py-2 rounded-lg text-sm font-medium transition-all
                            ${
                                activeStatus === tab.value
                                    ? "bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white shadow-lg"
                                    : "bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-300"
                            }
                        `}
                    >
                        {tab.label} ({tab.count})
                    </button>
                ))}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-700 font-medium mb-1">Total Lamaran</p>
                                <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
                            </div>
                            <div className="p-3 bg-blue-200 rounded-xl">
                                <Briefcase className="h-6 w-6 text-blue-700" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-purple-700 font-medium mb-1">Interview</p>
                                <p className="text-3xl font-bold text-purple-900">{stats.interview}</p>
                            </div>
                            <div className="p-3 bg-purple-200 rounded-xl">
                                <FileSearch className="h-6 w-6 text-purple-700" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-700 font-medium mb-1">Diterima</p>
                                <p className="text-3xl font-bold text-green-900">{stats.accepted}</p>
                            </div>
                            <div className="p-3 bg-green-200 rounded-xl">
                                <CheckCircle2 className="h-6 w-6 text-green-700" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-pink-200 bg-gradient-to-br from-pink-50 to-pink-100/50 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-pink-700 font-medium mb-1">Menunggu</p>
                                <p className="text-3xl font-bold text-pink-900">{stats.submitted + stats.review}</p>
                            </div>
                            <div className="p-3 bg-pink-200 rounded-xl">
                                <Hourglass className="h-6 w-6 text-pink-700" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Applications List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Memuat data...</p>
                    </div>
                ) : filteredApplications.length > 0 ? (
                    filteredApplications.map((app) => (
                        <Card
                            key={app.id}
                            className="border-2 border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300"
                        >
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                                                {app.job_listings?.company_name?.charAt(0).toUpperCase() || "?"}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                    {app.job_listings?.title || "Unknown Position"}
                                                </h3>
                                                <p className="text-sm text-gray-600 mb-3">
                                                    {app.job_listings?.company_name || "Unknown Company"}
                                                </p>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <MapPin className="w-4 h-4 text-gray-400" />
                                                        <span>
                                                            {app.job_listings?.location_city || "Tidak disebutkan"}
                                                            {app.job_listings?.location_province && 
                                                                `, ${app.job_listings.location_province}`
                                                            }
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Clock className="w-4 h-4 text-gray-400" />
                                                        <span>
                                                            {app.job_listings?.employment_type 
                                                                ? formatEmploymentType(app.job_listings.employment_type)
                                                                : "Tidak disebutkan"
                                                            }
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Calendar className="w-4 h-4 text-gray-400" />
                                                        <span>Dilamar {formatTimeAgo(app.submitted_at)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <DollarSign className="w-4 h-4 text-gray-400" />
                                                        <span>
                                                            {app.job_listings?.min_salary && app.job_listings?.max_salary
                                                                ? `${formatCurrency(app.job_listings.min_salary, app.job_listings.currency)} - ${formatCurrency(app.job_listings.max_salary, app.job_listings.currency)}`
                                                                : app.job_listings?.min_salary
                                                                ? `Mulai dari ${formatCurrency(app.job_listings.min_salary, app.job_listings.currency)}`
                                                                : "Tidak disebutkan"
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-3">
                                        <Badge
                                            className={`px-3 py-1.5 border-2 ${getStatusColor(app.status)}`}
                                        >
                                            {getStatusLabel(app.status)}
                                        </Badge>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                            className="border-2 border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-400"
                                        >
                                            <Link 
                                                href={`/job-seeker/applications/${app.id}`}
                                                className="flex items-center gap-2"
                                            >
                                                <Eye className="h-4 w-4" />
                                                Lihat Detail
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Card className="border-2 border-dashed border-gray-300">
                        <CardContent className="p-12 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                                <Briefcase className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {searchQuery || activeStatus !== "all"
                                    ? "Tidak ada lamaran ditemukan"
                                    : "Belum ada lamaran"}
                            </h3>
                            <p className="text-gray-600 mb-6">
                                {searchQuery || activeStatus !== "all"
                                    ? "Coba ubah filter atau kata kunci pencarian"
                                    : "Mulai melamar pekerjaan untuk melihat riwayat lamaran Anda"}
                            </p>
                            {!searchQuery && activeStatus === "all" && (
                                <Button asChild className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white">
                                    <Link href="/job-seeker/jobs">
                                        Cari Lowongan
                                    </Link>
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

