'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createBrowserClient } from "@/lib/supabase/client";
import { Loader2, Upload, Building2, FileText, AlertCircle, CheckCircle2, XCircle, Image as ImageIcon, X } from "lucide-react";
import type { Company } from "@/lib/types";

interface CompanyProfileFormProps {
    initialData?: Company | null;
}

export function CompanyProfileForm({ initialData }: CompanyProfileFormProps) {
    const router = useRouter();
    const supabase = createBrowserClient();
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadingLicense, setIsUploadingLicense] = useState(false);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const licenseFileInputRef = useRef<HTMLInputElement>(null);
    const logoFileInputRef = useRef<HTMLInputElement>(null);
    const [licenseFileName, setLicenseFileName] = useState<string | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.logo_url || null);
    
    const [formData, setFormData] = useState({
        name: initialData?.name || "",
        industry: initialData?.industry || "",
        location_city: initialData?.location_city || "",
        location_province: initialData?.location_province || "",
        address: initialData?.address || "",
        description: initialData?.description || "",
        website_url: initialData?.website_url || "",
        size: initialData?.size || "",
        logo_url: initialData?.logo_url || "",
        license_url: initialData?.license_url || "",
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || "",
                industry: initialData.industry || "",
                location_city: initialData.location_city || "",
                location_province: initialData.location_province || "",
                address: initialData.address || "",
                description: initialData.description || "",
                website_url: initialData.website_url || "",
                size: initialData.size || "",
                logo_url: initialData.logo_url || "",
                license_url: initialData.license_url || "",
            });
            if (initialData.license_url) {
                setLicenseFileName(initialData.license_url.split('/').pop() || null);
            }
            if (initialData.logo_url) {
                setLogoPreview(initialData.logo_url);
            }
        }
    }, [initialData]);

    const handleLicenseUpload = async (file: File) => {
        if (!file) return;

        // Validate file type (PDF, JPG, PNG)
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            toast.error("File harus berupa PDF, JPG, atau PNG");
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error("Ukuran file maksimal 10MB");
            return;
        }

        setIsUploadingLicense(true);
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                throw new Error("User not authenticated");
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `license_${user.id}_${Date.now()}.${fileExt}`;
            
            // Upload ke bucket company_licenses
            const bucketName = 'company_licenses';
            const filePath = fileName;

            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                const errorMessage = uploadError.message || "Unknown error";
                if (errorMessage.includes('not found') || errorMessage.includes('Bucket')) {
                    throw new Error(
                        "Bucket 'company_licenses' belum dibuat. Silakan hubungi admin untuk membuat bucket terlebih dahulu."
                    );
                }
                throw new Error(`Gagal mengunggah surat izin: ${errorMessage}`);
            }

            // Get signed URL (karena bucket private)
            const { data: urlData, error: urlError } = await supabase.storage
                .from(bucketName)
                .createSignedUrl(filePath, 31536000); // 1 year expiry

            if (urlError) {
                // Fallback: construct URL manually
                const { data: { publicUrl } } = supabase.storage
                    .from(bucketName)
                    .getPublicUrl(filePath);
                setFormData({ ...formData, license_url: publicUrl });
            } else {
                setFormData({ ...formData, license_url: urlData.signedUrl });
            }

            setLicenseFileName(file.name);
            toast.success("Surat izin berhasil diunggah");
        } catch (error: any) {
            console.error("Error uploading license:", error);
            toast.error(error.message || "Gagal mengunggah surat izin");
        } finally {
            setIsUploadingLicense(false);
        }
    };

    const handleLicenseFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleLicenseUpload(file);
        }
    };

    const handleRemoveLicense = () => {
        setLicenseFileName(null);
        setFormData({ ...formData, license_url: "" });
        if (licenseFileInputRef.current) {
            licenseFileInputRef.current.value = "";
        }
    };

    const handleLogoUpload = async (file: File) => {
        if (!file) return;

        // Validate file type (images only)
        if (!file.type.startsWith('image/')) {
            toast.error("File harus berupa gambar");
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Ukuran file maksimal 5MB");
            return;
        }

        setIsUploadingLogo(true);
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                throw new Error("User not authenticated");
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `logo_${user.id}_${Date.now()}.${fileExt}`;
            
            // Upload ke bucket company_logos (atau avatars jika company_logos belum ada)
            let bucketName = 'company_logos';
            const filePath = fileName;

            let { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            // Fallback ke avatars jika company_logos belum ada
            if (uploadError && (uploadError.message.includes('not found') || uploadError.message.includes('Bucket'))) {
                bucketName = 'avatars';
                const fallbackFileName = `company_logo_${user.id}_${Date.now()}.${fileExt}`;
                const { error: fallbackError } = await supabase.storage
                    .from(bucketName)
                    .upload(fallbackFileName, file, {
                        cacheControl: '3600',
                        upsert: true
                    });
                
                if (fallbackError) {
                    throw new Error(`Gagal mengunggah logo: ${fallbackError.message}`);
                }
                
                const { data: urlData } = supabase.storage
                    .from(bucketName)
                    .getPublicUrl(fallbackFileName);
                
                setFormData({ ...formData, logo_url: urlData.publicUrl });
                setLogoPreview(urlData.publicUrl);
                toast.success("Logo perusahaan berhasil diunggah");
                return;
            }

            if (uploadError) {
                throw new Error(`Gagal mengunggah logo: ${uploadError.message}`);
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from(bucketName)
                .getPublicUrl(filePath);

            setFormData({ ...formData, logo_url: urlData.publicUrl });
            setLogoPreview(urlData.publicUrl);
            toast.success("Logo perusahaan berhasil diunggah");
        } catch (error: any) {
            console.error("Error uploading logo:", error);
            toast.error(error.message || "Gagal mengunggah logo");
        } finally {
            setIsUploadingLogo(false);
        }
    };

    const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleLogoUpload(file);
        }
    };

    const handleRemoveLogo = () => {
        setLogoPreview(null);
        setFormData({ ...formData, logo_url: "" });
        if (logoFileInputRef.current) {
            logoFileInputRef.current.value = "";
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

            // Validasi: surat izin wajib diisi (cek formData atau initialData)
            const hasLicense = formData.license_url || initialData?.license_url;
            if (!hasLicense) {
                toast.error("Surat izin perusahaan wajib diunggah");
                setIsLoading(false);
                return;
            }
            
            // Validasi: logo wajib diisi (cek formData, initialData, atau logoPreview)
            const hasLogo = formData.logo_url || initialData?.logo_url || logoPreview;
            if (!hasLogo) {
                toast.error("Logo perusahaan wajib diunggah");
                setIsLoading(false);
                return;
            }
            
            // Gunakan license_url dari formData jika ada, jika tidak gunakan dari initialData
            const licenseUrlToSave = formData.license_url || initialData?.license_url || null;

            // Cek apakah recruiter sudah punya company
            const { data: existingCompanyData, error: checkError } = await (supabase
                .from("companies") as any)
                .select("id, is_approved, status, name")
                .eq("recruiter_id", user.id)
                .single();

            if (checkError && checkError.code !== 'PGRST116') {
                console.error("Error checking existing company:", checkError);
                throw new Error(`Gagal memeriksa data perusahaan: ${checkError.message || 'Unknown error'}`);
            }

            const existingCompany = existingCompanyData as { id: string; is_approved: boolean | null; status: string | null; name: string } | null;

            const companyData: any = {
                recruiter_id: user.id,
                name: formData.name || null,
                industry: formData.industry || null,
                location_city: formData.location_city || null,
                location_province: formData.location_province || null,
                address: formData.address || null,
                description: formData.description || null,
                website_url: formData.website_url || null,
                size: formData.size || null,
                logo_url: formData.logo_url || initialData?.logo_url || null,
                license_url: licenseUrlToSave,
            };

            // Hanya set is_approved dan status jika insert baru
            if (!existingCompany) {
                companyData.is_approved = false;
                companyData.status = 'pending';
            }
            // Untuk update, jangan set is_approved dan status (biarkan trigger handle)

            let result;
            if (existingCompany) {
                // Update existing company
                console.log("Updating existing company:", { 
                    companyId: existingCompany.id, 
                    currentStatus: existingCompany.status,
                    isApproved: existingCompany.is_approved,
                    companyData 
                });
                result = await (supabase
                    .from("companies") as any)
                    .update(companyData)
                    .eq("recruiter_id", user.id)
                    .eq("id", existingCompany.id)
                    .select();
            } else {
                // Insert new company
                console.log("Inserting new company:", companyData);
                result = await (supabase
                    .from("companies") as any)
                    .insert(companyData)
                    .select();
            }

            if (result.error) {
                console.error("Supabase error details:", {
                    message: result.error.message,
                    code: result.error.code,
                    details: result.error.details,
                    hint: result.error.hint,
                    error: result.error
                });

                // Handle specific error codes
                if (result.error.code === '23505') { // Unique constraint violation
                    throw new Error("Anda sudah memiliki perusahaan. Satu recruiter hanya boleh memiliki satu perusahaan.");
                } else if (result.error.code === '42501') { // Insufficient privilege (RLS policy violation)
                    throw new Error("Anda tidak memiliki izin untuk melakukan operasi ini. Pastikan profile perusahaan belum disetujui atau hubungi admin.");
                } else if (result.error.code === 'PGRST301') { // Row not found
                    throw new Error("Data perusahaan tidak ditemukan. Silakan refresh halaman dan coba lagi.");
                } else if (result.error.message && result.error.message.includes('infinite recursion')) {
                    throw new Error("Terjadi error pada policy database. Silakan hubungi admin untuk memperbaiki RLS policy. Error: infinite recursion detected in policy.");
                } else if (result.error.message) {
                    throw new Error(result.error.message);
                } else {
                    throw new Error(`Error: ${result.error.code || 'Unknown error'}. ${result.error.details || ''}`);
                }
            }

            console.log("Company saved successfully:", result.data);
            toast.success("Profile perusahaan berhasil disimpan. Menunggu persetujuan admin.");
            router.refresh();
        } catch (error: any) {
            console.error("Error saving company:", {
                error,
                message: error?.message,
                code: error?.code,
                details: error?.details,
                stack: error?.stack,
                fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
            });
            
            // Extract error message
            let errorMessage = "Terjadi kesalahan saat menyimpan profile perusahaan";
            if (error?.message) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            } else if (error?.code) {
                errorMessage = `Error ${error.code}: ${error.details || 'Terjadi kesalahan'}`;
            }
            
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadge = () => {
        if (!initialData) return null;
        
        const status = initialData.status || 'pending';
        const isApproved = initialData.is_approved;

        if (isApproved && status === 'approved') {
            return (
                <Badge className="bg-green-100 text-green-800 border-green-300/40">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Disetujui
                </Badge>
            );
        } else if (status === 'rejected') {
            return (
                <Badge className="bg-red-100 text-red-800 border-red-300/40">
                    <XCircle className="w-3 h-3 mr-1" />
                    Ditolak
                </Badge>
            );
        } else {
            return (
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300/40">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Menunggu Persetujuan
                </Badge>
            );
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Status Badge */}
            {initialData && (
                <Card className="border-0 bg-gradient-to-br from-white to-purple-50/30">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-lg mb-2">Status Persetujuan</h3>
                                <p className="text-sm text-gray-600">
                                    {initialData.is_approved && initialData.status === 'approved'
                                        ? "Profile perusahaan Anda sudah disetujui dan dapat dilihat oleh publik."
                                        : initialData.status === 'rejected'
                                        ? "Profile perusahaan Anda ditolak. Silakan perbaiki data dan kirim ulang."
                                        : "Profile perusahaan Anda sedang menunggu persetujuan admin."}
                                </p>
                            </div>
                            {getStatusBadge()}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Informasi Perusahaan */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        Informasi Perusahaan
                    </CardTitle>
                    <CardDescription>
                        Lengkapi data perusahaan yang Anda wakili
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Nama Perusahaan <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Contoh: PT. Teknologi Indonesia"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="industry">Industri <span className="text-red-500">*</span></Label>
                            <Input
                                id="industry"
                                value={formData.industry}
                                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                placeholder="Contoh: Technology, Finance, Healthcare"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="location_city">Kota <span className="text-red-500">*</span></Label>
                            <Input
                                id="location_city"
                                value={formData.location_city}
                                onChange={(e) => setFormData({ ...formData, location_city: e.target.value })}
                                placeholder="Contoh: Jakarta"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="location_province">Provinsi <span className="text-red-500">*</span></Label>
                            <Input
                                id="location_province"
                                value={formData.location_province}
                                onChange={(e) => setFormData({ ...formData, location_province: e.target.value })}
                                placeholder="Contoh: DKI Jakarta"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Alamat Lengkap Perusahaan</Label>
                        <Textarea
                            id="address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Contoh: Jl. Sudirman No. 123, Gedung ABC, Lantai 5, Jakarta Pusat"
                            rows={3}
                        />
                        <p className="text-xs text-gray-500">
                            Alamat lengkap kantor perusahaan (opsional)
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="website_url">Website <span className="text-red-500">*</span></Label>
                            <Input
                                id="website_url"
                                type="url"
                                value={formData.website_url}
                                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                                placeholder="https://www.example.com"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="size">Ukuran Perusahaan <span className="text-red-500">*</span></Label>
                            <Input
                                id="size"
                                value={formData.size}
                                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                                placeholder="Contoh: 50-100, 100-250"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Deskripsi Perusahaan <span className="text-red-500">*</span></Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Ceritakan tentang perusahaan Anda..."
                            rows={5}
                            required
                            />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="logo_file">Upload Logo Perusahaan (JPG, PNG, maks 5MB) <span className="text-red-500">*</span></Label>
                        <div className="flex items-center gap-2">
                            <input
                                ref={logoFileInputRef}
                                id="logo_file"
                                type="file"
                                accept="image/jpeg,image/png,image/jpg,image/webp"
                                onChange={handleLogoFileChange}
                                className="hidden"
                                disabled={isUploadingLogo}
                                required={!logoPreview}
                            />
                            <label
                                htmlFor="logo_file"
                                className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-gray-50 bg-white"
                            >
                                {isUploadingLogo ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Mengunggah...</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4" />
                                        <span>{logoPreview ? "Ganti Logo" : "Pilih File Logo"}</span>
                                    </>
                                )}
                            </label>
                            {logoPreview && !isUploadingLogo && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <ImageIcon className="w-4 h-4" />
                                    <span>Logo terunggah</span>
                                    <button
                                        type="button"
                                        onClick={handleRemoveLogo}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                        {logoPreview && (
                            <div className="mt-2">
                                <img
                                    src={logoPreview}
                                    alt="Logo perusahaan"
                                    className="w-20 h-20 object-cover rounded-lg border border-gray-300"
                                />
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Surat Izin Perusahaan */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Surat Izin Perusahaan
                        <span className="text-red-500">*</span>
                    </CardTitle>
                    <CardDescription>
                        Unggah surat izin perusahaan (SIUP, NPWP, atau dokumen legal lainnya) untuk validasi admin
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {licenseFileName || formData.license_url ? (
                        <div className="flex items-center justify-between p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl shadow-sm">
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                                <div className="p-3 bg-green-100 rounded-lg shrink-0">
                                    <FileText className="w-6 h-6 text-green-700" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-green-900 mb-1 truncate" title={licenseFileName || formData.license_url || "Surat izin sudah diunggah"}>
                                        {licenseFileName || "Surat izin sudah diunggah"}
                                    </p>
                                    <p className="text-sm text-green-700">
                                        File surat izin sudah tersimpan dan siap untuk validasi admin
                                    </p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleRemoveLicense}
                                className="border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 shrink-0"
                            >
                                <X className="w-4 h-4 mr-1" />
                                Hapus
                            </Button>
                        </div>
                    ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-indigo-400 transition-all duration-200 bg-gray-50/50">
                            <div className="flex flex-col items-center justify-center space-y-4">
                                <div className="p-4 bg-indigo-50 rounded-full">
                                    <FileText className="w-10 h-10 text-indigo-600" />
                                </div>
                                <div className="text-center space-y-2">
                                    <Label htmlFor="license_file" className="cursor-pointer block">
                                        <span className="text-base font-semibold text-gray-900 block mb-1">
                                            Klik untuk mengunggah surat izin
                                        </span>
                                        <p className="text-sm text-gray-600">
                                            Format: PDF, JPG, atau PNG
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Maksimal ukuran file: 10MB
                                        </p>
                                    </Label>
                                    <input
                                        ref={licenseFileInputRef}
                                        id="license_file"
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleLicenseFileChange}
                                        className="hidden"
                                        disabled={isUploadingLicense}
                                        required={!formData.license_url && !initialData?.license_url}
                                    />
                                </div>
                                {isUploadingLicense && (
                                    <div className="flex items-center gap-2 text-sm text-indigo-600 font-medium">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Mengunggah file...
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-amber-800">
                            <span className="font-semibold">Wajib:</span> Surat izin perusahaan harus diunggah untuk proses validasi oleh admin. File yang diunggah akan digunakan untuk verifikasi legalitas perusahaan.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isLoading}
                    className="hover:bg-gray-500 text-gray-700 border-0 bg-gray-400 shadow-sm transition-colors disabled:opacity-50"
                >
                    Batal
                </Button>
                <Button
                    type="submit"
                    disabled={
                        isLoading || 
                        isUploadingLicense || 
                        isUploadingLogo || 
                        (!formData.license_url && !initialData?.license_url) ||
                        (!formData.logo_url && !initialData?.logo_url && !logoPreview)
                    }
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Menyimpan...
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Simpan Profile Perusahaan
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
