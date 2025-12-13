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

interface RecruiterJobFormProps {
    initialData?: any;
    jobId?: string;
}

export function RecruiterJobForm({ initialData, jobId }: RecruiterJobFormProps) {
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
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                throw new Error("User not authenticated");
            }

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
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="title">Judul Lowongan *</Label>
                    <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="company_name">Nama Perusahaan *</Label>
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
                    <Label htmlFor="location_city">Kota *</Label>
                    <Input
                        id="location_city"
                        value={formData.location_city}
                        onChange={(e) => setFormData({ ...formData, location_city: e.target.value })}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="location_province">Provinsi</Label>
                    <Input
                        id="location_province"
                        value={formData.location_province}
                        onChange={(e) => setFormData({ ...formData, location_province: e.target.value })}
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                    <Label htmlFor="employment_type">Tipe Pekerjaan *</Label>
                    <Select
                        value={formData.employment_type}
                        onValueChange={(value) => setFormData({ ...formData, employment_type: value as EmploymentType })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="fulltime">Full Time</SelectItem>
                            <SelectItem value="parttime">Part Time</SelectItem>
                            <SelectItem value="contract">Contract</SelectItem>
                            <SelectItem value="internship">Internship</SelectItem>
                            <SelectItem value="remote">Remote</SelectItem>
                            <SelectItem value="hybrid">Hybrid</SelectItem>
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
                    <Label htmlFor="category">Kategori *</Label>
                    <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value as JobCategory })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Technology">Technology</SelectItem>
                            <SelectItem value="Design">Design</SelectItem>
                            <SelectItem value="Marketing">Marketing</SelectItem>
                            <SelectItem value="Business">Business</SelectItem>
                            <SelectItem value="Finance">Finance</SelectItem>
                            <SelectItem value="Healthcare">Healthcare</SelectItem>
                            <SelectItem value="Education">Education</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="job_level">Level Pekerjaan *</Label>
                    <Select
                        value={formData.job_level}
                        onValueChange={(value) => setFormData({ ...formData, job_level: value as JobLevel })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Entry Level">Entry Level</SelectItem>
                            <SelectItem value="Mid Level">Mid Level</SelectItem>
                            <SelectItem value="Senior Level">Senior Level</SelectItem>
                            <SelectItem value="Executive">Executive</SelectItem>
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
                <Button type="submit" disabled={isLoading}>
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
                >
                    Batal
                </Button>
            </div>
        </form>
    );
}

