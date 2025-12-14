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
import { User, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
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
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "jobseeker" as UserRole,
        agreeToTerms: false,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [emailError, setEmailError] = useState<string | null>(null);
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
        setEmailError(null);
    };

    // Handler untuk validasi format email saat blur
    const handleEmailBlur = () => {
        const email = formData.email.trim();
        if (!email) {
            setEmailError(null);
            return;
        }

        // Validasi format email dasar
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setEmailError("Format email tidak valid");
        } else {
            setEmailError(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validasi email
        if (emailError) {
            toast.error(emailError);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast.error("Password dan konfirmasi tidak sama.");
            return;
        }

        if (!formData.agreeToTerms) {
            toast.warning("Anda harus menyetujui syarat & ketentuan.");
            return;
        }

        setIsLoading(true);

        try {
            // Cek apakah email sudah terdaftar dengan mencoba cek di auth.users
            // Kita tidak bisa akses langsung ke auth.users, jadi kita cek dengan cara lain:
            // Cek apakah ada profile dengan email yang sama (jika email disimpan di profile)
            // Atau lebih baik: cek setelah signUp apakah user benar-benar dibuat

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
                // Handle error khusus untuk email yang sudah terdaftar
                const errorMessage = error.message.toLowerCase();
                const errorCode = error.status || error.code || '';
                
                // Cek berbagai kemungkinan error untuk email yang sudah terdaftar
                if (errorMessage.includes('user already registered') || 
                    errorMessage.includes('email already exists') ||
                    errorMessage.includes('already registered') ||
                    errorMessage.includes('user already exists') ||
                    errorCode === 'signup_disabled' ||
                    (errorMessage.includes('email') && errorMessage.includes('already'))) {
                    const errorMsg = "Email ini sudah terdaftar. Silakan gunakan email lain atau masuk dengan email ini.";
                    setEmailError(errorMsg);
                    toast.error(errorMsg);
                    setIsLoading(false);
                    return;
                }
                
                // Handle error lainnya
                const errorMsg = error.message || "Terjadi kesalahan saat registrasi. Silakan coba lagi.";
                toast.error(errorMsg);
                setIsLoading(false);
                return;
            }

            // Cek apakah user benar-benar dibuat
            // Jika email sudah terdaftar, Supabase mungkin tidak mengembalikan error
            // tapi juga tidak membuat user baru (data.user akan null atau undefined)
            if (!data || !data.user || !data.user.id) {
                // User tidak dibuat, kemungkinan email sudah terdaftar
                const errorMsg = "Email ini sudah terdaftar. Silakan gunakan email lain atau masuk dengan email ini.";
                setEmailError(errorMsg);
                toast.error(errorMsg);
                setIsLoading(false);
                return;
            }

            // Verifikasi bahwa user benar-benar baru dibuat
            // Cek apakah profile sudah ada untuk user ID ini dengan data lengkap
            const { data: existingProfile, error: checkError } = await supabase
                .from("profiles")
                .select("id, full_name, role")
                .eq("id", data.user.id)
                .maybeSingle();

            // Jika profile sudah ada dengan data lengkap (full_name tidak kosong), berarti email terdaftar
            if (existingProfile && existingProfile.full_name && existingProfile.full_name.trim().length > 0) {
                const errorMsg = "Email ini sudah terdaftar. Silakan gunakan email lain atau masuk dengan email ini.";
                setEmailError(errorMsg);
                toast.error(errorMsg);
                setIsLoading(false);
                // Sign out jika ada session
                try {
                    await supabase.auth.signOut();
                } catch (e) {
                    // Ignore error
                }
                return;
            }

            // Tunggu sebentar dan verifikasi session ter-set dengan benar
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Verifikasi session sudah ter-set
            const { data: { user: currentUser }, error: sessionError } = await supabase.auth.getUser();
            
            // Jika tidak ada session (misalnya karena perlu email confirmation), 
            // skip pembuatan profil - akan dibuat otomatis saat login pertama kali
            if (!currentUser || currentUser.id !== data.user.id) {
                console.log("Session belum ter-set (mungkin perlu email confirmation). Profil akan dibuat otomatis saat login.");
            } else {
                // Buat profil di tabel profiles setelah registrasi
                const profileData: any = {
                    id: data.user.id,
                    full_name: formData.name,
                    role: formData.role,
                };

                // Coba insert dulu, jika gagal karena sudah ada, gunakan upsert
                let profileResult: any = null;
                let profileError: any = null;

                // Coba insert terlebih dahulu
                const { data: insertData, error: insertError } = await (supabase
                    .from("profiles") as any)
                    .insert(profileData)
                    .select()
                    .single();

                if (insertError) {
                    // Jika error karena duplicate (profil sudah ada)
                    if (insertError.code === '23505' || insertError.message?.includes('duplicate')) {
                        // Cek apakah profile sudah ada dengan data lengkap
                        const { data: existingProfileCheck } = await supabase
                            .from("profiles")
                            .select("id, full_name, role")
                            .eq("id", data.user.id)
                            .maybeSingle();

                        if (existingProfileCheck && existingProfileCheck.full_name && existingProfileCheck.full_name.trim().length > 0) {
                            // Profile sudah ada dengan data lengkap, berarti email terdaftar
                            const errorMsg = "Email ini sudah terdaftar. Silakan gunakan email lain atau masuk dengan email ini.";
                            setEmailError(errorMsg);
                            toast.error(errorMsg);
                            setIsLoading(false);
                            try {
                                await supabase.auth.signOut();
                            } catch (e) {
                                // Ignore
                            }
                            return;
                        }

                        // Profile ada tapi kosong atau tidak lengkap, gunakan upsert
                        console.log("Profile already exists but empty, using upsert instead");
                        const { data: upsertData, error: upsertError } = await (supabase
                            .from("profiles") as any)
                            .upsert(profileData, {
                                onConflict: "id",
                            })
                            .select()
                            .single();
                        
                        profileResult = upsertData;
                        profileError = upsertError;
                    } else {
                        profileError = insertError;
                    }
                } else {
                    profileResult = insertData;
                }

                // Verifikasi bahwa profile benar-benar dibuat/updated
                if (profileError) {
                    // Jika masih ada error setelah upsert, kemungkinan ada masalah
                    console.error("Error creating/updating profile:", profileError);
                    // Tapi jangan throw error, karena user sudah dibuat
                } else {
                    // Verifikasi bahwa profile benar-benar tersimpan dengan data yang benar
                    const { data: verifyProfile } = await supabase
                        .from("profiles")
                        .select("id, full_name, role")
                        .eq("id", data.user.id)
                        .maybeSingle();

                    if (!verifyProfile) {
                        // Profile tidak dibuat, ada masalah
                        console.warn("Profile tidak berhasil dibuat");
                    } else if (verifyProfile.full_name && verifyProfile.full_name.trim() !== formData.name.trim()) {
                        // Profile sudah ada dengan nama berbeda, berarti email terdaftar
                        const errorMsg = "Email ini sudah terdaftar. Silakan gunakan email lain atau masuk dengan email ini.";
                        setEmailError(errorMsg);
                        toast.error(errorMsg);
                        setIsLoading(false);
                        try {
                            await supabase.auth.signOut();
                        } catch (e) {
                            // Ignore
                        }
                        return;
                    } else {
                        // Profile berhasil dibuat dengan benar
                        console.log("Profile created successfully:", verifyProfile);
                    }
                }

                // Log error dengan detail lengkap jika ada
                if (profileError) {
                const errorInfo: any = {
                    hasError: true,
                    errorType: typeof profileError,
                    errorConstructor: profileError?.constructor?.name,
                };

                // Coba ambil semua properti yang mungkin ada
                if (profileError.message) errorInfo.message = profileError.message;
                if (profileError.code) errorInfo.code = profileError.code;
                if (profileError.details) errorInfo.details = profileError.details;
                if (profileError.hint) errorInfo.hint = profileError.hint;
                if (profileError.statusCode) errorInfo.statusCode = profileError.statusCode;

                // Coba stringify
                try {
                    errorInfo.errorString = JSON.stringify(profileError, null, 2);
                } catch (e) {
                    errorInfo.stringifyError = String(e);
                }

                // Coba ambil semua keys
                try {
                    errorInfo.keys = Object.keys(profileError);
                    errorInfo.ownPropertyNames = Object.getOwnPropertyNames(profileError);
                } catch (e) {
                    // ignore
                }

                errorInfo.profileData = profileData;
                errorInfo.userId = data.user.id;

                console.error("Error creating profile:", errorInfo);
                
                    // Jika error bukan karena profil sudah ada, tampilkan warning
                    if (profileError.code !== '23505' && !profileError.message?.includes('duplicate')) {
                        console.warn("Gagal membuat profil, tetapi user sudah dibuat. Profil mungkin akan dibuat otomatis saat login.");
                    }
                } else {
                    console.log("Profile created successfully:", profileResult);
                    
                    // Untuk recruiter, update is_approved menjadi true setelah insert
                    // (karena trigger akan set false, kita perlu override)
                    if (formData.role === "recruiter") {
                        const { error: updateError } = await (supabase
                            .from("profiles") as any)
                            .update({ is_approved: true })
                            .eq("id", data.user.id);
                        
                        if (updateError) {
                            console.warn("Gagal update is_approved untuk recruiter:", {
                                message: updateError.message,
                                code: updateError.code,
                                details: updateError.details
                            });
                        } else {
                            console.log("is_approved updated to true for recruiter");
                        }
                    }
                }
            }

            // Verifikasi final: pastikan profile benar-benar tersimpan sebelum menampilkan success
            const { data: finalCheck } = await supabase
                .from("profiles")
                .select("id, full_name, role")
                .eq("id", data.user.id)
                .single();

            if (!finalCheck || !finalCheck.full_name || finalCheck.full_name.trim() !== formData.name.trim()) {
                // Profile tidak sesuai atau tidak tersimpan, kemungkinan email terdaftar
                const errorMsg = "Email ini sudah terdaftar. Silakan gunakan email lain atau masuk dengan email ini.";
                setEmailError(errorMsg);
                toast.error(errorMsg);
                setIsLoading(false);
                try {
                    await supabase.auth.signOut();
                } catch (e) {
                    // Ignore
                }
                return;
            }

            const dashboardPath = {
                admin: "/admin/dashboard",
                recruiter: "/recruiter/dashboard",
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
                            onChange={(e) => {
                                setFormData({ ...formData, email: e.target.value });
                                // Reset error saat user mengetik
                                if (emailError) {
                                    setEmailError(null);
                                }
                            }}
                            onBlur={handleEmailBlur}
                            className={`pl-10 ${emailError ? 'border-red-500 focus:border-red-500' : ''}`}
                            required
                        />
                        </div>
                        {emailError && (
                            <p className="text-sm text-red-600 flex items-center gap-1">
                                <AlertCircle className="h-4 w-4" />
                                {emailError}
                            </p>
                        )}
                    </div>

                    {/* Role Field */}
                    <div className="space-y-2">
                        <Label htmlFor="register-role">Saya mendaftar sebagai</Label>
                        <Select
                        value={formData.role}
                        onValueChange={(value) => {
                            setFormData({ ...formData, role: value as UserRole });
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
            <Button type="submit" className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg shadow-indigo-500/30" size="lg" disabled={isLoading}>
                {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
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
