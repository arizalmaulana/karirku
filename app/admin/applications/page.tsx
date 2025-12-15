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
import { Eye, Trash2, Pencil } from "lucide-react";
import type { Application } from "@/lib/types";
import { DeleteApplicationButton } from "@/components/admin/DeleteApplicationButton";

async function getApplications(statusFilter?: string) {
    const supabase = await createSupabaseServerClient();
    let query = supabase
        .from("applications")
        .select(`
            *,
            profiles(full_name),
            job_listings(title, company_name)
        `);

    // Apply status filter if provided
    if (statusFilter) {
        const statuses = statusFilter.split(',');
        if (statuses.length > 1) {
            query = query.in("status", statuses);
        } else {
            query = query.eq("status", statusFilter);
        }
    }

    const { data, error } = await query.order("submitted_at", { ascending: false });

    if (error) {
        console.error("Error fetching applications:", error);
        return [];
    }
    return data as any[];
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

export default async function ApplicationsManagementPage({ 
    searchParams 
}: { 
    searchParams?: { status?: string } 
}) {
    const statusFilter = searchParams?.status;
    const applications = await getApplications(statusFilter);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-semibold text-blue-900">Manajemen Lamaran</h1>
                <p className="text-gray-500 mt-1">
                    Kelola dan pantau semua lamaran pekerjaan
                </p>
            </div>

            <Card className="border border-blue-200 bg-gradient-to-br from-blue-50 to-purple-100/50 shadow-sm rounded-2xl p-6">
                <CardHeader>
                    <CardTitle>
                        {statusFilter ? "Lamaran Menunggu Tindakan" : "Daftar Lamaran"}
                    </CardTitle>
                    <CardDescription>
                        {statusFilter 
                            ? `${applications.length} lamaran dengan status ${statusFilter}`
                            : `Total ${applications.length} lamaran pekerjaan`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {applications.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-sm font-semibold text-gray-700 text-center">Pelamar</TableHead>
                                    <TableHead className="text-sm font-semibold text-gray-700 text-center">Lowongan</TableHead>
                                    <TableHead className="text-sm font-semibold text-gray-700 text-center">Perusahaan</TableHead>
                                    <TableHead className="text-sm font-semibold text-gray-700 text-center">Status</TableHead>
                                    <TableHead className="text-sm font-semibold text-gray-700 text-center">Tanggal Submit</TableHead>
                                    <TableHead className="text-sm font-semibold text-gray-700 text-center">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {applications.map((app: any) => (
                                    <TableRow key={app.id}>
                                        <TableCell className="font-medium text-center">
                                            {app.profiles?.full_name || "Unknown"}
                                        </TableCell>
                                        <TableCell className="text-center">{app.job_listings?.title || "Unknown"}</TableCell>
                                        <TableCell className="text-center">{app.job_listings?.company_name || "Unknown"}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={getStatusBadgeVariant(app.status)}>
                                                {getStatusLabel(app.status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {new Date(app.submitted_at).toLocaleDateString("id-ID")}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center gap-2">
                                                <Button variant="ghost" size="sm" asChild className="hover:bg-blue-50 transition-all">
                                                    <Link href={`/admin/applications/${app.id}`}>
                                                        <Eye className="h-4 w-4 text-blue-600" />
                                                    </Link>
                                                </Button>
                                                <Button variant="ghost" size="sm" asChild className="hover:bg-green-50 transition-all">
                                                    <Link href={`/admin/applications/${app.id}/edit`}>
                                                        <Pencil className="h-4 w-4 text-green-600" />
                                                    </Link>
                                                </Button>
                                                <DeleteApplicationButton applicationId={app.id} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-500">Belum ada lamaran pekerjaan</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

