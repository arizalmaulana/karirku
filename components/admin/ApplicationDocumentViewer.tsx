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
                
                // CV diambil dari bucket applications folder cv
                const folder = 'cv';
                
                // Daftar ekstensi yang mungkin untuk CV
                const possibleExtensions = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif', 'webp'];
                
                let success = false;
                let foundExtension = '';

                // Coba berbagai ekstensi file
                for (const ext of possibleExtensions) {
                    const filePath = `${folder}/${jobSeekerId}.${ext}`;
                    
                    try {
                        // Coba dapatkan signed URL dari bucket applications
                        const { data, error: urlError } = await supabase.storage
                            .from('applications')
                            .createSignedUrl(filePath, 3600); // 1 hour expiry

                        if (!urlError && data?.signedUrl) {
                            setSignedUrl(data.signedUrl);
                            foundExtension = ext;
                            success = true;
                            
                            // Determine file type
                            if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
                                setFileType('image');
                            } else if (ext === 'pdf') {
                                setFileType('pdf');
                            } else {
                                setFileType('unknown');
                            }
                            break;
                        }
                    } catch (err) {
                        // Continue to next extension
                        continue;
                    }
                }

                // Jika tidak ditemukan dengan ekstensi, coba list files di folder cv
                if (!success) {
                    try {
                        const { data: files, error: listError } = await supabase.storage
                            .from('applications')
                            .list(folder, {
                                limit: 100,
                                offset: 0,
                                sortBy: { column: 'name', order: 'asc' }
                            });

                        if (!listError && files) {
                            // Cari file yang mengandung jobseeker ID
                            const matchingFile = files.find(file => 
                                file.name.includes(jobSeekerId) || 
                                file.name.startsWith(jobSeekerId)
                            );

                            if (matchingFile) {
                                const filePath = `${folder}/${matchingFile.name}`;
                                const { data, error: urlError } = await supabase.storage
                                    .from('applications')
                                    .createSignedUrl(filePath, 3600);

                                if (!urlError && data?.signedUrl) {
                                    setSignedUrl(data.signedUrl);
                                    foundExtension = matchingFile.name.split('.').pop() || '';
                                    success = true;
                                    
                                    // Determine file type
                                    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(foundExtension)) {
                                        setFileType('image');
                                    } else if (foundExtension === 'pdf') {
                                        setFileType('pdf');
                                    } else {
                                        setFileType('unknown');
                                    }
                                }
                            }
                        }
                    } catch (err) {
                        console.error("Error listing files:", err);
                    }
                }

                // Fallback: jika documentUrl ada dan bukan local, coba gunakan URL tersebut
                if (!success && documentUrl && !documentUrl.startsWith('local:')) {
                    // Extract file path from URL
                    let filePath = documentUrl;
                    let bucketName = 'applications';

                    // Jika URL adalah full URL, extract path
                    if (documentUrl.includes('/storage/v1/object/')) {
                        const urlParts = documentUrl.split('/storage/v1/object/');
                        if (urlParts.length > 1) {
                            const pathParts = urlParts[1].split('/');
                            if (pathParts.length > 0) {
                                if (pathParts[0] === 'public' || pathParts[0] === 'sign') {
                                    if (pathParts.length > 1) {
                                        bucketName = pathParts[1];
                                        filePath = pathParts.slice(2).join('/');
                                    }
                                } else {
                                    bucketName = pathParts[0];
                                    filePath = pathParts.slice(1).join('/');
                                }
                            }
                        }
                    }

                    // Jika URL sudah public, langsung gunakan
                    if (documentUrl.includes('/public/') || documentUrl.includes('/storage/v1/object/public/')) {
                        setSignedUrl(documentUrl);
                        success = true;
                    } else {
                        // Coba dapatkan signed URL
                        const buckets = [bucketName, 'applications', 'documents'];
                        for (const bucket of buckets) {
                            try {
                                const { data, error: urlError } = await supabase.storage
                                    .from(bucket)
                                    .createSignedUrl(filePath, 3600);

                                if (!urlError && data?.signedUrl) {
                                    setSignedUrl(data.signedUrl);
                                    success = true;
                                    break;
                                }
                            } catch (err) {
                                continue;
                            }
                        }
                    }
                }

                if (!success) {
                    setError("File tidak ditemukan. Pastikan file telah diunggah ke folder yang sesuai.");
                }
            } catch (err: any) {
                console.error("Error loading document file:", err);
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

