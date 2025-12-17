import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Eye, Building2, CheckCircle2, XCircle, Clock, Lock } from "lucide-react";
import type { Company, Profile } from "@/lib/types";
import { redirect } from "next/navigation";
import { TableActionButton } from "@/components/recruiter/TableActionButton";


async function getCompanies(filter?: string) {
    const supabase = await createSupabaseServerClient();
    
    // Check if current user is admin
    const {
        data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
        return [];
    }

    const { data: currentProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", currentUser.id)
        .single();

    if (!currentProfile || (currentProfile as Pick<Profile, 'role'>).role !== "admin") {
        redirect("/");
        return [];
    }

    // Build query based on filter
    let query = supabase
        .from("companies")
        .select(`
            *,
            profiles!companies_recruiter_id_fkey(full_name, email)
        `)
        .order("created_at", { ascending: false });
    
    if (filter === "pending") {
        query = query.eq("status", "pending");
    } else if (filter === "approved") {
        query = query.eq("status", "approved");
    } else if (filter === "rejected") {
        query = query.eq("status", "rejected");
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching companies:", error);
        return [];
    }
    
    return (data || []) as (Company & { profiles?: { full_name: string; email: string } })[];
}

function getStatusBadgeColor(status: string | null): string {
    const colors: Record<string, string> = {
        approved: "bg-green-100 text-green-700 border-0",
        rejected: "bg-red-100 text-red-700 border-0",
        pending: "bg-yellow-100 text-yellow-700 border-0",
    };
    return colors[status || ""] || "bg-gray-100 text-gray-700 border-0";
}

function getStatusBadgeVariant(status: string | null) {
    switch (status) {
        case "approved":
            return "default";
        case "rejected":
            return "destructive";
        case "pending":
            return "secondary";
        default:
            return "outline";
    }
}

function getStatusLabel(status: string | null) {
    switch (status) {
        case "approved":
            return "Disetujui";
        case "rejected":
            return "Ditolak";
        case "pending":
            return "Menunggu";
        default:
            return "Tidak diketahui";
    }
}

function getStatusIcon(status: string | null) {
    switch (status) {
        case "approved":
            return <CheckCircle2 className="h-4 w-4" />;
        case "rejected":
            return <XCircle className="h-4 w-4" />;
        case "pending":
            return <Clock className="h-4 w-4" />;
        default:
            return null;
    }
}

export default async function CompaniesManagementPage({ 
    searchParams 
}: { 
    searchParams?: Promise<{ filter?: string }> | { filter?: string }
}) {
    const params = searchParams instanceof Promise ? await searchParams : searchParams;
    const filter = params?.filter;
    const companies = await getCompanies(filter);

    // Calculate statistics
    const stats = {
        total: companies.length,
        pending: companies.filter(c => c.status === "pending").length,
        approved: companies.filter(c => c.status === "approved").length,
        rejected: companies.filter(c => c.status === "rejected").length,
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-semibold text-blue-900">Manajemen Perusahaan</h1>
                    <p className="text-gray-500 mt-1">
                        Validasi dan kelola semua perusahaan yang terdaftar
                    </p>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-0 bg-gradient-to-br from-purple-50 via-purple-50/50 to-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 font-medium mb-1">Total Perusahaan</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                            <div className="p-3 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-xl shadow-md">
                                <Building2 className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 bg-gradient-to-br from-purple-50 via-purple-50/50 to-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 font-medium mb-1">Menunggu</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
                            </div>
                            <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-md">
                                <Clock className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 bg-gradient-to-br from-purple-50 via-purple-50/50 to-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 font-medium mb-1">Disetujui</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.approved}</p>
                            </div>
                            <div className="p-3 bg-gradient-to-br from-green-400 to-green-600 rounded-xl shadow-md">
                                <CheckCircle2 className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 bg-gradient-to-br from-purple-50 via-purple-50/50 to-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 font-medium mb-1">Ditolak</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.rejected}</p>
                            </div>
                            <div className="p-3 bg-gradient-to-br from-red-400 to-red-600 rounded-xl shadow-md">
                                <XCircle className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
                <Link href="/admin/companies">
                    <Button
                        variant={!filter ? "default" : "outline"}
                        size="sm" 
                        className={!filter 
                            ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg transition-all"
                            : "hover:bg-gray-500 text-gray-700 border-0 bg-gray-400 shadow-sm transition-colors cursor-pointer"
                        }
                    >
                        Semua ({stats.total})
                    </Button>
                </Link>
                <Link href="/admin/companies?filter=pending">
                    <Button
                        variant={filter === "pending" ? "default" : "outline"}
                        size="sm"
                        className={filter === "pending"
                            ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg transition-all"
                            : "hover:bg-gray-500 text-gray-700 border-0 bg-gray-400 shadow-sm transition-colors cursor-pointer"
                        }
                    >
                        Menunggu ({stats.pending})
                    </Button>
                </Link>
                <Link href="/admin/companies?filter=approved">
                    <Button
                        variant={filter === "approved" ? "default" : "outline"}
                        size="sm"
                        className={filter === "approved"
                            ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg transition-all"
                            : "hover:bg-gray-500 text-gray-700 border-0 bg-gray-400 shadow-sm transition-colors cursor-pointer"
                        }
                    >
                        Disetujui ({stats.approved})
                    </Button>
                </Link>
                <Link href="/admin/companies?filter=rejected">
                    <Button
                        variant={filter === "rejected" ? "default" : "outline"}
                        size="sm"
                        className={filter === "rejected"
                            ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg transition-all"
                            : "hover:bg-gray-500 text-gray-700 border-0 bg-gray-400 shadow-sm transition-colors cursor-pointer"
                        }
                    >
                        Ditolak ({stats.rejected})
                    </Button>
                </Link>
            </div>

            {/* Companies Table */}
            <Card className="border-0 bg-gradient-to-br from-purple-100 to-blue-100/50 shadow-sm rounded-2xl p-6">
                <CardHeader>
                    <CardTitle>
                        {filter === "pending" 
                            ? "Perusahaan Menunggu Persetujuan" 
                            : filter === "approved"
                            ? "Perusahaan yang Disetujui"
                            : filter === "rejected"
                            ? "Perusahaan yang Ditolak"
                            : "Daftar Semua Perusahaan"}
                    </CardTitle>
                    <CardDescription>
                        {filter === "pending"
                            ? `${stats.pending} perusahaan menunggu validasi`
                            : `Total ${stats.total} perusahaan terdaftar`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {companies.length > 0 ? (
                        <div className="border-0 rounded-lg overflow-hidden shadow-sm bg-white">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-400">
                                        <TableHead className="font-semibold text-center">Nama Perusahaan</TableHead>
                                        <TableHead className="font-semibold text-center">Recruiter</TableHead>
                                        <TableHead className="font-semibold text-center">Industri</TableHead>
                                        <TableHead className="font-semibold text-center">Lokasi</TableHead>
                                        <TableHead className="font-semibold text-center">Status</TableHead>
                                        <TableHead className="font-semibold text-center">Tanggal Daftar</TableHead>
                                        <TableHead className="font-semibold text-center">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {companies.map((company) => (
                                        <TableRow key={company.id} className="hover:bg-gray-50/50 bg-white">
                                        <TableCell className="font-medium text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {company.name}
                                                {company.is_blocked && (
                                                    <Badge className="text-xs bg-red-100 text-red-700 border-0">
                                                        <Lock className="h-3 w-3 mr-1 text-red-700" />
                                                        Diblokir
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {company.profiles?.full_name || "-"}
                                            {company.profiles?.email && (
                                                <p className="text-xs text-red-500">{company.profiles.email}</p>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">{company.industry || "-"}</TableCell>
                                        <TableCell className="text-center">
                                            {company.location_city || ""}
                                            {company.location_province && `, ${company.location_province}`}
                                            {!company.location_city && !company.location_province && "-"}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge 
                                                className={`${getStatusBadgeColor(company.status)} flex items-center gap-1 w-fit mx-auto`}
                                            >
                                                {getStatusIcon(company.status)}
                                                {getStatusLabel(company.status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {new Date(company.created_at).toLocaleDateString("id-ID")}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <TableActionButton
                                                href={`/admin/companies/${company.id}`}
                                                color="blue"
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                Detail
                                            </TableActionButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">
                                {filter 
                                    ? "Tidak ada perusahaan dengan status ini"
                                    : "Belum ada perusahaan terdaftar"}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}








