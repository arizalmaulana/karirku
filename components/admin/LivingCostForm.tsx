'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createBrowserClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import type { LivingCost } from "@/lib/types";

interface LivingCostFormProps {
    initialData?: LivingCost;
    livingCostId?: string;
}

export function LivingCostForm({ initialData, livingCostId }: LivingCostFormProps) {
    const router = useRouter();
    const supabase = createBrowserClient();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        city: initialData?.city || "",
        province: initialData?.province || "",
        avg_rent: initialData?.avg_rent?.toString() || "",
        avg_food: initialData?.avg_food?.toString() || "",
        avg_transport: initialData?.avg_transport?.toString() || "",
        salary_reference: initialData?.salary_reference?.toString() || "",
        currency: initialData?.currency || "IDR",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const livingCostData = {
                city: formData.city,
                province: formData.province,
                avg_rent: formData.avg_rent ? parseInt(formData.avg_rent) : null,
                avg_food: formData.avg_food ? parseInt(formData.avg_food) : null,
                avg_transport: formData.avg_transport ? parseInt(formData.avg_transport) : null,
                salary_reference: formData.salary_reference ? parseInt(formData.salary_reference) : null,
                currency: formData.currency,
            };

            if (livingCostId) {
                const { error } = await (supabase
                    .from("living_costs") as any)
                    .update(livingCostData)
                    .eq("id", livingCostId);

                if (error) throw error;
                toast.success("Data biaya hidup berhasil diperbarui");
            } else {
                const { error } = await (supabase
                    .from("living_costs") as any)
                    .insert([livingCostData]);

                if (error) throw error;
                toast.success("Data biaya hidup berhasil ditambahkan");
            }

            router.push("/admin/living-costs");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan saat menyimpan data");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="city">Kota *</Label>
                    <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="province">Provinsi *</Label>
                    <Input
                        id="province"
                        value={formData.province}
                        onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                        required
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="avg_rent">Rata-rata Sewa (per bulan)</Label>
                    <Input
                        id="avg_rent"
                        type="number"
                        value={formData.avg_rent}
                        onChange={(e) => setFormData({ ...formData, avg_rent: e.target.value })}
                        placeholder="Contoh: 4500000"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="avg_food">Rata-rata Makan (per bulan)</Label>
                    <Input
                        id="avg_food"
                        type="number"
                        value={formData.avg_food}
                        onChange={(e) => setFormData({ ...formData, avg_food: e.target.value })}
                        placeholder="Contoh: 2500000"
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="avg_transport">Rata-rata Transport (per bulan)</Label>
                    <Input
                        id="avg_transport"
                        type="number"
                        value={formData.avg_transport}
                        onChange={(e) => setFormData({ ...formData, avg_transport: e.target.value })}
                        placeholder="Contoh: 800000"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="salary_reference">Gaji Referensi (per bulan)</Label>
                    <Input
                        id="salary_reference"
                        type="number"
                        value={formData.salary_reference}
                        onChange={(e) => setFormData({ ...formData, salary_reference: e.target.value })}
                        placeholder="Contoh: 12000000"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="currency">Mata Uang</Label>
                <Input
                    id="currency"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    maxLength={3}
                />
            </div>

            <div className="flex gap-4">
                <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg shadow-indigo-500/30 cursor-pointer" type="submit" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Menyimpan...
                        </>
                    ) : (
                        livingCostId ? "Perbarui Data" : "Tambah Data"
                    )}
                </Button>
                <Button className="cursor-pointer"
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/admin/living-costs")}
                >
                    Batal
                </Button>
            </div>
        </form>
    );
}

