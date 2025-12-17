'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { createBrowserClient } from "@/lib/supabase/client";
import { Loader2, Upload, Save } from "lucide-react";

interface ApplicationFormEnhancedProps {
    jobId: string;
    jobTitle: string;
    profile?: {
        full_name?: string | null;
        headline?: string | null;
        bio?: string | null;
        skills?: string[] | null;
        major?: string | null;
        experience?: string | null;
        education?: string | null;
    } | null;
}

export function ApplicationFormEnhanced({ jobId, jobTitle, profile }: ApplicationFormEnhancedProps) {
    const router = useRouter();
    const supabase = createBrowserClient();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Generate cover letter template from profile
    const generateCoverLetterFromProfile = () => {
        if (!profile) return "";
        
        const parts: string[] = [];
        
        // Introduction
        if (profile.full_name) {
            parts.push(`Dengan hormat,`);
            parts.push(`\nSaya ${profile.full_name}`);
        }
        
        // Headline/Bio
        if (profile.headline) {
            parts.push(profile.headline);
        } else if (profile.bio) {
            parts.push(profile.bio);
        }
        
        // Education
        if (profile.education) {
            parts.push(`\nPendidikan: ${profile.education}`);
        } else if (profile.major) {
            parts.push(`\nJurusan: ${profile.major}`);
        }
        
        // Experience
        if (profile.experience) {
            parts.push(`\nPengalaman: ${profile.experience}`);
        }
        
        // Skills
        if (profile.skills && profile.skills.length > 0) {
            parts.push(`\nSkills: ${profile.skills.join(", ")}`);
        }
        
        // Closing
        parts.push(`\n\nSaya sangat tertarik untuk bergabung dengan tim Anda dan siap memberikan kontribusi terbaik.`);
        parts.push(`\n\nTerima kasih atas perhatiannya.`);
        parts.push(`\n\nHormat saya,`);
        if (profile.full_name) {
            parts.push(profile.full_name);
        }
        
        return parts.join("");
    };
    
    const [formData, setFormData] = useState({
        cover_letter: "",
        cv_url: "",
        portfolio_url: "",
    });
    const [draftId, setDraftId] = useState<string | null>(null);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isAutoFilled, setIsAutoFilled] = useState(false);

    // Load draft jika ada
    useEffect(() => {
        const loadDraft = async () => {
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser();

                if (!user) return;

                // Cek apakah ada draft untuk job ini
                const { data } = await supabase
                    .from("applications")
                    .select("id, cover_letter, cv_url, portfolio_url")
                    .eq("job_id", jobId)
                    .eq("job_seeker_id", user.id)
                    .eq("status", "draft")
                    .maybeSingle();

                if (data) {
                    const draftData = data as any;
                    setDraftId(draftData.id);
                    setFormData({
                        cover_letter: draftData.cover_letter || "",
                        cv_url: draftData.cv_url || "",
                        portfolio_url: draftData.portfolio_url || "",
                    });
                    toast.info("Draft lamaran ditemukan dan dimuat");
                } else if (profile) {
                    // Auto-fill cover letter from profile if no draft exists
                    const autoFilledCoverLetter = generateCoverLetterFromProfile();
                    if (autoFilledCoverLetter && autoFilledCoverLetter.trim().length > 0) {
                        setFormData(prev => ({
                            ...prev,
                            cover_letter: autoFilledCoverLetter
                        }));
                        setIsAutoFilled(true);
                        toast.success("Cover letter diisi otomatis dari profil Anda");
                    }
                }
            } catch (error) {
                console.error("Error loading draft:", error);
            }
        };

        loadDraft();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [jobId, profile]);

    // Auto-save draft setiap 30 detik
    useEffect(() => {
        const autoSaveInterval = setInterval(() => {
            if (formData.cover_letter || formData.cv_url || formData.portfolio_url) {
                handleSaveDraft(true); // silent save
            }
        }, 30000); // 30 detik

        return () => clearInterval(autoSaveInterval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData]);

    const handleFileUpload = async (file: File, type: 'cv' | 'portfolio') => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `applications/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage
                .from('documents')
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (error: any) {
            toast.error(`Gagal mengunggah ${type === 'cv' ? 'CV' : 'Portfolio'}: ${error.message}`);
            return null;
        }
    };

    const handleCVChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validasi ukuran file (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Ukuran file CV maksimal 5MB");
                return;
            }

            const url = await handleFileUpload(file, 'cv');
            if (url) {
                setFormData({ ...formData, cv_url: url });
            }
        }
    };

    const handlePortfolioChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = await handleFileUpload(file, 'portfolio');
            if (url) {
                setFormData({ ...formData, portfolio_url: url });
            }
        }
    };

    const handleSaveDraft = async (silent = false) => {
        if (!silent) {
            setIsSaving(true);
        }

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                throw new Error("User not authenticated");
            }

            const draftData = {
                job_id: jobId,
                job_seeker_id: user.id,
                status: "draft" as const,
                cover_letter: formData.cover_letter || null,
                cv_url: formData.cv_url || null,
                portfolio_url: formData.portfolio_url || null,
            };

            let result;
            if (draftId) {
                // Update existing draft
                result = await (supabase
                    .from("applications") as any)
                    .update(draftData)
                    .eq("id", draftId)
                    .select()
                    .single();
            } else {
                // Create new draft
                result = await (supabase
                    .from("applications") as any)
                    .insert([draftData])
                    .select()
                    .single();
            }

            if (result.error) throw result.error;

            if (result.data) {
                setDraftId((result.data as any).id);
                setLastSaved(new Date());
                if (!silent) {
                    toast.success("Draft berhasil disimpan");
                }
            }
        } catch (error: any) {
            if (!silent) {
                toast.error(error.message || "Terjadi kesalahan saat menyimpan draft");
            }
        } finally {
            if (!silent) {
                setIsSaving(false);
            }
        }
    };

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

            // Validasi minimal
            if (!formData.cv_url) {
                toast.error("CV wajib diunggah");
                setIsLoading(false);
                return;
            }

            if (!formData.cover_letter || formData.cover_letter.trim().length < 50) {
                toast.error("Cover letter minimal 50 karakter");
                setIsLoading(false);
                return;
            }

            // Jika ada draft, update statusnya. Jika tidak, buat baru
            let result;
            if (draftId) {
                result = await (supabase
                    .from("applications") as any)
                    .update({
                        status: "submitted",
                        cover_letter: formData.cover_letter,
                        cv_url: formData.cv_url,
                        portfolio_url: formData.portfolio_url || null,
                        submitted_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", draftId)
                    .select()
                    .single();
            } else {
                result = await (supabase
                    .from("applications") as any)
                    .insert([
                        {
                            job_id: jobId,
                            job_seeker_id: user.id,
                            status: "submitted",
                            cover_letter: formData.cover_letter,
                            cv_url: formData.cv_url,
                            portfolio_url: formData.portfolio_url || null,
                        },
                    ])
                    .select()
                    .single();
            }

            if (result.error) throw result.error;

            // Buat notifikasi untuk recruiter saat ada lamaran baru
            try {
                // Ambil informasi job dan recruiter
                const { data: jobData } = await supabase
                    .from("job_listings")
                    .select("title, company_name, recruiter_id")
                    .eq("id", jobId)
                    .single();

                if (jobData && jobData.recruiter_id && profile) {
                    const { notifyNewApplication } = await import("@/lib/utils/notifications");
                    await notifyNewApplication(
                        jobData.recruiter_id,
                        jobData.title || jobTitle,
                        profile.full_name || "Pelamar",
                        result.data.id,
                        jobId
                    );
                }
            } catch (notifError) {
                // Jangan gagalkan proses jika notifikasi gagal
                console.error("Error creating notification:", notifError);
            }

            toast.success("Lamaran berhasil dikirim!");
            
            // Dispatch custom event
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("application-submitted", {
                    detail: { jobId }
                }));
            }
            
            router.push("/job-seeker/applications");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan saat mengirim lamaran");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="cover_letter">
                        Cover Letter <span className="text-red-500">*</span>
                    </Label>
                    {profile && !isAutoFilled && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => {
                                const autoFilled = generateCoverLetterFromProfile();
                                if (autoFilled) {
                                    setFormData(prev => ({ ...prev, cover_letter: autoFilled }));
                                    setIsAutoFilled(true);
                                    toast.success("Cover letter diisi otomatis dari profil Anda");
                                }
                            }}
                        >
                            Isi Otomatis dari Profil
                        </Button>
                    )}
                </div>
                <Textarea
                    id="cover_letter"
                    value={formData.cover_letter}
                    onChange={(e) => setFormData({ ...formData, cover_letter: e.target.value })}
                    rows={8}
                    placeholder="Tuliskan cover letter Anda di sini..."
                    required
                />
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Jelaskan mengapa Anda cocok untuk posisi ini (minimal 50 karakter)
                    </p>
                    <p className={`text-xs ${
                        formData.cover_letter.length < 50 
                            ? "text-red-500" 
                            : "text-green-500"
                    }`}>
                        {formData.cover_letter.length}/50
                    </p>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="cv">
                    CV / Resume <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-4">
                    <Input
                        id="cv"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleCVChange}
                        className="cursor-pointer"
                        required={!formData.cv_url}
                    />
                    {formData.cv_url && (
                        <span className="text-sm text-green-600 flex items-center gap-1">
                            ✓ CV terunggah
                        </span>
                    )}
                </div>
                <p className="text-sm text-gray-500">
                    Format: PDF, DOC, atau DOCX (maks. 5MB)
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="portfolio">Portfolio / Link Portfolio</Label>
                <Input
                    id="portfolio"
                    type="url"
                    value={formData.portfolio_url}
                    onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
                    placeholder="https://portfolio.example.com"
                />
                <p className="text-sm text-gray-500">
                    Link ke portfolio atau website Anda (opsional)
                </p>
            </div>

            {/* Draft info */}
            {lastSaved && (
                <div className="p-3 bg-blue-50 border border-blue-200/40 rounded-lg">
                    <p className="text-sm text-blue-700">
                        ✓ Draft terakhir disimpan: {lastSaved.toLocaleTimeString("id-ID")}
                    </p>
                </div>
            )}

            <div className="flex gap-3 flex-col sm:flex-row">
                <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => handleSaveDraft()}
                    disabled={isSaving}
                    className="flex-1 border border-gray-200/40 hover:bg-gray-50"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Menyimpan...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Simpan Draft
                        </>
                    )}
                </Button>
                <Button 
                    type="submit" 
                    disabled={isLoading} 
                    className="flex-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 hover:shadow-lg transition-all"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Mengirim...
                        </>
                    ) : (
                        <>
                            <Upload className="mr-2 h-4 w-4" />
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

