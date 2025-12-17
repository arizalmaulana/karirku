'use client';

import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { createBrowserClient } from "@/lib/supabase/client";
import { Loader2, Save } from "lucide-react";
import type { ApplicationStatus } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ApplicationEditFormProps {
    applicationId: string;
    initialData: {
        status: ApplicationStatus;
        notes?: string | null;
        rejection_reason?: string | null;
        interview_date?: string | null;
        interview_location?: string | null;
    };
}

const statusOptions: { value: ApplicationStatus; label: string; description: string }[] = [
    { value: "submitted", label: "Dikirim", description: "Lamaran telah dikirim" },
    { value: "review", label: "Dalam Review", description: "Lamaran sedang direview" },
    { value: "interview", label: "Interview", description: "Kandidat diundang interview" },
    { value: "accepted", label: "Diterima", description: "Lamaran diterima" },
    { value: "rejected", label: "Ditolak", description: "Lamaran ditolak" },
];

export function ApplicationEditForm({ applicationId, initialData }: ApplicationEditFormProps) {
    const router = useRouter();
    const supabase = createBrowserClient();
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<ApplicationStatus>(initialData.status);
    const [rejectionReason, setRejectionReason] = useState(initialData.rejection_reason || "");
    const [interviewDate, setInterviewDate] = useState(
        initialData.interview_date 
            ? new Date(initialData.interview_date).toISOString().slice(0, 16)
            : ""
    );
    const [interviewLocation, setInterviewLocation] = useState(initialData.interview_location || "");
    const [acceptedNotes, setAcceptedNotes] = useState(
        initialData.status === "accepted" && initialData.notes ? initialData.notes : ""
    );

    const selectedStatus = statusOptions.find(opt => opt.value === status);

    // Handle status change
    const handleStatusChange = (newStatus: ApplicationStatus) => {
        setStatus(newStatus);
        // Reset acceptedNotes jika status bukan accepted
        if (newStatus !== "accepted") {
            setAcceptedNotes("");
        } else if (newStatus === "accepted" && initialData.notes && !acceptedNotes) {
            // Jika status berubah ke accepted dan belum ada acceptedNotes, ambil dari initialData
            setAcceptedNotes(initialData.notes);
        }
    };

    // Get minimum date for interview (today, current time)
    const getMinInterviewDate = () => {
        const now = new Date();
        // Format: YYYY-MM-DDTHH:mm (datetime-local format)
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Validasi keterangan untuk status accepted
            if (status === "accepted" && !acceptedNotes.trim()) {
                toast.error("Mohon isi keterangan untuk status diterima");
                setIsLoading(false);
                return;
            }

            // Validasi notes untuk status rejected
            if (status === "rejected" && !rejectionReason.trim()) {
                toast.error("Mohon berikan alasan penolakan");
                setIsLoading(false);
                return;
            }

            // Validasi interview info untuk status interview
            if (status === "interview") {
                if (!interviewDate.trim()) {
                    toast.error("Mohon isi jadwal interview");
                    setIsLoading(false);
                    return;
                }
                if (!interviewLocation.trim()) {
                    toast.error("Mohon isi lokasi interview");
                    setIsLoading(false);
                    return;
                }
                // Validasi: tanggal interview tidak boleh di hari sebelumnya
                const selectedDate = new Date(interviewDate);
                const now = new Date();
                // Set waktu ke 00:00:00 untuk perbandingan tanggal saja
                const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
                const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                
                if (selectedDateOnly < todayOnly) {
                    toast.error("Tanggal interview tidak boleh di hari sebelumnya. Pilih tanggal hari ini atau setelahnya.");
                    setIsLoading(false);
                    return;
                }
            }

            // Prepare update data
            const updateData: any = {
                status: status,
                updated_at: new Date().toISOString(),
            };

            // Set notes - untuk accepted, gunakan acceptedNotes (wajib)
            if (status === "accepted") {
                updateData.notes = acceptedNotes.trim();
            } else {
                updateData.notes = null;
            }

            // Set rejection reason
            if (status === "rejected" && rejectionReason.trim()) {
                updateData.rejection_reason = rejectionReason.trim();
            } else {
                updateData.rejection_reason = null;
            }

            // Set interview info
            if (status === "interview" && interviewDate.trim()) {
                updateData.interview_date = new Date(interviewDate).toISOString();
                updateData.interview_location = interviewLocation.trim();
            } else {
                updateData.interview_date = null;
                updateData.interview_location = null;
            }

            const { error } = await (supabase
                .from("applications") as any)
                .update(updateData)
                .eq("id", applicationId);

            if (error) throw error;

            toast.success("Lamaran berhasil diperbarui");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan saat memperbarui lamaran");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="border-0 bg-gradient-to-br from-blue-50 to-pink-200/50 shadow-sm">
                <CardHeader>
                    <CardTitle>Status Lamaran</CardTitle>
                    <CardDescription>
                        Perbarui status lamaran kandidat
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={status} onValueChange={(value) => handleStatusChange(value as ApplicationStatus)}>
                            <SelectTrigger className="bg-gray-200">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-200">
                                {statusOptions
                                    .filter(opt => opt.value !== "draft")
                                    .map((option) => (
                                        <SelectItem key={option.value} value={option.value} className="bg-gray-200 hover:bg-gray-300">
                                            {option.label}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                        {selectedStatus && (
                            <p className="text-xs text-gray-500">{selectedStatus.description}</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-blue-50 to-pink-200/50 shadow-sm">
                <CardHeader>
                    <CardTitle>Informasi Interview</CardTitle>
                    <CardDescription>
                        Isi jika status adalah Interview
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="interview_date">Jadwal Interview<span className="text-red-500">*</span></Label> 
                        <Input
                            id="interview_date"
                            type="datetime-local"
                            value={interviewDate}
                            onChange={(e) => setInterviewDate(e.target.value)}
                            disabled={status !== "interview"}
                            required={status === "interview"}
                            min={status === "interview" ? getMinInterviewDate() : undefined}
                        />
                        <p className="text-xs text-gray-500">
                            {status === "interview" 
                                ? "Wajib diisi untuk status Interview. Tanggal tidak boleh di hari sebelumnya."
                                : "Aktif jika status adalah Interview"}
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="interview_location">Lokasi Interview <span className="text-red-500">*</span></Label>
                        <Input
                            id="interview_location"
                            value={interviewLocation}
                            onChange={(e) => setInterviewLocation(e.target.value)}
                            placeholder="Contoh: Kantor Jakarta, Jl. Sudirman No. 1 atau Link Zoom/Google Meet"
                            disabled={status !== "interview"}
                            required={status === "interview"}
                        />
                        <p className="text-xs text-gray-500">
                            {status === "interview" 
                                ? "Wajib diisi untuk status Interview"
                                : "Aktif jika status adalah Interview"}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-blue-50 to-pink-200/50 shadow-sm">
                <CardHeader>
                    <CardTitle>Keterangan Ketika Status Diterima</CardTitle>
                    <CardDescription>
                        Isi jika status adalah Diterima
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="accepted_notes">Keterangan <span className="text-red-500">*</span></Label>
                        <Textarea
                            id="accepted_notes"
                            value={acceptedNotes}
                            onChange={(e) => setAcceptedNotes(e.target.value)}
                            rows={4}
                            placeholder="Contoh: Nomor telepon yang bisa dihubungi: 081234567890, Email: hr@company.com, atau informasi lainnya untuk follow-up..."
                            disabled={status !== "accepted"}
                            required={status === "accepted"}
                        />
                        <p className="text-xs text-gray-500">
                            {status === "accepted" 
                                ? "Wajib diisi untuk status Diterima. Keterangan ini akan dikirim ke pelamar. Bisa diisi dengan nomor telepon, email, atau informasi kontak lainnya untuk follow-up."
                                : "Aktif jika status adalah Diterima"}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-blue-50 to-pink-200/50 shadow-sm">
                <CardHeader>
                    <CardTitle>Alasan Penolakan</CardTitle>
                    <CardDescription>
                        Isi jika status adalah Ditolak
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="rejection_reason">Alasan Penolakan <span className="text-red-500">*</span></Label>
                        <Textarea
                            id="rejection_reason"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={4}
                            placeholder="Berikan alasan mengapa lamaran ditolak..."
                            disabled={status !== "rejected"}
                            required={status === "rejected"}
                        />
                        <p className="text-xs text-gray-500">
                            {status === "rejected" 
                                ? "Wajib diisi untuk status Ditolak. Catatan ini akan dikirim ke pelamar"
                                : "Aktif jika status adalah Ditolak"}
                        </p>
                    </div>
                </CardContent>
            </Card>


            <div className="flex gap-4">
                <Button 
                    type="submit" 
                    disabled={isLoading} 
                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Menyimpan...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Simpan Perubahan
                        </>
                    )}
                </Button>
                <Button 
                    type="button" 
                    onClick={() => router.back()}
                    disabled={isLoading}
                    className="hover:bg-gray-500 text-gray-700 border-0 bg-gray-400 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                >
                    Batal
                </Button>
            </div>
        </form>
    );
}

