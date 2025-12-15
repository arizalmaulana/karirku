'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { AlertCircle, Building2 } from "lucide-react";
import { toast } from "sonner";
import { createBrowserClient } from "@/lib/supabase/client";
import type { EmploymentType, JobCategory, JobLevel, JobListing } from "@/lib/types";
import { Loader2 } from "lucide-react";
import Link from "next/link";

interface RecruiterJobFormProps {
    initialData?: any;
    jobId?: string;
}

export function RecruiterJobForm({ initialData, jobId }: RecruiterJobFormProps) {
    const router = useRouter();
    const supabase = createBrowserClient();
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingCompany, setIsLoadingCompany] = useState(true);
    const [companyProfile, setCompanyProfile] = useState<any>(null);
    
    const [formData, setFormData] = useState({
        title: initialData?.title || "",
        company_name: initialData?.company_name || "",
        location_city: initialData?.location_city || "",
        location_province: initialData?.location_province || "",
        employment_type: (initialData?.employment_type || "fulltime") as EmploymentType,
        min_salary: initialData?.min_salary?.toString() || "",
        max_salary: initialData?.max_salary?.toString() || "",
        currency: initialData?.currency || "IDR",
        description: initialData?.description || "",
        requirements: initialData?.requirements?.join("\n") || "",
        skills_required: initialData?.skills_required?.join(", ") || "",
        major_required: initialData?.major_required || "",
        category: (initialData?.category || "Technology") as JobCategory,
        job_level: (initialData?.job_level || "Mid Level") as JobLevel,
        featured: initialData?.featured || false,
    });

    // Load company profile on mount
    useEffect(() => {
        async function loadCompanyProfile() {
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser();

                if (!user) return;

                const { data: company, error } = await supabase
                    .from("companies")
                    .select("*")
                    .eq("recruiter_id", user.id)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error("Error fetching company:", error);
                } else if (company) {
                    setCompanyProfile(company);
                    // Auto-fill from company profile if not editing existing job
                    if (!jobId && !initialData) {
                        setFormData(prev => ({
                            ...prev,
                            company_name: company.name || prev.company_name,
                            location_city: company.location_city || prev.location_city,
                            location_province: company.location_province || prev.location_province,
                        }));
                    }
                }
            } catch (error) {
                console.error("Error loading company profile:", error);
            } finally {
                setIsLoadingCompany(false);
            }
        }

        loadCompanyProfile();
    }, [supabase, jobId, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                throw new Error("User not authenticated");
            }

            // Validasi: Cek apakah company profile sudah lengkap dan approved
            if (!companyProfile) {
                toast.error("Anda harus melengkapi profile perusahaan terlebih dahulu sebelum menambah lowongan.");
                setIsLoading(false);
                router.push("/recruiter/company/profile");
                return;
            }

            // Cek apakah profile lengkap (minimal ada name dan license_url)
            const hasName = !!companyProfile.name && companyProfile.name.trim().length > 0;
            const hasLicense = !!companyProfile.license_url && companyProfile.license_url.trim().length > 0;

            if (!hasName || !hasLicense) {
                toast.error("Profile perusahaan belum lengkap. Pastikan nama perusahaan dan surat izin sudah diisi.");
                setIsLoading(false);
                router.push("/recruiter/company/profile");
                return;
            }

            // Cek apakah sudah disetujui admin
            if (companyProfile.is_approved !== true || companyProfile.status !== 'approved') {
                const status = companyProfile.status || 'pending';
                if (status === 'rejected') {
                    toast.error("Profile perusahaan Anda ditolak oleh admin. Silakan perbaiki dan kirim ulang untuk persetujuan.");
                } else {
                    toast.error("Profile perusahaan Anda sedang menunggu persetujuan admin. Anda belum dapat menambah lowongan sampai profile disetujui.");
                }
                setIsLoading(false);
                router.push("/recruiter/company/profile");
                return;
            }

            // Use company profile data if creating new job and company profile exists
            // Otherwise use form data (for editing or if no company profile)
            let companyName = formData.company_name;
            let locationCity = formData.location_city;
            let locationProvince = formData.location_province;

            // Only use company profile data when creating new job (not editing)
            if (!jobId && companyProfile) {
                companyName = companyProfile.name || formData.company_name;
                locationCity = companyProfile.location_city || formData.location_city;
                locationProvince = companyProfile.location_province || formData.location_province;
            }

            if (!companyName || !locationCity) {
                toast.error("Nama perusahaan dan kota wajib diisi. Lengkapi profile perusahaan terlebih dahulu.");
                setIsLoading(false);
                return;
            }

            const jobData = {
                title: formData.title,
                company_name: companyName,
                location_city: locationCity,
                location_province: locationProvince || null,
                employment_type: formData.employment_type,
                min_salary: formData.min_salary ? parseInt(formData.min_salary) : null,
                max_salary: formData.max_salary ? parseInt(formData.max_salary) : null,
                currency: formData.currency,
                description: formData.description || null,
                requirements: formData.requirements
                    ? formData.requirements.split("\n").filter((r: string) => r.trim())
                    : null,
                skills_required: formData.skills_required
                    ? formData.skills_required.split(",").map((s: string) => s.trim()).filter((s: string) => s)
                    : null,
                major_required: formData.major_required || null,
                category: formData.category || null,
                job_level: formData.job_level || null,
                featured: formData.featured,
                recruiter_id: user.id,
            };

            if (jobId) {
                const { error } = await (supabase
                    .from("job_listings") as any)
                    .update(jobData)
                    .eq("id", jobId)
                    .eq("recruiter_id", user.id);

                if (error) throw error;
                toast.success("Lowongan berhasil diperbarui");
            } else {
                const { error } = await (supabase
                    .from("job_listings") as any)
                    .insert([jobData]);

                if (error) throw error;
                toast.success("Lowongan berhasil ditambahkan");
            }

            router.push("/recruiter/jobs");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan saat menyimpan lowongan");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Warning jika belum ada company profile */}
            {!isLoadingCompany && !companyProfile && !jobId && (
                <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-amber-900 mb-1">
                                    Profile Perusahaan Belum Dilengkapi
                                </p>
                                <p className="text-sm text-amber-700 mb-3">
                                    Anda harus melengkapi profile perusahaan terlebih dahulu sebelum dapat menambah lowongan baru.
                                </p>
                                <Button variant="outline" size="sm" asChild className="border-amber-300 text-amber-700 hover:bg-amber-100">
                                    <Link href="/recruiter/company/profile">
                                        <Building2 className="h-4 w-4 mr-2" />
                                        Lengkapi Profile Perusahaan
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Warning jika company profile belum lengkap atau belum approved */}
            {!isLoadingCompany && companyProfile && !jobId && (
                <>
                    {/* Cek apakah profile lengkap */}
                    {(!companyProfile.name || !companyProfile.license_url) && (
                        <Card className="border-red-200 bg-red-50">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-red-900 mb-1">
                                            Profile Perusahaan Belum Lengkap
                                        </p>
                                        <p className="text-sm text-red-700 mb-3">
                                            Profile perusahaan Anda belum lengkap. Pastikan nama perusahaan dan surat izin sudah diisi sebelum menambah lowongan.
                                        </p>
                                        <Button variant="outline" size="sm" asChild className="border-red-300 text-red-700 hover:bg-red-100">
                                            <Link href="/recruiter/company/profile">
                                                <Building2 className="h-4 w-4 mr-2" />
                                                Lengkapi Profile Perusahaan
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Cek apakah sudah approved */}
                    {companyProfile.name && companyProfile.license_url && 
                     (companyProfile.is_approved !== true || companyProfile.status !== 'approved') && (
                        <Card className={`border-2 ${companyProfile.status === 'rejected' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}>
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className={`h-5 w-5 mt-0.5 ${companyProfile.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'}`} />
                                    <div className="flex-1">
                                        <p className={`text-sm font-medium mb-1 ${companyProfile.status === 'rejected' ? 'text-red-900' : 'text-yellow-900'}`}>
                                            {companyProfile.status === 'rejected' 
                                                ? 'Profile Perusahaan Ditolak' 
                                                : 'Menunggu Persetujuan Admin'}
                                        </p>
                                        <p className={`text-sm mb-3 ${companyProfile.status === 'rejected' ? 'text-red-700' : 'text-yellow-700'}`}>
                                            {companyProfile.status === 'rejected'
                                                ? 'Profile perusahaan Anda ditolak oleh admin. Silakan perbaiki dan kirim ulang untuk persetujuan sebelum dapat menambah lowongan.'
                                                : 'Profile perusahaan Anda sedang menunggu persetujuan admin. Anda belum dapat menambah lowongan sampai profile disetujui.'}
                                        </p>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            asChild 
                                            className={companyProfile.status === 'rejected' 
                                                ? 'border-red-300 text-red-700 hover:bg-red-100' 
                                                : 'border-yellow-300 text-yellow-700 hover:bg-yellow-100'}
                                        >
                                            <Link href="/recruiter/company/profile">
                                                <Building2 className="h-4 w-4 mr-2" />
                                                {companyProfile.status === 'rejected' ? 'Perbaiki Profile Perusahaan' : 'Lihat Profile Perusahaan'}
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Info jika sudah approved */}
                    {companyProfile.name && companyProfile.license_url && 
                     companyProfile.is_approved === true && companyProfile.status === 'approved' && (
                        <Card className="border-green-200 bg-green-50">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-3">
                                    <Building2 className="h-5 w-5 text-green-600 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-green-900 mb-1">
                                            Menggunakan Data dari Profile Perusahaan
                                        </p>
                                        <p className="text-sm text-green-700">
                                            Nama perusahaan dan lokasi akan diambil dari profile perusahaan Anda: <strong>{companyProfile.name}</strong>
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}

                <div className="space-y-2">
                    <Label htmlFor="title">Judul Lowongan <span className="text-red-500">*</span></Label>
                    <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Contoh: Frontend Developer, Product Manager, dll"
                        required
                    />
                </div>

            {/* Company name - auto-filled dari company profile */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="company_name">
                        Nama Perusahaan <span className="text-red-500">*</span>
                        {companyProfile && (
                            <span className="text-xs text-gray-500 ml-2">(dari profile perusahaan)</span>
                        )}
                    </Label>
                    <Input
                        id="company_name"
                        value={formData.company_name}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                        disabled={!!companyProfile && !jobId}
                        className={companyProfile && !jobId ? "bg-gray-100" : ""}
                        required
                    />
                    {companyProfile && !jobId && (
                        <p className="text-xs text-gray-500">
                            Data diambil dari profile perusahaan. Untuk mengubah, edit di{" "}
                            <Link href="/recruiter/company/profile" className="text-blue-600 hover:underline">
                                Profile Perusahaan
                            </Link>
                        </p>
                    )}
            </div>

                <div className="space-y-2">
                    <Label htmlFor="location_city">
                        Kota <span className="text-red-500">*</span>
                        {companyProfile && (
                            <span className="text-xs text-gray-500 ml-2">(dari profile perusahaan)</span>
                        )}
                    </Label>
                    <Input
                        id="location_city"
                        value={formData.location_city}
                        onChange={(e) => setFormData({ ...formData, location_city: e.target.value })}
                        disabled={!!companyProfile && !jobId}
                        className={companyProfile && !jobId ? "bg-gray-100" : ""}
                        required
                    />
                </div>
                </div>

                <div className="space-y-2">
                <Label htmlFor="location_province">
                    Provinsi
                    {companyProfile && (
                        <span className="text-xs text-gray-500 ml-2">(dari profile perusahaan)</span>
                    )}
                </Label>
                    <Input
                        id="location_province"
                        value={formData.location_province}
                        onChange={(e) => setFormData({ ...formData, location_province: e.target.value })}
                    disabled={!!companyProfile && !jobId}
                    className={companyProfile && !jobId ? "bg-gray-100" : ""}
                    />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                    <Label htmlFor="employment_type">Tipe Pekerjaan <span className="text-red-500">*</span></Label>
                    <Select
                        value={formData.employment_type}
                        onValueChange={(value) => setFormData({ ...formData, employment_type: value as EmploymentType })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="!bg-white text-black border border-gray-200">
                            <SelectItem value="fulltime" className="!bg-white text-black hover:bg-gray-100">Full Time</SelectItem>
                            <SelectItem value="parttime" className="!bg-white text-black hover:bg-gray-100">Part Time</SelectItem>
                            <SelectItem value="contract" className="!bg-white text-black hover:bg-gray-100">Contract</SelectItem>
                            <SelectItem value="internship" className="!bg-white text-black hover:bg-gray-100">Internship</SelectItem>
                            <SelectItem value="remote" className="!bg-white text-black hover:bg-gray-100">Remote</SelectItem>
                            <SelectItem value="hybrid" className="!bg-white text-black hover:bg-gray-100">Hybrid</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="min_salary">Gaji Minimum</Label>
                    <Input
                        id="min_salary"
                        type="number"
                        value={formData.min_salary}
                        onChange={(e) => setFormData({ ...formData, min_salary: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="max_salary">Gaji Maksimum</Label>
                    <Input
                        id="max_salary"
                        type="number"
                        value={formData.max_salary}
                        onChange={(e) => setFormData({ ...formData, max_salary: e.target.value })}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Deskripsi Pekerjaan</Label>
                <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={5}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="requirements">Persyaratan (satu per baris)</Label>
                <Textarea
                    id="requirements"
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    rows={4}
                    placeholder="Contoh:&#10;3+ tahun pengalaman&#10;Menguasai React&#10;Portfolio yang kuat"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="skills_required">Skills yang Diperlukan (pisahkan dengan koma)</Label>
                <Input
                    id="skills_required"
                    value={formData.skills_required}
                    onChange={(e) => setFormData({ ...formData, skills_required: e.target.value })}
                    placeholder="Contoh: React, TypeScript, UI/UX"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="major_required">Jurusan yang Diperlukan (opsional)</Label>
                <Input
                    id="major_required"
                    value={formData.major_required}
                    onChange={(e) => setFormData({ ...formData, major_required: e.target.value })}
                    placeholder="Contoh: Teknik Informatika, Sistem Informasi, dll"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="category">Kategori <span className="text-red-500">*</span></Label>
                    <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value as JobCategory })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="!bg-white text-black border border-gray-200">
                            <SelectItem value="Technology" className="!bg-white text-black hover:bg-gray-100">Technology</SelectItem>
                            <SelectItem value="Design" className="!bg-white text-black hover:bg-gray-100">Design</SelectItem>
                            <SelectItem value="Marketing" className="!bg-white text-black hover:bg-gray-100">Marketing</SelectItem>
                            <SelectItem value="Business" className="!bg-white text-black hover:bg-gray-100">Business</SelectItem>
                            <SelectItem value="Finance" className="!bg-white text-black hover:bg-gray-100">Finance</SelectItem>
                            <SelectItem value="Healthcare" className="!bg-white text-black hover:bg-gray-100">Healthcare</SelectItem>
                            <SelectItem value="Education" className="!bg-white text-black hover:bg-gray-100">Education</SelectItem>
                            <SelectItem value="Other" className="!bg-white text-black hover:bg-gray-100">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="job_level">Level Pekerjaan <span className="text-red-500">*</span></Label>
                    <Select
                        value={formData.job_level}
                        onValueChange={(value) => setFormData({ ...formData, job_level: value as JobLevel })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="!bg-white text-black border border-gray-200">
                            <SelectItem value="Entry Level" className="!bg-white text-black hover:bg-gray-100">Entry Level</SelectItem>
                            <SelectItem value="Mid Level" className="!bg-white text-black hover:bg-gray-100">Mid Level</SelectItem>
                            <SelectItem value="Senior Level" className="!bg-white text-black hover:bg-gray-100">Senior Level</SelectItem>
                            <SelectItem value="Executive" className="!bg-white text-black hover:bg-gray-100">Executive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <Checkbox
                    id="featured"
                    checked={formData.featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, featured: checked as boolean })}
                />
                <Label htmlFor="featured" className="cursor-pointer">
                    Tandai sebagai Featured
                </Label>
            </div>

            <div className="flex gap-4">
                <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-purple-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Menyimpan...
                        </>
                    ) : (
                        jobId ? "Perbarui Lowongan" : "Tambah Lowongan"
                    )}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/recruiter/jobs")}
                    className="hover:bg-gray-50 transition-all"
                >
                    Batal
                </Button>
            </div>
        </form>
    );
}

