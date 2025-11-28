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
import { User, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
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

            const userId = data.user?.id;
            if (userId) {
                const { error: profileError } = await supabase.from("profiles").upsert({
                    id: userId,
                    full_name: formData.name,
                    role: formData.role,
                    headline: null,
                    location_city: null,
                    skills: [],
                });

                if (profileError) {
                    throw profileError;
                }
            }

            const dashboardPath = {
                admin: "/admin/dashboard",
                recruiter: "/recruiter/dashboard",
                jobseeker: "/job-seeker/dashboard",
            }[formData.role];

            if (data.session) {
                toast.success("Registrasi berhasil! Mengarahkan ke dashboard Anda.");
                closeDialog();
                router.push(dashboardPath);
                router.refresh();
            } else {
                toast.success("Registrasi berhasil! Silakan konfirmasi email Anda.");
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

            <form onSubmit={handleSubmit} className="space-y-4">
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
                <Label htmlFor="register-role">Peran Pengguna</Label>
                <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                >
                <SelectTrigger id="register-role">
                    <SelectValue placeholder="Pilih peran" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="jobseeker">Job Seeker / Pencari Kerja</SelectItem>
                    <SelectItem value="recruiter">Recruiter / Perusahaan</SelectItem>
                    <SelectItem value="admin">Admin Sistem</SelectItem>
                </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                Peran menentukan dashboard dan izin akses yang Anda dapatkan.
                </p>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
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
                <p className="text-gray-500">Minimal 8 karakter</p>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
                <Label htmlFor="register-confirm-password">Konfirmasi Password</Label>
                <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                    id="register-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
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

            {/* Terms & Conditions */}
            <div className="flex items-start gap-2">
                <Checkbox
                id="terms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) =>
                    setFormData({ ...formData, agreeToTerms: checked === true })
                }
                />
                <label htmlFor="terms" className="text-gray-600 cursor-pointer leading-tight">
                Saya menyetujui{" "}
                <a href="#" className="text-blue-600 hover:text-blue-700">
                    syarat dan ketentuan
                </a>{" "}
                serta{" "}
                <a href="#" className="text-blue-600 hover:text-blue-700">
                    kebijakan privasi
                </a>
                </label>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                </>
                ) : (
                "Daftar"
                )}
            </Button>

            {/* Divider */}
            <div className="relative">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-gray-500">
                atau
                </span>
            </div>

            {/* Social Register */}
            <div className="space-y-2">
                <Button type="button" variant="outline" className="w-full" size="lg" disabled={isLoading}>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                </svg>
                Daftar dengan Google
                </Button>
            </div>

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
