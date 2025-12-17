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

            <Card className="border-0 bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 shadow-md p-4">
                <CardHeader >
                    <CardTitle>Informasi Lowongan</CardTitle>
                    <CardDescription>
                        Isi semua informasi yang diperlukan untuk lowongan pekerjaan
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-4 border-0 bg-gradient-to-br from-white to-purple-50/30 shadow-sm rounded-2xl">
                    <RecruiterJobForm/>
                </CardContent >
            </Card>
        </div>
    );
}

