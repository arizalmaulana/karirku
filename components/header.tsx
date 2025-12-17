"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { LoginDialog } from "@/components/LoginDialog";
import { RegisterDialog } from "@/components/RegisterDialog";
import { useAuth } from "@/lib/hooks/useAuth";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Briefcase, Menu, X, User, LogOut, LayoutDashboard, Settings, LogIn, UserPlus, Building2 } from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { useCompany } from "@/lib/hooks/useCompany";
import Image from "next/image";


export function Header() {
    const pathname = usePathname();
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { user, profile, loading, signOut } = useAuth();
    const { company } = useCompany(profile?.role === 'recruiter' ? user?.id || null : null);

    // Prevent hydration mismatch by only rendering after client-side mount
    useEffect(() => {
        setMounted(true);
    }, []);

    const isActive = (path: string) => pathname === path;

    const getDashboardPath = () => {
        if (!profile) return "/";
        switch (profile.role) {
            case "admin":
                return "/admin/dashboard";
            case "recruiter":
                return "/recruiter/dashboard";
            case "jobseeker":
                return "/job-seeker/dashboard";
            default:
                return "/";
        }
    };

    const getRoleLabel = () => {
        if (!profile) return "";
        switch (profile.role) {
            case "admin":
                return "Admin";
            case "recruiter":
                return "Recruiter";
            case "jobseeker":
                return "Job Seeker";
            default:
                return "";
        }
    };

    const getInitials = () => {
        if (profile?.full_name) {
            return profile.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
        }
        return user?.email?.[0]?.toUpperCase() || "U";
    };

    return (
        <>
        <header className="bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 border-0 sticky top-0 z-[60] shadow-md">
            <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 cursor-pointer group">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                    <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <span className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">KarirKu</span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center gap-4 xl:gap-6">
                {mounted && !loading && (
                    <>
                        {user && profile ? (
                            // Setelah login: hanya avatar, navigasi menggunakan sidebar
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild className="cursor-pointer">
                                    <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 overflow-hidden">
                                        {profile.role === 'recruiter' && company ? (
                                            <Avatar className="h-10 w-10 border border-purple-200/40 rounded-full">
                                                {company.logo_url ? (
                                                    <AvatarImage 
                                                        src={company.logo_url} 
                                                        alt={company.name || "Company Logo"}
                                                        className="object-cover object-center"
                                                    />
                                                ) : null}
                                                <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white rounded-full">
                                                    <Building2 className="w-5 h-5" />
                                                </AvatarFallback>
                                            </Avatar>
                                        ) : (
                                            <Avatar className="h-10 w-10 border border-purple-200/40 rounded-full">
                                                {profile.avatar_url ? (
                                                    <AvatarImage 
                                                        src={profile.avatar_url} 
                                                        alt={profile.full_name || "User"}
                                                        className="object-cover object-center"
                                                    />
                                                ) : null}
                                                <AvatarFallback className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white rounded-full">
                                                    {getInitials()}
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-64 bg-white" align="end" forceMount>
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-3">
                                            {/* User Information - Top */}
                                            <div className="flex items-center gap-2">
                                                {/* Use Company Logo for Recruiter, User Avatar for others */}
                                                {profile.role === 'recruiter' && company ? (
                                                    company.logo_url ? (
                                                        <div className="relative w-8 h-8 rounded-full overflow-hidden border border-purple-200/40 shrink-0">
                                                            <Image
                                                                src={company.logo_url}
                                                                alt={company.name || "Company Logo"}
                                                                fill
                                                                className="object-cover"
                                                                sizes="32px"
                                                                unoptimized={company.logo_url.includes('/sign/')}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shrink-0">
                                                            <Building2 className="w-4 h-4 text-white" />
                                                        </div>
                                                    )
                                                ) : (
                                                    <Avatar className="h-8 w-8 border border-purple-200 shrink-0">
                                                        {profile.avatar_url ? (
                                                            <AvatarImage src={profile.avatar_url} alt={profile.full_name || "User"} />
                                                        ) : null}
                                                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white text-xs">
                                                            {getInitials()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium leading-none truncate">
                                                        {profile.full_name || "Pengguna"}
                                                    </p>
                                                    <p className="text-xs leading-none text-gray-600 truncate mt-1">
                                                        {user.email}
                                                    </p>
                                                    <p className="text-xs leading-none text-blue-600 mt-1">
                                                        {getRoleLabel()}
                                                    </p>
                                                    {/* Company Name for Recruiter */}
                                                    {profile.role === 'recruiter' && company && (
                                                        <>
                                                            <p className="text-xs font-semibold text-gray-900 truncate mt-1">
                                                                {company.name || "Perusahaan"}
                                                            </p>
                                                            {company.is_approved && company.status === 'approved' ? (
                                                                <p className="text-xs text-green-600 mt-0.5">✓ Disetujui</p>
                                                            ) : company.status === 'rejected' ? (
                                                                <p className="text-xs text-red-600 mt-0.5">✗ Ditolak</p>
                                                            ) : (
                                                                <p className="text-xs text-yellow-600 mt-0.5">⏳ Menunggu</p>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href={getDashboardPath()} className="cursor-pointer">
                                            <LayoutDashboard className="mr-2 h-4 w-4" />
                                            Dashboard
                                        </Link>
                                    </DropdownMenuItem>
                                    {profile.role === 'recruiter' && (
                                        <>
                                            <DropdownMenuItem asChild>
                                                <Link href="/recruiter/company/profile" className="cursor-pointer">
                                                    <Building2 className="mr-2 h-4 w-4" />
                                                    Profile Perusahaan
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                        </>
                                    )}
                                    <DropdownMenuItem
                                        className="cursor-pointer text-red-600 focus:text-red-600"
                                        onClick={signOut}
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Keluar
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <>
                                <Link
                                    href="/"
                                    className={`transition-colors px-3 py-2 rounded-lg ${
                                        isActive("/") ? "text-indigo-600 bg-indigo-50 font-medium" : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                                    }`}
                                >
                                    Cari Kerja
                                </Link>
                                <Link
                                    href="/companies"
                                    className={`transition-colors px-3 py-2 rounded-lg ${
                                        isActive("/companies") ? "text-indigo-600 bg-indigo-50 font-medium" : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                                    }`}
                                >
                                    Perusahaan
                                </Link>
                                <Link
                                    href="/about"
                                    className={`transition-colors px-3 py-2 rounded-lg ${
                                        isActive("/about") ? "text-indigo-600 bg-indigo-50 font-medium" : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                                    }`}
                                >
                                    Tentang
                                </Link>
                                <Button 
                                    variant="outline" 
                                    onClick={() => setShowLogin(true)} 
                                    className="ml-2 border-0 cursor-pointer bg-gray-200 text-indigo-600 hover:!bg-gray-200 hover:!text-indigo-600 shadow-sm transition-colors"
                                >
                                    <LogIn className="mr-2 h-4 w-4" />
                                    Masuk
                                </Button>
                                <Button onClick={() => setShowRegister(true)} className="cursor-pointer  bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-md shadow-indigo-500/30 hover:shadow-lg">
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Daftar
                                </Button>
                            </>
                        )}
                    </>
                )}
                </nav>

                {/* Mobile Menu Button & Avatar */}
                <div className="lg:hidden flex items-center gap-2">
                    {mounted && user && profile && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild className="cursor-pointer">
                                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 overflow-hidden">
                                    {profile.role === 'recruiter' && company ? (
                                        <Avatar className="h-9 w-9 border border-purple-200/40 rounded-full">
                                            {company.logo_url ? (
                                                <AvatarImage 
                                                    src={company.logo_url} 
                                                    alt={company.name || "Company Logo"}
                                                    className="object-cover object-center"
                                                />
                                            ) : null}
                                            <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white rounded-full">
                                                <Building2 className="w-4 h-4" />
                                            </AvatarFallback>
                                        </Avatar>
                                    ) : (
                                        <Avatar className="h-9 w-9 border border-purple-200/40 rounded-full">
                                            {profile.avatar_url ? (
                                                <AvatarImage 
                                                    src={profile.avatar_url} 
                                                    alt={profile.full_name || "User"}
                                                    className="object-cover object-center"
                                                />
                                            ) : null}
                                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white rounded-full text-xs">
                                                {getInitials()}
                                            </AvatarFallback>
                                        </Avatar>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 bg-white mr-2" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-2">
                                        <div className="flex items-center gap-2">
                                            {profile.role === 'recruiter' && company ? (
                                                company.logo_url ? (
                                                    <div className="relative w-8 h-8 rounded-full overflow-hidden border border-purple-200/40 shrink-0">
                                                        <Image
                                                            src={company.logo_url}
                                                            alt={company.name || "Company Logo"}
                                                            fill
                                                            className="object-cover"
                                                            sizes="32px"
                                                            unoptimized={company.logo_url.includes('/sign/')}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shrink-0">
                                                        <Building2 className="w-4 h-4 text-white" />
                                                    </div>
                                                )
                                            ) : (
                                                <Avatar className="h-8 w-8 border border-purple-200 shrink-0">
                                                    {profile.avatar_url ? (
                                                        <AvatarImage src={profile.avatar_url} alt={profile.full_name || "User"} />
                                                    ) : null}
                                                    <AvatarFallback className="bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 text-white text-xs">
                                                        {getInitials()}
                                                    </AvatarFallback>
                                                </Avatar>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium leading-none truncate">
                                                    {profile.full_name || "Pengguna"}
                                                </p>
                                                <p className="text-xs leading-none text-muted-foreground truncate mt-1">
                                                    {user.email}
                                                </p>
                                                <p className="text-xs leading-none text-blue-600 mt-1">
                                                    {getRoleLabel()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="cursor-pointer text-red-600 focus:text-red-600"
                                    onClick={() => {
                                        signOut();
                                        setMobileMenuOpen(false);
                                    }}
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Keluar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                    <button
                        className="p-2 -mr-2"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? (
                            <X className="w-6 h-6 text-gray-700" />
                        ) : (
                            <Menu className="w-6 h-6 text-gray-700" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
                <nav className="mt-3 mb-2 border-0 pt-4 pb-2 flex flex-col gap-3">
                {mounted && !loading && (
                    <>
                        {user && profile ? (
                            // Setelah login: navigasi menggunakan sidebar, hanya tampilkan menu minimal
                            <div className="flex flex-col gap-3">
                                <p className="text-xs text-gray-600 px-3">
                                    Gunakan sidebar untuk navigasi lengkap
                                </p>
                                <Link
                                    href={getDashboardPath()}
                                    className={`py-2 px-3 rounded-lg transition ${
                                        isActive(getDashboardPath()) 
                                            ? "bg-blue-50 text-blue-600 font-medium" 
                                            : "text-gray-700 hover:bg-gray-50"
                                    }`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <div className="flex items-center gap-2">
                                        <LayoutDashboard className="w-4 h-4" />
                                        Dashboard
                                    </div>
                                </Link>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        signOut();
                                        setMobileMenuOpen(false);
                                    }}
                                    className="w-full mt-2 border-0 bg-gradient-to-br from-white to-red-50/30 text-red-600 hover:bg-gradient-to-br hover:from-red-50 hover:to-red-100/50 shadow-sm"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Keluar
                                </Button>
                            </div>
                        ) : (
                            <>
                                <Link
                                    href="/"
                                    className={`py-2 px-3 rounded-lg transition-colors ${
                                        isActive("/") 
                                            ? "bg-indigo-50 text-indigo-600 font-medium" 
                                            : "text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                                    }`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Cari Kerja
                                </Link>
                                <Link
                                    href="/companies"
                                    className={`py-2 px-3 rounded-lg transition-colors ${
                                        isActive("/companies") 
                                            ? "bg-indigo-50 text-indigo-600 font-medium" 
                                            : "text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                                    }`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Perusahaan
                                </Link>
                                <Link
                                    href="/about"
                                    className={`py-2 px-3 rounded-lg transition-colors ${
                                        isActive("/about") 
                                            ? "bg-indigo-50 text-indigo-600 font-medium" 
                                            : "text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                                    }`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Tentang
                                </Link>
                                <div className="flex flex-col gap-2 mt-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setShowLogin(true);
                                            setMobileMenuOpen(false);
                                        }}
                                        className="w-full border-0 bg-gray-200 text-indigo-600 hover:!bg-gray-600 hover:!text-white shadow-sm transition-colors"
                                    > 
                                        <LogIn className="mr-2 h-4 w-4" />
                                        Masuk
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setShowRegister(true);
                                            setMobileMenuOpen(false);
                                        }}
                                        className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-md"
                                    > 
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Daftar
                                    </Button>
                                </div>
                            </>
                        )}
                    </>
                )}
                </nav>
            )}
            </div>
        </header>

        {/* Login Dialog */}
        <LoginDialog
            open={showLogin}
            onClose={() => setShowLogin(false)}
            onSwitchToRegister={() => {
            setShowLogin(false);
            setShowRegister(true);
            }}
        />

        {/* Register Dialog */}
        <RegisterDialog
            open={showRegister}
            onClose={() => setShowRegister(false)}
            onSwitchToLogin={() => {
            setShowRegister(false);
            setShowLogin(true);
            }}
        />
        </>
    );
}

// Export default untuk kompatibilitas
export default Header;
