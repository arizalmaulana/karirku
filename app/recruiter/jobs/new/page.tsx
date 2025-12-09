import { RecruiterJobForm } from "@/components/recruiter/RecruiterJobForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewRecruiterJobPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-semibold text-gray-900 text-purple-900">Tambah Lowongan Baru</h1>
                <p className="text-gray-500 mt-1">
                    Buat lowongan pekerjaan baru untuk menarik kandidat terbaik
                </p>
            </div>

            <Card className="border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50 shadow-sm p-4">
                <CardHeader >
                    <CardTitle>Informasi Lowongan</CardTitle>
                    <CardDescription>
                        Isi semua informasi yang diperlukan untuk lowongan pekerjaan
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-4 border border-purple-200 bg-gradient-to-br from-pink-50 to-pink-100/50 shadow-sm rounded-2xl">
                    <RecruiterJobForm/>
                </CardContent >
            </Card>
        </div>
    );
}

