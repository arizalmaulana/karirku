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
import { Loader2, X, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            draft: "Draft",
            submitted: "Dikirim",
            review: "Dalam Review",
            interview: "Interview",
            accepted: "Diterima",
            rejected: "Ditolak",
        };
        return labels[status] || status;
    };

    if (!canWithdraw) {
        return (
            <Alert className="border-yellow-200 bg-yellow-50">
                <Info className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                    <div className="space-y-1">
                        <div className="font-semibold">Tidak dapat menarik lamaran</div>
                        <div className="text-sm">
                            Lamaran hanya dapat ditarik saat status masih <strong>"Dikirim"</strong> atau <strong>"Dalam Review"</strong>.
                            Status saat ini: <strong>{getStatusLabel(currentStatus)}</strong>
                        </div>
                    </div>
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                    <div className="space-y-1">
                        <div className="font-semibold">Informasi Tarik Lamaran</div>
                        <div className="text-sm">
                            Anda dapat menarik lamaran saat status masih <strong>"Dikirim"</strong> atau <strong>"Dalam Review"</strong>.
                            Setelah status berubah menjadi <strong>"Interview"</strong>, <strong>"Diterima"</strong>, atau <strong>"Ditolak"</strong>, lamaran tidak dapat ditarik lagi.
                        </div>
                    </div>
                </AlertDescription>
            </Alert>
            
            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogTrigger asChild>
                    <Button 
                        variant="destructive" 
                        size="default"
                        className="w-full bg-red-600 hover:bg-red-700 text-white border-red-700 shadow-md hover:shadow-lg transition-all"
                    >
                        <X className="h-4 w-4 mr-2" />
                        Tarik Lamaran
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Yakin ingin menarik lamaran?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                            <p>
                                Tindakan ini tidak dapat dibatalkan. Lamaran Anda akan dihapus dan tidak dapat dikembalikan.
                            </p>
                            <p>
                                Anda masih bisa melamar kembali ke lowongan yang sama di kemudian hari.
                            </p>
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
        </div>
    );
}

