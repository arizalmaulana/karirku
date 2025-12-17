import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Pencil, Trash2, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import type { LivingCost } from "@/lib/types";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function formatCurrency(amount: number | null): string {
    if (!amount) return "Tidak disebutkan";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
}

async function getLivingCost(id: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("living_costs")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !data) {
        return null;
    }
    return data as LivingCost;
}

export default async function LivingCostDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const livingCost = await getLivingCost(id);

    if (!livingCost) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" asChild className="hover:bg-gray-500 text-gray-700 border-0 bg-gray-400 shadow-sm transition-colors">
                    <Link href="/admin/living-costs">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Kembali
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-semibold text-gray-900">Data Biaya Hidup</h1>
                    <p className="text-gray-500 mt-1 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {livingCost.city}, {livingCost.province}
                    </p>
                </div>
                <div className="flex gap-1">
                    <Button variant="outline" asChild className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg transition-all" size="default">
                        <Link href={`/admin/living-costs/${livingCost.id}/edit`}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                        </Link>
                    </Button>
                    <Button variant="destructive" asChild>
                        <Link href={`/admin/living-costs/${livingCost.id}/delete`}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Hapus
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 ">
                <Card className="bg-gradient-to-br from-purple-50 to-red-100/50">
                    <CardHeader>
                        <CardTitle>Informasi Lokasi</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-500">Kota</p>
                            <p className="font-medium">{livingCost.city}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Provinsi</p>
                            <p className="font-medium">{livingCost.province}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Mata Uang</p>
                            <Badge variant="outline" className="bg-blue-100 text-blue-700">{livingCost.currency || "IDR"}</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-blue-100/50">
                    <CardHeader>
                        <CardTitle>Rincian Biaya</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-500">Rata-rata Sewa (per bulan)</p>
                            <p className="font-medium text-lg">{formatCurrency(livingCost.avg_rent)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Rata-rata Makan (per bulan)</p>
                            <p className="font-medium text-lg">{formatCurrency(livingCost.avg_food)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Rata-rata Transport (per bulan)</p>
                            <p className="font-medium text-lg">{formatCurrency(livingCost.avg_transport)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Gaji Referensi (per bulan)</p>
                            <p className="font-medium text-lg">{formatCurrency(livingCost.salary_reference)}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {livingCost.updated_at && (
                <Card className="bg-gradient-to-br from-pink-50 to-blue-100/50">
                    <CardHeader>
                        <CardTitle>Informasi Update</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500">
                            Terakhir diperbarui: {new Date(livingCost.updated_at).toLocaleDateString("id-ID", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

