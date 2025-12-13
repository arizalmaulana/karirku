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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createBrowserClient } from "@/lib/supabase/client";
import { Loader2, Send } from "lucide-react";
import type { ApplicationStatus } from "@/lib/types";

interface ApplicationStatusFormEnhancedProps {
    applicationId: string;
    currentStatus: ApplicationStatus;
    jobSeekerEmail?: string;
}

const statusOptions: { value: ApplicationStatus; label: string; description: string }[] = [
    { value: "submitted", label: "Dikirim", description: "Kembalikan ke status dikirim" },
    { value: "review", label: "Dalam Review", description: "Mulai proses review lamaran" },
    { value: "interview", label: "Interview", description: "Undang kandidat untuk interview" },
    { value: "accepted", label: "Diterima", description: "Terima kandidat untuk posisi ini" },
    { value: "rejected", label: "Ditolak", description: "Tolak lamaran kandidat" },
];

export function ApplicationStatusFormEnhanced({ 
    applicationId, 
    currentStatus,
    jobSeekerEmail 
}: ApplicationStatusFormEnhancedProps) {
    const router = useRouter();
    const supabase = createBrowserClient();
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<ApplicationStatus>(currentStatus);
    const [notes, setNotes] = useState("");

    const selectedStatus = statusOptions.find(opt => opt.value === status);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Validasi notes untuk status rejected
            if (status === "rejected" && !notes.trim()) {
                toast.error("Mohon berikan alasan penolakan");
                setIsLoading(false);
                return;
            }

            // Validasi notes untuk status interview
            if (status === "interview" && !notes.trim()) {
                toast.error("Mohon berikan informasi jadwal interview");
                setIsLoading(false);
                return;
            }

            // Prepare update data
            const updateData: any = {
                status: status,
                updated_at: new Date().toISOString(),
            };

            // Simpan notes/reason berdasarkan status
            if (status === "rejected" && notes.trim()) {
                updateData.rejection_reason = notes.trim();
            } else if (status === "interview" && notes.trim()) {
                // Parse notes untuk extract interview date dan location jika ada
                // Format: "Tanggal: 2024-01-15 10:00, Lokasi: Jakarta"
                const dateMatch = notes.match(/Tanggal:\s*([^,]+)/i);
                const locationMatch = notes.match(/Lokasi:\s*(.+)/i);
                
                if (dateMatch) {
                    updateData.interview_date = new Date(dateMatch[1].trim()).toISOString();
                }
                if (locationMatch) {
                    updateData.interview_location = locationMatch[1].trim();
                }
                updateData.notes = notes.trim();
            } else if (status === "accepted" && notes.trim()) {
                updateData.notes = notes.trim();
            }

            const { error } = await (supabase
                .from("applications") as any)
                .update(updateData)
                .eq("id", applicationId);

            if (error) throw error;

            // TODO: Kirim email notifikasi ke job seeker
            // if (jobSeekerEmail) {
            //     await sendStatusUpdateEmail(jobSeekerEmail, status, notes);
            // }

            toast.success("Status lamaran berhasil diperbarui");
            
            // Dispatch event untuk real-time update
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("application-status-updated", {
                    detail: { applicationId, status }
                }));
            }
            
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
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {statusOptions
                            .filter(opt => opt.value !== "draft") // Jangan tampilkan draft untuk recruiter
                            .map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                    </SelectContent>
                </Select>
                {selectedStatus && (
                    <p className="text-xs text-gray-500">{selectedStatus.description}</p>
                )}
            </div>

            {/* Notes/Reason field untuk status tertentu */}
            {(status === "rejected" || status === "interview" || status === "accepted") && (
                <div className="space-y-2">
                    <Label htmlFor="notes">
                        {status === "rejected" && "Alasan Penolakan *"}
                        {status === "interview" && "Informasi Interview *"}
                        {status === "accepted" && "Catatan (Opsional)"}
                    </Label>
                    <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={status === "interview" ? 6 : 4}
                        placeholder={
                            status === "rejected"
                                ? "Berikan alasan mengapa lamaran ditolak..."
                                : status === "interview"
                                ? "Contoh format:\nTanggal: 15 Januari 2024, 10:00 WIB\nLokasi: Kantor Jakarta, Jl. Sudirman No. 1\nAtau link Zoom/Google Meet jika online"
                                : "Catatan tambahan untuk kandidat..."
                        }
                        required={status === "rejected" || status === "interview"}
                    />
                    <p className="text-xs text-gray-500">
                        {status === "rejected" && "Catatan ini akan dikirim ke pelamar"}
                        {status === "interview" && "Gunakan format: 'Tanggal: [tanggal], Lokasi: [lokasi]' untuk auto-parse. Informasi ini akan dikirim ke pelamar"}
                        {status === "accepted" && "Catatan ini akan dikirim ke pelamar"}
                    </p>
                </div>
            )}

            <Button 
                type="submit" 
                disabled={isLoading || status === currentStatus} 
                className="w-full"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Memperbarui...
                    </>
                ) : (
                    <>
                        <Send className="mr-2 h-4 w-4" />
                        Perbarui Status
                    </>
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

