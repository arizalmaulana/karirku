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
import { Eye } from "lucide-react";
import type { Application } from "@/lib/types";

async function getApplications() {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("applications")
        .select(`
            *,
            profiles(full_name),
            job_listings(title, company_name)
        `)
        .order("submitted_at", { ascending: false });

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

export default async function ApplicationsManagementPage() {
    const applications = await getApplications();

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
                    <CardTitle>Daftar Lamaran</CardTitle>
                    <CardDescription>
                        Total {applications.length} lamaran pekerjaan
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {applications.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Pelamar</TableHead>
                                    <TableHead>Lowongan</TableHead>
                                    <TableHead>Perusahaan</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Tanggal Submit</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {applications.map((app: any) => (
                                    <TableRow key={app.id}>
                                        <TableCell className="font-medium">
                                            {app.profiles?.full_name || "Unknown"}
                                        </TableCell>
                                        <TableCell>{app.job_listings?.title || "Unknown"}</TableCell>
                                        <TableCell>{app.job_listings?.company_name || "Unknown"}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(app.status)}>
                                                {getStatusLabel(app.status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(app.submitted_at).toLocaleDateString("id-ID")}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/admin/applications/${app.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
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

