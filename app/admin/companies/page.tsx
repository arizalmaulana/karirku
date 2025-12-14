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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-700 font-medium mb-1">Total Perusahaan</p>
                                <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
                            </div>
                            <div className="p-3 bg-blue-200 rounded-xl">
                                <Building2 className="h-6 w-6 text-blue-700" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100/50 hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-yellow-700 font-medium mb-1">Menunggu</p>
                                <p className="text-3xl font-bold text-yellow-900">{stats.pending}</p>
                            </div>
                            <div className="p-3 bg-yellow-200 rounded-xl">
                                <Clock className="h-6 w-6 text-yellow-700" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-700 font-medium mb-1">Disetujui</p>
                                <p className="text-3xl font-bold text-green-900">{stats.approved}</p>
                            </div>
                            <div className="p-3 bg-green-200 rounded-xl">
                                <CheckCircle2 className="h-6 w-6 text-green-700" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-red-700 font-medium mb-1">Ditolak</p>
                                <p className="text-3xl font-bold text-red-900">{stats.rejected}</p>
                            </div>
                            <div className="p-3 bg-red-200 rounded-xl">
                                <XCircle className="h-6 w-6 text-red-700" />
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
                        className="hover:bg-blue-600 hover:text-white transition-all duration-300"
                    >
                        Semua ({stats.total})
                    </Button>
                </Link>
                <Link href="/admin/companies?filter=pending">
                    <Button
                        variant={filter === "pending" ? "default" : "outline"}
                        size="sm"
                        className="hover:bg-yellow-600 hover:text-white transition-all duration-300"
                    >
                        Menunggu ({stats.pending})
                    </Button>
                </Link>
                <Link href="/admin/companies?filter=approved">
                    <Button
                        variant={filter === "approved" ? "default" : "outline"}
                        size="sm"
                        className="hover:bg-green-600 hover:text-white transition-all duration-300"
                    >
                        Disetujui ({stats.approved})
                    </Button>
                </Link>
                <Link href="/admin/companies?filter=rejected">
                    <Button
                        variant={filter === "rejected" ? "default" : "outline"}
                        size="sm"
                        className="hover:bg-red-600 hover:text-white transition-all duration-300"
                    >
                        Ditolak ({stats.rejected})
                    </Button>
                </Link>
            </div>

            {/* Companies Table */}
            <Card className="border border-purple-200 bg-gradient-to-br from-blue-100 to-pink-100/50 shadow-sm rounded-2xl">
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
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama Perusahaan</TableHead>
                                    <TableHead>Recruiter</TableHead>
                                    <TableHead>Industri</TableHead>
                                    <TableHead>Lokasi</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Tanggal Daftar</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {companies.map((company) => (
                                    <TableRow key={company.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                {company.name}
                                                {company.is_blocked && (
                                                    <Badge variant="destructive" className="text-xs">
                                                        <Lock className="h-3 w-3 mr-1" />
                                                        Diblokir
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {company.profiles?.full_name || "-"}
                                            {company.profiles?.email && (
                                                <p className="text-xs text-gray-500">{company.profiles.email}</p>
                                            )}
                                        </TableCell>
                                        <TableCell>{company.industry || "-"}</TableCell>
                                        <TableCell>
                                            {company.location_city || ""}
                                            {company.location_province && `, ${company.location_province}`}
                                            {!company.location_city && !company.location_province && "-"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge 
                                                variant={getStatusBadgeVariant(company.status)} 
                                                className="flex items-center gap-1 w-fit"
                                            >
                                                {getStatusIcon(company.status)}
                                                {getStatusLabel(company.status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(company.created_at).toLocaleDateString("id-ID")}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/admin/companies/${company.id}`}>
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Detail
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
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








