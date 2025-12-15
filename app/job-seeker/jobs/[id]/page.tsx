import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, MapPin, Briefcase, DollarSign, Home, Utensils, Car } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { calculateMatchScore } from "@/lib/utils/jobMatching";
import type { JobListing, LivingCost, Profile } from "@/lib/types";

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

    const jobListing = data as JobListing;

    // Integrate company data from companies table
    const { data: companyData } = await supabase
        .from("companies")
        .select("logo_url, industry, location_city, location_province, website_url, description")
        .eq("name", jobListing.company_name)
        .maybeSingle();

    // If company data exists, integrate it with job listing
    if (companyData) {
        const company = companyData as any;
        return {
            ...jobListing,
            // Use company location if job listing doesn't have it
            location_city: company.location_city || jobListing.location_city,
            location_province: company.location_province || jobListing.location_province,
        } as JobListing;
    }

    return jobListing;
}

async function getLivingCost(livingCostId: string | null) {
    if (!livingCostId) return null;

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("living_costs")
        .select("*")
        .eq("id", livingCostId)
        .single();

    if (error || !data) {
        return null;
    }
    return data as LivingCost;
}

async function getLivingCostByCity(cityName: string | null) {
    if (!cityName) return null;

    const supabase = await createSupabaseServerClient();
    
    // Try exact match first
    let { data, error } = await supabase
        .from("living_costs")
        .select("*")
        .eq("city", cityName)
        .maybeSingle();

    // If not found, try case-insensitive match
    if (error || !data) {
        const { data: data2, error: error2 } = await supabase
            .from("living_costs")
            .select("*")
            .ilike("city", cityName)
            .maybeSingle();
        
        if (!error2 && data2) {
            data = data2;
            error = null;
        }
    }

    // If still not found, try partial match (contains)
    if (error || !data) {
        const { data: data3, error: error3 } = await supabase
            .from("living_costs")
            .select("*")
            .ilike("city", `%${cityName}%`)
            .maybeSingle();
        
        if (!error3 && data3) {
            data = data3;
        }
    }

    if (error || !data) {
        return null;
    }
    return data as LivingCost;
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
    return data as Profile;
}

async function checkExistingApplication(userId: string, jobId: string) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
        .from("applications")
        .select("id, status")
        .eq("job_seeker_id", userId)
        .eq("job_id", jobId)
        .maybeSingle();

    return data as { id: string; status: string } | null;
}

export default async function JobDetailPage({ 
    params 
}: { 
    params: Promise<{ id: string }> | { id: string } 
}) {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/");
    }

    // Handle params as Promise (Next.js 15) or object (Next.js 14)
    const resolvedParams = params instanceof Promise ? await params : params;
    const jobId = resolvedParams.id;

    const [job, profile, existingApplication] = await Promise.all([
        getJob(jobId),
        getUserProfile(user.id),
        checkExistingApplication(user.id, jobId),
    ]);

    if (!job) {
        notFound();
    }

    // Cek apakah lowongan sudah ditutup
    if (job.is_closed) {
        notFound();
    }

    // Ambil living cost: prioritas dari living_cost_id, jika tidak ada ambil berdasarkan kota
    let livingCost = job.living_cost_id
        ? await getLivingCost(job.living_cost_id)
        : null;
    
    // Jika tidak ada living_cost_id, coba ambil berdasarkan kota perusahaan
    // Coba dari location_city job listing dulu, lalu dari companies table
    if (!livingCost) {
        if (job.location_city) {
            livingCost = await getLivingCostByCity(job.location_city);
        }
        
        // Jika masih tidak ada, coba ambil dari companies table
        if (!livingCost && job.company_name) {
            const { data: companyData } = await supabase
                .from("companies")
                .select("location_city")
                .eq("name", job.company_name)
                .maybeSingle();
            
            if (companyData && (companyData as any).location_city) {
                livingCost = await getLivingCostByCity((companyData as any).location_city);
            }
        }
    }

    const matchScore = profile
        ? calculateMatchScore(
              profile.skills || [],
              job.skills_required,
              profile.major || null,
              job.major_required || null
          )
        : 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" asChild className="hover:bg-gray-50 transition-all border-gray-300">
                    <Link href="/job-seeker/jobs">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Kembali
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-semibold text-gray-900">{job.title}</h1>
                    <p className="text-gray-500 mt-1">{job.company_name}</p>
                </div>
                {matchScore > 0 && (
                    <Badge variant={matchScore >= 50 ? "default" : "secondary"}>
                        {matchScore}% Match
                    </Badge>
                )}
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
                        </CardContent>
                    </Card>

                    {livingCost && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Biaya Hidup di {livingCost.city}</CardTitle>
                                <CardDescription>
                                    Estimasi biaya hidup per bulan
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {livingCost.avg_rent && (
                                    <div>
                                        <p className="text-sm text-gray-500 flex items-center gap-2">
                                            <Home className="h-4 w-4" />
                                            Rata-rata Sewa
                                        </p>
                                        <p className="font-medium mt-1">
                                            {formatCurrency(livingCost.avg_rent)}
                                        </p>
                                    </div>
                                )}
                                {livingCost.avg_food && (
                                    <div>
                                        <p className="text-sm text-gray-500 flex items-center gap-2">
                                            <Utensils className="h-4 w-4" />
                                            Rata-rata Makan
                                        </p>
                                        <p className="font-medium mt-1">
                                            {formatCurrency(livingCost.avg_food)}
                                        </p>
                                    </div>
                                )}
                                {livingCost.avg_transport && (
                                    <div>
                                        <p className="text-sm text-gray-500 flex items-center gap-2">
                                            <Car className="h-4 w-4" />
                                            Rata-rata Transport
                                        </p>
                                        <p className="font-medium mt-1">
                                            {formatCurrency(livingCost.avg_transport)}
                                        </p>
                                    </div>
                                )}
                                {livingCost.salary_reference && (
                                    <div>
                                        <p className="text-sm text-gray-500">Gaji Referensi</p>
                                        <p className="font-medium mt-1">
                                            {formatCurrency(livingCost.salary_reference)}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {!livingCost && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Biaya Hidup</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-500">
                                    Data biaya hidup untuk daerah ini belum tersedia
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardContent className="pt-6">
                            {existingApplication ? (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-500">
                                        Anda sudah melamar untuk posisi ini
                                    </p>
                                    <Badge variant="outline">
                                        Status: {existingApplication.status}
                                    </Badge>
                                    <Button variant="outline" className="w-full" asChild>
                                        <Link href="/job-seeker/applications">
                                            Lihat Status Lamaran
                                        </Link>
                                    </Button>
                                </div>
                            ) : (
                                <Button className="w-full" size="lg" asChild>
                                    <Link href={`/job-seeker/jobs/${job.id}/apply`}>
                                        Lamar Sekarang
                                    </Link>
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

