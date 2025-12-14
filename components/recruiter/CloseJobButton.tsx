'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createBrowserClient } from "@/lib/supabase/client";
import { Lock, Unlock, Loader2 } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CloseJobButtonProps {
    jobId: string;
    jobTitle: string;
    isClosed: boolean;
}

export function CloseJobButton({ jobId, jobTitle, isClosed }: CloseJobButtonProps) {
    const router = useRouter();
    const supabase = createBrowserClient();
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const handleToggleClose = async () => {
        setIsLoading(true);
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                throw new Error("User not authenticated");
            }

            const { error } = await (supabase
                .from("job_listings") as any)
                .update({ is_closed: !isClosed })
                .eq("id", jobId)
                .eq("recruiter_id", user.id);

            if (error) throw error;

            toast.success(
                isClosed 
                    ? "Lowongan berhasil dibuka kembali" 
                    : "Lowongan berhasil ditutup"
            );
            router.refresh();
            setOpen(false);
        } catch (error: any) {
            console.error("Error toggling job status:", error);
            toast.error(error.message || "Terjadi kesalahan saat mengubah status lowongan");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className={isClosed 
                        ? "text-green-600 hover:text-green-700 hover:bg-green-50" 
                        : "text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    }
                    title={isClosed ? "Buka Kembali Lowongan" : "Tutup Lowongan"}
                >
                    {isClosed ? (
                        <Unlock className="h-4 w-4" />
                    ) : (
                        <Lock className="h-4 w-4" />
                    )}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {isClosed ? "Buka Kembali Lowongan?" : "Tutup Lowongan?"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {isClosed ? (
                            <>
                                Apakah Anda yakin ingin membuka kembali lowongan <strong>{jobTitle}</strong>?
                                Lowongan akan kembali ditampilkan di landing page dan halaman jobseeker.
                            </>
                        ) : (
                            <>
                                Apakah Anda yakin ingin menutup lowongan <strong>{jobTitle}</strong>?
                                Lowongan akan disembunyikan dari landing page dan halaman jobseeker, 
                                tetapi masih dapat dilihat di dashboard recruiter.
                            </>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Batal</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleToggleClose}
                        disabled={isLoading}
                        className={isClosed 
                            ? "bg-green-600 hover:bg-green-700" 
                            : "bg-orange-600 hover:bg-orange-700"
                        }
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Memproses...
                            </>
                        ) : (
                            isClosed ? "Buka Kembali" : "Tutup Lowongan"
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}



