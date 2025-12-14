'use client';

import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import Image from "next/image";

interface ApplicationDocumentViewerProps {
    documentUrl: string | null;
    title: string;
    jobSeekerId: string;
}

export function ApplicationDocumentViewer({ documentUrl, title, jobSeekerId }: ApplicationDocumentViewerProps) {
    const [signedUrl, setSignedUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fileType, setFileType] = useState<'image' | 'pdf' | 'unknown'>('unknown');

    useEffect(() => {
        async function getSignedUrl() {
            if (!jobSeekerId) {
                setIsLoading(false);
                if (!documentUrl) {
                    return;
                }
            }

            // Handle local files (tidak terupload ke storage)
            if (documentUrl && documentUrl.startsWith('local:')) {
                setError("File ini disimpan secara lokal dan tidak dapat diakses. Silakan minta pelamar untuk mengunggah ulang.");
                setIsLoading(false);
                return;
            }

            try {
                const supabase = createBrowserClient();
                
                let success = false;
                let filePath = '';

                // Jika documentUrl ada, extract filename dari URL
                if (documentUrl && !documentUrl.startsWith('local:')) {
                    // Extract filename dari Supabase Storage URL
                    // Format: https://[project].supabase.co/storage/v1/object/public/applications/cv_[user_id]_[timestamp].pdf
                    // atau: https://[project].supabase.co/storage/v1/object/sign/applications/cv_[user_id]_[timestamp].pdf
                    
                    if (documentUrl.includes('/storage/v1/object/')) {
                        // Extract path setelah /storage/v1/object/
                        const urlParts = documentUrl.split('/storage/v1/object/');
                        if (urlParts.length > 1) {
                            const pathAfterObject = urlParts[1];
                            const pathParts = pathAfterObject.split('/');
                            
                            // Skip 'public' atau 'sign' jika ada
                            let startIndex = 0;
                            if (pathParts[0] === 'public' || pathParts[0] === 'sign') {
                                startIndex = 1;
                            }
                            
                            // Bucket name adalah pathParts[startIndex], file path adalah sisanya
                            if (pathParts.length > startIndex + 1) {
                                filePath = pathParts.slice(startIndex + 1).join('/');
                            } else if (pathParts.length > startIndex) {
                                // Jika hanya ada bucket name, coba ambil dari URL langsung
                                filePath = pathParts[startIndex];
                            }
                        }
                    } else if (documentUrl.includes('/applications/')) {
                        // Format alternatif: URL langsung dengan /applications/
                        const parts = documentUrl.split('/applications/');
                        if (parts.length > 1) {
                            filePath = parts[1].split('?')[0]; // Remove query params
                        }
                    }

                    // Jika berhasil extract filePath, buat signed URL
                    if (filePath) {
                        try {
                            const { data, error: urlError } = await supabase.storage
                                .from('applications')
                                .createSignedUrl(filePath, 3600); // 1 hour expiry

                            if (!urlError && data?.signedUrl) {
                                setSignedUrl(data.signedUrl);
                                
                                // Determine file type dari extension
                                const ext = filePath.split('.').pop()?.toLowerCase() || '';
                                if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
                                    setFileType('image');
                                } else if (ext === 'pdf') {
                                    setFileType('pdf');
                                } else {
                                    setFileType('unknown');
                                }
                                
                                success = true;
                            }
                        } catch (err) {
                            console.error("Error creating signed URL:", err);
                        }
                    }
                }

                // Fallback: Jika tidak berhasil extract dari URL, coba cari file berdasarkan jobSeekerId
                if (!success && jobSeekerId) {
                    try {
                        // List semua file di bucket applications
                        const { data: files, error: listError } = await supabase.storage
                            .from('applications')
                            .list('', {
                                limit: 100,
                                offset: 0,
                                sortBy: { column: 'created_at', order: 'desc' }
                            });

                        if (!listError && files) {
                            // Cari file yang mengandung jobseeker ID (format: cv_{user_id}_ atau doc_{user_id}_)
                            const matchingFile = files.find(file => 
                                (file.name.startsWith('cv_') || file.name.startsWith('doc_')) &&
                                file.name.includes(jobSeekerId)
                            );

                            if (matchingFile) {
                                const { data, error: urlError } = await supabase.storage
                                    .from('applications')
                                    .createSignedUrl(matchingFile.name, 3600);

                                if (!urlError && data?.signedUrl) {
                                    setSignedUrl(data.signedUrl);
                                    
                                    // Determine file type
                                    const ext = matchingFile.name.split('.').pop()?.toLowerCase() || '';
                                    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
                                        setFileType('image');
                                    } else if (ext === 'pdf') {
                                        setFileType('pdf');
                                    } else {
                                        setFileType('unknown');
                                    }
                                    
                                    success = true;
                                }
                            }
                        }
                    } catch (err) {
                        console.error("Error listing files:", err);
                    }
                }

                if (!success) {
                    // Jika documentUrl ada tapi tidak bisa diakses, beri pesan yang lebih jelas
                    if (documentUrl && !documentUrl.startsWith('local:')) {
                        console.error("Failed to create signed URL for:", documentUrl);
                        setError("File tidak dapat diakses. Pastikan RLS policy sudah dikonfigurasi dengan benar.");
                    } else {
                        setError("File tidak ditemukan. Pastikan file telah diunggah.");
                    }
                }
            } catch (err: any) {
                console.error("Error loading document file:", err);
                console.error("Document URL:", documentUrl);
                console.error("Job Seeker ID:", jobSeekerId);
                setError(err.message || "Terjadi kesalahan saat memuat file");
            } finally {
                setIsLoading(false);
            }
        }

        getSignedUrl();
    }, [documentUrl, jobSeekerId]);

    const handleDownload = () => {
        if (signedUrl) {
            window.open(signedUrl, '_blank');
        }
    };

    if (!documentUrl) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {title}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-500">Dokumen tidak diunggah</p>
                </CardContent>
            </Card>
        );
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {title}
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
                        {title}
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
                    {title}
                </CardTitle>
                <CardDescription>
                    Dokumen yang telah diupload oleh pelamar
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {fileType === 'image' && signedUrl ? (
                    <div className="relative w-full h-64 border rounded-lg overflow-hidden bg-gray-50">
                        <Image
                            src={signedUrl}
                            alt={title}
                            fill
                            className="object-contain"
                            unoptimized
                        />
                    </div>
                ) : fileType === 'pdf' && signedUrl ? (
                    <div className="border rounded-lg overflow-hidden bg-gray-50">
                        <iframe
                            src={signedUrl}
                            className="w-full h-[600px] border-0"
                            title={title}
                        />
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

