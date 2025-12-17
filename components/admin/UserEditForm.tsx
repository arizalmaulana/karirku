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

interface UserEditFormProps {
    initialData: any;
    userId: string;
}

export function UserEditForm({ initialData, userId }: UserEditFormProps) {
    const router = useRouter();
    const supabase = createBrowserClient();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: initialData?.full_name || "",
        headline: initialData?.headline || "",
        email: initialData?.email || "",
        phone: initialData?.phone || "",
        location_city: initialData?.location_city || "",
        bio: initialData?.bio || "",
        role: (initialData?.role || 'jobseeker') as UserRole,
        is_approved: initialData?.is_approved || false,
        skills: initialData?.skills?.join(", ") || "",
        education: initialData?.education || "",
        major: initialData?.major || "",
        experience: initialData?.experience || "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const updateData: any = {
                full_name: formData.full_name || null,
                headline: formData.headline || null,
                email: formData.email || null,
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

            // Update is_approved untuk semua role (status aktif)
            updateData.is_approved = formData.is_approved;

            // Simpan status is_approved sebelumnya untuk cek apakah recruiter baru di-approve
            const previousIsApproved = initialData.is_approved;
            const newIsApproved = formData.is_approved;

            const { error } = await (supabase
                .from("profiles") as any)
                .update(updateData)
                .eq("id", userId);

            if (error) throw error;

            // Buat notifikasi jika recruiter baru saja di-approve
            if (newIsApproved && !previousIsApproved && initialData.role === "recruiter") {
                try {
                    const { notifyRecruiterApproval } = await import("@/lib/utils/notifications");
                    await notifyRecruiterApproval(userId);
                } catch (notifError) {
                    // Jangan gagalkan proses jika notifikasi gagal
                    console.error("Error creating notification:", notifError);
                }
            }

            toast.success("Data pengguna berhasil diperbarui");
            router.push(`/admin/users/${userId}`);
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan saat memperbarui data");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
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
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@example.com"
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
                        <SelectContent className="!bg-white text-black border border-gray-200/40">
                            <SelectItem value="jobseeker" className="!bg-white text-black hover:bg-gray-100">Job Seeker</SelectItem>
                            <SelectItem value="recruiter" className="!bg-white text-black hover:bg-gray-100">Recruiter</SelectItem>
                            <SelectItem value="admin" className="!bg-white text-black hover:bg-gray-100">Admin</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="is_approved"
                        checked={formData.is_approved}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_approved: checked as boolean })}
                    />
                    <Label htmlFor="is_approved" className="cursor-pointer">
                        Status Aktif
                    </Label>
                </div>

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
                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Menyimpan...
                        </>
                    ) : (
                        "Perbarui Data"
                    )}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isLoading}
                    className="hover:bg-gray-500 text-gray-700 border-0 bg-gray-400 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                >
                    Batal
                </Button>
            </div>
        </form>
    );
}


