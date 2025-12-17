'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, Users, FileText, Building2, X } from 'lucide-react';
import { useState } from "react";

const navItems = [
    { href: "/recruiter/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/recruiter/jobs", label: "Lowongan Saya", icon: Briefcase },
    { href: "/recruiter/applications", label: "Pelamar", icon: Users },
    { href: "/recruiter/company/profile", label: "Profile Perusahaan", icon: Building2 },
];

export function RecruiterSidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const toggleSidebar = () => setIsOpen(!isOpen);

    return (
        <>
            {/* MOBILE BUTTON */}
            <button 
                className="lg:hidden fixed top-16 left-3 z-50 bg-gradient-to-br from-white to-purple-50/30 p-2.5 rounded-lg shadow-md hover:shadow-lg transition-all border-0 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50"
                onClick={toggleSidebar}
                aria-label="Toggle sidebar"
            >
                <LayoutDashboard className="w-5 h-5 text-indigo-600" />
            </button>

            {/* MOBILE BACKDROP */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-gradient-to-br from-indigo-900/15 via-purple-900/15 to-pink-900/15 z-40 lg:hidden backdrop-blur-md transition-opacity duration-300"
                    onClick={toggleSidebar}
                />
            )}

            {/* SIDEBAR */}
            <aside className={`
                fixed top-0 left-0 z-50 h-screen w-56 sm:w-60 bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 border-0 shadow-lg overflow-y-auto
                transform transition-transform duration-300 ease-in-out
                ${isOpen ? "translate-x-0" : "-translate-x-full"}
                lg:translate-x-0
            `}>
                
                {/* LOGO HEADER */}
                <div className="h-20 flex items-center justify-between px-6 border-0 bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                            <Briefcase className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-bold text-gray-900 text-lg">KarirKu</span>
                    </div>

                    {/* CLOSE BUTTON MOBILE */}
                    <button 
                        onClick={toggleSidebar}
                        className="lg:hidden text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-1.5 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* MENU */}
                <nav className="p-4 space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={`
                                    flex items-center gap-3 px-4 py-3 rounded-xl w-full transition-all duration-200 touch-manipulation
                                    ${
                                        isActive
                                            ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-md shadow-indigo-500/20 font-medium"
                                            : "text-gray-700 hover:bg-gray-50 hover:text-indigo-600 active:bg-gray-100"
                                    }
                                `}
                            >
                                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-gray-600"}`} />
                                <span className="truncate text-sm">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>        
            </aside>
        </>
    );
}

