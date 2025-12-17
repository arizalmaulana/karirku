import { DeleteJobForm } from "@/components/admin/DeleteJobForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DeleteJobPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-semibold text-purple-600">Hapus Lowongan</h1>
                <p className="text-gray-500 mt-1">
                    Konfirmasi penghapusan lowongan pekerjaan
                </p>
            </div>

            <Card className="border-0 bg-gradient-to-br from-blue-50 to-pink-200/50 shadow-sm">
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
                    <DeleteJobForm jobId={id} />
                </CardContent>
            </Card>
        </div>
    );
}

