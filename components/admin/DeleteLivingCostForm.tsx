'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Link from "next/link";

interface DeleteLivingCostFormProps {
    livingCostId: string;
}

export function DeleteLivingCostForm({ livingCostId }: DeleteLivingCostFormProps) {
    const router = useRouter();
    const supabase = createBrowserClient();
    const [isLoading, setIsLoading] = useState(false);
    const [cityName, setCityName] = useState("");

    useEffect(() => {
        async function fetchLivingCost() {
            const { data } = await supabase
                .from("living_costs")
                .select("city")
                .eq("id", livingCostId)
                .single();
            
            if (data) {
                setCityName(data.city);
            }
        }
        fetchLivingCost();
    }, [livingCostId, supabase]);

    const handleDelete = async () => {
        setIsLoading(true);
        try {
            const { error } = await supabase
                .from("living_costs")
                .delete()
                .eq("id", livingCostId);

            if (error) throw error;

            toast.success("Data biaya hidup berhasil dihapus");
            router.push("/admin/living-costs");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan saat menghapus data");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-600">
                Apakah Anda yakin ingin menghapus data biaya hidup untuk <strong>{cityName || "ini"}</strong>?
                Semua data terkait akan dihapus secara permanen.
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
                    <Link href="/admin/living-costs">Batal</Link>
                </Button>
            </div>
        </div>
    );
}

