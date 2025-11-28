import { Briefcase, CheckCircle, Compass, MapPin, Send } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { jobs } from "@/data/jobs";
import { JobLocationMap } from "@/components/JobLocationMap";

type BadgeVariant = "default" | "secondary" | "outline";

const sampleApplications: Array<{
    job: string;
    company: string;
    status: string;
    updatedAt: string;
    variant: BadgeVariant;
}> = [
    {
        job: "Senior Frontend Developer",
        company: "TechCorp Indonesia",
        status: "Interview Dijadwalkan",
        updatedAt: "24 Nov 2025",
        variant: "default",
    },
    {
        job: "UI/UX Designer",
        company: "Creative Studio",
        status: "Sedang Ditinjau",
        updatedAt: "22 Nov 2025",
        variant: "secondary",
    },
    {
        job: "Digital Marketing Specialist",
        company: "Growth Marketing Co",
        status: "Lamaran Dikirim",
        updatedAt: "20 Nov 2025",
        variant: "outline",
    },
];

const preferredCities = ["Jakarta", "Bandung", "Yogyakarta"];

export default function JobSeekerDashboardPage() {
    const recommendedJobs = jobs.slice(0, 3);

    return (
        <div className="container mx-auto px-4 py-10 space-y-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-sm font-semibold text-blue-600">Selamat datang kembali 👋</p>
                    <h1 className="text-3xl font-semibold text-gray-900 mt-1">Dashboard Pencari Kerja</h1>
                    <p className="text-gray-500">
                        Monitor status lamaran, lengkapi profil, dan temukan rekomendasi kerja paling relevan.
                    </p>
                </div>
                <Button size="lg" className="w-full lg:w-fit">
                    <Send className="mr-2 h-4 w-4" />
                    Kirim Lamaran Baru
                </Button>
            </div>

            <section className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Progress Profil Anda</CardTitle>
                        <CardDescription>Lengkapi profil untuk meningkatkan peluang matching</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <div className="flex justify-between text-sm text-gray-500 mb-2">
                                <span>Kelengkapan Profil</span>
                                <span>72%</span>
                            </div>
                            <Progress value={72} />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-xl border p-4">
                                <p className="font-semibold text-gray-900">Skill & Sertifikat</p>
                                <p className="text-sm text-gray-500">Tambahkan 2 skill lagi agar profil lebih menonjol</p>
                            </div>
                            <div className="rounded-xl border p-4">
                                <p className="font-semibold text-gray-900">Preferensi Lokasi</p>
                                <p className="text-sm text-gray-500">
                                    {preferredCities.slice(0, 2).join(", ")} dan {preferredCities.length - 2} lainnya
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Status Lamaran Terbaru</CardTitle>
                        <CardDescription>Pantau update tanpa ketinggalan</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {sampleApplications.map((application) => (
                            <div key={application.job} className="rounded-xl border p-4">
                                <p className="font-semibold">{application.job}</p>
                                <p className="text-sm text-gray-500">{application.company}</p>
                                <Badge className="mt-3" variant={application.variant}>
                                    {application.status}
                                </Badge>
                                <p className="text-xs text-gray-400 mt-2">Update {application.updatedAt}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </section>

            <section className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader className="flex-row items-center justify-between">
                        <div>
                            <CardTitle>Rekomendasi Untuk Anda</CardTitle>
                            <CardDescription>Hasil pencocokan otomatis berdasarkan jurusan & skill</CardDescription>
                        </div>
                        <Button variant="outline" size="sm">
                            Lihat Semua
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {recommendedJobs.map((job) => (
                            <div key={job.id} className="rounded-2xl border p-4 hover:border-blue-500 transition">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-900">{job.title}</p>
                                        <p className="text-sm text-gray-500">
                                            {job.company} • {job.location}
                                        </p>
                                    </div>
                                    <Badge variant="outline">{job.level}</Badge>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {job.requirements.slice(0, 3).map((req) => (
                                        <Badge key={req} variant="secondary">
                                            {req}
                                        </Badge>
                                    ))}
                                </div>
                                <div className="mt-4 flex flex-col gap-1 text-sm text-gray-500">
                                    <span>Estimasi Gaji: {job.salary}</span>
                                    <span>Jenis Kerja: {job.type}</span>
                                </div>
                                <div className="mt-4">
                                    <JobLocationMap company={job.company} location={job.location} />
                                </div>
                                <Button className="mt-4 w-full" variant="secondary">
                                    <Briefcase className="mr-2 h-4 w-4" />
                                    Lihat Detail & Lamar
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Pengetahuan Kota Tujuan</CardTitle>
                        <CardDescription>Filter lokasi membuat rekomendasi lebih akurat</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {preferredCities.map((city) => (
                            <div key={city} className="rounded-xl border p-4">
                                <div className="flex items-center gap-2 text-gray-700">
                                    <MapPin className="h-4 w-4 text-blue-500" />
                                    <p className="font-semibold">{city}</p>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                    Estimasi biaya hidup dan lowongan terbaru tersedia.
                                </p>
                                <Button variant="link" className="px-0 text-blue-600">
                                    Lihat detail biaya hidup
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Checklist Lamaran</CardTitle>
                        <CardDescription>Tetap terorganisir selama proses mencari kerja</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-3 rounded-xl border p-4">
                            <CheckCircle className="mt-1 h-5 w-5 text-emerald-500" />
                            <div>
                                <p className="font-semibold">Perbarui CV dengan pengalaman terbaru</p>
                                <p className="text-sm text-gray-500">Tambah proyek kampus & sertifikasi terbaru</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 rounded-xl border p-4">
                            <Compass className="mt-1 h-5 w-5 text-blue-500" />
                            <div>
                                <p className="font-semibold">Terapkan filter kota tujuan</p>
                                <p className="text-sm text-gray-500">Manfaatkan data biaya hidup di halaman detail</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Tips Cepat</CardTitle>
                        <CardDescription>Insight singkat dari tim KarirKu</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-xl border p-4">
                            <p className="font-semibold">Sesuaikan CV dengan kata kunci skill</p>
                            <p className="text-sm text-gray-500">Sistem kami mendeteksi 4 skill utama di setiap lowongan.</p>
                        </div>
                        <div className="rounded-xl border p-4">
                            <p className="font-semibold">Follow-up lamaran setelah 5 hari</p>
                            <p className="text-sm text-gray-500">
                                Recruiter menghargai kandidat yang proaktif namun sopan.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}

