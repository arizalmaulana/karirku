import { LivingCostForm } from "@/components/admin/LivingCostForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewLivingCostPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-semibold text-gray-900">Tambah Data Biaya Hidup</h1>
                <p className="text-gray-500 mt-1">
                    Tambahkan data biaya hidup untuk daerah baru
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Informasi Biaya Hidup</CardTitle>
                    <CardDescription>
                        Isi semua informasi yang diperlukan untuk data biaya hidup
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <LivingCostForm />
                </CardContent>
            </Card>
        </div>
    );
}

