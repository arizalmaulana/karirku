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
import { Loader2, Trash2 } from "lucide-react";

interface DeleteApplicationButtonProps {
    applicationId: string;
}

export function DeleteApplicationButton({ applicationId }: DeleteApplicationButtonProps) {
    const router = useRouter();
    const supabase = createBrowserClient();
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const handleDelete = async () => {
        setIsLoading(true);
        try {
            const { error } = await (supabase
                .from("applications") as any)
                .delete()
                .eq("id", applicationId);

            if (error) throw error;

            toast.success("Lamaran berhasil dihapus");
            setOpen(false);
            // Redirect ke halaman list setelah berhasil delete
            router.push("/admin/applications");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan saat menghapus lamaran");
            setIsLoading(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Lamaran?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Apakah Anda yakin ingin menghapus lamaran ini? Tindakan ini tidak dapat dibatalkan.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Batal</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isLoading}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Menghapus...
                            </>
                        ) : (
                            "Ya, Hapus"
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

