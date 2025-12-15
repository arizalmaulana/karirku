'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createBrowserClient } from "@/lib/supabase/client";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
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

interface CompanyApprovalFormProps {
    companyId: string;
    currentStatus: string | null;
    companyName: string;
}

export function CompanyApprovalForm({ 
    companyId, 
    currentStatus,
    companyName 
}: CompanyApprovalFormProps) {
    const router = useRouter();
    const supabase = createBrowserClient();
    const [isLoading, setIsLoading] = useState(false);
    const [notes, setNotes] = useState("");

    const handleApprove = async () => {
        setIsLoading(true);

        try {
            const { error } = await (supabase
                .from("companies") as any)
                .update({
                    status: "approved",
                    is_approved: true,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", companyId);

            if (error) throw error;

            toast.success("Perusahaan berhasil disetujui");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan saat menyetujui perusahaan");
        } finally {
            setIsLoading(false);
        }
    };

    const handleReject = async () => {
        if (!notes.trim()) {
            toast.error("Mohon berikan alasan penolakan");
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await (supabase
                .from("companies") as any)
                .update({
                    status: "rejected",
                    is_approved: false,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", companyId);

            if (error) throw error;

            toast.success("Perusahaan ditolak");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan saat menolak perusahaan");
        } finally {
            setIsLoading(false);
        }
    };

    if (currentStatus === "approved") {
        return (
            <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle2 className="h-5 w-5" />
                        <p className="font-medium">Perusahaan ini sudah disetujui</p>
                    </div>
                </div>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button 
                            variant="destructive" 
                            className="w-full"
                            disabled={isLoading}
                        >
                            <XCircle className="mr-2 h-4 w-4" />
                            Batalkan Persetujuan
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Batalkan Persetujuan?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Apakah Anda yakin ingin membatalkan persetujuan untuk perusahaan "{companyName}"? 
                                Status akan diubah menjadi "Menunggu" dan recruiter akan diberitahu.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={async () => {
                                    setIsLoading(true);
                                    try {
                                        const { error } = await (supabase
                                            .from("companies") as any)
                                            .update({
                                                status: "pending",
                                                is_approved: false,
                                                updated_at: new Date().toISOString(),
                                            })
                                            .eq("id", companyId);

                                        if (error) throw error;

                                        toast.success("Persetujuan dibatalkan");
                                        router.refresh();
                                    } catch (error: any) {
                                        toast.error(error.message || "Terjadi kesalahan");
                                    } finally {
                                        setIsLoading(false);
                                    }
                                }}
                                className="bg-yellow-600 hover:bg-yellow-700"
                            >
                                Ya, Batalkan
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        );
    }

    if (currentStatus === "rejected") {
        return (
            <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700">
                        <XCircle className="h-5 w-5" />
                        <p className="font-medium">Perusahaan ini ditolak</p>
                    </div>
                </div>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button 
                            variant="default" 
                            className="w-full"
                            disabled={isLoading}
                        >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Setujui Perusahaan
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Setujui Perusahaan?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Apakah Anda yakin ingin menyetujui perusahaan "{companyName}"? 
                                Perusahaan akan ditampilkan ke publik setelah disetujui.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleApprove}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Memproses...
                                    </>
                                ) : (
                                    "Ya, Setujui"
                                )}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        );
    }

    // Status pending
    return (
        <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-700">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <p className="font-medium">Menunggu validasi</p>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="notes">Catatan (Opsional)</Label>
                <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Tambahkan catatan untuk validasi ini..."
                />
            </div>

            <div className="flex gap-2">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button 
                            variant="default" 
                            className="flex-1"
                            disabled={isLoading}
                        >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Setujui
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Setujui Perusahaan?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Apakah Anda yakin ingin menyetujui perusahaan "{companyName}"? 
                                Perusahaan akan ditampilkan ke publik setelah disetujui.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleApprove}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Memproses...
                                    </>
                                ) : (
                                    "Ya, Setujui"
                                )}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button 
                            variant="destructive" 
                            className="flex-1"
                            disabled={isLoading}
                        >
                            <XCircle className="mr-2 h-4 w-4" />
                            Tolak
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Tolak Perusahaan?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Apakah Anda yakin ingin menolak perusahaan "{companyName}"? 
                                Recruiter akan diberitahu dan dapat mengajukan ulang setelah memperbaiki data.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-2 py-4">
                            <Label htmlFor="rejection-notes">Alasan Penolakan *</Label>
                            <Textarea
                                id="rejection-notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                placeholder="Berikan alasan mengapa perusahaan ditolak..."
                                required
                            />
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleReject}
                                disabled={isLoading || !notes.trim()}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Memproses...
                                    </>
                                ) : (
                                    "Ya, Tolak"
                                )}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}

















