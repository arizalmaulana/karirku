import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Pencil, Users, MapPin, Briefcase, DollarSign } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import type { JobListing } from "@/lib/types";

function formatCurrency(amount: number | null): string {
    if (!amount) return "Tidak disebutkan";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
}

async function getJob(id: string, userId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("job_listings")
        .select("*")
        .eq("id", id)
        .eq("recruiter_id", userId)
        .single();

    if (error || !data) {
        return null;
    }
    return data as JobListing;
}

async function getApplicationCount(jobId: string) {
    const supabase = await createSupabaseServerClient();
    const { count } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("job_id", jobId);

    return count || 0;
}

export default async function RecruiterJobDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
    // Handle params as Promise (Next.js 15) or object (Next.js 14)
    const resolvedParams = params instanceof Promise ? await params : params;
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/");
    }

    const [job, applicationCount] = await Promise.all([
        getJob(resolvedParams.id, user.id),
        getApplicationCount(resolvedParams.id),
    ]);

    if (!job) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/recruiter/jobs">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Kembali
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-semibold text-gray-900">{job.title}</h1>
                    <p className="text-gray-500 mt-1">{job.company_name}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href={`/recruiter/jobs/${job.id}/edit`}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                        </Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href={`/recruiter/applications?job=${job.id}`}>
                            <Users className="h-4 w-4 mr-2" />
                            Lihat Pelamar ({applicationCount})
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Deskripsi Pekerjaan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="whitespace-pre-wrap text-sm">
                                {job.description || "Tidak ada deskripsi tersedia"}
                            </p>
                        </CardContent>
                    </Card>

                    {job.requirements && job.requirements.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Persyaratan</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="list-disc list-inside space-y-2">
                                    {job.requirements.map((req, index) => (
                                        <li key={index} className="text-sm">{req}</li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}

                    {job.skills_required && job.skills_required.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Skills yang Diperlukan</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {job.skills_required.map((skill, index) => (
                                        <Badge key={index} variant="outline">
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {job.major_required && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Jurusan yang Diperlukan</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Badge variant="secondary">{job.major_required}</Badge>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Lowongan</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-500 flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    Lokasi
                                </p>
                                <p className="font-medium mt-1">
                                    {job.location_city}
                                    {job.location_province && `, ${job.location_province}`}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 flex items-center gap-2">
                                    <Briefcase className="h-4 w-4" />
                                    Tipe Pekerjaan
                                </p>
                                <Badge variant="outline" className="mt-1">
                                    {job.employment_type}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 flex items-center gap-2">
                                    <DollarSign className="h-4 w-4" />
                                    Estimasi Gaji
                                </p>
                                <p className="font-medium mt-1">
                                    {job.min_salary && job.max_salary
                                        ? `${formatCurrency(job.min_salary)} - ${formatCurrency(job.max_salary)}`
                                        : job.min_salary
                                        ? `Mulai dari ${formatCurrency(job.min_salary)}`
                                        : "Tidak disebutkan"}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Status</p>
                                <Badge variant={job.featured ? "default" : "secondary"} className="mt-1">
                                    {job.featured ? "Featured" : "Aktif"}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Pelamar</p>
                                <p className="font-medium mt-1 flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    {applicationCount} kandidat
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Tanggal Dibuat</p>
                                <p className="font-medium mt-1">
                                    {new Date(job.created_at).toLocaleDateString("id-ID", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

