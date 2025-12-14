'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, Users, FileText, Building2 } from "lucide-react";

const navItems = [
    { href: "/recruiter/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/recruiter/jobs", label: "Lowongan Saya", icon: Briefcase },
    { href: "/recruiter/applications", label: "Pelamar", icon: Users },
    { href: "/recruiter/company/profile", label: "Profile Perusahaan", icon: Building2 },
];

export function RecruiterSidebar() {
    const pathname = usePathname();

    return (
        <aside className="hidden w-64 flex-col border-r bg-pink p-4 lg:flex">
            <div className="mb-8 flex items-center gap-2">
               
                <p className="text-lg font-semibold text-purple-6000\">Recruiter Panel</p>
            </div>
            <nav className="flex flex-col gap-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all
                                ${isActive
                                    ? "bg-blue-100 text-blue-700 font-medium"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                }`}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}

