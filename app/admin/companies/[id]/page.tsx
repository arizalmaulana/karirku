import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Building2, CheckCircle2, XCircle, Clock, ExternalLink, FileText, MapPin, Globe, Users } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { CompanyApprovalForm } from "@/components/admin/CompanyApprovalForm";
import type { Company } from "@/lib/types";

async function getCompany(id: string) {
    const supabase = await createSupabaseServerClient();
    
    // Check if current user is admin
    const {
        data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
        return null;
    }

    const { data: currentProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", currentUser.id)
        .single();

    if (!currentProfile || currentProfile.role !== "admin") {
        redirect("/");
        return null;
    }

    const { data, error } = await supabase
        .from("companies")
        .select(`
            *,
            profiles!companies_recruiter_id_fkey(
                id,
                full_name,
                email,
                phone,
                headline,
                location_city
            )
        `)
        .eq("id", id)
        .single();

    if (error || !data) {
        return null;
    }
    
    return data as Company & { profiles?: { id: string; full_name: string; email: string; phone: string; headline: string; location_city: string } };
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
            return "Menunggu Persetujuan";
        default:
            return "Tidak diketahui";
    }
}

function getStatusIcon(status: string | null) {
    switch (status) {
        case "approved":
            return <CheckCircle2 className="h-5 w-5" />;
        case "rejected":
            return <XCircle className="h-5 w-5" />;
        case "pending":
            return <Clock className="h-5 w-5" />;
        default:
            return null;
    }
}

export default async function CompanyDetailPage({ 
    params 
}: { 
    params: Promise<{ id: string }> | { id: string }
}) {
    const resolvedParams = params instanceof Promise ? await params : params;
    const company = await getCompany(resolvedParams.id);

    if (!company) {
        notFound();
    }

    const recruiter = company.profiles;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/admin/companies">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Kembali
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-semibold text-gray-900">{company.name}</h1>
                    <p className="text-gray-500 mt-1">
                        Detail perusahaan dan validasi
                    </p>
                </div>
                <Badge 
                    variant={getStatusBadgeVariant(company.status)} 
                    className="flex items-center gap-2 px-4 py-2"
                >
                    {getStatusIcon(company.status)}
                    {getStatusLabel(company.status)}
                </Badge>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Company Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Informasi Perusahaan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Nama Perusahaan</p>
                                    <p className="font-medium">{company.name}</p>
                                </div>
                                {company.industry && (
                                    <div>
                                        <p className="text-sm text-gray-500">Industri</p>
                                        <p className="font-medium">{company.industry}</p>
                                    </div>
                                )}
                                {company.size && (
                                    <div>
                                        <p className="text-sm text-gray-500">Ukuran Perusahaan</p>
                                        <p className="font-medium flex items-center gap-2">
                                            <Users className="h-4 w-4" />
                                            {company.size} karyawan
                                        </p>
                                    </div>
                                )}
                                {(company.location_city || company.location_province) && (
                                    <div>
                                        <p className="text-sm text-gray-500">Lokasi</p>
                                        <p className="font-medium flex items-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            {company.location_city || ""}
                                            {company.location_province && `, ${company.location_province}`}
                                        </p>
                                    </div>
                                )}
                                {company.website_url && (
                                    <div>
                                        <p className="text-sm text-gray-500">Website</p>
                                        <a 
                                            href={company.website_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="font-medium flex items-center gap-2 text-blue-600 hover:text-blue-800"
                                        >
                                            <Globe className="h-4 w-4" />
                                            {company.website_url}
                                        </a>
                                    </div>
                                )}
                            </div>
                            {company.description && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Deskripsi</p>
                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{company.description}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recruiter Information */}
                    {recruiter && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Informasi Recruiter</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-500">Nama</p>
                                    <p className="font-medium">{recruiter.full_name || "-"}</p>
                                </div>
                                {recruiter.email && (
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="font-medium">{recruiter.email}</p>
                                    </div>
                                )}
                                {recruiter.phone && (
                                    <div>
                                        <p className="text-sm text-gray-500">Telepon</p>
                                        <p className="font-medium">{recruiter.phone}</p>
                                    </div>
                                )}
                                {recruiter.headline && (
                                    <div>
                                        <p className="text-sm text-gray-500">Headline</p>
                                        <p className="font-medium">{recruiter.headline}</p>
                                    </div>
                                )}
                                {recruiter.location_city && (
                                    <div>
                                        <p className="text-sm text-gray-500">Lokasi</p>
                                        <p className="font-medium">{recruiter.location_city}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* License Document */}
                    {company.license_url && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Surat Izin Perusahaan
                                </CardTitle>
                                <CardDescription>
                                    Dokumen legal perusahaan yang diunggah oleh recruiter
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline" asChild>
                                    <a 
                                        href={company.license_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                    >
                                        <FileText className="mr-2 h-4 w-4" />
                                        Lihat Dokumen
                                        <ExternalLink className="ml-2 h-4 w-4" />
                                    </a>
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar - Approval Form */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Validasi Perusahaan</CardTitle>
                            <CardDescription>
                                {company.status === "pending" 
                                    ? "Tinjau dan validasi perusahaan ini"
                                    : company.status === "approved"
                                    ? "Perusahaan ini sudah disetujui"
                                    : "Perusahaan ini ditolak"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CompanyApprovalForm
                                companyId={company.id}
                                currentStatus={company.status}
                                companyName={company.name}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Tambahan</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-500">Tanggal Daftar</p>
                                <p className="font-medium">
                                    {new Date(company.created_at).toLocaleDateString("id-ID", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </p>
                            </div>
                            {company.updated_at !== company.created_at && (
                                <div>
                                    <p className="text-sm text-gray-500">Terakhir Diupdate</p>
                                    <p className="font-medium">
                                        {new Date(company.updated_at).toLocaleDateString("id-ID", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}






