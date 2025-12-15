import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { notFound } from "next/navigation";
import type { JobListing } from "@/lib/types";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function formatCurrency(amount: number | null): string {
    if (!amount) return "Tidak disebutkan";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
}

async function getJob(id: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("job_listings")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !data) {
        return null;
    }
    return data as JobListing;
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const job = await getJob(id);

    if (!job) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" asChild className="hover:bg-gray-50 transition-all border-gray-300">
                    <Link href="/admin/jobs">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Kembali
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-semibold text-gray-900">{job.title}</h1>
                    <p className="text-gray-500 mt-1">{job.company_name}</p>
                </div>
                <div className="flex gap-1">
                    <Button variant="outline" asChild className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-purple-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all" size="default">
                        <Link href={`/admin/jobs/${job.id}/edit`}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                        </Link>
                    </Button>
                    <Button variant="destructive" asChild>
                        <Link href={`/admin/jobs/${job.id}/delete`}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Hapus
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-gradient-to-br from-purple-50 to-blue-100/50">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-gray-700">Informasi Umum</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-500">Perusahaan</p>
                            <p className="font-medium">{job.company_name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Lokasi</p>
                            <p className="font-medium">
                                {job.location_city}
                                {job.location_province && `, ${job.location_province}`}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-black-500">Tipe Pekerjaan</p>
                            <Badge variant="outline" className="bg-gradient-to-br from-green-50 to-green-100/50">{job.employment_type}</Badge>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Gaji</p>
                            <p className="font-medium">
                                {job.min_salary && job.max_salary
                                    ? `${formatCurrency(job.min_salary)} - ${formatCurrency(job.max_salary)}`
                                    : job.min_salary
                                    ? `Mulai dari ${formatCurrency(job.min_salary)}`
                                    : "Tidak disebutkan"}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <Badge variant={job.featured ? "default" : "secondary"}>
                                {job.featured ? "Featured" : "Aktif"}
                            </Badge>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Tanggal Dibuat</p>
                            <p className="font-medium">
                                {new Date(job.created_at).toLocaleDateString("id-ID", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                })}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-pink-200/50">
                    <CardHeader className="text-2xl font-bold text-gray-700">
                        <CardTitle >Detail Pekerjaan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {job.description && (
                            <div>
                                <p className="text-sm text-gray-500 mb-2">Deskripsi</p>
                                <p className="text-sm whitespace-pre-wrap">{job.description}</p>
                            </div>
                        )}

                        {job.requirements && job.requirements.length > 0 && (
                            <div>
                                <p className="text-sm text-gray-500 mb-2">Persyaratan</p>
                                <ul className="list-disc list-inside space-y-1">
                                    {job.requirements.map((req, index) => (
                                        <li key={index} className="text-sm">{req}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {job.skills_required && job.skills_required.length > 0 && (
                            <div>
                                <p className="text-sm text-gray-500 mb-2">Skills yang Diperlukan</p>
                                <div className="flex flex-wrap gap-2">
                                    {job.skills_required.map((skill, index) => (
                                        <Badge key={index} variant="outline" className="bg-gradient-to-br from-blue-100 to-blue-100/50">{skill}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

