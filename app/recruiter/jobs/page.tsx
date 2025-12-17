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
import { CloseJobButton } from "@/components/recruiter/CloseJobButton";

function formatCurrency(amount: number | null): string {
    if (!amount) return "Tidak disebutkan";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
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

function getJobStatusColor(featured: boolean, isClosed: boolean): string {
    if (isClosed) {
        return "bg-red-100 text-red-700 border-0";
    }
    if (featured) {
        return "bg-indigo-500 text-white border-0";
    }
    return "bg-green-100 text-green-700 border-0";
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
        <div className="space-y-6 w-full max-w-full">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-0 bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 shadow-md rounded-2xl p-4">
                <div>
                    <h1 className="text-3xl font-semibold text-purple-900">Lowongan Saya</h1>
                    <p className="text-gray-500 mt-1">
                        Kelola semua lowongan pekerjaan yang telah Anda publikasikan
                    </p>
                </div>
                <Button size="lg" asChild className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-lg shadow-indigo-500/30">
                    <Link href="/recruiter/jobs/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Lowongan Baru
                    </Link>
                </Button>
            </div>

            <Card className="border-0 bg-gradient-to-br from-white to-purple-50/30 shadow-sm w-full">
                <CardHeader>
                    <CardTitle>Daftar Lowongan</CardTitle>
                    <CardDescription>
                        Total {jobs.length} lowongan pekerjaan
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0 sm:p-6 w-full overflow-hidden">
                    {jobs.length > 0 ? (
                        <div className="border-0 rounded-lg overflow-hidden shadow-sm bg-white w-full">
                        <div className="w-full overflow-x-auto">
                            <Table className="w-full table-fixed">
                                    <TableHeader>
                                        <TableRow className="bg-gray-400">
                                            <TableHead className="font-semibold text-center w-[18%]">Judul</TableHead>
                                            <TableHead className="font-semibold text-center w-[12%]">Perusahaan</TableHead>
                                            <TableHead className="font-semibold text-center w-[12%]">Lokasi</TableHead>
                                            <TableHead className="font-semibold text-center w-[15%]">Gaji</TableHead>
                                            <TableHead className="font-semibold text-center w-[8%]">Tipe</TableHead>
                                            <TableHead className="font-semibold text-center w-[8%]">Pelamar</TableHead>
                                            <TableHead className="font-semibold text-center w-[8%]">Status</TableHead>
                                            <TableHead className="font-semibold text-center w-[19%]">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {jobsWithCounts.map((job: any) => (
                                            <TableRow key={job.id} className="hover:bg-gray-50/50 bg-white">
                                                <TableCell className="font-medium text-center">
                                                    <div className="truncate px-2" title={job.title}>
                                                        {job.title}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="truncate px-2" title={job.company_name}>
                                                        {job.company_name}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="truncate px-2" title={`${job.location_city}${job.location_province ? `, ${job.location_province}` : ''}`}>
                                                        {job.location_city}
                                                        {job.location_province && `, ${job.location_province}`}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="truncate text-sm px-2">
                                                        {job.min_salary && job.max_salary
                                                            ? `${formatCurrency(job.min_salary)} - ${formatCurrency(job.max_salary)}`
                                                            : job.min_salary
                                                            ? `Mulai dari ${formatCurrency(job.min_salary)}`
                                                            : "Tidak disebutkan"}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge className={`text-xs whitespace-nowrap ${getEmploymentTypeColor(job.employment_type)}`}>
                                                        {job.employment_type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Users className="h-4 w-4 text-gray-400" />
                                                        <span className="font-medium text-sm">{job.applicationCount || 0}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge className={`text-xs whitespace-nowrap ${getJobStatusColor(job.featured || false, job.is_closed || false)}`}>
                                                        {job.is_closed ? "Ditutup" : (job.featured ? "Featured" : "Aktif")}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex justify-center gap-1 flex-wrap">
                                                        <Button variant="ghost" size="sm" asChild title="Lihat Detail" className="cursor-pointer h-7 w-7 p-0">
                                                            <Link href={`/recruiter/jobs/${job.id}`}>
                                                                <Eye className="h-4 w-4 text-blue-600" />
                                                            </Link>
                                                        </Button>
                                                        <Button variant="ghost" size="sm" asChild title="Edit Lowongan" className="cursor-pointer h-7 w-7 p-0">
                                                            <Link href={`/recruiter/jobs/${job.id}/edit`}>
                                                                <Pencil className="h-4 w-4 text-green-600" />
                                                            </Link>
                                                        </Button>
                                                        <CloseJobButton 
                                                            jobId={job.id} 
                                                            jobTitle={job.title} 
                                                            isClosed={job.is_closed || false}
                                                        />
                                                        <DeleteJobButton jobId={job.id} jobTitle={job.title} />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
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

