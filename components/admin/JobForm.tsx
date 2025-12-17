'use client';

import { useState } from "react";
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
import { toast } from "sonner";
import { createBrowserClient } from "@/lib/supabase/client";
import type { EmploymentType, JobCategory, JobLevel, JobListing } from "@/lib/types";
import { Loader2 } from "lucide-react";

interface JobFormProps {
    initialData?: any;
    jobId?: string;
}

export function JobForm({ initialData, jobId }: JobFormProps) {
    const router = useRouter();
    const supabase = createBrowserClient();
    const [isLoading, setIsLoading] = useState(false);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const jobData = {
                title: formData.title,
                company_name: formData.company_name,
                location_city: formData.location_city,
                location_province: formData.location_province || null,
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
            };

            if (jobId) {
                const { error } = await (supabase
                    .from("job_listings") as any)
                    .update(jobData)
                    .eq("id", jobId);

                if (error) throw error;
                toast.success("Lowongan berhasil diperbarui");
            } else {
                const { error } = await (supabase
                    .from("job_listings") as any)
                    .insert([jobData]);

                if (error) throw error;
                toast.success("Lowongan berhasil ditambahkan");
            }

            router.push("/admin/jobs");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan saat menyimpan lowongan");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-semibold text-gray-700">Judul Lowongan <span className="text-sm text-red-700">*</span></Label>
                    <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="company_name" className="text-sm font-semibold text-gray-700">Nama Perusahaan <span className="text-sm text-red-700">*</span></Label>
                    <Input
                        id="company_name"
                        value={formData.company_name}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                        required
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="location_city" className="text-sm font-semibold text-gray-700">Kota <span className="text-sm text-red-700">*</span></Label>
                    <Input
                        id="location_city"
                        value={formData.location_city}
                        onChange={(e) => setFormData({ ...formData, location_city: e.target.value })}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="location_province" className="text-sm font-semibold text-gray-700">Provinsi <span className="text-sm text-red-700">*</span></Label>
                    <Input
                        id="location_province"
                        value={formData.location_province}
                        onChange={(e) => setFormData({ ...formData, location_province: e.target.value })}
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                    <Label htmlFor="employment_type" className="text-sm font-semibold text-gray-700">Tipe Pekerjaan <span className="text-sm text-red-700">*</span></Label>
                    <Select
                        value={formData.employment_type}
                        onValueChange={(value) => setFormData({ ...formData, employment_type: value as EmploymentType })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white text-sm text-black">
                            <SelectItem value="fulltime" className="text-sm text-black hover:bg-gray-100">Full Time</SelectItem>
                            <SelectItem value="parttime" className="text-sm text-black hover:bg-gray-100">Part Time</SelectItem>
                            <SelectItem value="contract" className="text-sm text-black hover:bg-gray-100">Contract</SelectItem>
                            <SelectItem value="internship" className="text-sm text-black hover:bg-gray-100">Internship</SelectItem>
                            <SelectItem value="remote" className="text-sm text-black hover:bg-gray-100">Remote</SelectItem>
                            <SelectItem value="hybrid" className="text-sm text-black hover:bg-gray-100">Hybrid</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="min_salary" className="text-sm font-semibold text-gray-700">Gaji Minimum</Label>
                    <Input
                        id="min_salary"
                        type="number"
                        value={formData.min_salary}
                        onChange={(e) => setFormData({ ...formData, min_salary: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="max_salary" className="text-sm font-semibold text-gray-700">Gaji Maksimum</Label>
                    <Input
                        id="max_salary"
                        type="number"
                        value={formData.max_salary}
                        onChange={(e) => setFormData({ ...formData, max_salary: e.target.value })}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-gray-700">Deskripsi Pekerjaan</Label>
                <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={5}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="requirements" className="text-sm font-semibold text-gray-700">Persyaratan (satu per baris)</Label>
                <Textarea
                    id="requirements"
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    rows={4}
                    placeholder="Contoh:&#10;3+ tahun pengalaman&#10;Menguasai React&#10;Portfolio yang kuat"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="skills_required" className="text-sm font-semibold text-gray-700">Skills yang Diperlukan (pisahkan dengan koma)</Label>
                <Input
                    id="skills_required"
                    value={formData.skills_required}
                    onChange={(e) => setFormData({ ...formData, skills_required: e.target.value })}
                    placeholder="Contoh: React, TypeScript, UI/UX"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="major_required" className="text-sm font-semibold text-gray-700">Jurusan yang Diperlukan (opsional)</Label>
                <Input
                    id="major_required"
                    value={formData.major_required}
                    onChange={(e) => setFormData({ ...formData, major_required: e.target.value })}
                    placeholder="Contoh: Teknik Informatika, Sistem Informasi, dll"
                />
                <p className="text-sm text-gray-500">
                    Jurusan yang dibutuhkan untuk posisi ini (opsional)
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm font-semibold text-gray-700">Kategori <span className="text-sm text-red-700">*</span></Label>
                    <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value as JobCategory })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white text-sm text-black">
                            <SelectItem value="Technology" className="text-sm text-black hover:bg-gray-100">Technology</SelectItem>
                            <SelectItem value="Design" className="text-sm text-black hover:bg-gray-100">Design</SelectItem>
                            <SelectItem value="Marketing" className="text-sm text-black hover:bg-gray-100">Marketing</SelectItem>
                            <SelectItem value="Business" className="text-sm text-black hover:bg-gray-100">Business</SelectItem>
                            <SelectItem value="Finance" className="text-sm text-black hover:bg-gray-100">Finance</SelectItem>
                            <SelectItem value="Healthcare" className="text-sm text-black hover:bg-gray-100">Healthcare</SelectItem>
                            <SelectItem value="Education" className="text-sm text-black hover:bg-gray-100">Education</SelectItem>
                            <SelectItem value="Other" className="text-sm text-black hover:bg-gray-100">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="job_level" className="text-sm font-semibold text-gray-700">Level Pekerjaan <span className="text-sm text-red-700">*</span></Label>
                    <Select
                        value={formData.job_level}
                        onValueChange={(value) => setFormData({ ...formData, job_level: value as JobLevel })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white text-sm text-black">
                            <SelectItem value="Entry Level" className="text-sm text-black hover:bg-gray-100">Entry Level</SelectItem>
                            <SelectItem value="Mid Level" className="text-sm text-black hover:bg-gray-100">Mid Level</SelectItem>
                            <SelectItem value="Senior Level" className="text-sm text-black hover:bg-gray-100">Senior Level</SelectItem>
                            <SelectItem value="Executive" className="text-sm text-black hover:bg-gray-100">Executive</SelectItem>
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
                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                    onClick={() => router.push("/admin/jobs")}
                    className="hover:bg-gray-500 text-gray-700 border-0 bg-gray-400 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                    disabled={isLoading}
                >
                    Batal
                </Button>
            </div>
        </form>
    );
}

