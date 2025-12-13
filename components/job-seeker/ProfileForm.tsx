'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { createBrowserClient } from "@/lib/supabase/client";
import { Loader2, Upload, User, Camera, X } from "lucide-react";
import type { Profile } from "@/lib/types";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";

interface ProfileFormProps {
    initialData?: Profile | null;
}

export function ProfileForm({ initialData }: ProfileFormProps) {
    const router = useRouter();
    const supabase = createBrowserClient();
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(initialData?.avatar_url || null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [skillsInput, setSkillsInput] = useState(
        initialData?.skills?.join(", ") || ""
    );
    const [formData, setFormData] = useState({
        full_name: initialData?.full_name || "",
        headline: initialData?.headline || "",
        location_city: initialData?.location_city || "",
        major: initialData?.major || "",
        email: initialData?.email || "",
        phone: initialData?.phone || "",
        bio: initialData?.bio || "",
        experience: initialData?.experience || "",
        education: initialData?.education || "",
        avatar_url: initialData?.avatar_url || "",
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                full_name: initialData.full_name || "",
                headline: initialData.headline || "",
                location_city: initialData.location_city || "",
                major: initialData.major || "",
                email: initialData.email || "",
                phone: initialData.phone || "",
                bio: initialData.bio || "",
                experience: initialData.experience || "",
                education: initialData.education || "",
                avatar_url: initialData.avatar_url || "",
            });
            setSkillsInput(initialData.skills?.join(", ") || "");
            setPreviewImage(initialData.avatar_url || null);
        }
    }, [initialData]);

    const handleImageUpload = async (file: File) => {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error("File harus berupa gambar");
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Ukuran file maksimal 5MB");
            return;
        }

        setIsUploading(true);
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                throw new Error("User not authenticated");
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            
            // Try avatars bucket first, fallback to documents if not found
            let bucketName = 'avatars';
            let filePath = `avatars/${fileName}`;
            let uploadError: any = null;

            // Try to upload to avatars bucket
            const { error: avatarsError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (avatarsError) {
                // If bucket not found, try documents bucket
                if (avatarsError.message?.includes('not found') || avatarsError.message?.includes('Bucket')) {
                    console.warn("avatars bucket not found, trying documents bucket...");
                    bucketName = 'documents';
                    filePath = `avatars/${fileName}`;
                    
                    const { error: documentsError } = await supabase.storage
                        .from('documents')
                        .upload(filePath, file, {
                            cacheControl: '3600',
                            upsert: true
                        });
                    
                    if (documentsError) {
                        uploadError = documentsError;
                    }
                } else {
                    uploadError = avatarsError;
                }
            }

            if (uploadError) {
                const errorMessage = uploadError.message || "Unknown error";
                if (errorMessage.includes('not found') || errorMessage.includes('Bucket')) {
                    throw new Error(
                        "Bucket storage belum dibuat. Silakan buat bucket 'avatars' atau 'documents' di Supabase Storage terlebih dahulu."
                    );
                }
                throw new Error(`Gagal mengunggah foto: ${errorMessage}`);
            }

            // Get public URL
            const { data } = supabase.storage
                .from(bucketName)
                .getPublicUrl(filePath);

            setFormData({ ...formData, avatar_url: data.publicUrl });
            setPreviewImage(data.publicUrl);
            toast.success("Foto profil berhasil diunggah");
        } catch (error: any) {
            console.error("Error uploading image:", error);
            toast.error(error.message || "Gagal mengunggah foto profil");
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleImageUpload(file);
        }
    };

    const handleRemoveImage = () => {
        setPreviewImage(null);
        setFormData({ ...formData, avatar_url: "" });
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
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
                email: formData.email || null,
                phone: formData.phone || null,
                bio: formData.bio || null,
                experience: formData.experience || null,
                education: formData.education || null,
                avatar_url: formData.avatar_url || null,
                skills: skills,
            };

            const { error } = await (supabase
                .from("profiles") as any)
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
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Photo Upload Section */}
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50/50">
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center">
                                {previewImage ? (
                                    <ImageWithFallback
                                        src={previewImage}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User className="w-16 h-16 text-white" />
                                )}
                            </div>
                            {previewImage && (
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition shadow-lg"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Foto Profil</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Unggah foto profil Anda untuk meningkatkan kredibilitas
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="avatar-upload"
                                />
                                <label
                                    htmlFor="avatar-upload"
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all cursor-pointer"
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Mengunggah...
                                        </>
                                    ) : (
                                        <>
                                            <Camera className="w-4 h-4" />
                                            {previewImage ? "Ganti Foto" : "Unggah Foto"}
                                        </>
                                    )}
                                </label>
                                {previewImage && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleRemoveImage}
                                        className="border-red-200 text-red-600 hover:bg-red-50"
                                    >
                                        Hapus Foto
                                    </Button>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Format: JPG, PNG (maks. 5MB)
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Personal Information */}
            <Card className="border-2 border-gray-200 shadow-sm">
                <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <User className="w-5 h-5 text-purple-600" />
                        </div>
                        Informasi Pribadi
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label htmlFor="full_name">Nama Lengkap *</Label>
                <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                    placeholder="Contoh: John Doe"
                                className="border-2 focus:border-purple-400"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="headline">Headline / Tagline</Label>
                <Input
                    id="headline"
                    value={formData.headline}
                    onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                    placeholder="Contoh: Frontend Developer dengan 3 tahun pengalaman"
                                className="border-2 focus:border-purple-400"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="Contoh: john.doe@email.com"
                                className="border-2 focus:border-purple-400"
                />
            </div>

            <div className="space-y-2">
                            <Label htmlFor="phone">Nomor Telepon</Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="Contoh: +62 812-3456-7890"
                                className="border-2 focus:border-purple-400"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                <Label htmlFor="location_city">Kota</Label>
                <Input
                    id="location_city"
                    value={formData.location_city}
                    onChange={(e) => setFormData({ ...formData, location_city: e.target.value })}
                                placeholder="Contoh: Jakarta, Bandung, Surabaya"
                                className="border-2 focus:border-purple-400"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="bio">Bio / Deskripsi Diri</Label>
                            <Textarea
                                id="bio"
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                rows={4}
                                placeholder="Ceritakan tentang diri Anda, minat, dan tujuan karir..."
                                className="border-2 focus:border-purple-400"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Education & Experience */}
            <Card className="border-2 border-gray-200 shadow-sm">
                <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Upload className="w-5 h-5 text-blue-600" />
                        </div>
                        Pendidikan & Pengalaman
                    </h3>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="education">Pendidikan</Label>
                            <Textarea
                                id="education"
                                value={formData.education}
                                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                                rows={3}
                                placeholder="Contoh: S1 Teknik Informatika - Universitas Indonesia (2018-2022)"
                                className="border-2 focus:border-purple-400"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="major">Jurusan / Major</Label>
                <Input
                    id="major"
                    value={formData.major}
                    onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                    placeholder="Contoh: Teknik Informatika, Sistem Informasi, dll"
                                className="border-2 focus:border-purple-400"
                />
                <p className="text-sm text-gray-500">
                    Jurusan akan digunakan untuk mencocokkan dengan lowongan yang memerlukan jurusan tertentu
                </p>
            </div>

                        <div className="space-y-2">
                            <Label htmlFor="experience">Pengalaman Kerja</Label>
                            <Textarea
                                id="experience"
                                value={formData.experience}
                                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                                rows={4}
                                placeholder="Jelaskan pengalaman kerja Anda, proyek yang pernah dikerjakan, atau pencapaian penting..."
                                className="border-2 focus:border-purple-400"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Skills */}
            <Card className="border-2 border-gray-200 shadow-sm">
                <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <div className="p-2 bg-pink-100 rounded-lg">
                            <Upload className="w-5 h-5 text-pink-600" />
                        </div>
                        Skills & Keahlian
                    </h3>
            <div className="space-y-2">
                <Label htmlFor="skills">Skills (pisahkan dengan koma) *</Label>
                <Input
                    id="skills"
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    required
                            placeholder="Contoh: React, TypeScript, Node.js, UI/UX, Python, Java"
                            className="border-2 focus:border-purple-400"
                />
                <p className="text-sm text-gray-500">
                            Skills ini akan digunakan untuk mencocokkan dengan lowongan pekerjaan. Pisahkan setiap skill dengan koma.
                </p>
            </div>
                </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex gap-4">
                <Button 
                    type="submit" 
                    disabled={isLoading || isUploading}
                    className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white hover:shadow-lg transition-all px-8"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Menyimpan...
                        </>
                    ) : (
                        "Simpan Profil"
                    )}
                </Button>
                <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => router.back()}
                    className="border-2"
                >
                    Batal
                </Button>
            </div>
        </form>
    );
}
