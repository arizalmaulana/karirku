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
import { Loader2 } from "lucide-react";
import type { UserRole } from "@/lib/types";

export function CreateUserForm() {
    const router = useRouter();
    const supabase = createBrowserClient();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        full_name: "",
        headline: "",
        phone: "",
        location_city: "",
        bio: "",
        role: 'jobseeker' as UserRole,
        is_approved: false,
        skills: "",
        education: "",
        major: "",
        experience: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Validasi
            if (!formData.email || !formData.password) {
                toast.error("Email dan password wajib diisi");
                setIsLoading(false);
                return;
            }

            // Buat user di auth
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: formData.email,
                password: formData.password,
                email_confirm: true, // Auto confirm email
            });

            if (authError) {
                // Jika admin API tidak tersedia, gunakan signUp biasa
                if (authError.message.includes('admin') || authError.message.includes('service_role')) {
                    toast.error("Fitur ini memerlukan akses admin API. Silakan gunakan registrasi biasa atau hubungi administrator.");
                    setIsLoading(false);
                    return;
                }
                throw authError;
            }

            if (!authData?.user) {
                throw new Error("Gagal membuat user");
            }

            const userId = authData.user.id;

            // Buat profile
            const profileData: any = {
                id: userId,
                full_name: formData.full_name || null,
                headline: formData.headline || null,
                email: formData.email,
                phone: formData.phone || null,
                location_city: formData.location_city || null,
                bio: formData.bio || null,
                role: formData.role,
                skills: formData.skills
                    ? formData.skills.split(",").map((s: string) => s.trim()).filter((s: string) => s.length > 0)
                    : [],
                education: formData.education || null,
                major: formData.major || null,
                experience: formData.experience || null,
            };

            // Hanya set is_approved jika role adalah recruiter
            if (formData.role === 'recruiter') {
                profileData.is_approved = formData.is_approved;
            } else {
                profileData.is_approved = null;
            }

            const { error: profileError } = await (supabase
                .from("profiles") as any)
                .insert(profileData);

            if (profileError) throw profileError;

            toast.success("Pengguna berhasil dibuat");
            router.push("/admin/users");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan saat membuat pengguna");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@example.com"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Minimal 6 karakter"
                        required
                        minLength={6}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="full_name">Nama Lengkap</Label>
                    <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="Nama lengkap"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="headline">Headline</Label>
                    <Input
                        id="headline"
                        value={formData.headline}
                        onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                        placeholder="Headline profesional"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone">Telepon</Label>
                    <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="081234567890"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="location_city">Kota</Label>
                    <Input
                        id="location_city"
                        value={formData.location_city}
                        onChange={(e) => setFormData({ ...formData, location_city: e.target.value })}
                        placeholder="Jakarta"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="jobseeker">Job Seeker</SelectItem>
                            <SelectItem value="recruiter">Recruiter</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {formData.role === 'recruiter' && (
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="is_approved"
                            checked={formData.is_approved}
                            onCheckedChange={(checked) => setFormData({ ...formData, is_approved: checked as boolean })}
                        />
                        <Label htmlFor="is_approved" className="cursor-pointer">
                            Approved
                        </Label>
                    </div>
                )}

                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="skills">Skills (pisahkan dengan koma)</Label>
                    <Input
                        id="skills"
                        value={formData.skills}
                        onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                        placeholder="JavaScript, React, Node.js"
                    />
                </div>

                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="education">Pendidikan</Label>
                    <Textarea
                        id="education"
                        value={formData.education}
                        onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                        placeholder="Riwayat pendidikan"
                        rows={3}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="major">Jurusan</Label>
                    <Input
                        id="major"
                        value={formData.major}
                        onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                        placeholder="Teknik Informatika"
                    />
                </div>

                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="experience">Pengalaman</Label>
                    <Textarea
                        id="experience"
                        value={formData.experience}
                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                        placeholder="Riwayat pengalaman kerja"
                        rows={4}
                    />
                </div>

                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="Tentang saya"
                        rows={4}
                    />
                </div>
            </div>

            <div className="flex gap-4">
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Membuat...
                        </>
                    ) : (
                        "Buat Pengguna"
                    )}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isLoading}
                >
                    Batal
                </Button>
            </div>
        </form>
    );
}


