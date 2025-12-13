'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { createBrowserClient } from "@/lib/supabase/client";
import { Loader2, X } from "lucide-react";

interface WithdrawApplicationButtonProps {
    applicationId: string;
    currentStatus: string;
}

export function WithdrawApplicationButton({ 
    applicationId, 
    currentStatus 
}: WithdrawApplicationButtonProps) {
    const router = useRouter();
    const supabase = createBrowserClient();
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);

    // Hanya bisa withdraw jika status masih submitted atau review
    const canWithdraw = currentStatus === 'submitted' || currentStatus === 'review';

    if (!canWithdraw) {
        return null;
    }

    const handleWithdraw = async () => {
        setIsLoading(true);

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                throw new Error("User not authenticated");
            }

            // Hapus aplikasi (atau update status menjadi withdrawn jika ingin tracking)
            const { error } = await supabase
                .from("applications")
                .delete()
                .eq("id", applicationId)
                .eq("job_seeker_id", user.id);

            if (error) throw error;

            toast.success("Lamaran berhasil ditarik");
            setOpen(false);
            router.push("/job-seeker/applications");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan saat menarik lamaran");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button 
                    variant="destructive" 
                    size="sm"
                    className="w-full"
                >
                    <X className="h-4 w-4 mr-2" />
                    Tarik Lamaran
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Yakin ingin menarik lamaran?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tindakan ini tidak dapat dibatalkan. Lamaran Anda akan dihapus dan tidak dapat dikembalikan.
                        Anda masih bisa melamar kembali ke lowongan yang sama di kemudian hari.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Batal</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleWithdraw}
                        disabled={isLoading}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Memproses...
                            </>
                        ) : (
                            "Ya, Tarik Lamaran"
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

