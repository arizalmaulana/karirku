'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Link from "next/link";

interface DeleteJobFormProps {
    jobId: string;
}

export function DeleteJobForm({ jobId }: DeleteJobFormProps) {
    const router = useRouter();
    const supabase = createBrowserClient();
    const [isLoading, setIsLoading] = useState(false);
    const [jobTitle, setJobTitle] = useState("");

    useEffect(() => {
        async function fetchJob() {
            const { data } = await supabase
                .from("job_listings")
                .select("title")
                .eq("id", jobId)
                .single();
            
            if (data) {
                setJobTitle((data as any).title);
            }
        }
        fetchJob();
    }, [jobId, supabase]);

    const handleDelete = async () => {
        setIsLoading(true);
        try {
            const { error } = await supabase
                .from("job_listings")
                .delete()
                .eq("id", jobId);

            if (error) throw error;

            toast.success("Lowongan berhasil dihapus");
            router.push("/admin/jobs");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan saat menghapus lowongan");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-600">
                Apakah Anda yakin ingin menghapus lowongan <strong>{jobTitle || "ini"}</strong>?
                Semua data terkait lowongan ini akan dihapus secara permanen.
            </p>

            <div className="flex gap-4">
                <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isLoading}
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
                <Button variant="outline" asChild>
                    <Link href="/admin/jobs">Batal</Link>
                </Button>
            </div>
        </div>
    );
}

