'use client';

import { usePathname } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Building2, CheckCircle2, XCircle, Clock } from "lucide-react";
import Link from "next/link";
import type { Company } from "@/lib/types";

interface RecruiterAccessGuardProps {
    children: React.ReactNode;
    company: Company | null;
    canAccess: boolean;
    isComplete: boolean;
}

export function RecruiterAccessGuard({ 
    children, 
    company, 
    canAccess,
    isComplete 
}: RecruiterAccessGuardProps) {
    const pathname = usePathname();

    // Halaman yang boleh diakses tanpa validasi
    const allowedPaths = [
        '/recruiter/company/profile',
    ];

    const isAllowedPath = allowedPaths.some(path => pathname.startsWith(path));

    // Jika di halaman yang diizinkan, tampilkan children
    if (isAllowedPath) {
        return <>{children}</>;
    }

    // Jika belum lengkap profile, tampilkan pesan
    if (!isComplete) {
        return (
            <div className="max-w-2xl mx-auto mt-8">
                <Card className="border-2 border-yellow-200 bg-yellow-50">
                    <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <AlertCircle className="h-6 w-6 text-yellow-600" />
                            <CardTitle className="text-yellow-900">Profile Perusahaan Belum Lengkap</CardTitle>
                        </div>
                        <CardDescription className="text-yellow-700">
                            Anda harus melengkapi profile perusahaan terlebih dahulu sebelum dapat mengakses fitur lainnya.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-white rounded-lg p-4 space-y-2">
                            <p className="font-semibold text-gray-900">Yang perlu dilengkapi:</p>
                            <ul className="list-disc list-inside space-y-1 text-gray-700">
                                <li className={company?.name ? "text-green-600" : ""}>
                                    {company?.name ? (
                                        <span className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4" />
                                            Nama Perusahaan
                                        </span>
                                    ) : (
                                        "Nama Perusahaan"
                                    )}
                                </li>
                                <li className={company?.license_url ? "text-green-600" : ""}>
                                    {company?.license_url ? (
                                        <span className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4" />
                                            Surat Izin Perusahaan
                                        </span>
                                    ) : (
                                        "Surat Izin Perusahaan (wajib)"
                                    )}
                                </li>
                            </ul>
                        </div>
                        <Button 
                            asChild 
                            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                        >
                            <Link href="/recruiter/company/profile">
                                <Building2 className="mr-2 h-4 w-4" />
                                Lengkapi Profile Perusahaan
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Jika sudah lengkap tapi belum approved, tampilkan pesan
    if (isComplete && !canAccess) {
        const status = company?.status || 'pending';
        const isRejected = status === 'rejected';

        return (
            <div className="max-w-2xl mx-auto mt-8">
                <Card className={`border-2 ${isRejected ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}>
                    <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                            {isRejected ? (
                                <XCircle className="h-6 w-6 text-red-600" />
                            ) : (
                                <Clock className="h-6 w-6 text-yellow-600" />
                            )}
                            <CardTitle className={isRejected ? "text-red-900" : "text-yellow-900"}>
                                {isRejected ? "Profile Perusahaan Ditolak" : "Menunggu Persetujuan Admin"}
                            </CardTitle>
                        </div>
                        <CardDescription className={isRejected ? "text-red-700" : "text-yellow-700"}>
                            {isRejected 
                                ? "Profile perusahaan Anda ditolak oleh admin. Silakan perbaiki dan kirim ulang untuk persetujuan."
                                : "Profile perusahaan Anda sedang menunggu persetujuan admin. Setelah disetujui, Anda dapat mengakses semua fitur termasuk menambah lowongan."
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-white rounded-lg p-4 mb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-gray-900">Status:</span>
                                {isRejected ? (
                                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                                        Ditolak
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                                        Menunggu Persetujuan
                                    </span>
                                )}
                            </div>
                            {company?.name && (
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium">Perusahaan:</span> {company.name}
                                </p>
                            )}
                        </div>
                        <Button 
                            asChild 
                            variant={isRejected ? "default" : "outline"}
                            className={isRejected ? "w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white" : "w-full"}
                        >
                            <Link href="/recruiter/company/profile">
                                <Building2 className="mr-2 h-4 w-4" />
                                {isRejected ? "Perbaiki Profile Perusahaan" : "Lihat Profile Perusahaan"}
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Jika sudah lengkap dan approved, tampilkan children
    return <>{children}</>;
}

