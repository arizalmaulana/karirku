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

            if (!data.user) {
                throw new Error("Gagal membuat akun pengguna");
            }

            // Buat profil di tabel profiles setelah registrasi
            // Gunakan upsert untuk menghindari error jika profil sudah ada
            const { error: profileError } = await (supabase
                .from("profiles") as any)
                .upsert({
                    id: data.user.id,
                    full_name: formData.name,
                    role: formData.role,
                }, {
                    onConflict: "id",
                });

            if (profileError) {
                // Log error tapi jangan throw, karena user sudah dibuat
                console.error("Error creating profile:", profileError);
            }

            const dashboardPath = {
                admin: "/admin/dashboard",
                recruiter: "/recruiter/dashboard",
                jobseeker: "/job-seeker/dashboard",
            }[formData.role];

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
                        onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
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
