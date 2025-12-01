import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/lib/types";

interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
  redirectTo?: string;
  message?: string;
}

const roleRedirectMap: Record<UserRole, string> = {
  admin: "/admin/dashboard",
  recruiter: "/recruiter/dashboard",
  jobseeker: "/job-seeker/dashboard",
};

export function LoginDialog({
  open,
  onClose,
  onSwitchToRegister,
  redirectTo,
  message,
}: LoginDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const supabase = useMemo(() => createBrowserClient(), []);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoading) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        throw error;
      }

      const userId = data.user?.id;
      if (!userId) {
        throw new Error("Gagal mendapatkan data pengguna");
      }

      // Ambil role dari user_metadata terlebih dahulu sebagai fallback
      const userMetadata = data.user.user_metadata;
      let role: UserRole = (userMetadata?.role as UserRole) || "jobseeker";

      // Coba fetch profil, tapi jangan biarkan error memblokir login
      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .maybeSingle();

        // Jika tidak ada error dan data ada, gunakan role dari profil
        if (!profileError && profileData) {
          const profile = profileData as { role?: UserRole };
          role = profile.role ?? role;
        } else if (profileError && profileError.code !== "PGRST116") {
          // Jika error selain "not found", log dan tetap lanjutkan
          console.warn("Profile fetch error during login:", {
            message: profileError.message,
            code: profileError.code,
          });
        }
      } catch (err: any) {
        // Log error tapi jangan blokir login
        console.warn("Error fetching profile during login:", {
          message: err?.message,
          code: err?.code,
          details: err?.details,
          error: err,
        });
      }

      // Pastikan role valid
      if (!role || !roleRedirectMap[role]) {
        role = "jobseeker";
      }

      const destination = redirectTo ?? roleRedirectMap[role];

      toast.success("Berhasil masuk, mengarahkan ke dashboard Anda.");
      onClose();

      // Delay untuk memastikan session cookie sudah ter-set dan middleware bisa jalan
      setTimeout(() => {
        // Full page reload supaya middleware dijalankan
        window.location.href = destination;
      }, 300);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Terjadi kesalahan saat login";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      toast.info("Masukkan email terlebih dahulu untuk mengatur ulang password.");
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(
        formData.email,
      );

      if (error) {
        throw error;
      }

      toast.success("Tautan reset password telah dikirim ke email Anda.");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Gagal mengirim tautan reset password";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Masuk ke Akun Anda</DialogTitle>
          <DialogDescription>
            {message ||
              "Masukkan email dan password Anda untuk melanjutkan"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                id="login-email"
                type="email"
                placeholder="nama@email.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password">Password</Label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-blue-600 transition hover:text-blue-700"
              >
                Lupa password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-600 hover:to-purple-600"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              "Masuk"
            )}
          </Button>

          {/* Divider */}
          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-gray-500">
              atau
            </span>
          </div>

          {/* Social Login */}
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              size="lg"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
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
              Masuk dengan Google
            </Button>
          </div>

          {/* Register Link */}
          <div className="text-center text-gray-600">
            Belum punya akun?{" "}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-blue-600 transition hover:text-blue-700"
            >
              Daftar sekarang
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
