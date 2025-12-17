"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
    RefreshCw,
    Info
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Application, Profile } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";

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
    companyLogo?: string;
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

function getEmploymentTypeColor(type: string): string {
    const colors: Record<string, string> = {
        fulltime: "bg-indigo-500 text-white border-0",
        parttime: "bg-purple-500 text-white border-0",
        remote: "bg-green-500 text-white border-0",
        contract: "bg-indigo-500 text-white border-0",
        internship: "bg-pink-500 text-white border-0",
        hybrid: "bg-teal-500 text-white border-0",
    };
    return colors[type.toLowerCase()] || "bg-indigo-500 text-white border-0";
}

function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
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
        submitted: "bg-yellow-100 text-yellow-700 border-0",
        review: "bg-blue-100 text-blue-700 border-0",
        interview: "bg-purple-100 text-purple-700 border-0",
        accepted: "bg-green-100 text-green-700 border-0",
        rejected: "bg-red-100 text-red-700 border-0",
    };
    return colors[status] || "bg-gray-100 text-gray-700 border-0";
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
    const [selectedApplication, setSelectedApplication] = useState<ApplicationWithJob | null>(null);
    const router = useRouter();
    const supabase = createBrowserClient();

    // Helper function to get company logo
    const getCompanyLogo = async (companyName: string): Promise<string> => {
        try {
            const { data } = await supabase
                .from("companies")
                .select("logo_url")
                .eq("name", companyName)
                .maybeSingle();
            
            if (data && (data as any).logo_url) {
                return (data as any).logo_url;
            }
        } catch (error) {
            console.error("Error fetching company logo:", error);
        }
        
        // Fallback to generated logo
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&size=128&background=6366f1&color=ffffff&bold=true&format=png`;
    };

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
                // Fetch company logos for all applications
                const applicationsWithLogos = await Promise.all(
                    data.map(async (app: any) => {
                        const companyName = app.job_listings?.company_name;
                        if (companyName) {
                            const logo = await getCompanyLogo(companyName);
                            return { ...app, companyLogo: logo };
                        }
                        return app;
                    })
                );
                setApplications(applicationsWithLogos as ApplicationWithJob[]);
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

        // Real-time subscription - disabled untuk mengurangi refresh yang terlalu sering
        // Gunakan polling interval saja untuk refresh berkala
        // const channel = supabase
        //     .channel(`applications_changes_${userId}`)
        //     .on(
        //         "postgres_changes",
        //         {
        //             event: "*",
        //             schema: "public",
        //             table: "applications",
        //             filter: `job_seeker_id=eq.${userId}`,
        //         },
        //         (payload) => {
        //             console.log("Real-time update:", payload);
        //             refreshApplications();
        //         }
        //     )
        //     .subscribe((status) => {
        //         console.log("Subscription status:", status);
        //     });

        // Polling fallback - refresh every 10 minutes (only if page is visible)
        const pollInterval = setInterval(() => {
            if (document.visibilityState === "visible") {
                refreshApplications();
            }
        }, 600000); // 10 menit = 600000ms
        // Also listen for custom events (when application is submitted from other tabs)
        const handleApplicationSubmitted = () => {
            console.log("Application submitted event received");
            setTimeout(() => refreshApplications(), 3000); // Wait 1 second for DB to update
        };

        window.addEventListener("application-submitted", handleApplicationSubmitted);

        return () => {
            // supabase.removeChannel(channel);
            clearInterval(pollInterval);
            window.removeEventListener("application-submitted", handleApplicationSubmitted);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    // Refresh on mount only (real-time subscription and polling will handle updates)
    useEffect(() => {
        refreshApplications();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Filter applications (exclude draft status)
    const filteredApplications = useMemo(() => {
        return applications.filter((app) => {
            // Exclude draft applications
            if (app.status === "draft") return false;

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

    // Calculate statistics (exclude draft)
    const stats = useMemo(() => {
        const nonDraftApps = applications.filter((a) => a.status !== "draft");
        return {
            total: nonDraftApps.length,
            submitted: nonDraftApps.filter((a) => a.status === "submitted").length,
            review: nonDraftApps.filter((a) => a.status === "review").length,
            interview: nonDraftApps.filter((a) => a.status === "interview").length,
            accepted: nonDraftApps.filter((a) => a.status === "accepted").length,
            rejected: nonDraftApps.filter((a) => a.status === "rejected").length,
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
                                    ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg"
                                    : "bg-white text-gray-700 border border-gray-200/40 hover:border-purple-300/50"
                            }
                        `}
                    >
                        {tab.label} ({tab.count})
                    </button>
                ))}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-0 bg-gradient-to-br from-indigo-50 to-indigo-100/50 shadow-sm">
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

                <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100/50 shadow-sm">
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

                <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100/50 shadow-sm">
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

                <Card className="border-0 bg-gradient-to-br from-pink-50 to-pink-100/50 shadow-sm">
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

            {/* Applications Table */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">Memuat data...</p>
                        </div>
                    ) : filteredApplications.length > 0 ? (
                        <div className="border-0 rounded-lg overflow-hidden shadow-sm bg-white">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-400">
                                        <TableHead className="font-semibold text-center">Posisi</TableHead>
                                        <TableHead className="font-semibold text-center">Perusahaan</TableHead>
                                        <TableHead className="font-semibold text-center">Status</TableHead>
                                        <TableHead className="font-semibold text-center">Tanggal</TableHead>
                                        <TableHead className="font-semibold text-center">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredApplications.map((app) => (
                                        <TableRow 
                                            key={app.id}
                                            className="hover:bg-gray-50/50 bg-white"
                                        >
                                        <TableCell className="font-medium text-center">
                                            {app.job_listings?.title || "Unknown Position"}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {app.job_listings?.company_name || "Unknown Company"}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge
                                                className={`px-2.5 py-1 border ${getStatusColor(app.status)}`}
                                            >
                                                {getStatusLabel(app.status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1.5 text-sm text-gray-600">
                                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                <span>{formatTimeAgo(app.submitted_at)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setSelectedApplication(app)}
                                                    className="shadow-md"
                                                    style={{ 
                                                        backgroundColor: '#14b8a6',
                                                        color: 'white',
                                                        border: 'none'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#0d9488';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#14b8a6';
                                                    }}
                                                >
                                                    <Info className="h-3.5 w-3.5 mr-1.5" />
                                                    Detail Lowongan
                                                </Button>
                                                <Link href={`/job-seeker/applications/${app.id}`}>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="shadow-md"
                                                        style={{ 
                                                            backgroundColor: '#3b82f6',
                                                            color: 'white',
                                                            border: 'none'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor = '#2563eb';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor = '#3b82f6';
                                                        }}
                                                    >
                                                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                                                        Detail Lamaran
                                                    </Button>
                                                </Link>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="p-12 text-center">
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
                                <Button asChild className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600">
                                    <Link href="/job-seeker/jobs">
                                        Cari Lowongan
                                    </Link>
                                </Button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Detail Lowongan Modal */}
            {selectedApplication && selectedApplication.job_listings && (
                <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)} > 
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-gray-900">Detail Lowongan</DialogTitle>
                            <DialogDescription>
                                Informasi lengkap tentang lowongan pekerjaan
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 mt-4">
                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shadow-sm border border-gray-200/40">
                                    <ImageWithFallback
                                        src={(selectedApplication as any).companyLogo || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedApplication.job_listings?.company_name || "Company")}&size=128&background=6366f1&color=ffffff&bold=true&format=png`}
                                        alt={selectedApplication.job_listings?.company_name || "Company"}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                                        {selectedApplication.job_listings.title}
                                    </h3>
                                    <p className="text-lg text-gray-700">
                                        {selectedApplication.job_listings.company_name}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <MapPin className="w-4 h-4" />
                                        <span>Lokasi</span>
                                    </div>
                                    <p className="font-medium text-gray-900">
                                        {selectedApplication.job_listings.location_city || "-"}
                                        {selectedApplication.job_listings.location_province && 
                                            `, ${selectedApplication.job_listings.location_province}`
                                        }
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Clock className="w-4 h-4" />
                                        <span>Tipe Pekerjaan</span>
                                    </div>
                                    <Badge className={`mt-1 ${getEmploymentTypeColor(selectedApplication.job_listings.employment_type || "")}`}>
                                        {selectedApplication.job_listings.employment_type 
                                            ? formatEmploymentType(selectedApplication.job_listings.employment_type)
                                            : "-"
                                        }
                                    </Badge>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <DollarSign className="w-4 h-4" />
                                        <span>Gaji</span>
                                    </div>
                                    <p className="font-medium text-gray-900">
                                        {selectedApplication.job_listings.min_salary && selectedApplication.job_listings.max_salary
                                            ? `${formatCurrency(selectedApplication.job_listings.min_salary, selectedApplication.job_listings.currency)} - ${formatCurrency(selectedApplication.job_listings.max_salary, selectedApplication.job_listings.currency)}`
                                            : selectedApplication.job_listings.min_salary
                                            ? `Mulai dari ${formatCurrency(selectedApplication.job_listings.min_salary, selectedApplication.job_listings.currency)}`
                                            : "Tidak disebutkan"
                                        }
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Calendar className="w-4 h-4" />
                                        <span>Tanggal Lamar</span>
                                    </div>
                                    <p className="font-medium text-gray-900">
                                        {new Date(selectedApplication.submitted_at).toLocaleDateString("id-ID", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Status Lamaran</p>
                                        <Badge
                                            className={`px-3 py-1.5 border ${getStatusColor(selectedApplication.status)}`}
                                        >
                                            {getStatusLabel(selectedApplication.status)}
                                        </Badge>
                                    </div>
                                    <Button
                                        variant="outline"
                                        asChild
                                        className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-400"
                                    >
                                        <Link href={`/job-seeker/applications/${selectedApplication.id}`}>
                                            <Eye className="h-4 w-4 mr-2" />
                                            Lihat Detail Lamaran
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}

