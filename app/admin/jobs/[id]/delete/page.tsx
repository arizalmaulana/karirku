import { DeleteJobForm } from "@/components/admin/DeleteJobForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function DeleteJobPage({ params }: { params: { id: string } }) {

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-semibold text-gray-900">Hapus Lowongan</h1>
                <p className="text-gray-500 mt-1">
                    Konfirmasi penghapusan lowongan pekerjaan
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        Peringatan
                    </CardTitle>
                    <CardDescription>
                        Tindakan ini tidak dapat dibatalkan
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DeleteJobForm jobId={params.id} />
                </CardContent>
            </Card>
        </div>
    );
}

