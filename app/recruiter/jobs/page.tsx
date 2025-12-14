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
import { Plus, Pencil, Eye, Users } from "lucide-react";
import { redirect } from "next/navigation";
import type { JobListing } from "@/lib/types";
import { DeleteJobButton } from "@/components/recruiter/DeleteJobButton";

function formatCurrency(amount: number | null): string {
    if (!amount) return "Tidak disebutkan";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
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
    return data;
}

async function getRecruiterJobs(userId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("job_listings")
        .select(`
            *,
            applications(count)
        `)
        .eq("recruiter_id", userId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching jobs:", error);
        return [];
    }
    return data || [];
}

async function getApplicationCounts(jobId: string) {
    const supabase = await createSupabaseServerClient();
    const { count } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("job_id", jobId);

    return count || 0;
}

export default async function RecruiterJobsPage() {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/");
    }

    const profile = await getUserProfile(user.id);
    if (!profile || (profile as any).role !== "recruiter") {
        redirect("/");
    }

    const jobs = await getRecruiterJobs(user.id);

    // Get application counts for each job
    const jobsWithCounts = await Promise.all(
        jobs.map(async (job: any) => {
            const count = await getApplicationCounts(job.id);
            return { ...job, applicationCount: count };
        })
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50 shadow-sm rounded-2xl p-4">
                <div >
                    <h1 className="text-3xl font-semibold text-purple-900">Lowongan Saya</h1>
                    <p className="text-gray-500 mt-1">
                        Kelola semua lowongan pekerjaan yang telah Anda publikasikan
                    </p>
                </div>
                <Button size="lg" asChild className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/30">
                    <Link href="/recruiter/jobs/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Lowongan Baru
                    </Link>
                </Button>
            </div>

            <Card className="border border-purple-200 bg-gradient-to-br from-white to-purple-50/30 shadow-sm">
                <CardHeader>
                    <CardTitle>Daftar Lowongan</CardTitle>
                    <CardDescription>
                        Total {jobs.length} lowongan pekerjaan
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {jobs.length > 0 ? (
                        <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead className="font-semibold">Judul</TableHead>
                                        <TableHead className="font-semibold">Perusahaan</TableHead>
                                        <TableHead className="font-semibold">Lokasi</TableHead>
                                        <TableHead className="font-semibold">Gaji</TableHead>
                                        <TableHead className="font-semibold">Tipe</TableHead>
                                        <TableHead className="font-semibold">Pelamar</TableHead>
                                        <TableHead className="font-semibold">Status</TableHead>
                                        <TableHead className="font-semibold text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {jobsWithCounts.map((job: any) => (
                                        <TableRow key={job.id} className="hover:bg-gray-50">
                                        <TableCell className="font-medium">{job.title}</TableCell>
                                        <TableCell>{job.company_name}</TableCell>
                                        <TableCell>
                                            {job.location_city}
                                            {job.location_province && `, ${job.location_province}`}
                                        </TableCell>
                                        <TableCell>
                                            {job.min_salary && job.max_salary
                                                ? `${formatCurrency(job.min_salary)} - ${formatCurrency(job.max_salary)}`
                                                : job.min_salary
                                                ? `Mulai dari ${formatCurrency(job.min_salary)}`
                                                : "Tidak disebutkan"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{job.employment_type}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-gray-400" />
                                                    <span className="font-medium">{job.applicationCount || 0}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={job.featured ? "default" : "secondary"}>
                                                {job.featured ? "Featured" : "Aktif"}
                                            </Badge>
                                        </TableCell>
                                            <TableCell>
                                            <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="sm" asChild title="Lihat Detail">
                                                    <Link href={`/recruiter/jobs/${job.id}`}>
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                    <Button variant="ghost" size="sm" asChild title="Edit Lowongan">
                                                    <Link href={`/recruiter/jobs/${job.id}/edit`}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                    <Button variant="ghost" size="sm" asChild title="Lihat Pelamar">
                                                    <Link href={`/recruiter/applications?job=${job.id}`}>
                                                        <Users className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                    <DeleteJobButton jobId={job.id} jobTitle={job.title} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-500 mb-4">Belum ada lowongan pekerjaan</p>
                            <Button className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-blue-600 hover:to-purple-700 text-white" asChild>
                                <Link href="/recruiter/jobs/new">Tambah Lowongan Pertama</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

