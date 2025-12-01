'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createBrowserClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import type { Profile } from "@/lib/types";

interface ProfileFormProps {
    initialData?: Profile | null;
}

export function ProfileForm({ initialData }: ProfileFormProps) {
    const router = useRouter();
    const supabase = createBrowserClient();
    const [isLoading, setIsLoading] = useState(false);
    const [skillsInput, setSkillsInput] = useState(
        initialData?.skills?.join(", ") || ""
    );
    const [formData, setFormData] = useState({
        full_name: initialData?.full_name || "",
        headline: initialData?.headline || "",
        location_city: initialData?.location_city || "",
        major: initialData?.major || "",
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                full_name: initialData.full_name || "",
                headline: initialData.headline || "",
                location_city: initialData.location_city || "",
                major: initialData.major || "",
            });
            setSkillsInput(initialData.skills?.join(", ") || "");
        }
    }, [initialData]);

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

            // Parse skills dari string ke array
            const skills = skillsInput
                .split(",")
                .map((s) => s.trim())
                .filter((s) => s.length > 0);

            const profileData = {
                id: user.id,
                full_name: formData.full_name || null,
                headline: formData.headline || null,
                location_city: formData.location_city || null,
                major: formData.major || null,
                skills: skills,
            };

            const { error } = await supabase
                .from("profiles")
                .upsert(profileData, {
                    onConflict: "id",
                });

            if (error) throw error;

            toast.success("Profil berhasil diperbarui");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan saat menyimpan profil");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="full_name">Nama Lengkap *</Label>
                <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                    placeholder="Contoh: John Doe"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="headline">Headline / Tagline</Label>
                <Input
                    id="headline"
                    value={formData.headline}
                    onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                    placeholder="Contoh: Frontend Developer dengan 3 tahun pengalaman"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="location_city">Kota</Label>
                <Input
                    id="location_city"
                    value={formData.location_city}
                    onChange={(e) => setFormData({ ...formData, location_city: e.target.value })}
                    placeholder="Contoh: Jakarta"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="major">Jurusan / Major</Label>
                <Input
                    id="major"
                    value={formData.major}
                    onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                    placeholder="Contoh: Teknik Informatika, Sistem Informasi, dll"
                />
                <p className="text-sm text-gray-500">
                    Jurusan akan digunakan untuk mencocokkan dengan lowongan yang memerlukan jurusan tertentu
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="skills">Skills (pisahkan dengan koma) *</Label>
                <Input
                    id="skills"
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    required
                    placeholder="Contoh: React, TypeScript, Node.js, UI/UX"
                />
                <p className="text-sm text-gray-500">
                    Skills ini akan digunakan untuk mencocokkan dengan lowongan pekerjaan
                </p>
            </div>

            <div className="flex gap-4">
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Menyimpan...
                        </>
                    ) : (
                        "Simpan Profil"
                    )}
                </Button>
            </div>
        </form>
    );
}

