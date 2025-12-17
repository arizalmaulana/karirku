'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Loader2, X } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Profile, JobListing } from "@/lib/types";

interface ApplicationFormPageProps {
    job: JobListing;
    profile?: Profile | null;
}

interface FormData {
    namaLengkap: string;
    email: string;
    nomorTelepon: string;
    domisili: string;
    pendidikanTerakhir: string;
    pengalamanKerja: string;
    skill: string;
    portfolio: string;
    cvFile: File | null;
    dokumenTambahan: File | null;
}

export function ApplicationFormPage({ job, profile }: ApplicationFormPageProps) {
    const router = useRouter();
    const [formData, setFormData] = useState<FormData>({
        namaLengkap: "",
        email: "",
        nomorTelepon: "",
        domisili: "",
        pendidikanTerakhir: "",
        pengalamanKerja: "",
        skill: "",
        portfolio: "",
        cvFile: null,
        dokumenTambahan: null,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const hasAutoFilled = useRef(false);
    const supabase = createBrowserClient();

    // Auto-fill form from profile when component mounts (only once)
    useEffect(() => {
        if (profile && !hasAutoFilled.current) {
            hasAutoFilled.current = true; // Set immediately to prevent double execution
            
            const autoFill = async () => {
                const { data: { user } } = await supabase.auth.getUser();
                
                // Map education to dropdown values
                const mapEducation = (edu: string | null | undefined): string => {
                    if (!edu) return "";
                    const eduLower = edu.toLowerCase();
                    if (eduLower.includes("sma") || eduLower.includes("smk")) return "SMA/SMK";
                    if (eduLower.includes("d3") || eduLower.includes("diploma")) return "D3";
                    if (eduLower.includes("s1") || eduLower.includes("sarjana") || eduLower.includes("strata 1")) return "S1";
                    if (eduLower.includes("s2") || eduLower.includes("magister") || eduLower.includes("strata 2")) return "S2";
                    // Default to S1 if major exists
                    return profile.major ? "S1" : "";
                };

                setFormData(prev => ({
                    ...prev,
                    namaLengkap: profile.full_name || prev.namaLengkap,
                    email: user?.email || prev.email,
                    nomorTelepon: profile.phone || prev.nomorTelepon,
                    domisili: profile.location_city || prev.domisili,
                    pendidikanTerakhir: mapEducation(profile.education) || prev.pendidikanTerakhir,
                    pengalamanKerja: profile.experience || prev.pengalamanKerja,
                    skill: profile.skills ? profile.skills.join(", ") : prev.skill,
                    portfolio: prev.portfolio,
                }));
                
                toast.success("Form diisi otomatis dari profil Anda");
            };
            
            autoFill();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile?.id]); // Only depend on profile.id to prevent re-runs

    const handleFileChange = (field: "cvFile" | "dokumenTambahan", file: File | null) => {
        if (!file) {
            setFormData((prev) => ({ ...prev, [field]: null }));
            return;
        }

        // Validate CV file (PDF, max 5MB)
        if (field === "cvFile") {
            if (file.type !== "application/pdf") {
                toast.error("CV harus dalam format PDF");
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Ukuran CV maksimal 5MB");
                return;
            }
        }

        // Validate additional document (PDF/JPG)
        if (field === "dokumenTambahan") {
            const validTypes = ["application/pdf", "image/jpeg", "image/jpg"];
            if (!validTypes.includes(file.type)) {
                toast.error("Dokumen tambahan harus PDF atau JPG");
                return;
            }
        }

        setFormData((prev) => ({ ...prev, [field]: file }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.cvFile) {
            toast.error("CV wajib diupload");
            return;
        }

        setIsSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                toast.error("Anda harus login untuk melamar");
                router.push("/");
                return;
            }

            // Upload CV file to applications bucket
            let cvUrl: string | null = null;
            const cvFileName = `cv_${user.id}_${Date.now()}.pdf`;
            const { data: cvData, error: cvError } = await supabase.storage
                .from("applications")
                .upload(cvFileName, formData.cvFile, {
                    cacheControl: "3600",
                    upsert: false,
                });

            if (cvError) {
                throw new Error(`Gagal upload CV: ${cvError.message}`);
            }

            const { data: cvPublicData } = supabase.storage
                .from("applications")
                .getPublicUrl(cvFileName);

            cvUrl = cvPublicData.publicUrl;

            // Upload additional document if provided
            let docUrl: string | null = null;
            if (formData.dokumenTambahan) {
                const docFileName = `doc_${user.id}_${Date.now()}.${formData.dokumenTambahan.type.includes("pdf") ? "pdf" : "jpg"}`;
                const { data: docData, error: docError } = await supabase.storage
                    .from("applications")
                    .upload(docFileName, formData.dokumenTambahan, {
                        cacheControl: "3600",
                        upsert: false,
                    });

                if (docError) {
                    console.error("Error uploading additional document:", docError);
                    // Don't fail the whole submission if additional doc fails
                } else {
                    const { data: docPublicData } = supabase.storage
                        .from("applications")
                        .getPublicUrl(docFileName);
                    docUrl = docPublicData.publicUrl;
                }
            }

            // Prepare application data
            const applicationData = {
                job_id: job.id,
                job_seeker_id: user.id,
                status: "submitted" as const,
                cv_url: cvUrl,
                portfolio_url: formData.portfolio || null,
                cover_letter: JSON.stringify({
                    namaLengkap: formData.namaLengkap,
                    email: formData.email,
                    nomorTelepon: formData.nomorTelepon,
                    domisili: formData.domisili,
                    pendidikanTerakhir: formData.pendidikanTerakhir,
                    pengalamanKerja: formData.pengalamanKerja,
                    skill: formData.skill,
                    dokumenTambahan: docUrl,
                }),
            };

            // Save application to database
            const { error: insertError } = await supabase
                .from("applications")
                .insert([applicationData] as any);

            if (insertError) {
                console.error("Database insert error:", insertError);
                toast.error(`Gagal menyimpan lamaran: ${insertError.message}`);
                setIsSubmitting(false);
                return;
            }

            router.push("/job-seeker/applications");
        } catch (error: any) {
            console.error("Error submitting application:", error);
            toast.error(error.message || "Gagal mengirim lamaran. Silakan coba lagi.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nama Lengkap */}
            <div className="space-y-2">
                <Label htmlFor="namaLengkap">
                    Nama Lengkap <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="namaLengkap"
                    value={formData.namaLengkap}
                    onChange={(e) => setFormData({ ...formData, namaLengkap: e.target.value })}
                    required
                    className="border border-gray-200/40"
                />
            </div>

            {/* Email */}
            <div className="space-y-2">
                <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="border border-gray-200/40"
                />
            </div>

            {/* Nomor Telepon */}
            <div className="space-y-2">
                <Label htmlFor="nomorTelepon">
                    Nomor Telepon <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="nomorTelepon"
                    type="tel"
                    value={formData.nomorTelepon}
                    onChange={(e) => setFormData({ ...formData, nomorTelepon: e.target.value })}
                    required
                    className="border border-gray-200/40"
                />
            </div>

            {/* Domisili */}
            <div className="space-y-2">
                <Label htmlFor="domisili">
                    Domisili <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="domisili"
                    value={formData.domisili}
                    onChange={(e) => setFormData({ ...formData, domisili: e.target.value })}
                    required
                    className="border border-gray-200/40"
                />
            </div>

            {/* Pendidikan Terakhir */}
            <div className="space-y-2">
                <Label htmlFor="pendidikanTerakhir">
                    Pendidikan Terakhir <span className="text-red-500">*</span>
                </Label>
                <Select
                    value={formData.pendidikanTerakhir}
                    onValueChange={(value) => setFormData({ ...formData, pendidikanTerakhir: value })}
                    required
                >
                    <SelectTrigger 
                        id="pendidikanTerakhir"
                        className="w-full border border-gray-200/40"
                    >
                        <SelectValue placeholder="Pilih pendidikan terakhir" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="SMA/SMK">SMA/SMK</SelectItem>
                        <SelectItem value="D3">D3</SelectItem>
                        <SelectItem value="S1">S1</SelectItem>
                        <SelectItem value="S2">S2</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Pengalaman Kerja */}
            <div className="space-y-2">
                <Label htmlFor="pengalamanKerja">
                    Pengalaman Kerja <span className="text-red-500">*</span>
                </Label>
                <Textarea
                    id="pengalamanKerja"
                    value={formData.pengalamanKerja}
                    onChange={(e) => setFormData({ ...formData, pengalamanKerja: e.target.value })}
                    rows={4}
                    required
                    className="border border-gray-200/40"
                />
            </div>

            {/* Skill */}
            <div className="space-y-2">
                <Label htmlFor="skill">
                    Skill <span className="text-red-500">*</span>
                </Label>
                <Textarea
                    id="skill"
                    value={formData.skill}
                    onChange={(e) => setFormData({ ...formData, skill: e.target.value })}
                    rows={3}
                    placeholder="Pisahkan setiap skill dengan koma"
                    required
                    className="border border-gray-200/40"
                />
            </div>

            {/* Portfolio */}
            <div className="space-y-2">
                <Label htmlFor="portfolio">Portfolio (Link) - Opsional</Label>
                <Input
                    id="portfolio"
                    type="url"
                    value={formData.portfolio}
                    onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                    placeholder="https://..."
                    className="border border-gray-200/40"
                />
            </div>

            {/* Upload CV */}
            <div className="space-y-2">
                <Label htmlFor="cvFile">
                    Upload CV (PDF, maks 5MB) <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-2">
                    <Input
                        id="cvFile"
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileChange("cvFile", e.target.files?.[0] || null)}
                        className="hidden"
                    />
                    <label
                        htmlFor="cvFile"
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200/40 rounded-md cursor-pointer hover:bg-gray-50"
                    >
                        <Upload className="w-4 h-4" />
                        {formData.cvFile ? formData.cvFile.name : "Pilih File CV"}
                    </label>
                    {formData.cvFile && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FileText className="w-4 h-4" />
                            <span>{(formData.cvFile.size / 1024 / 1024).toFixed(2)} MB</span>
                            <button
                                type="button"
                                onClick={() => handleFileChange("cvFile", null)}
                                className="text-red-500"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
                <Button
                    type="submit"
                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:shadow-lg transition-all"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Mengirim...
                        </>
                    ) : (
                        <>
                            <Upload className="w-4 h-4 mr-2" />
                            Kirim Lamaran
                        </>
                    )}
                </Button>
                <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => router.back()}
                    className="hover:bg-gray-500 text-gray-700 border-0 bg-gray-400 shadow-sm transition-colors"
                >
                    Batal
                </Button>
            </div>
        </form>
    );
}

