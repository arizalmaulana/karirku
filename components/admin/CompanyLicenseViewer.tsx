'use client';

import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import Image from "next/image";

interface CompanyLicenseViewerProps {
    licenseUrl: string;
    userId: string;
}

export function CompanyLicenseViewer({ licenseUrl, userId }: CompanyLicenseViewerProps) {
    const [signedUrl, setSignedUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fileType, setFileType] = useState<'image' | 'pdf' | 'unknown'>('unknown');

    useEffect(() => {
        async function getSignedUrl() {
            if (!licenseUrl) {
                setIsLoading(false);
                return;
            }

            try {
                const supabase = createBrowserClient();
                
                // Extract file path from URL
                // URL format bisa berupa:
                // - https://[project].supabase.co/storage/v1/object/public/documents/licenses/file.pdf
                // - https://[project].supabase.co/storage/v1/object/sign/company_licenses/file.pdf
                // - Atau path relatif seperti "licenses/file.pdf" atau "license_userid_timestamp.pdf"
                
                let filePath = licenseUrl;
                let bucketName = 'company_licenses';

                // Jika URL adalah full URL, extract path
                if (licenseUrl.includes('/storage/v1/object/')) {
                    // Extract bucket dan path dari URL
                    const urlParts = licenseUrl.split('/storage/v1/object/');
                    if (urlParts.length > 1) {
                        const pathParts = urlParts[1].split('/');
                        if (pathParts.length > 0) {
                            // Path format: public/bucket/path atau sign/bucket/path
                            if (pathParts[0] === 'public' || pathParts[0] === 'sign') {
                                if (pathParts.length > 1) {
                                    bucketName = pathParts[1];
                                    filePath = pathParts.slice(2).join('/');
                                }
                            } else {
                                // Langsung bucket name
                                bucketName = pathParts[0];
                                filePath = pathParts.slice(1).join('/');
                            }
                        }
                    }
                } else if (licenseUrl.startsWith('licenses/')) {
                    // Path relatif dengan prefix licenses/
                    bucketName = 'documents';
                    filePath = licenseUrl;
                } else if (licenseUrl.includes('/')) {
                    // Path relatif lainnya
                    filePath = licenseUrl;
                }

                // Determine file type dari path
                const extension = filePath.toLowerCase().split('.').pop();
                if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
                    setFileType('image');
                } else if (extension === 'pdf') {
                    setFileType('pdf');
                }

                // Coba beberapa bucket yang mungkin
                const buckets = [bucketName, 'company_licenses', 'documents', 'applications'];
                const uniqueBuckets = Array.from(new Set(buckets)); // Remove duplicates
                let success = false;

                for (const bucket of uniqueBuckets) {
                    try {
                        // Coba dapatkan signed URL
                        const { data, error: urlError } = await supabase.storage
                            .from(bucket)
                            .createSignedUrl(filePath, 3600); // 1 hour expiry

                        if (!urlError && data?.signedUrl) {
                            setSignedUrl(data.signedUrl);
                            success = true;
                            break;
                        }
                    } catch (err) {
                        // Continue to next bucket
                        continue;
                    }
                }

                if (!success) {
                    // Jika tidak bisa dapatkan signed URL, coba gunakan URL asli jika public
                    if (licenseUrl.includes('/public/')) {
                        setSignedUrl(licenseUrl);
                    } else {
                        setError("Tidak dapat mengakses file. Pastikan file masih tersedia dan Anda memiliki akses.");
                    }
                }
            } catch (err: any) {
                console.error("Error loading license file:", err);
                setError(err.message || "Terjadi kesalahan saat memuat file");
            } finally {
                setIsLoading(false);
            }
        }

        getSignedUrl();
    }, [licenseUrl, userId]);

    const handleDownload = () => {
        if (signedUrl) {
            window.open(signedUrl, '_blank');
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Surat Izin Perusahaan
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                        <span className="ml-2 text-sm text-gray-500">Memuat file...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error || !signedUrl) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Surat Izin Perusahaan
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 text-amber-600">
                        <AlertCircle className="h-5 w-5" />
                        <p className="text-sm">{error || "File tidak tersedia"}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Surat Izin Perusahaan
                </CardTitle>
                <CardDescription>
                    Dokumen surat izin yang telah diupload
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {fileType === 'image' && signedUrl ? (
                    <div className="relative w-full h-64 border rounded-lg overflow-hidden bg-gray-50">
                        <Image
                            src={signedUrl}
                            alt="Surat Izin Perusahaan"
                            fill
                            className="object-contain"
                            unoptimized
                        />
                    </div>
                ) : fileType === 'pdf' ? (
                    <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-center py-8">
                            <FileText className="h-12 w-12 text-gray-400" />
                        </div>
                        <p className="text-center text-sm text-gray-500 mt-2">
                            File PDF - Klik tombol di bawah untuk melihat
                        </p>
                    </div>
                ) : (
                    <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-center py-8">
                            <FileText className="h-12 w-12 text-gray-400" />
                        </div>
                        <p className="text-center text-sm text-gray-500 mt-2">
                            File dokumen - Klik tombol di bawah untuk melihat
                        </p>
                    </div>
                )}

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handleDownload}
                        className="flex-1"
                    >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Lihat File
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleDownload}
                    >
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

