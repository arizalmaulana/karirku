'use client';

import { useMemo, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Mail, Lock, Eye, EyeOff, Loader2, Upload, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createBrowserClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/types";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface RegisterDialogProps {
    open: boolean;
    onClose: () => void;
    onSwitchToLogin: () => void;
}

export function RegisterDialog({
    open,
    onClose,
    onSwitchToLogin,
}: RegisterDialogProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [licenseFile, setLicenseFile] = useState<File | null>(null);
    const [isUploadingLicense, setIsUploadingLicense] = useState(false);
    const [licensePreviewUrl, setLicensePreviewUrl] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "jobseeker" as UserRole,
        agreeToTerms: false,
    });
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const supabase = useMemo(() => createBrowserClient(), []);

    const closeDialog = () => {
        onClose();
        setFormData({
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
            role: "jobseeker",
            agreeToTerms: false,
        });
        setLicenseFile(null);
        setLicensePreviewUrl(null);
    };

    const handleLicenseFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        // Validate file type (PDF, JPG, PNG)
        const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (!validTypes.includes(selectedFile.type)) {
            toast.error('File harus berupa PDF, JPG, atau PNG');
            return;
        }

        // Validate file size (max 10MB)
        if (selectedFile.size > 10 * 1024 * 1024) {
            toast.error('Ukuran file maksimal 10MB');
            return;
        }

        setLicenseFile(selectedFile);

        // Create preview for images
        if (selectedFile.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLicensePreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        } else {
            setLicensePreviewUrl(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error("Password dan konfirmasi tidak sama.");
            return;
        }

        if (!formData.agreeToTerms) {
            toast.warning("Anda harus menyetujui syarat & ketentuan.");
            return;
        }

        // Validasi untuk recruiter: harus upload surat izin
        if (formData.role === "recruiter" && !licenseFile) {
            toast.error("Recruiter harus mengupload surat izin perusahaan.");
            return;
        }

        setIsLoading(true);

        try {
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.name,
                        role: formData.role,
                    },
                },
            });

            if (error) {
                throw error;
            }

            if (!data.user) {
                throw new Error("Gagal membuat akun pengguna");
            }

            // Upload surat izin jika recruiter
            let licenseUrl: string | null = null;
            if (formData.role === "recruiter" && licenseFile) {
                setIsUploadingLicense(true);
                try {
                    const fileExt = licenseFile.name.split('.').pop();
                    const fileName = `license_${data.user.id}_${Date.now()}.${fileExt}`;
                    // Upload langsung ke root bucket, tidak perlu subfolder
                    const filePath = fileName;

                    // Try documents bucket first (more reliable, supports all file types)
                    // Fallback to company_licenses if documents fails
                    let bucketName = 'documents';
                    let uploadError: any = null;
                    const filePathDocuments = `licenses/${fileName}`;

                    const { data: uploadData, error: uploadErr } = await supabase.storage
                        .from(bucketName)
                        .upload(filePathDocuments, licenseFile, {
                            cacheControl: '3600',
                            upsert: false,
                        });
                    
                    // Log untuk debugging
                    if (uploadErr) {
                        console.log('Upload error:', {
                            bucket: bucketName,
                            path: filePathDocuments,
                            error: uploadErr,
                            message: uploadErr.message,
                            statusCode: uploadErr.statusCode,
                            name: uploadErr.name
                        });
                    } else {
                        console.log('Upload success:', uploadData);
                    }

                    if (uploadErr) {
                        // Extract error message
                        const errMsg = uploadErr.message || 
                                      (typeof uploadErr === 'string' ? uploadErr : JSON.stringify(uploadErr)) || 
                                      '';
                        
                        // If documents bucket fails (MIME type, RLS, or not found), try applications bucket
                        const lowerMsg = errMsg.toLowerCase();
                        if (lowerMsg.includes('not found') || 
                            lowerMsg.includes('bucket') ||
                            lowerMsg.includes('row-level security') ||
                            lowerMsg.includes('rls') ||
                            lowerMsg.includes('mime type') ||
                            lowerMsg.includes('not supported') ||
                            lowerMsg.includes('mime') ||
                            lowerMsg.includes('policy')) {
                            console.warn('documents bucket error, trying applications bucket...', uploadErr);
                            bucketName = 'applications';
                            const filePathApplications = `licenses/${fileName}`;
                            const { error: applicationsError } = await supabase.storage
                                .from('applications')
                                .upload(filePathApplications, licenseFile, {
                                    cacheControl: '3600',
                                    upsert: false,
                                });
                            
                            if (applicationsError) {
                                // Last fallback: try company_licenses
                                console.warn('applications bucket error, trying company_licenses bucket...', applicationsError);
                                bucketName = 'company_licenses';
                                const { error: companyLicensesError } = await supabase.storage
                                    .from('company_licenses')
                                    .upload(filePath, licenseFile, {
                                        cacheControl: '3600',
                                        upsert: false,
                                    });
                                
                                if (companyLicensesError) {
                                    uploadError = companyLicensesError;
                                } else {
                                    const { data: urlData } = supabase.storage
                                        .from('company_licenses')
                                        .getPublicUrl(filePath);
                                    licenseUrl = urlData.publicUrl;
                                }
                            } else {
                                const { data: urlData } = supabase.storage
                                    .from('applications')
                                    .getPublicUrl(filePathApplications);
                                licenseUrl = urlData.publicUrl;
                            }
                        } else {
                            uploadError = uploadErr;
                        }
                    } else {
                        const { data: urlData } = supabase.storage
                            .from(bucketName)
                            .getPublicUrl(filePathDocuments);
                        licenseUrl = urlData.publicUrl;
                    }

                    if (uploadError) {
                        // Log detailed error for debugging
                        const errorMessage = uploadError.message || 
                                           (typeof uploadError === 'string' ? uploadError : JSON.stringify(uploadError)) || 
                                           'Unknown error';
                        // Try to get more error details
                        const errorDetails: any = {
                            message: errorMessage,
                            statusCode: uploadError.statusCode,
                            name: uploadError.name,
                            error: uploadError
                        };
                        
                        // Try to stringify with all properties
                        try {
                            errorDetails.fullError = JSON.stringify(uploadError, Object.getOwnPropertyNames(uploadError), 2);
                        } catch (e) {
                            errorDetails.fullError = String(uploadError);
                        }
                        
                        console.error("Upload error details:", errorDetails);
                        
                        // Check for specific error types
                        const lowerMsg = errorMessage.toLowerCase();
                        if (lowerMsg.includes('row-level security') || 
                            lowerMsg.includes('rls') ||
                            lowerMsg.includes('violates row-level security') ||
                            lowerMsg.includes('policy')) {
                            throw new Error('Gagal mengunggah surat izin: Policy keamanan belum dikonfigurasi. Pastikan sudah menjalankan script fix_storage_rls_policy.sql untuk semua bucket (company_licenses, documents, applications).');
                        }
                        
                        if (lowerMsg.includes('mime type') || lowerMsg.includes('not supported')) {
                            throw new Error('Gagal mengunggah surat izin: Format file tidak didukung. Pastikan bucket storage dikonfigurasi untuk menerima PDF, JPG, atau PNG.');
                        }
                        
                        throw new Error(`Gagal mengunggah surat izin: ${errorMessage || 'Unknown error. Cek console untuk detail.'}`);
                    }
                } catch (uploadError: any) {
                    console.error("Error uploading license:", uploadError);
                    
                    // Extract error message
                    const errorMessage = uploadError?.message || 
                                       (typeof uploadError === 'string' ? uploadError : JSON.stringify(uploadError)) ||
                                       'Unknown error occurred';
                    
                    const lowerMsg = errorMessage.toLowerCase();
                    // Re-throw dengan pesan yang lebih jelas
                    if (lowerMsg.includes('row-level security') || 
                        lowerMsg.includes('rls') ||
                        lowerMsg.includes('violates row-level security') ||
                        lowerMsg.includes('policy')) {
                        throw new Error('Gagal mengunggah surat izin: Policy keamanan belum dikonfigurasi. Pastikan sudah menjalankan script fix_storage_rls_policy.sql untuk semua bucket (company_licenses, documents, applications).');
                    }
                    
                    throw new Error(`Gagal mengunggah surat izin: ${errorMessage}`);
                } finally {
                    setIsUploadingLicense(false);
                }
            }

            // Buat profil di tabel profiles setelah registrasi
            // Gunakan upsert untuk menghindari error jika profil sudah ada
            const profileData: any = {
                id: data.user.id,
                full_name: formData.name,
                role: formData.role,
            };

            // Tambahkan company_license_url jika recruiter
            if (formData.role === "recruiter") {
                profileData.company_license_url = licenseUrl;
                profileData.is_approved = false; // Default false untuk recruiter baru
            } else {
                profileData.is_approved = true; // Admin dan jobseeker langsung approved
            }

            const { error: profileError } = await (supabase
                .from("profiles") as any)
                .upsert(profileData, {
                    onConflict: "id",
                });

            if (profileError) {
                // Log error tapi jangan throw, karena user sudah dibuat
                console.error("Error creating profile:", profileError);
            }

            // Untuk recruiter, tidak langsung redirect ke dashboard karena perlu approval
            if (formData.role === "recruiter") {
                toast.success("Registrasi berhasil! Akun Anda sedang menunggu persetujuan admin. Anda akan mendapat notifikasi setelah disetujui.");
                closeDialog();
                // Redirect ke home karena belum approved
                setTimeout(() => {
                    window.location.href = "/";
                }, 1500);
            } else {
            const dashboardPath = {
                admin: "/admin/dashboard",
                jobseeker: "/job-seeker/dashboard",
                }[formData.role] || "/job-seeker/dashboard";

            if (data.session) {
                toast.success("Registrasi berhasil! Mengarahkan ke dashboard Anda.");
                closeDialog();
                // Menggunakan window.location.href untuk full page reload.
                // Ini memastikan middleware berjalan dengan benar setelah registrasi.
                window.location.href = dashboardPath;
            } else {
                toast.success("Registrasi berhasil! Silakan konfirmasi email Anda sebelum masuk.");
                closeDialog();
                }
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Terjadi kesalahan saat registrasi.";
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
            if (!nextOpen) {
                closeDialog();
            }
        }}
        >
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
            <DialogTitle>Buat Akun Baru</DialogTitle>
            <DialogDescription>
                Daftar sekarang untuk mulai mencari pekerjaan impian Anda
            </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    {/* Name Field */}
                    <div className="space-y-2">
                        <Label htmlFor="register-name">Nama Lengkap</Label>
                        <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            id="register-name"
                            type="text"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="pl-10"
                            required
                        />
                        </div>
                    </div>

                    {/* Email Field */}
                    <div className="space-y-2">
                        <Label htmlFor="register-email">Email</Label>
                        <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            id="register-email"
                            type="email"
                            placeholder="nama@email.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="pl-10"
                            required
                        />
                        </div>
                    </div>

                    {/* Role Field */}
                    <div className="space-y-2">
                        <Label htmlFor="register-role">Saya mendaftar sebagai</Label>
                        <Select
                        value={formData.role}
                        onValueChange={(value) => {
                            setFormData({ ...formData, role: value as UserRole });
                            // Reset license file jika ganti role
                            if (value !== "recruiter") {
                                setLicenseFile(null);
                                setLicensePreviewUrl(null);
                            }
                        }}
                        >
                        <SelectTrigger id="register-role">
                            <SelectValue placeholder="Pilih peran" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-white-50 text-gray-900 dark:text-black-50">
                            <SelectItem value="jobseeker" className="focus:bg-blue-50 focus:text-blue-800">Pencari Kerja</SelectItem>
                            <SelectItem value="recruiter" className="focus:bg-blue-50 focus:text-blue-800">Recruiter / Perusahaan</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>

                    {/* License Upload Field - Hanya muncul jika role = recruiter */}
                    {formData.role === "recruiter" && (
                        <div className="space-y-2">
                            <Label htmlFor="register-license">
                                Surat Izin Perusahaan <span className="text-red-500">*</span>
                            </Label>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="register-license"
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleLicenseFileChange}
                                        disabled={isLoading || isUploadingLicense}
                                        className="flex-1"
                                        required={formData.role === "recruiter"}
                                    />
                                </div>
                                <p className="text-xs text-gray-500">
                                    Format: PDF, JPG, atau PNG (maksimal 10MB)
                                </p>
                                {licensePreviewUrl && (
                                    <div className="mt-2 border rounded-lg p-2 bg-gray-50">
                                        <img
                                            src={licensePreviewUrl}
                                            alt="Preview surat izin"
                                            className="max-w-full h-auto max-h-48 mx-auto"
                                        />
                                    </div>
                                )}
                                {licenseFile && !licensePreviewUrl && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                                        <FileText className="h-4 w-4" />
                                        <span>{licenseFile.name}</span>
                                        <span className="text-gray-400">
                                            ({(licenseFile.size / 1024 / 1024).toFixed(2)} MB)
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    {/* Password Field */}
                    <div className="space-y-2">
                        <Label htmlFor="register-password">Password</Label>
                        <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            id="register-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Minimal 8 karakter"
                            value={formData.password}
                            onChange={(e) =>
                            setFormData({ ...formData, password: e.target.value })
                            }
                            className="pl-10 pr-10"
                            required
                            minLength={8}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                            ) : (
                            <Eye className="w-5 h-5" />
                            )}
                        </button>
                        </div>
                    </div>

                    {/* Confirm Password Field */}
                    <div className="space-y-2">
                        <Label htmlFor="register-confirm-password">Konfirmasi Password</Label>
                        <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            id="register-confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Ulangi password Anda"
                            value={formData.confirmPassword}
                            onChange={(e) =>
                            setFormData({ ...formData, confirmPassword: e.target.value })
                            }
                            className="pl-10 pr-10"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showConfirmPassword ? (
                            <EyeOff className="w-5 h-5" />
                            ) : (
                            <Eye className="w-5 h-5" />
                            )}
                        </button>
                        </div>
                    </div>
                </div>

                {/* Terms & Conditions */}
                <div className="flex items-start gap-3">
                    <Checkbox
                    id="terms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) =>
                        setFormData({ ...formData, agreeToTerms: checked === true })
                    }
                    className="mt-0.5 border-black"
                    />
                    <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer leading-tight">
                    Saya menyetujui{" "}
                    <a href="/terms" target="_blank" className="text-blue-600 hover:underline">
                        Syarat & Ketentuan
                    </a>{" "}
                    serta{" "}
                    <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">
                        Kebijakan Privasi
                    </a>
                    </label>
                </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg shadow-indigo-500/30" size="lg" disabled={isLoading || isUploadingLicense}>
                {isLoading || isUploadingLicense ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isUploadingLicense ? "Mengunggah surat izin..." : "Memproses..."}
                </>
                ) : (
                "Daftar"
                )}
            </Button>

            {/* Login Link */}
            <div className="text-center text-gray-600">
                Sudah punya akun?{" "}
                <button
                type="button"
                onClick={() => {
                    closeDialog();
                    onSwitchToLogin();
                }}
                className="text-blue-600 hover:text-blue-700 transition"
                >
                Masuk di sini
                </button>
            </div>
            </form>
        </DialogContent>
        </Dialog>
    );
}
