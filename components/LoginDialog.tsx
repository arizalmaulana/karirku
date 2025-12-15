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
      // Validasi supabase client
      if (!supabase) {
        throw new Error("Koneksi ke server gagal. Silakan coba lagi.");
      }

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
      let isApproved: boolean | null = null;

      // Coba fetch profil, tapi jangan biarkan error memblokir login
      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("role, is_approved")
          .eq("id", userId)
          .maybeSingle();

        // Jika tidak ada error dan data ada, gunakan role dari profil
        if (!profileError && profileData) {
          const profile = profileData as { 
            role?: UserRole;
            is_approved?: boolean | null;
          };
          role = profile.role ?? role;
          isApproved = profile.is_approved ?? null;
          
          // Untuk jobseeker, pastikan is_approved = true
          // Jika belum true, update terlebih dahulu
          if (role === "jobseeker" && isApproved !== true) {
            console.log("Updating is_approved to true for jobseeker during login...");
            const { error: updateError } = await (supabase
              .from("profiles") as any)
              .update({ is_approved: true })
              .eq("id", userId);
            
            if (!updateError) {
              isApproved = true;
              console.log("is_approved successfully updated to true for jobseeker");
            } else {
              console.warn("Could not update is_approved for jobseeker:", updateError);
            }
          }
        } else if (profileError && profileError.code !== "PGRST116") {
          // Jika error selain "not found", log dan tetap lanjutkan
          console.warn("Profile fetch error during login:", {
            message: profileError.message,
            code: profileError.code,
          });
        } else if (profileError && profileError.code === "PGRST116") {
          // Profile tidak ditemukan, buat profile baru untuk jobseeker
          if (role === "jobseeker") {
            console.log("Profile not found for jobseeker, creating new profile...");
            const { error: createError } = await (supabase
              .from("profiles") as any)
              .insert({
                id: userId,
                full_name: userMetadata?.full_name || null,
                role: "jobseeker",
                email: data.user.email || null,
                is_approved: true, // Jobseeker langsung aktif
              });
            
            if (!createError) {
              isApproved = true;
              console.log("Profile created successfully for jobseeker with is_approved = true");
            } else {
              console.warn("Could not create profile for jobseeker:", createError);
            }
          }
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

      // Cek apakah user diblokir (is_approved = false atau null)
      // Kecuali untuk jobseeker yang sudah di-update di atas
      if (isApproved === false || (isApproved === null && role !== "jobseeker")) {
        // Sign out user yang diblokir (bukan jobseeker)
        await supabase.auth.signOut();
        toast.error("Akun Anda telah diblokir. Silahkan hubungi admin.");
        setIsLoading(false);
        return;
      }

      // Jika recruiter, cek apakah perusahaan diblokir
      if (role === "recruiter") {
        try {
          const { data: companyData, error: companyError } = await supabase
            .from("companies")
            .select("is_blocked, blocked_reason")
            .eq("recruiter_id", userId)
            .maybeSingle();

          if (!companyError && companyData && companyData.is_blocked === true) {
            // Sign out recruiter yang perusahaannya diblokir
            await supabase.auth.signOut();
            const reason = companyData.blocked_reason 
              ? `Perusahaan Anda telah diblokir. Alasan: ${companyData.blocked_reason}. Silahkan hubungi admin.`
              : "Perusahaan Anda telah diblokir. Silahkan hubungi admin.";
            toast.error(reason);
            setIsLoading(false);
            return;
          }
        } catch (err: any) {
          console.warn("Error checking company block status:", err);
          // Continue login jika error, jangan blokir
        }
      }

      // Pastikan role valid
      if (!role || !roleRedirectMap[role]) {
        role = "jobseeker";
      }

      const destination = redirectTo ?? roleRedirectMap[role];

      toast.success("Berhasil masuk, mengarahkan ke dashboard Anda.");
      onClose();

      // Tunggu sedikit untuk memastikan session ter-set dan notifikasi terlihat
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Tunggu lagi agar notifikasi terlihat sebelum redirect (total ~2 detik)
      setTimeout(() => {
        // Gunakan router.push untuk navigasi yang lebih smooth
        router.push(destination);
        
        // Fallback: jika router.push tidak bekerja, gunakan window.location
        setTimeout(() => {
          if (window.location.pathname === '/') {
            window.location.href = destination;
          }
        }, 1000);
      }, 1500); // Delay tambahan 1.5 detik agar notifikasi terlihat
    } catch (err: any) {
      let message = "Terjadi kesalahan saat login";
      
      if (err instanceof Error) {
        message = err.message;
      } else if (err?.message) {
        message = err.message;
      } else if (typeof err === 'string') {
        message = err;
      }
      
      // Handle network errors
      if (message.includes("Failed to fetch") || message.includes("NetworkError") || message.includes("fetch")) {
        message = "Koneksi ke server gagal. Periksa koneksi internet Anda dan coba lagi.";
      }
      
      // Handle specific Supabase errors
      if (err?.status === 400 || err?.code === 'invalid_credentials') {
        message = "Email atau password salah. Silakan coba lagi.";
      } else if (err?.status === 429) {
        message = "Terlalu banyak percobaan login. Silakan tunggu sebentar dan coba lagi.";
      } else if (err?.status === 500 || err?.code === 'internal_error') {
        message = "Terjadi kesalahan pada server. Silakan coba lagi nanti.";
      }
      
      console.error("Login error:", err);
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

          {/* Register Link */}
          <div className="text-center text-gray-600">
            Belum punya akun?{" "}
            <button
              type="button"
              onClick={() => {
                onClose();
                onSwitchToRegister();
              }}
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
