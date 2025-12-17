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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { createBrowserClient } from "@/lib/supabase/client";
import { Loader2, UserCheck, UserX } from "lucide-react";
import type { UserRole } from "@/lib/types";

interface UserManagementFormProps {
    user: any;
}

export function UserManagementForm({ user }: UserManagementFormProps) {
    const router = useRouter();
    const supabase = createBrowserClient();
    const [isLoading, setIsLoading] = useState(false);
    const [role, setRole] = useState<UserRole>(user.role || 'jobseeker');
    const [isApproved, setIsApproved] = useState(user.is_approved || false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const updateData: any = {
                role: role,
            };

            // Update is_approved untuk semua role (status aktif)
            updateData.is_approved = isApproved;

            const { error } = await (supabase
                .from("profiles") as any)
                .update(updateData)
                .eq("id", user.id);

            if (error) throw error;

            // Buat notifikasi jika recruiter baru saja di-approve
            if (isApproved && user.role === "recruiter" && !user.is_approved) {
                try {
                    const { notifyRecruiterApproval } = await import("@/lib/utils/notifications");
                    await notifyRecruiterApproval(user.id);
                } catch (notifError) {
                    // Jangan gagalkan proses jika notifikasi gagal
                    console.error("Error creating notification:", notifError);
                }
            }

            toast.success("Data pengguna berhasil diperbarui");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan saat memperbarui data");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="!bg-white text-black border border-gray-200/40">
                        <SelectItem value="jobseeker" className="!bg-white text-black hover:bg-gray-100">Job Seeker</SelectItem>
                        <SelectItem value="recruiter" className="!bg-white text-black hover:bg-gray-100">Recruiter</SelectItem>
                        <SelectItem value="admin" className="!bg-white text-black hover:bg-gray-100">Admin</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center space-x-2">
                <Checkbox
                    id="is_approved"
                    checked={isApproved}
                    onCheckedChange={(checked) => setIsApproved(checked as boolean)}
                />
                <Label htmlFor="is_approved" className="cursor-pointer flex items-center gap-2">
                    {isApproved ? (
                        <>
                            <UserCheck className="h-4 w-4 text-green-600" />
                            Aktif
                        </>
                    ) : (
                        <>
                            <UserX className="h-4 w-4 text-gray-400" />
                            Tidak Aktif
                        </>
                    )}
                </Label>
            </div>

            <Button 
                type="submit" 
                disabled={isLoading || (role === user.role && isApproved === user.is_approved)}
                className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menyimpan...
                    </>
                ) : (
                    "Perbarui Data"
                )}
            </Button>

            {(role === user.role && isApproved === user.is_approved) && (
                <p className="text-xs text-gray-500 text-center">
                    Tidak ada perubahan
                </p>
            )}
        </form>
    );
}

