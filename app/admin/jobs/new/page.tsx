import { JobForm } from "@/components/admin/JobForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewJobPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-semibold text-gray-900">Tambah Lowongan Baru</h1>
                <p className="text-gray-500 mt-1">
                    Tambahkan lowongan pekerjaan baru ke platform
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Informasi Lowongan</CardTitle>
                    <CardDescription>
                        Isi semua informasi yang diperlukan untuk lowongan pekerjaan
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <JobForm />
                </CardContent>
            </Card>
        </div>
    );
}

