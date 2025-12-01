'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, Users, Wallet, FileText } from "lucide-react";

const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/jobs", label: "Manajemen Lowongan", icon: Briefcase },
    { href: "/admin/applications", label: "Manajemen Lamaran", icon: FileText },
    { href: "/admin/users", label: "Manajemen Pengguna", icon: Users },
    { href: "/admin/living-costs", label: "Biaya Hidup", icon: Wallet },
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="hidden w-64 flex-col border-r bg-white p-4 lg:flex">
            <div className="mb-8 flex items-center gap-2">
                <p className="text-lg font-semibold">Admin Panel</p>
            </div>
            <nav className="flex flex-col gap-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all
                                ${isActive
                                    ? "bg-blue-100 text-blue-700"
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