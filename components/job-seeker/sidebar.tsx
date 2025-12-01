'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, FileText, User, Search } from "lucide-react";

const navItems = [
    { href: "/job-seeker/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/job-seeker/jobs", label: "Cari Lowongan", icon: Search },
    { href: "/job-seeker/applications", label: "Lamaran Saya", icon: FileText },
    { href: "/job-seeker/profile", label: "Profil Saya", icon: User },
];

export function JobSeekerSidebar() {
    const pathname = usePathname();

    return (
        <aside className="hidden w-64 flex-col border-r bg-white p-4 lg:flex">
            <div className="mb-8 flex items-center gap-2">
                <Briefcase className="h-6 w-6 text-blue-600" />
                <p className="text-lg font-semibold">KarirKu</p>
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

