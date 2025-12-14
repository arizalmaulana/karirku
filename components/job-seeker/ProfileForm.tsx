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
import { Loader2, Upload, User, Camera, X, GraduationCap, Briefcase, Award } from "lucide-react";
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
            // Set preview image dari avatar_url
            if (initialData.avatar_url) {
                setPreviewImage(initialData.avatar_url);
            } else {
                setPreviewImage(null);
            }
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
            
            // Upload langsung ke bucket avatars
            const bucketName = 'avatars';
            const filePath = fileName;

            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) {
                const errorMessage = uploadError.message || "Unknown error";
                if (errorMessage.includes('not found') || errorMessage.includes('Bucket')) {
                    throw new Error(
                        "Bucket 'avatars' belum dibuat. Silakan buat bucket 'avatars' di Supabase Storage terlebih dahulu."
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
            <Card className="border-2 border-purple-200 bg-white shadow-lg overflow-hidden">
                <CardContent className="p-0">
                    <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 p-6">
                        <h3 className="text-2xl font-bold text-white mb-1">Foto Profil</h3>
                        <p className="text-purple-100 text-sm">
                            Unggah foto profil profesional Anda untuk meningkatkan kredibilitas
                        </p>
                    </div>
                    <div className="p-8">
                        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
                            {/* Photo Preview */}
                            <div className="relative flex-shrink-0">
                                <div className="w-48 h-48 rounded-2xl overflow-hidden border-4 border-white shadow-2xl bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 flex items-center justify-center relative group">
                                    {previewImage ? (
                                        <>
                                            <img
                                                src={previewImage}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    const parent = e.currentTarget.parentElement;
                                                    if (parent) {
                                                        const fallback = document.createElement('div');
                                                        fallback.className = 'w-full h-full flex items-center justify-center';
                                                        fallback.innerHTML = '<svg class="w-24 h-24 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>';
                                                        parent.appendChild(fallback);
                                                    }
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center pointer-events-none">
                                                <Camera className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </>
                                    ) : (
                                        <User className="w-24 h-24 text-white/80" />
                                    )}
                                </div>
                                {previewImage && (
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2.5 shadow-xl transition-all hover:scale-110 z-10 border-2 border-white"
                                        aria-label="Hapus foto"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                                {/* Decorative rings */}
                                <div className="absolute -inset-2 rounded-2xl border-2 border-purple-200/50 pointer-events-none"></div>
                            </div>

                            {/* Upload Controls */}
                            <div className="flex-1 w-full lg:w-auto space-y-4">
                                <div className="space-y-3">
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
                                        className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white rounded-xl hover:shadow-2xl transition-all cursor-pointer font-semibold text-base hover:scale-[1.02] active:scale-[0.98] w-full lg:w-auto"
                                    >
                                        {isUploading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span>Mengunggah...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Camera className="w-5 h-5" />
                                                <span>{previewImage ? "Ganti Foto" : "Unggah Foto"}</span>
                                            </>
                                        )}
                                    </label>
                                    
                                    {previewImage && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleRemoveImage}
                                            className="w-full lg:w-auto border-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 font-medium px-8 py-4 rounded-xl transition-all"
                                        >
                                            <X className="w-4 h-4 mr-2" />
                                            Hapus Foto
                                        </Button>
                                    )}
                                </div>
                                
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <p className="text-sm text-gray-600 flex items-center gap-2">
                                        <span className="font-semibold text-gray-700">Format yang didukung:</span>
                                        <span>JPEG, PNG, JPG</span>
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        <span className="font-semibold text-gray-700">Ukuran maksimal:</span> 5MB
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Personal Information */}
            <Card className="border-2 border-gray-200 shadow-md">
                <CardContent className="p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl shadow-sm">
                            <User className="w-6 h-6 text-purple-600" />
                        </div>
                        <span>Informasi Pribadi</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="full_name" className="text-sm font-semibold text-gray-700">
                                Nama Lengkap *
                            </Label>
                            <Input
                                id="full_name"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                required
                                placeholder="Contoh: John Doe"
                                className="border-2 focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="headline" className="text-sm font-semibold text-gray-700">
                                Headline / Tagline
                            </Label>
                            <Input
                                id="headline"
                                value={formData.headline}
                                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                                placeholder="Contoh: Frontend Developer dengan 3 tahun pengalaman"
                                className="border-2 focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="Contoh: john.doe@email.com"
                                className="border-2 focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                                Nomor Telepon
                            </Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="Contoh: +62 812-3456-7890"
                                className="border-2 focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="location_city" className="text-sm font-semibold text-gray-700">
                                Kota
                            </Label>
                            <Input
                                id="location_city"
                                value={formData.location_city}
                                onChange={(e) => setFormData({ ...formData, location_city: e.target.value })}
                                placeholder="Contoh: Jakarta, Bandung, Surabaya"
                                className="border-2 focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="bio" className="text-sm font-semibold text-gray-700">
                                Bio / Deskripsi Diri
                            </Label>
                            <Textarea
                                id="bio"
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                rows={4}
                                placeholder="Ceritakan tentang diri Anda, minat, dan tujuan karir..."
                                className="border-2 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 resize-none"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Education & Experience */}
            <Card className="border-2 border-gray-200 shadow-md">
                <CardContent className="p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl shadow-sm">
                            <GraduationCap className="w-6 h-6 text-blue-600" />
                        </div>
                        <span>Pendidikan & Pengalaman</span>
                    </h3>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="education" className="text-sm font-semibold text-gray-700">
                                Pendidikan
                            </Label>
                            <Textarea
                                id="education"
                                value={formData.education}
                                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                                rows={3}
                                placeholder="Contoh: S1 Teknik Informatika - Universitas Indonesia (2018-2022)"
                                className="border-2 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="major" className="text-sm font-semibold text-gray-700">
                                Jurusan / Major
                            </Label>
                            <Input
                                id="major"
                                value={formData.major}
                                onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                                placeholder="Contoh: Teknik Informatika, Sistem Informasi, dll"
                                className="border-2 focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Jurusan akan digunakan untuk mencocokkan dengan lowongan yang memerlukan jurusan tertentu
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="experience" className="text-sm font-semibold text-gray-700">
                                Pengalaman Kerja
                            </Label>
                            <Textarea
                                id="experience"
                                value={formData.experience}
                                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                                rows={4}
                                placeholder="Jelaskan pengalaman kerja Anda, proyek yang pernah dikerjakan, atau pencapaian penting..."
                                className="border-2 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 resize-none"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Skills */}
            <Card className="border-2 border-gray-200 shadow-md">
                <CardContent className="p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-pink-100 to-pink-200 rounded-xl shadow-sm">
                            <Award className="w-6 h-6 text-pink-600" />
                        </div>
                        <span>Skills & Keahlian</span>
                    </h3>
                    <div className="space-y-2">
                        <Label htmlFor="skills" className="text-sm font-semibold text-gray-700">
                            Skills (pisahkan dengan koma) *
                        </Label>
                        <Input
                            id="skills"
                            value={skillsInput}
                            onChange={(e) => setSkillsInput(e.target.value)}
                            required
                            placeholder="Contoh: React, TypeScript, Node.js, UI/UX, Python, Java"
                            className="border-2 focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            Skills ini akan digunakan untuk mencocokkan dengan lowongan pekerjaan. Pisahkan setiap skill dengan koma.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                    type="submit" 
                    disabled={isLoading || isUploading}
                    className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white hover:shadow-xl transition-all px-8 py-6 text-base font-semibold hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
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
                    className="border-2 px-8 py-6 text-base font-semibold hover:bg-gray-50"
                >
                    Batal
                </Button>
            </div>
        </form>
    );
}
