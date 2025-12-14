import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LivingCostForm } from "@/components/admin/LivingCostForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    return data;
}

export default async function EditLivingCostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const livingCost = await getLivingCost(id);

    if (!livingCost) {
        notFound();
    }

    return (
        <div className="space-y-6 ">
            <div>
                <h1 className="text-3xl font-semibold text-gray-900">Edit Data Biaya Hidup</h1>
                <p className="text-gray-500 mt-1">
                    Perbarui informasi biaya hidup untuk daerah
                </p>
            </div>

            <Card className="bg-gradient-to-br from-purple-50 to-red-100/50">
                <CardHeader >
                    <CardTitle>Informasi Biaya Hidup</CardTitle>
                    <CardDescription>
                        Perbarui informasi yang diperlukan untuk data biaya hidup
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <LivingCostForm initialData={livingCost} livingCostId={id}/>
                </CardContent>
            </Card>
        </div>
    );
}

