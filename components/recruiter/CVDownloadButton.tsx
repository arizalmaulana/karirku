'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface CVDownloadButtonProps {
    cvUrl: string | null;
    jobSeekerId: string;
}

export function CVDownloadButton({ cvUrl, jobSeekerId }: CVDownloadButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createBrowserClient();

    const handleDownload = async () => {
        if (!cvUrl) {
            toast.error("CV tidak tersedia");
            return;
        }

        setIsLoading(true);
        try {
            let filePath = '';
            let signedUrl = '';

            // Extract file path from URL
            if (cvUrl.includes('/storage/v1/object/')) {
                const urlParts = cvUrl.split('/storage/v1/object/');
                if (urlParts.length > 1) {
                    const pathAfterObject = urlParts[1];
                    const pathParts = pathAfterObject.split('/');
                    
                    let startIndex = 0;
                    if (pathParts[0] === 'public' || pathParts[0] === 'sign') {
                        startIndex = 1;
                    }
                    
                    if (pathParts.length > startIndex + 1) {
                        filePath = pathParts.slice(startIndex + 1).join('/');
                    } else if (pathParts.length > startIndex) {
                        filePath = pathParts[startIndex];
                    }
                }
            } else if (cvUrl.includes('/applications/')) {
                const parts = cvUrl.split('/applications/');
                if (parts.length > 1) {
                    filePath = parts[1].split('?')[0];
                }
            } else {
                // Assume it's just the filename (e.g., "cv_userid_timestamp.pdf")
                filePath = cvUrl.split('/').pop() || cvUrl;
            }

            // Try to create signed URL
            if (filePath) {
                const { data, error } = await supabase.storage
                    .from('applications')
                    .createSignedUrl(filePath, 3600); // 1 hour expiry

                if (!error && data?.signedUrl) {
                    signedUrl = data.signedUrl;
                } else {
                    console.log("Failed to create signed URL for:", filePath, error);
                    // Fallback: try to find file by job seeker ID
                    if (jobSeekerId) {
                        try {
                            const { data: files, error: listError } = await supabase.storage
                                .from('applications')
                                .list('', {
                                    limit: 100,
                                    sortBy: { column: 'created_at', order: 'desc' }
                                });

                            if (!listError && files) {
                                const matchingFile = files.find(file => 
                                    (file.name.startsWith('cv_') || file.name.startsWith('doc_')) &&
                                    file.name.includes(jobSeekerId)
                                );

                                if (matchingFile) {
                                    const { data: urlData, error: urlError } = await supabase.storage
                                        .from('applications')
                                        .createSignedUrl(matchingFile.name, 3600);
                                    
                                    if (!urlError && urlData?.signedUrl) {
                                        signedUrl = urlData.signedUrl;
                                    }
                                }
                            }
                        } catch (listErr) {
                            console.error("Error listing files:", listErr);
                        }
                    }
                }
            }

            // If still no signed URL, try using public URL if available
            if (!signedUrl) {
                if (cvUrl.includes('/public/')) {
                    signedUrl = cvUrl;
                } else {
                    toast.error("Tidak dapat mengakses CV. Pastikan file masih tersedia dan RLS policy sudah dikonfigurasi.");
                    setIsLoading(false);
                    return;
                }
            }

            // Open CV in new tab
            if (signedUrl) {
                window.open(signedUrl, '_blank');
                toast.success("Membuka CV...");
            }
        } catch (error: any) {
            console.error("Error downloading CV:", error);
            toast.error("Gagal membuka CV: " + (error.message || "Terjadi kesalahan"));
        } finally {
            setIsLoading(false);
        }
    };

    if (!cvUrl) {
        return null;
    }

    return (
        <Button
            size="sm"
            variant="outline"
            onClick={handleDownload}
            disabled={isLoading}
            className="shadow-md"
            style={{ 
                backgroundColor: '#14b8a6',
                color: 'white',
                border: 'none'
            }}
            onMouseEnter={(e) => {
                if (!isLoading) {
                    e.currentTarget.style.backgroundColor = '#0d9488';
                }
            }}
            onMouseLeave={(e) => {
                if (!isLoading) {
                    e.currentTarget.style.backgroundColor = '#14b8a6';
                }
            }}
        >
            {isLoading ? (
                <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Membuka...
                </>
            ) : (
                <>
                    <FileText className="h-3 w-3 mr-1" />
                    Lihat
                </>
            )}
        </Button>
    );
}
