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
            // ============================================
            // CEK EMAIL SEBELUM SIGNUP - PENTING!
            // ============================================
            // 1. Cek email di auth.users menggunakan database function
            // Ini adalah pengecekan utama untuk memastikan email belum terdaftar
            const { data: emailExistsInAuth, error: checkEmailError } = await supabase
                .rpc('check_email_exists', {
                    email_to_check: formData.email.trim().toLowerCase()
                } as any);

            if (checkEmailError) {
                console.error("Error checking email in auth.users:", checkEmailError);
                // Jika function tidak ada, lanjutkan dengan pengecekan lain
                // (untuk backward compatibility jika function belum di-deploy)
            } else if (emailExistsInAuth === true) {
                // Email sudah terdaftar di auth.users
                const errorMsg = "Email ini sudah terdaftar. Silakan gunakan email lain atau masuk dengan email ini.";
                setEmailError(errorMsg);
                toast.error(errorMsg);
                setIsLoading(false);
                return;
            }

            // 2. Cek apakah ada profile dengan email yang sama (backup check)
            // Ini untuk memastikan tidak ada email yang terlewat
            const { data: existingProfileByEmail } = await supabase
                .from("profiles")
                .select("id, email, full_name")
                .eq("email", formData.email.trim().toLowerCase())
                .maybeSingle();

            const existingProfile = existingProfileByEmail as { email?: string } | null;
            if (existingProfile && existingProfile.email) {
                const errorMsg = "Email ini sudah terdaftar. Silakan gunakan email lain atau masuk dengan email ini.";
                setEmailError(errorMsg);
                toast.error(errorMsg);
                setIsLoading(false);
                return;
            }

            // 3. Coba signUp - Supabase akan mengembalikan error jika email sudah terdaftar
            // Konfigurasi untuk mempercepat email confirmation:
            // - emailRedirectTo: URL callback yang akan menangani konfirmasi email dan redirect ke dashboard
            //   CATATAN: URL ini HARUS di-whitelist di Supabase Dashboard → Authentication → URL Configuration
            //   Jika belum di-whitelist, akan terjadi error 500. Solusi: whitelist URL atau nonaktifkan emailRedirectTo
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
            const redirectPath = formData.role === 'jobseeker' 
                ? '/job-seeker/dashboard' 
                : formData.role === 'recruiter' 
                ? '/recruiter/dashboard' 
                : '/job-seeker/dashboard';
            
            // Buat emailRedirectTo hanya jika baseUrl valid
            // Jika terjadi error 500, coba tanpa emailRedirectTo sebagai fallback
            const emailRedirectTo = baseUrl ? `${baseUrl}/auth/callback?next=${encodeURIComponent(redirectPath)}` : undefined;

            // SignUp dengan emailRedirectTo (akan error 500 jika URL belum di-whitelist)
            // Jika error 500, akan dicoba lagi tanpa emailRedirectTo
            let { data, error } = await supabase.auth.signUp({
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
                options: {
                    ...(emailRedirectTo && { emailRedirectTo: emailRedirectTo }),
                    data: {
                        full_name: formData.name,
                        role: formData.role,
                    },
                },
            });

            // Jika error 500 dan ada emailRedirectTo, coba lagi tanpa emailRedirectTo
            // Error 500 biasanya terjadi karena URL belum di-whitelist di Supabase
            if (error && (error.status === 500 || error.message?.includes('500')) && emailRedirectTo) {
                console.warn('Error 500 dengan emailRedirectTo, mencoba tanpa emailRedirectTo:', error.message);
                // Retry tanpa emailRedirectTo
                const retryResult = await supabase.auth.signUp({
                    email: formData.email.trim().toLowerCase(),
                    password: formData.password,
                    options: {
                        data: {
                            full_name: formData.name,
                            role: formData.role,
                        },
                    },
                });
                data = retryResult.data;
                error = retryResult.error;
                
                // Jika masih error, tampilkan pesan yang lebih jelas
                if (error) {
                    console.error('Error setelah retry tanpa emailRedirectTo:', error);
                } else {
                    console.log('SignUp berhasil setelah retry tanpa emailRedirectTo');
                }
            }

            if (error) {
                // Handle error khusus untuk email yang sudah terdaftar
                const errorMessage = error.message.toLowerCase();
                const errorCode = error.status || error.code || '';
                
                // Handle error "Error sending confirmation email" - biasanya karena SMTP tidak dikonfigurasi
                if (errorMessage.includes('error sending confirmation email') || 
                    errorMessage.includes('sending confirmation email') ||
                    (error.status === 500 && errorMessage.includes('email'))) {
                    const smtpErrorMsg = "Gagal mengirim email konfirmasi. Pastikan SMTP sudah dikonfigurasi di Supabase Dashboard. Lihat TROUBLESHOOTING_EMAIL_ERROR.md untuk panduan setup.";
                    console.error('SMTP Error:', error);
                    toast.error(smtpErrorMsg, {
                        duration: 8000,
                    });
                    setIsLoading(false);
                    return;
                }
                
                // Cek berbagai kemungkinan error untuk email yang sudah terdaftar
                if (errorMessage.includes('user already registered') || 
                    errorMessage.includes('email already exists') ||
                    errorMessage.includes('already registered') ||
                    errorMessage.includes('user already exists') ||
                    errorMessage.includes('email address is already registered') ||
                    errorMessage.includes('user with this email already exists') ||
                    errorCode === 'signup_disabled' ||
                    errorCode === 'user_already_registered' ||
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

            // Verifikasi tambahan: cek apakah email user sama dengan yang didaftarkan
            if (data.user.email && data.user.email.toLowerCase() !== formData.email.trim().toLowerCase()) {
                // Email tidak sesuai, kemungkinan ada masalah
                const errorMsg = "Terjadi kesalahan saat registrasi. Email tidak sesuai.";
                toast.error(errorMsg);
                setIsLoading(false);
                try {
                    await supabase.auth.signOut();
                } catch (e) {
                    // Ignore
                }
                return;
            }

            // Simpan user ID dan created_at untuk digunakan di seluruh proses
            const newUserId = data.user.id;
            const userCreatedAt: string | undefined = data.user.created_at;
            
            // Catatan: Pengecekan email sudah dilakukan SEBELUM signup menggunakan check_email_exists()
            // Jadi jika sampai di sini, berarti email belum terdaftar di auth.users
            // Kita hanya perlu memastikan tidak ada duplikasi di profiles (edge case)
            
            // Flag untuk menandai apakah email sudah terdaftar
            let isEmailAlreadyRegistered = false;

            // Cek apakah ada profile dengan email yang sama tapi user ID berbeda
            // Hanya block jika ada profile LENGKAP (dengan full_name) dengan email yang sama
            // Ini untuk menangani edge case di mana ada duplikasi di profiles
            const { data: emailCheckProfiles } = await supabase
                .from("profiles")
                .select("id, email, full_name")
                .eq("email", formData.email.trim().toLowerCase());

            if (emailCheckProfiles && emailCheckProfiles.length > 0) {
                // Cek apakah ada profile dengan email yang sama tapi user ID berbeda
                // DAN memiliki full_name lengkap (berarti sudah terdaftar sebelumnya)
                const otherProfile = (emailCheckProfiles as any[]).find(
                    (p: any) => p.id !== newUserId && 
                    p.full_name && 
                    p.full_name.trim().length > 0
                );
                
                if (otherProfile) {
                    // Email sudah terdaftar dengan user ID lain yang memiliki profile lengkap
                    // Ini berarti email sudah terdaftar sebelumnya
                    isEmailAlreadyRegistered = true;
                    const errorMsg = "Email ini sudah terdaftar. Silakan gunakan email lain atau masuk dengan email ini.";
                    setEmailError(errorMsg);
                    toast.error(errorMsg);
                    setIsLoading(false);
                    // Hapus user yang baru dibuat
                    try {
                        await supabase.auth.signOut();
                    } catch (e) {
                        // Ignore error
                    }
                    return;
                }
            }

            // Untuk jobseeker, langsung buat profile dengan is_approved = true
            // agar bisa langsung login tanpa perlu approval admin
            // Untuk role lain (recruiter), tetap perlu approval admin
            const isJobseeker = formData.role === 'jobseeker';
            const shouldAutoApprove = isJobseeker; // Hanya jobseeker yang auto-approve
            
            // Buat profil di tabel profiles setelah registrasi
            const profileData: any = {
                id: newUserId,
                full_name: formData.name,
                role: formData.role,
                email: formData.email.trim().toLowerCase(),
                is_approved: shouldAutoApprove ? true : false, // Auto aktif untuk jobseeker, recruiter perlu approval
            };

            // Untuk jobseeker, selalu coba buat profile langsung (bahkan jika belum ada session)
            // Jika gagal karena RLS (belum ada session), tidak apa-apa - profile akan dibuat otomatis saat login
            // Untuk role lain (recruiter), tunggu session ter-set
            let shouldCreateProfile = false;
            let hasSession = false;
            
            if (isJobseeker) {
                // Jobseeker: selalu coba buat profile, bahkan jika belum ada session
                // Jika gagal karena RLS, profile akan dibuat otomatis saat login pertama kali
                shouldCreateProfile = true;
            } else {
                // Role lain: tunggu session ter-set
                await new Promise(resolve => setTimeout(resolve, 500));
                const { data: { user: currentUser }, error: sessionError } = await supabase.auth.getUser();
                
                if (currentUser && currentUser.id === newUserId) {
                    shouldCreateProfile = true;
                    hasSession = true;
                } else {
                    console.log("Session belum ter-set (mungkin perlu email confirmation). Profil akan dibuat otomatis saat login.");
                }
            }

            // Cek apakah ada session untuk jobseeker juga
            if (isJobseeker && !hasSession) {
                const { data: { user: currentUser } } = await supabase.auth.getUser();
                hasSession = !!(currentUser && currentUser.id === newUserId);
            }

            if (shouldCreateProfile) {

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
                            .select("id, full_name, role, email")
                            .eq("id", newUserId)
                            .maybeSingle();

                        const profileCheck = existingProfileCheck as { full_name?: string } | null;
                        if (profileCheck && profileCheck.full_name && profileCheck.full_name.trim().length > 0) {
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
                    // Untuk jobseeker yang belum ada session, error RLS adalah normal
                    // Profile akan dibuat otomatis saat login pertama kali
                    if (isJobseeker && !hasSession) {
                        // Error karena RLS (belum ada session) adalah normal untuk jobseeker
                        // Profile akan dibuat otomatis saat login pertama kali oleh useAuth hook
                        console.log("Profile jobseeker belum dibuat karena belum ada session (perlu email confirmation). Profile akan dibuat otomatis saat login.");
                    } else {
                        // Untuk kasus lain, log error
                        console.error("Error creating/updating profile:", profileError);
                        // Jika error bukan karena duplicate, berarti ada masalah serius
                        // Tapi jangan throw error, karena user sudah dibuat dan email sudah terkirim
                        // Kita akan tetap lanjutkan, profile mungkin akan dibuat otomatis oleh trigger
                    }
                } else {
                    // Verifikasi bahwa profile benar-benar tersimpan dengan data yang benar
                    const { data: verifyProfile } = await supabase
                        .from("profiles")
                        .select("id, full_name, role, email")
                        .eq("id", newUserId)
                        .maybeSingle();

                    if (!verifyProfile) {
                        // Profile tidak dibuat, ada masalah
                        console.warn("Profile tidak berhasil dibuat, tetapi user sudah dibuat. Profile mungkin akan dibuat otomatis saat login.");
                    } else {
                        const verifyProfileData = verifyProfile as { full_name?: string } | null;
                        if (verifyProfileData && verifyProfileData.full_name && verifyProfileData.full_name.trim() !== formData.name.trim()) {
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
                }

                // Verifikasi profile untuk jobseeker dengan session
                if (profileError) {
                    // Untuk jobseeker yang belum ada session, error RLS adalah normal
                    if (isJobseeker && !hasSession) {
                        // Error karena RLS (belum ada session) adalah normal untuk jobseeker
                        // Profile akan dibuat otomatis saat login pertama kali oleh useAuth hook
                        console.log("Profile jobseeker belum dibuat karena belum ada session (perlu email confirmation). Profile akan dibuat otomatis saat login.");
                    } else {
                        // Log error dengan detail untuk debugging
                        const errorInfo: any = {
                            hasError: true,
                            errorType: typeof profileError,
                            errorConstructor: profileError?.constructor?.name,
                        };

                        // Coba ambil semua properti yang mungkin ada
                        if (profileError && typeof profileError === 'object') {
                            if ('message' in profileError) errorInfo.message = (profileError as any).message;
                            if ('code' in profileError) errorInfo.code = (profileError as any).code;
                            if ('details' in profileError) errorInfo.details = (profileError as any).details;
                            if ('hint' in profileError) errorInfo.hint = (profileError as any).hint;
                            if ('statusCode' in profileError) errorInfo.statusCode = (profileError as any).statusCode;

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
                        } else {
                            errorInfo.errorValue = String(profileError);
                        }

                        errorInfo.profileData = profileData;
                        errorInfo.userId = newUserId;
                        errorInfo.isJobseeker = isJobseeker;
                        errorInfo.hasSession = hasSession;

                        console.error("Error creating profile:", errorInfo);
                        
                        // Jika error bukan karena profil sudah ada, tampilkan warning
                        const errorCode = (profileError as any)?.code;
                        const errorMessage = (profileError as any)?.message || '';
                        if (errorCode !== '23505' && !errorMessage.includes('duplicate')) {
                            console.warn("Gagal membuat profil, tetapi user sudah dibuat. Profil mungkin akan dibuat otomatis saat login.");
                        }
                    }
                } else {
                    console.log("Profile created successfully:", profileResult);
                    
                    // Pastikan is_approved = true hanya untuk jobseeker
                    // Recruiter tetap perlu approval admin
                    if (isJobseeker) {
                        const { error: updateError } = await (supabase
                            .from("profiles") as any)
                            .update({ is_approved: true })
                            .eq("id", newUserId);
                        
                        if (updateError) {
                            console.warn("Gagal update is_approved untuk jobseeker:", {
                                message: updateError.message,
                                code: updateError.code,
                                details: updateError.details
                            });
                        } else {
                            console.log("is_approved updated to true untuk jobseeker");
                        }
                    }
                }
            }

            // Untuk jobseeker, verifikasi final bahwa profile sudah dibuat dengan is_approved = true
            // Ini penting agar jobseeker bisa langsung login
            // Hanya lakukan verifikasi jika ada session (user sudah terkonfirmasi)
            if (isJobseeker && data.session) {
                const { data: finalCheck } = await supabase
                    .from("profiles")
                    .select("id, full_name, role, email, is_approved")
                    .eq("id", newUserId)
                    .maybeSingle();

                const finalCheckData = finalCheck as { full_name?: string; is_approved?: boolean } | null;
                if (!finalCheckData || !finalCheckData.full_name || finalCheckData.full_name.trim() !== formData.name.trim()) {
                    // Profile tidak sesuai atau tidak tersimpan
                    console.warn("Profile jobseeker tidak sesuai setelah registrasi. Mencoba membuat ulang...");
                    
                    // Coba buat ulang profile untuk jobseeker (hanya jika ada session)
                    try {
                        const { error: retryError } = await (supabase
                            .from("profiles") as any)
                            .upsert({
                                id: newUserId,
                                full_name: formData.name,
                                role: formData.role,
                                email: formData.email.trim().toLowerCase(),
                                is_approved: true, // Pastikan jobseeker langsung aktif
                            }, {
                                onConflict: "id",
                            });
                        
                        if (retryError) {
                            // Log error dengan detail
                            const errorDetails: any = {
                                message: retryError?.message || 'Unknown error',
                                code: retryError?.code || 'Unknown code',
                                details: retryError?.details || null,
                                hint: retryError?.hint || null,
                            };
                            
                            // Coba stringify error
                            try {
                                errorDetails.fullError = JSON.stringify(retryError, null, 2);
                            } catch (e) {
                                errorDetails.stringifyError = String(e);
                            }
                            
                            console.error("Gagal membuat ulang profile jobseeker:", errorDetails);
                            console.warn("Profile akan dibuat otomatis saat jobseeker login pertama kali setelah konfirmasi email.");
                        } else {
                            console.log("Profile jobseeker berhasil dibuat ulang dengan is_approved = true");
                        }
                    } catch (e: any) {
                        const errorDetails = {
                            message: e?.message || String(e),
                            stack: e?.stack || null,
                            name: e?.name || null,
                        };
                        console.error("Error saat membuat ulang profile:", errorDetails);
                        console.warn("Profile akan dibuat otomatis saat jobseeker login pertama kali setelah konfirmasi email.");
                    }
                } else if (finalCheckData && finalCheckData.is_approved !== true) {
                    // Pastikan is_approved = true untuk jobseeker
                    console.log("Memastikan is_approved = true untuk jobseeker...");
                    const { error: ensureApprovedError } = await (supabase
                        .from("profiles") as any)
                        .update({ is_approved: true })
                        .eq("id", newUserId);
                    
                    if (ensureApprovedError) {
                        const errorDetails: any = {
                            message: ensureApprovedError?.message || 'Unknown error',
                            code: ensureApprovedError?.code || 'Unknown code',
                        };
                        console.error("Gagal memastikan is_approved = true:", errorDetails);
                    } else {
                        console.log("is_approved berhasil di-set ke true untuk jobseeker");
                    }
                }
            } else if (isJobseeker && !data.session) {
                // Jobseeker belum ada session (perlu email confirmation)
                // Profile akan dibuat otomatis saat login pertama kali dengan is_approved = true
                console.log("Jobseeker belum ada session. Profile akan dibuat otomatis saat login pertama kali dengan is_approved = true.");
            }

            // ============================================
            // VERIFIKASI FINAL: Pastikan email belum terdaftar
            // ============================================
            // Catatan: Pengecekan utama sudah dilakukan SEBELUM signup menggunakan check_email_exists()
            // Pengecekan di sini hanya untuk memastikan tidak ada duplikasi di profiles (edge case)
            
            // Jika flag isEmailAlreadyRegistered sudah true, langsung block
            if (isEmailAlreadyRegistered) {
                const errorMsgDuplicate = "Email ini sudah terdaftar. Silakan gunakan email lain atau masuk dengan email ini.";
                setEmailError(errorMsgDuplicate);
                toast.error(errorMsgDuplicate);
                setIsLoading(false);
                try {
                    await supabase.auth.signOut();
                } catch (e) {
                    // Ignore error
                }
                return;
            }
            
            // Final check: cek sekali lagi di profiles untuk memastikan tidak ada duplikasi
            // Hanya block jika ada profile LENGKAP (dengan full_name) dengan email yang sama dan user ID berbeda
            // Ini untuk menangani edge case di mana ada duplikasi di profiles
            const { data: finalEmailCheck } = await supabase
                .from("profiles")
                .select("id, email, full_name")
                .eq("email", formData.email.trim().toLowerCase());

            if (finalEmailCheck && finalEmailCheck.length > 0) {
                // Cek apakah ada profile dengan email yang sama yang:
                // - Bukan profile yang baru dibuat (id berbeda)
                // - Memiliki full_name lengkap (berarti sudah terdaftar sebelumnya)
                const duplicateProfile = (finalEmailCheck as any[]).find(
                    (p: any) => p.id !== newUserId && 
                    p.full_name && 
                    p.full_name.trim().length > 0
                );

                if (duplicateProfile) {
                    // Email sudah terdaftar dengan profile lengkap yang berbeda
                    const errorMsgDuplicate = "Email ini sudah terdaftar. Silakan gunakan email lain atau masuk dengan email ini.";
                    setEmailError(errorMsgDuplicate);
                    toast.error(errorMsgDuplicate);
                    setIsLoading(false);
                    try {
                        await supabase.auth.signOut();
                    } catch (e) {
                        // Ignore error
                    }
                    return;
                }
            }

            const dashboardPath = {
                admin: "/admin/dashboard",
                recruiter: "/recruiter/dashboard",
                jobseeker: "/job-seeker/dashboard",
            }[formData.role] || "/job-seeker/dashboard";

            if (data.session) {
                // Ada session, tampilkan notifikasi dulu, baru redirect setelah delay
                if (isJobseeker) {
                    toast.success("Registrasi berhasil! Akun Anda sudah aktif. Mengarahkan ke dashboard...");
                } else {
                    toast.success("Registrasi berhasil! Mengarahkan ke dashboard Anda.");
                }
                closeDialog();
                
                // Tunggu sebentar agar notifikasi terlihat sebelum redirect
                setTimeout(() => {
                    // Menggunakan window.location.href untuk full page reload.
                    // Ini memastikan middleware berjalan dengan benar setelah registrasi.
                    // Lebih reliable untuk mobile dan desktop
                    if (typeof window !== "undefined") {
                        window.location.href = dashboardPath;
                    }
                }, 1500); // Delay 1.5 detik agar notifikasi terlihat
            } else {
                // Tidak ada session, perlu email confirmation
                if (isJobseeker) {
                    toast.success("Registrasi berhasil! Silakan cek email Anda untuk konfirmasi. Setelah konfirmasi, Anda bisa langsung login - akun Anda sudah aktif.");
                } else {
                    toast.success("Registrasi berhasil! Silakan cek email Anda untuk konfirmasi sebelum masuk.");
                }
                closeDialog();
            }
        } catch (err) {
            // Jika ada error di catch, berarti ada masalah serius
            // User mungkin sudah dibuat dan email sudah terkirim
            const message = err instanceof Error ? err.message : "Terjadi kesalahan saat registrasi.";
            console.error("Error during registration:", err);
            
            // Cek apakah user sudah dibuat sebelum error
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    // User sudah dibuat, email mungkin sudah terkirim
                    toast.warning("Registrasi mungkin berhasil, tetapi ada masalah teknis. Silakan cek email Anda atau coba login.");
                } else {
                    // User tidak dibuat, tampilkan error biasa
                    toast.error(message);
                }
            } catch (checkErr) {
                // Tidak bisa cek user, tampilkan error biasa
                toast.error(message);
            }
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
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                        <Input
                            id="register-email"
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            autoCapitalize="none"
                            autoCorrect="off"
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
                            className={`pl-10 relative z-0 ${emailError ? 'border-red-500 focus:border-red-500' : ''}`}
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
                        <SelectContent className="bg-white text-black">
                            <SelectItem value="jobseeker" className="text-black hover:bg-gray-100">Pencari Kerja</SelectItem>
                            <SelectItem value="recruiter" className="text-black hover:bg-gray-100">Recruiter / Perusahaan</SelectItem>
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
