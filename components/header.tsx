"use client";

import { useState } from "react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Briefcase, Menu, X, User, LogOut, LayoutDashboard, Settings, LogIn, UserPlus } from "lucide-react";


export function Header() {
    const pathname = usePathname();
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { user, profile, loading, signOut } = useAuth();

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
        <header className="bg-white border-b sticky top-0 z-40">
            <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 cursor-pointer">
                <Briefcase className="w-8 h-8 text-blue-600" />
                <span className="text-xl font-bold text-slate-800">KarirKu</span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-6">
                {!loading && (
                    <>
                        {user && profile ? (
                            <>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild className="cursor-pointer">
                                        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                            <Avatar className="h-10 w-10">
                                                <AvatarFallback className="bg-blue-600 text-white">
                                                    {getInitials()}
                                                </AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56 bg-white" align="end" forceMount>
                                        <DropdownMenuLabel className="font-normal">
                                            <div className="flex flex-col space-y-1">
                                                <p className="text-sm font-medium leading-none">
                                                    {profile.full_name || "Pengguna"}
                                                </p>
                                                <p className="text-xs leading-none text-muted-foreground">
                                                    {user.email}
                                                </p>
                                                <p className="text-xs leading-none text-blue-600 mt-1">
                                                    {getRoleLabel()}
                                                </p>
                                            </div>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="cursor-pointer text-red-600 focus:text-red-600"
                                            onClick={signOut}
                                        >
                                            <LogOut className="mr-2 h-4 w-4" />
                                            Keluar
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/"
                                    className={`transition ${
                                        isActive("/") ? "text-blue-600" : "text-gray-700 hover:text-blue-600"
                                    }`}
                                >
                                    Cari Kerja
                                </Link>
                                <Link
                                    href="/companies"
                                    className={`transition ${
                                        isActive("/companies") ? "text-blue-600" : "text-gray-700 hover:text-blue-600"
                                    }`}
                                >
                                    Perusahaan
                                </Link>
                                <Link
                                    href="/about"
                                    className={`transition ${
                                        isActive("/about") ? "text-blue-600" : "text-gray-700 hover:text-blue-600"
                                    }`}
                                >
                                    Tentang
                                </Link>
                                <Button variant="outline" onClick={() => setShowLogin(true)} className="ml-2 border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700">
                                    <LogIn className="mr-2 h-4 w-4" />
                                    Masuk
                                </Button>
                                <Button variant="outline" onClick={() => setShowRegister(true)} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/30">
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Daftar
                                </Button>
                            </>
                        )}
                    </>
                )}
                </nav>

                {/* Mobile Menu Button */}
                <button
                className="md:hidden p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                {mobileMenuOpen ? (
                    <X className="w-6 h-6 text-gray-700" />
                ) : (
                    <Menu className="w-6 h-6 text-gray-700" />
                )}
                </button>
            </div>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
                <nav className="mt-2 mb-2 border-t border-gray-200 dark:border-gray-800 dark:bg-gray-900 pt-4 pb-2 flex flex-col gap-4">
                {!loading && (
                    <>
                        {user && profile ? (
                            <div className="flex flex-col gap-4 mt-2">
                                <Link
                                    href={getDashboardPath()}
                                    className={`transition ${
                                        isActive(getDashboardPath()) ? "text-blue-600" : "text-gray-700"
                                    }`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Dashboard
                                </Link>
                                {profile.role === "jobseeker" && (
                                    <>
                                        <Link
                                            href="/"
                                            className={`transition ${
                                                isActive("/") ? "text-blue-600" : "text-gray-700"
                                            }`}
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            Cari Kerja
                                        </Link>
                                        <Link
                                            href="/companies"
                                            className={`transition ${
                                                isActive("/companies") ? "text-blue-600" : "text-gray-700"
                                            }`}
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            Perusahaan
                                        </Link>
                                    </>
                                )}
                                <Link
                                    href="/profile"
                                    className={`transition ${
                                        isActive("/profile") ? "text-blue-600" : "text-gray-700"
                                    }`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Profil
                                </Link>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        signOut();
                                        setMobileMenuOpen(false);
                                    }}
                                    className="w-full"
                                >
                                    Keluar
                                </Button>
                            </div>
                        ) : (
                            <>
                                <Link
                                    href="/"
                                    className={`transition ${
                                        isActive("/") ? "text-blue-600" : "text-gray-700"
                                    }`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Cari Kerja
                                </Link>
                                <Link
                                    href="/companies"
                                    className={`transition ${
                                        isActive("/companies") ? "text-blue-600" : "text-gray-700"
                                    }`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Perusahaan
                                </Link>
                                <Link
                                    href="/about"
                                    className={`transition ${
                                        isActive("/about") ? "text-blue-600" : "text-gray-700"
                                    }`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Tentang
                                </Link>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setShowLogin(true);
                                            setMobileMenuOpen(false);
                                        }}
                                        className="flex-1"
                                    > 
                                        Masuk
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setShowRegister(true);
                                            setMobileMenuOpen(false);
                                        }}
                                        className="flex-1"
                                    > 
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
