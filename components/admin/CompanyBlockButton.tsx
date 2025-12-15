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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface CompanyBlockButtonProps {
    companyId: string;
    companyName: string;
    isBlocked: boolean;
    blockedReason?: string | null;
}

export function CompanyBlockButton({ 
    companyId, 
    companyName, 
    isBlocked,
    blockedReason 
}: CompanyBlockButtonProps) {
    const router = useRouter();
    const supabase = createBrowserClient();
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState(blockedReason || "");

    const handleToggleBlock = async () => {
        setIsLoading(true);

        try {
            const updateData: any = {
                is_blocked: !isBlocked,
            };

            // Jika memblokir, simpan alasan
            if (!isBlocked) {
                if (!reason.trim()) {
                    toast.error("Alasan pemblokiran wajib diisi");
                    setIsLoading(false);
                    return;
                }
                updateData.blocked_reason = reason.trim();
            } else {
                // Jika membuka blokir, hapus alasan
                updateData.blocked_reason = null;
            }

            const { error } = await (supabase
                .from("companies") as any)
                .update(updateData)
                .eq("id", companyId);

            if (error) throw error;

            toast.success(
                isBlocked 
                    ? "Perusahaan berhasil dibuka kembali" 
                    : "Perusahaan berhasil diblokir"
            );
            setOpen(false);
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan saat memperbarui status");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button 
                    variant="outline" 
                    size="sm"
                    className={isBlocked 
                        ? "text-green-600 hover:text-green-700 hover:bg-green-50" 
                        : "text-red-600 hover:text-red-700 hover:bg-red-50"
                    }
                    title={isBlocked ? "Buka Blokir Perusahaan" : "Blokir Perusahaan"}
                >
                    {isBlocked ? (
                        <Unlock className="h-4 w-4 mr-2" />
                    ) : (
                        <Lock className="h-4 w-4 mr-2" />
                    )}
                    {isBlocked ? "Buka Blokir" : "Blokir"}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {isBlocked ? "Buka Blokir Perusahaan?" : "Blokir Perusahaan?"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {isBlocked ? (
                            <>
                                Apakah Anda yakin ingin membuka blokir perusahaan <strong>{companyName}</strong>?
                                Recruiter akan bisa login kembali setelah perusahaan dibuka.
                            </>
                        ) : (
                            <>
                                Apakah Anda yakin ingin memblokir perusahaan <strong>{companyName}</strong>?
                                Recruiter tidak akan bisa login sampai perusahaan dibuka kembali oleh admin.
                            </>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {!isBlocked && (
                    <div className="space-y-2">
                        <Label htmlFor="block-reason">Alasan Pemblokiran *</Label>
                        <Textarea
                            id="block-reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Masukkan alasan mengapa perusahaan ini diblokir..."
                            rows={3}
                            className="resize-none"
                        />
                        <p className="text-xs text-gray-500">
                            Alasan ini akan ditampilkan kepada recruiter dan di card perusahaan.
                        </p>
                    </div>
                )}
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Batal</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleToggleBlock}
                        disabled={isLoading}
                        className={isBlocked ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Memproses...
                            </>
                        ) : (
                            isBlocked ? "Buka Blokir" : "Blokir"
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

