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

            // Hanya update is_approved jika role adalah recruiter
            if (role === 'recruiter') {
                updateData.is_approved = isApproved;
            } else {
                // Jika role bukan recruiter, set is_approved ke null atau false
                updateData.is_approved = null;
            }

            const { error } = await (supabase
                .from("profiles") as any)
                .update(updateData)
                .eq("id", user.id);

            if (error) throw error;

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
                    <SelectContent>
                        <SelectItem value="jobseeker">Job Seeker</SelectItem>
                        <SelectItem value="recruiter">Recruiter</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {role === 'recruiter' && (
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
                                Approved
                            </>
                        ) : (
                            <>
                                <UserX className="h-4 w-4 text-gray-400" />
                                Pending Approval
                            </>
                        )}
                    </Label>
                </div>
            )}

            <Button 
                type="submit" 
                disabled={isLoading || (role === user.role && (role !== 'recruiter' || isApproved === user.is_approved))}
                className="w-full"
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

            {(role === user.role && (role !== 'recruiter' || isApproved === user.is_approved)) && (
                <p className="text-xs text-gray-500 text-center">
                    Tidak ada perubahan
                </p>
            )}
        </form>
    );
}

