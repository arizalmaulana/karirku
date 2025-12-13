'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { createBrowserClient } from "@/lib/supabase/client";
import { Loader2, Upload } from "lucide-react";

interface ApplicationFormProps {
    jobId: string;
    jobTitle: string;
}

export function ApplicationForm({ jobId, jobTitle }: ApplicationFormProps) {
    const router = useRouter();
    const supabase = createBrowserClient();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        cover_letter: "",
        cv_url: "",
        portfolio_url: "",
    });

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

            const { error } = await (supabase.from("applications") as any).insert([
                {
                    job_id: jobId,
                    job_seeker_id: user.id,
                    status: "submitted",
                    cover_letter: formData.cover_letter || null,
                    cv_url: formData.cv_url || null,
                    portfolio_url: formData.portfolio_url || null,
                },
            ]);

            if (error) throw error;

            toast.success("Lamaran berhasil dikirim!");
            
            // Dispatch custom event to notify other components
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
                <Label htmlFor="cover_letter">Cover Letter</Label>
                <Textarea
                    id="cover_letter"
                    value={formData.cover_letter}
                    onChange={(e) => setFormData({ ...formData, cover_letter: e.target.value })}
                    rows={6}
                    placeholder="Tuliskan cover letter Anda di sini..."
                />
                <p className="text-sm text-gray-500">
                    Jelaskan mengapa Anda cocok untuk posisi ini
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="cv">CV / Resume</Label>
                <div className="flex items-center gap-4">
                    <Input
                        id="cv"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleCVChange}
                        className="cursor-pointer"
                    />
                    {formData.cv_url && (
                        <span className="text-sm text-green-600">✓ CV terunggah</span>
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

            <div className="flex gap-4">
                <Button type="submit" disabled={isLoading} className="flex-1">
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
                >
                    Batal
                </Button>
            </div>
        </form>
    );
}

