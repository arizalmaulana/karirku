'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createBrowserClient } from "@/lib/supabase/client";
import { Trash2, Loader2 } from "lucide-react";
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

interface DeleteJobButtonProps {
    jobId: string;
    jobTitle: string;
}

export function DeleteJobButton({ jobId, jobTitle }: DeleteJobButtonProps) {
    const router = useRouter();
    const supabase = createBrowserClient();
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const handleDelete = async () => {
        setIsLoading(true);
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                throw new Error("User not authenticated");
            }

            // Check if job has applications
            const { count } = await supabase
                .from("applications")
                .select("*", { count: "exact", head: true })
                .eq("job_id", jobId);

            if (count && count > 0) {
                toast.error(`Tidak dapat menghapus lowongan. Masih ada ${count} pelamar yang terdaftar.`);
                setIsLoading(false);
                setOpen(false);
                return;
            }

            const { error } = await (supabase
                .from("job_listings") as any)
                .delete()
                .eq("id", jobId)
                .eq("recruiter_id", user.id);

            if (error) throw error;

            toast.success("Lowongan berhasil dihapus");
            router.push("/recruiter/jobs");
            router.refresh();
        } catch (error: any) {
            console.error("Error deleting job:", error);
            toast.error(error.message || "Terjadi kesalahan saat menghapus lowongan");
        } finally {
            setIsLoading(false);
            setOpen(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="hover:bg-red-50">
                    <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Lowongan?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Apakah Anda yakin ingin menghapus lowongan <strong>{jobTitle}</strong>?
                        Tindakan ini tidak dapat dibatalkan dan semua data terkait akan dihapus secara permanen.
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
                            "Hapus"
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
