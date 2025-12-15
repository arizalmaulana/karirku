import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
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
import Link from "next/link";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
function formatCurrency(amount: number | null): string {
    if (!amount) return "Tidak disebutkan";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
}
import type { JobListing } from "@/lib/types";

async function getJobs() {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("job_listings")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching jobs:", error);
        return [];
    }
    return data as JobListing[];
}

export default async function JobsManagementPage() {
    const jobs = await getJobs();

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-semibold text-blue-900">Manajemen Lowongan</h1>
                    <p className="text-gray-500 mt-1">
                        Kelola semua lowongan pekerjaan di platform
                    </p>
                </div>
            </div>

            <Card className="border border-purple-200 bg-gradient-to-br from-purple-100 to-blue-100/50 shadow-sm rounded-2xl p-6">
                <CardHeader>
                    <CardTitle>Daftar Lowongan</CardTitle>
                    <CardDescription>
                        Total {jobs.length} lowongan pekerjaan
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {jobs.length > 0 ? (
                        <Table>
                            <TableHeader >
                                <TableRow>
                                    <TableHead className="text-sm font-semibold text-gray-700 text-center">Judul</TableHead>
                                    <TableHead className="text-sm font-semibold text-gray-700 text-center">Perusahaan</TableHead>
                                    <TableHead className="text-sm font-semibold text-gray-700 text-center">Lokasi</TableHead>
                                    <TableHead className="text-sm font-semibold text-gray-700 text-center">Gaji</TableHead>
                                    <TableHead className="text-sm font-semibold text-gray-700 text-center">Tipe</TableHead>
                                    <TableHead className="text-sm font-semibold text-gray-700 text-center">Status</TableHead>
                                    <TableHead className="text-sm font-semibold text-gray-700 text-center">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {jobs.map((job) => (
                                    <TableRow key={job.id}>
                                        <TableCell className="font-medium text-center">{job.title}</TableCell>
                                        <TableCell className="text-center">{job.company_name}</TableCell>
                                        <TableCell className="text-center">
                                            {job.location_city}
                                            {job.location_province && `, ${job.location_province}`}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {job.min_salary && job.max_salary
                                                ? `${formatCurrency(job.min_salary)} - ${formatCurrency(job.max_salary)}`
                                                : job.min_salary
                                                ? `Mulai dari ${formatCurrency(job.min_salary)}`
                                                : "Tidak disebutkan"}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className="bg-gradient-to-r from-purple-100 to-purple-100/50 border-purple-200 text-gray-700 shadow-sm">{job.employment_type}</Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={job.featured ? "default" : "secondary"}>
                                                {job.featured ? "Featured" : "Aktif"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center gap-2">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/admin/jobs/${job.id}`}>
                                                        <Eye className="h-4 w-4 text-blue-600" />
                                                    </Link>
                                                </Button>
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/admin/jobs/${job.id}/edit`}>
                                                        <Pencil className="h-4 w-4 text-green-600" />
                                                    </Link>
                                                </Button>
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/admin/jobs/${job.id}/delete`}>
                                                        <Trash2 className="h-4 w-4 text-red-600" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-500">Belum ada lowongan pekerjaan</p>
                            <Button className="mt-4" asChild>
                                <Link href="/admin/jobs/new">Tambah Lowongan Pertama</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

