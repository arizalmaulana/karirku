'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createBrowserClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import type { ApplicationStatus } from "@/lib/types";

interface ApplicationStatusFormProps {
    applicationId: string;
    currentStatus: ApplicationStatus;
}

const statusOptions: { value: ApplicationStatus; label: string }[] = [
    { value: "submitted", label: "Dikirim" },
    { value: "review", label: "Dalam Review" },
    { value: "interview", label: "Interview" },
    { value: "accepted", label: "Diterima" },
    { value: "rejected", label: "Ditolak" },
];

export function ApplicationStatusForm({ applicationId, currentStatus }: ApplicationStatusFormProps) {
    const router = useRouter();
    const supabase = createBrowserClient();
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<ApplicationStatus>(currentStatus);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { error } = await (supabase
                .from("applications") as any)
                .update({
                    status: status,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", applicationId);

            if (error) throw error;

            toast.success("Status lamaran berhasil diperbarui");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan saat memperbarui status");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="status">Status Lamaran</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as ApplicationStatus)}>
                    <SelectTrigger className="bg-gray-200">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-200">
                        {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="bg-gray-200 hover:bg-gray-300">
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Button type="submit" disabled={isLoading || status === currentStatus} className="w-full">
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Memperbarui...
                    </>
                ) : (
                    "Perbarui Status"
                )}
            </Button>

            {status === currentStatus && (
                <p className="text-xs text-gray-500 text-center">
                    Status sudah sama dengan status saat ini
                </p>
            )}
        </form>
    );
}

