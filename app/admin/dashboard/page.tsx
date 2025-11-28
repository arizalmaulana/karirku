import { ArrowUpRight, BriefcaseBusiness, FileText, Users, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const summaryStats = [
    {
        title: "Total Pengguna",
        value: "4.218",
        delta: "+8% bulan ini",
        icon: Users,
    },
    {
        title: "Lowongan Aktif",
        value: "182",
        delta: "+12 posting baru",
        icon: BriefcaseBusiness,
    },
    {
        title: "Lamaran Masuk",
        value: "1.094",
        delta: "+4% vs minggu lalu",
        icon: FileText,
    },
    {
        title: "Kota Dengan Data Biaya Hidup",
        value: "36",
        delta: "3 pembaruan terbaru",
        icon: Wallet,
    },
];

const recentJobs = [
    {
        title: "Frontend Engineer",
        company: "TechCorp Indonesia",
        status: "Aktif",
        submitted: "23 Nov 2025",
    },
    {
        title: "Product Designer",
        company: "Creative Studio",
        status: "Menunggu Review",
        submitted: "22 Nov 2025",
    },
    {
        title: "Data Analyst",
        company: "Analytics Pro",
        status: "Aktif",
        submitted: "21 Nov 2025",
    },
];

const pendingApplications = [
    {
        candidate: "Alya Pratiwi",
        job: "UI/UX Designer",
        company: "Creative Studio",
        status: "Review",
    },
    {
        candidate: "Rizky Aditya",
        job: "Backend Engineer",
        company: "Startup Innovate",
        status: "Interview",
    },
    {
        candidate: "Dina Maharani",
        job: "Digital Marketing",
        company: "Growth Marketing Co",
        status: "Submitted",
    },
];

const livingCostUpdates = [
    { city: "Jakarta", rent: "Rp4.500.000", food: "Rp2.500.000", updatedAt: "24 Nov 2025" },
    { city: "Bandung", rent: "Rp2.500.000", food: "Rp2.000.000", updatedAt: "22 Nov 2025" },
    { city: "Surabaya", rent: "Rp3.000.000", food: "Rp2.200.000", updatedAt: "20 Nov 2025" },
];

export default function AdminDashboardPage() {
    return (
        <div className="container mx-auto px-4 py-10 space-y-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-sm font-semibold text-blue-600">Dashboard Admin</p>
                    <h1 className="text-3xl font-semibold text-gray-900 mt-1">Kontrol Sistem Terpadu</h1>
                    <p className="text-gray-500">
                        Pantau metrik utama, verifikasi lowongan baru, dan pastikan data biaya hidup selalu
                        terkini.
                    </p>
                </div>
                <Button className="w-full lg:w-fit" size="lg">
                    Tambah Lowongan Baru
                </Button>
            </div>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {summaryStats.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">{stat.title}</CardTitle>
                            <stat.icon className="h-5 w-5 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-semibold">{stat.value}</div>
                            <p className="text-sm text-emerald-600">{stat.delta}</p>
                        </CardContent>
                    </Card>
                ))}
            </section>

            <section className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader className="flex-row items-center justify-between">
                        <div>
                            <CardTitle>Lowongan Terbaru</CardTitle>
                            <CardDescription>Lowongan yang baru diajukan oleh recruiter</CardDescription>
                        </div>
                        <Button variant="outline" size="sm">
                            Lihat Semua
                            <ArrowUpRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentJobs.map((job) => (
                                <div key={job.title} className="flex items-center justify-between rounded-xl border p-4">
                                    <div>
                                        <p className="font-semibold text-gray-900">{job.title}</p>
                                        <p className="text-sm text-gray-500">{job.company}</p>
                                        <p className="text-xs text-gray-400 mt-1">Diajukan pada {job.submitted}</p>
                                    </div>
                                    <Badge variant={job.status === "Aktif" ? "default" : "secondary"}>{job.status}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Aktivitas Lamaran</CardTitle>
                        <CardDescription>Follow up lamaran yang masih menunggu tindakan</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {pendingApplications.map((application) => (
                            <div key={application.candidate} className="rounded-xl border p-4">
                                <p className="font-semibold text-gray-900">{application.candidate}</p>
                                <p className="text-sm text-gray-600">
                                    {application.job} • {application.company}
                                </p>
                                <Badge className="mt-3 w-fit" variant="outline">
                                    Status: {application.status}
                                </Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Pembaruan Data Biaya Hidup</CardTitle>
                        <CardDescription>Pastikan estimasi biaya selalu relevan</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kota</TableHead>
                                    <TableHead>Sewa (avg)</TableHead>
                                    <TableHead>Makan (avg)</TableHead>
                                    <TableHead>Pembaruan</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {livingCostUpdates.map((cost) => (
                                    <TableRow key={cost.city}>
                                        <TableCell>{cost.city}</TableCell>
                                        <TableCell>{cost.rent}</TableCell>
                                        <TableCell>{cost.food}</TableCell>
                                        <TableCell>{cost.updatedAt}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Checklist Admin</CardTitle>
                        <CardDescription>Tugas prioritas minggu ini</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-xl border p-4">
                            <p className="font-semibold">Verifikasi 12 lowongan baru</p>
                            <p className="text-sm text-gray-500">Pastikan detail gaji & biaya hidup sudah terisi</p>
                        </div>
                        <div className="rounded-xl border p-4">
                            <p className="font-semibold">Pantau 4 laporan penyalahgunaan</p>
                            <p className="text-sm text-gray-500">Tinjau laporan profil recruiter bermasalah</p>
                        </div>
                        <div className="rounded-xl border p-4">
                            <p className="font-semibold">Update dataset kota baru</p>
                            <p className="text-sm text-gray-500">Tambahkan data biaya hidup untuk kota-kota sekunder</p>
                        </div>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}

