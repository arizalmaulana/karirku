import { RecruiterJobForm } from "@/components/recruiter/RecruiterJobForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewRecruiterJobPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-semibold text-gray-900">Tambah Lowongan Baru</h1>
                <p className="text-gray-500 mt-1">
                    Buat lowongan pekerjaan baru untuk menarik kandidat terbaik
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
                    <RecruiterJobForm />
                </CardContent>
            </Card>
        </div>
    );
}

