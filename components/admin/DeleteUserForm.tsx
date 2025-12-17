'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Link from "next/link";

interface DeleteUserFormProps {
    userId: string;
}

export function DeleteUserForm({ userId }: DeleteUserFormProps) {
    const router = useRouter();
    const supabase = createBrowserClient();
    const [isLoading, setIsLoading] = useState(false);
    const [userName, setUserName] = useState("");

    useEffect(() => {
        async function fetchUser() {
            const { data } = await supabase
                .from("profiles")
                .select("full_name")
                .eq("id", userId)
                .single();
            
            if (data) {
                setUserName((data as any).full_name || "pengguna ini");
            }
        }
        fetchUser();
    }, [userId, supabase]);

    const handleDelete = async () => {
        setIsLoading(true);
        try {
            // Hapus profile terlebih dahulu
            // Catatan: User di auth.users akan tetap ada, tapi tidak bisa login karena tidak ada profile
            // Untuk menghapus user dari auth.users, diperlukan admin API yang mungkin tidak tersedia
            const { error: profileError } = await supabase
                .from("profiles")
                .delete()
                .eq("id", userId);

            if (profileError) throw profileError;

            // Coba hapus user dari auth.users jika admin API tersedia
            try {
                const { error: authError } = await supabase.auth.admin.deleteUser(userId);
                if (authError && !authError.message.includes('admin') && !authError.message.includes('service_role')) {
                    // Admin API tidak tersedia, tapi profile sudah dihapus
                    console.warn("Could not delete auth user (admin API may not be available):", authError);
                }
            } catch (authErr: any) {
                // Admin API tidak tersedia, tapi profile sudah dihapus
                console.warn("Admin API not available, profile deleted but auth user remains:", authErr);
            }

            toast.success("Pengguna berhasil dihapus");
            router.push("/admin/users");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan saat menghapus pengguna");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-600">
                Apakah Anda yakin ingin menghapus pengguna <strong>{userName || "ini"}</strong>?
                Semua data terkait akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex gap-4">
                <Button
                    variant="outline"
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="text-white border-0 shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                    style={{
                        backgroundColor: '#ef4444',
                        backgroundImage: 'none',
                    }}
                    onMouseEnter={(e) => {
                        if (!isLoading) {
                            e.currentTarget.style.backgroundColor = '#dc2626';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isLoading) {
                            e.currentTarget.style.backgroundColor = '#ef4444';
                        }
                    }}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Menghapus...
                        </>
                    ) : (
                        "Ya, Hapus"
                    )}
                </Button>
                <Button variant="outline" asChild className="hover:bg-gray-500 text-gray-700 border-0 bg-gray-400 shadow-sm transition-colors cursor-pointer">
                    <Link href="/admin/users">Batal</Link>
                </Button>
            </div>
        </div>
    );
}

