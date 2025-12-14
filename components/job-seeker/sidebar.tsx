'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, Building2, MessageSquare, FileText, User, X } from 'lucide-react';
import { useState } from "react";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
  }
  

export function JobSeekerSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: "/job-seeker/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/job-seeker/jobs", label: "Lowongan", icon: Briefcase },
    { href: "/job-seeker/perusahaan", label: "Perusahaan", icon: Building2 },
    { href: "/job-seeker/applications", label: "Riwayat Lamar", icon: FileText },
    { href: "/job-seeker/profile", label: "Profil", icon: User },
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* MOBILE BUTTON */}
      <button 
        className="lg:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded-lg shadow"
        onClick={toggleSidebar}
      >
        <LayoutDashboard />
      </button>

      {/* MOBILE BACKDROP DARK */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`
          fixed top-0 left-0 z-50 h-screen w-64 bg-white shadow-xl overflow-y-auto
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}>
            
        {/* LOGO HEADER */}
        <div className="h-20 flex items-center justify-between px-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <span className="font-semibold text-gray-900">KarirKu</span>
          </div>

          {/* CLOSE BUTTON MOBILE */}
          <button 
            onClick={toggleSidebar}
            className="lg:hidden text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MENU */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl w-full transition-all duration-200
                  ${
                    isActive
                      ? "bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white shadow-lg"
                      : "text-gray-600 hover:bg-gray-100"
                  }
                `}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>        
      </aside>
    </>
  );
}
  