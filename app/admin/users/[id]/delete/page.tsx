import { DeleteUserForm } from "@/components/admin/DeleteUserForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DeleteUserPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-semibold text-gray-900">Hapus Pengguna</h1>
                <p className="text-gray-500 mt-1">
                    Konfirmasi penghapusan pengguna
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
                    <DeleteUserForm userId={id} />
                </CardContent>
            </Card>
        </div>
    );
}


