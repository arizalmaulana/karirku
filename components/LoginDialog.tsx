import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
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

export function LoginDialog({ open, onClose, onSwitchToRegister, redirectTo, message }: LoginDialogProps) {
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
            let profile: { role?: UserRole } | null = null;
            
            // Coba fetch profil, tapi jangan biarkan error memblokir login
            try {
                const { data: profileData, error: profileError } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", userId)
                    .maybeSingle();

                // Jika tidak ada error dan data ada, gunakan role dari profil
                if (!profileError && profileData) {
                    profile = profileData as { role?: UserRole };
                    role = profile?.role ?? role;
                } else {
                    // Jika error atau profil belum ada, coba buat profil
                    console.log("Profile not found or error, attempting to create:", {
                        error: profileError?.message || profileError?.code,
                        hasData: !!profileData,
                    });
                    
                    try {
                        const { error: createError } = await (supabase
                            .from("profiles") as any)
                            .upsert({
                                id: userId,
                                full_name: userMetadata?.full_name || null,
                                role: role,
                            }, {
                                onConflict: "id",
                            });

                        if (createError) {
                            console.warn("Could not create profile during login:", createError);
                            // Tetap lanjutkan dengan role dari metadata
                        } else {
                            // Coba fetch ulang setelah dibuat
                            const { data: newProfile } = await supabase
                                .from("profiles")
                                .select("role")
                                .eq("id", userId)
                                .maybeSingle();
                            if (newProfile) {
                                profile = newProfile as { role?: UserRole };
                                role = profile?.role ?? role;
                            }
                        }
                    } catch (createErr: any) {
                        console.warn("Error creating profile during login:", {
                            message: createErr?.message,
                            code: createErr?.code,
                            error: createErr,
                        });
                        // Tetap lanjutkan dengan role dari metadata
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
                // Gunakan role dari metadata sebagai fallback
            }

            // Pastikan role valid
            if (!role || !roleRedirectMap[role]) {
                role = "jobseeker";
            }

            const destination = roleRedirectMap[role];
            
            // Pastikan profil sudah dibuat sebelum redirect
            // Retry beberapa kali untuk memastikan profil sudah tersinkronisasi
            let retryCount = 0;
            const maxRetries = 3;
            
            while (retryCount < maxRetries) {
                try {
                    // Coba fetch profil untuk memastikan sudah ada
                    const { data: finalProfile, error: finalError } = await supabase
                        .from("profiles")
                        .select("role")
                        .eq("id", userId)
                        .maybeSingle();
                    
                    if (finalProfile && !finalError) {
                        const profileData = finalProfile as { role?: UserRole } | null;
                        if (profileData?.role) {
                            role = profileData.role;
                            const newDestination = roleRedirectMap[role];
                            if (newDestination) {
                                console.log("Profile found, redirecting to:", newDestination);
                                toast.success("Berhasil masuk, mengarahkan ke dashboard Anda.");
                                closeDialog();
                                
                                // Delay untuk memastikan session cookie sudah ter-set
                                setTimeout(() => {
                                    window.location.href = newDestination;
                                }, 300);
                                return; // Exit function
                            }
                        }
                        break; // Profil ditemukan, lanjutkan redirect
                    } else if (finalError && finalError.code !== 'PGRST116') {
                        console.warn("Error fetching profile (retry", retryCount + 1, "):", finalError);
                    }
                } catch (finalErr) {
                    console.warn("Final profile check error (retry", retryCount + 1, "):", finalErr);
                }
                
                retryCount++;
                if (retryCount < maxRetries) {
                    // Tunggu sebentar sebelum retry
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }

            // Jika setelah retry profil masih belum ada, tetap redirect dengan role yang ada
            console.log("Redirecting to:", destination, "with role:", role, "(profile may not be synced yet)");
            toast.success("Berhasil masuk, mengarahkan ke dashboard Anda.");
            closeDialog();
            
            // Delay lebih lama untuk memastikan session cookie sudah ter-set
            setTimeout(() => {
                // Menggunakan window.location.href untuk full page reload.
                // Ini memastikan middleware berjalan dengan benar setelah login.
                window.location.href = destination;
            }, 500);

        } catch (err) {
            const message = err instanceof Error ? err.message : "Terjadi kesalahan saat login";
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
            const { error } = await supabase.auth.resetPasswordForEmail(formData.email);

            if (error) {
                throw error;
            }

            toast.success("Tautan reset password telah dikirim ke email Anda.");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Gagal mengirim tautan reset password";
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };
      if (data.session) {
        toast.success("Login berhasil!");
        onClose();
        
        // Redirect if needed
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          // Default redirect based on user role
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", data.user.id)
            .single();

          //const dashboardPath = {
          //  admin: "/admin/dashboard",
          //  recruiter: "/recruiter/dashboard",
          //  jobseeker: "/job-seeker/dashboard",
          //}[profile?.role || "jobseeker"];

          //router.push(dashboardPath || "/");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Login gagal. Periksa email dan password Anda.");
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
            {message || "Masukkan email dan password Anda untuk melanjutkan"}
          </DialogDescription>
        </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */} 
            <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                    id="login-email"
                    type="email"
                    placeholder="nama@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10"
                    required
                />
                </div>
            </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="login-email"
                type="email"
                placeholder="nama@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>

            {/* Password Field */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                <Label htmlFor="login-password">Password</Label>
                </div>
                <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 pr-10"
                    required
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
          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password">Password</Label>
              <button
                type="button"
                className="text-blue-600 hover:text-blue-700 transition"
              >
                Lupa password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pl-10 pr-10"
                required
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

            {/* Submit Button */}
            <Button type="submit" className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg shadow-indigo-500/30" size="lg" disabled={isLoading}>
                {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                </>
                ) : (
                "Masuk"
                )}
            </Button>
          {/* Submit Button */}
          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Masuk...
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
                onClick={onSwitchToRegister}
                className="text-blue-600 hover:text-blue-700 transition"
                >
                Daftar sekarang
                </button>
            </div>
            </form>
        </DialogContent>
        </Dialog>
    );
    }
          {/* Divider */}
          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-gray-500">
              atau
            </span>
          </div>

          {/* Social Login */}
          <div className="space-y-2">
            <Button type="button" variant="outline" className="w-full" size="lg">
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
              Masuk dengan Google
            </Button>
          </div>

          {/* Register Link */}
          <div className="text-center text-gray-600">
            Belum punya akun?{" "}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-blue-600 hover:text-blue-700 transition"
            >
              Daftar sekarang
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
