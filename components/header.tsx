"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
// import { LoginDialog } from "./LoginDialog";
// import { RegisterDialog } from "./RegisterDialog";
import { Briefcase, Menu, X } from "lucide-react";

export function Header() {
    const pathname = usePathname();
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const isActive = (path: string) => pathname === path;

    return (
        <>
        <header className="bg-white border-b sticky top-0 z-40">
            <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 cursor-pointer">
                <Briefcase className="w-8 h-8 text-blue-600" />
                <span className="text-blue-600">KarirKu</span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-6">
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
                <Button variant="outline" onClick={() => setShowLogin(true)}>
                    Masuk
                </Button>
                <Button onClick={() => setShowRegister(true)}>Daftar</Button>
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
                <nav className="md:hidden pt-4 pb-2 flex flex-col gap-4">
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
                </nav>
            )}
            </div>
        </header>

        {/* Login Dialog */}
        {/* <LoginDialog
            open={showLogin}
            onClose={() => setShowLogin(false)}
            onSwitchToRegister={() => {
            setShowLogin(false);
            setShowRegister(true);
            }}
        /> */}

        {/* Register Dialog */}
        {/* <RegisterDialog
            open={showRegister}
            onClose={() => setShowRegister(false)}
            onSwitchToLogin={() => {
            setShowRegister(false);
            setShowLogin(true);
            }}
        /> */}
        </>
    );
}
