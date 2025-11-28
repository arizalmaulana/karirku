import { CalendarCheck, FileCheck, Mail, Users2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const pipelineStats = [
    { label: "Lamaran Masuk", value: 86, icon: Mail, subtext: "12 kandidat baru minggu ini" },
    { label: "Sedang Discreening", value: 34, icon: FileCheck, subtext: "Butuh feedback tim tech" },
    { label: "Interview Dijadwalkan", value: 18, icon: CalendarCheck, subtext: "4 interview hari ini" },
    { label: "Offer Dikirim", value: 5, icon: Users2, subtext: "2 kandidat menunggu respon" },
];

const openRoles = [
    {
        title: "Frontend Engineer",
        team: "Product Engineering",
        applicants: 42,
        status: "Aktif",
        matchRate: 78,
    },
    {
        title: "Product Designer",
        team: "Design",
        applicants: 27,
        status: "Screening",
        matchRate: 64,
    },
    {
        title: "Digital Marketing Specialist",
        team: "Marketing",
        applicants: 19,
        status: "Interview",
        matchRate: 71,
    },
];

const candidateHighlights = [
    {
        name: "Alya Pratiwi",
        role: "UI/UX Designer",
        rating: "Sangat cocok (92%)",
        note: "Berpengalaman di SaaS, kuat di design system",
    },
    {
        name: "Rahman Aditya",
        role: "Frontend Engineer",
        rating: "Cocok (85%)",
        note: "React + Next.js, pengalaman remote",
    },
    {
        name: "Sabrina Kurnia",
        role: "Digital Marketing",
        rating: "Potential (78%)",
        note: "Spesialis Paid Ads & SEO",
    },
];

export default function RecruiterDashboardPage() {
    return (
        <div className="container mx-auto px-4 py-10 space-y-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-sm font-semibold text-blue-600">Dashboard Recruiter</p>
                    <h1 className="text-3xl font-semibold text-gray-900 mt-1">Kelola Pipeline Kandidat</h1>
                    <p className="text-gray-500">
                        Pantau performa lowongan, tindak lanjuti kandidat, dan update status lamaran langsung.
                    </p>
                </div>
                <Button size="lg" className="w-full lg:w-fit">
                    Buat Lowongan Baru
                </Button>
            </div>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {pipelineStats.map((stat) => (
                    <Card key={stat.label}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">{stat.label}</CardTitle>
                            <stat.icon className="h-5 w-5 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-semibold">{stat.value}</div>
                            <p className="text-sm text-gray-500">{stat.subtext}</p>
                        </CardContent>
                    </Card>
                ))}
            </section>

            <section className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader className="flex-row items-center justify-between">
                        <div>
                            <CardTitle>Lowongan Aktif</CardTitle>
                            <CardDescription>Update status tiap lowongan untuk menjaga pipeline rapih</CardDescription>
                        </div>
                        <Button variant="outline" size="sm">
                            Kelola Semua
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {openRoles.map((role) => (
                            <div key={role.title} className="rounded-2xl border p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-900">{role.title}</p>
                                        <p className="text-sm text-gray-500">{role.team}</p>
                                    </div>
                                    <Badge variant={role.status === "Aktif" ? "default" : "secondary"}>
                                        {role.status}
                                    </Badge>
                                </div>
                                <div className="mt-4 grid gap-4 md:grid-cols-2">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Kandidat Masuk</p>
                                        <p className="text-lg font-semibold">{role.applicants} Pelamar</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                                            Kecocokan Rata-Rata
                                        </p>
                                        <Progress value={role.matchRate} />
                                        <p className="text-sm text-gray-500 mt-1">{role.matchRate}% skill match</p>
                                    </div>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <Badge variant="outline">Perbarui status</Badge>
                                    <Badge variant="outline">Bagikan ke tim</Badge>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Kandidat Prioritas</CardTitle>
                        <CardDescription>Langsung hubungi kandidat berkualitas</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {candidateHighlights.map((candidate) => (
                            <div key={candidate.name} className="rounded-xl border p-4">
                                <p className="font-semibold text-gray-900">{candidate.name}</p>
                                <p className="text-sm text-gray-500">{candidate.role}</p>
                                <Badge className="mt-3" variant="secondary">
                                    {candidate.rating}
                                </Badge>
                                <p className="text-sm text-gray-500 mt-2">{candidate.note}</p>
                                <div className="mt-3 flex gap-2">
                                    <Button size="sm" className="flex-1">
                                        Hubungi
                                    </Button>
                                    <Button size="sm" variant="outline" className="flex-1">
                                        Tandai
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Checklist Rekrutmen</CardTitle>
                        <CardDescription>Pastikan setiap langkah proses berjalan</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-xl border p-4">
                            <p className="font-semibold">Sinkronisasi jadwal dengan Hiring Manager</p>
                            <p className="text-sm text-gray-500">Libatkan tim engineering untuk interview teknis</p>
                        </div>
                        <div className="rounded-xl border p-4">
                            <p className="font-semibold">Perbarui template penawaran kerja</p>
                            <p className="text-sm text-gray-500">Pastikan komponen gaji & tunjangan up to date</p>
                        </div>
                        <div className="rounded-xl border p-4">
                            <p className="font-semibold">Review talent pool</p>
                            <p className="text-sm text-gray-500">Hubungi kembali kandidat kuat dari batch sebelumnya</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Aktivitas Terbaru</CardTitle>
                        <CardDescription>Ringkasan apa yang terjadi 24 jam terakhir</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-3 rounded-xl border p-4">
                            <Badge variant="secondary">Interview</Badge>
                            <div>
                                <p className="font-semibold">3 interview berhasil dijadwalkan</p>
                                <p className="text-sm text-gray-500">Frontend Engineer & Product Designer</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 rounded-xl border p-4">
                            <Badge variant="outline">Feedback</Badge>
                            <div>
                                <p className="font-semibold">2 kandidat mendapat feedback</p>
                                <p className="text-sm text-gray-500">Butuh tindak lanjut HR untuk proses offer</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 rounded-xl border p-4">
                            <Badge variant="default">Promosi</Badge>
                            <div>
                                <p className="font-semibold">Lowongan baru dipromosikan</p>
                                <p className="text-sm text-gray-500">Digital Marketing Specialist</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}

