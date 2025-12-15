import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import type { LivingCost } from "@/lib/types";

function formatCurrency(amount: number | null): string {
    if (!amount) return "Tidak disebutkan";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
}

async function getLivingCosts() {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("living_costs")
        .select("*")
        .order("city", { ascending: true });

    if (error) {
        console.error("Error fetching living costs:", error);
        return [];
    }
    return data as LivingCost[];
}

export default async function LivingCostsPage() {
    const livingCosts = await getLivingCosts();

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-semibold text-blue-900">Manajemen Biaya Hidup</h1>
                    <p className="text-gray-500 mt-1">
                        Kelola data biaya hidup untuk setiap daerah
                    </p>
                </div>
                <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg shadow-indigo-500/30" size="lg" asChild>
                    <Link href="/admin/living-costs/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Data Baru
                    </Link>
                </Button>
            </div>

            <Card className="border border-blue-200 bg-gradient-to-br from-blue-50 to-purple-100/50 shadow-sm rounded-2xl p-6">
                <CardHeader>
                    <CardTitle>Data Biaya Hidup</CardTitle>
                    <CardDescription>
                        Total {livingCosts.length} kota dengan data biaya hidup
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {livingCosts.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-sm font-semibold text-gray-700 text-center">Kota</TableHead>
                                    <TableHead className="text-sm font-semibold text-gray-700 text-center">Provinsi</TableHead>
                                    <TableHead className="text-sm font-semibold text-gray-700 text-center">Rata-rata Sewa</TableHead>
                                    <TableHead className="text-sm font-semibold text-gray-700 text-center">Rata-rata Makan</TableHead>
                                    <TableHead className="text-sm font-semibold text-gray-700 text-center">Rata-rata Transport</TableHead>
                                    <TableHead className="text-sm font-semibold text-gray-700 text-center">Gaji Referensi</TableHead>
                                    <TableHead className="text-sm font-semibold text-gray-700 text-center">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {livingCosts.map((cost) => (
                                    <TableRow key={cost.id}>
                                        <TableCell className="font-medium text-center">{cost.city}</TableCell>
                                        <TableCell className="text-center">{cost.province}</TableCell>
                                        <TableCell className="text-center">{formatCurrency(cost.avg_rent)}</TableCell>
                                        <TableCell className="text-center">{formatCurrency(cost.avg_food)}</TableCell>
                                        <TableCell className="text-center">{formatCurrency(cost.avg_transport)}</TableCell>
                                        <TableCell className="text-center">{formatCurrency(cost.salary_reference)}</TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center gap-2">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/admin/living-costs/${cost.id}`}>
                                                        <Eye className="h-4 w-4 text-blue-600" />
                                                    </Link>
                                                </Button>
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/admin/living-costs/${cost.id}/edit`}>
                                                        <Pencil className="h-4 w-4 text-green-600" />
                                                    </Link>
                                                </Button>
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/admin/living-costs/${cost.id}/delete`}>
                                                        <Trash2 className="h-4 w-4 text-red-600" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-500">Belum ada data biaya hidup</p>
                            <Button className="mt-4" asChild>
                                <Link href="/admin/living-costs/new">Tambah Data Pertama</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

