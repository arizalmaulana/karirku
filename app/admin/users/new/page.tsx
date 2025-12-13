import { CreateUserForm } from "@/components/admin/CreateUserForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function CreateUserPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-semibold text-gray-900">Tambah Pengguna Baru</h1>
                <p className="text-gray-500 mt-1">
                    Buat akun pengguna baru di platform
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Informasi Pengguna</CardTitle>
                    <CardDescription>
                        Isi informasi yang diperlukan untuk membuat pengguna baru
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CreateUserForm />
                </CardContent>
            </Card>
        </div>
    );
}


