import { Card } from "@/components/ui/card";
import { Target, Users, Award, Rocket, CheckCircle2 } from "lucide-react";

export function AboutPage() {
    return (
        <div>
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
            <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
                <h1 className="mb-4">Tentang KarirKu</h1>
                <p className="text-blue-100 text-lg">
                Platform terpercaya untuk menghubungkan talenta terbaik dengan perusahaan impian
                </p>
            </div>
            </div>
        </section>

        {/* Mission & Vision */}
        <section className="container mx-auto px-4 py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <Card className="p-8">
                <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-blue-600" />
                </div>
                <h2>Misi Kami</h2>
                </div>
                <p className="text-gray-600 leading-relaxed">
                Memudahkan setiap individu menemukan pekerjaan yang sesuai dengan passion dan
                keahlian mereka, sambil membantu perusahaan mendapatkan talenta terbaik untuk
                mengembangkan bisnis mereka.
                </p>
            </Card>

            <Card className="p-8">
                <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Rocket className="w-6 h-6 text-green-600" />
                </div>
                <h2>Visi Kami</h2>
                </div>
                <p className="text-gray-600 leading-relaxed">
                Menjadi platform pencari kerja nomor satu di Indonesia yang dipercaya oleh jutaan
                pencari kerja dan ribuan perusahaan untuk membangun karir dan tim yang sukses.
                </p>
            </Card>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            <Card className="p-6 text-center">
                <div className="text-blue-600 mb-2">10,000+</div>
                <p className="text-gray-600">Lowongan Aktif</p>
            </Card>
            <Card className="p-6 text-center">
                <div className="text-blue-600 mb-2">5,000+</div>
                <p className="text-gray-600">Perusahaan</p>
            </Card>
            <Card className="p-6 text-center">
                <div className="text-blue-600 mb-2">100,000+</div>
                <p className="text-gray-600">Pencari Kerja</p>
            </Card>
            <Card className="p-6 text-center">
                <div className="text-blue-600 mb-2">50,000+</div>
                <p className="text-gray-600">Sukses Diterima</p>
            </Card>
            </div>

            {/* Values */}
            <div className="mb-16">
            <div className="text-center mb-12">
                <h2 className="mb-3">Nilai-Nilai Kami</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                Nilai-nilai yang menjadi fondasi dalam setiap langkah kami
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <Award className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="mb-2">Integritas</h3>
                <p className="text-gray-600">
                    Kami berkomitmen untuk selalu transparan dan jujur dalam setiap interaksi
                    dengan pengguna dan mitra kami.
                </p>
                </Card>

                <Card className="p-6">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="mb-2">Kolaborasi</h3>
                <p className="text-gray-600">
                    Kami percaya pada kekuatan kolaborasi antara pencari kerja, perusahaan, dan
                    tim kami untuk mencapai kesuksesan bersama.
                </p>
                </Card>

                <Card className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Rocket className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="mb-2">Inovasi</h3>
                <p className="text-gray-600">
                    Kami terus berinovasi untuk memberikan pengalaman terbaik dan solusi yang
                    relevan dengan kebutuhan pasar kerja modern.
                </p>
                </Card>
            </div>
            </div>

            {/* Why Choose Us */}
            <div>
            <div className="text-center mb-12">
                <h2 className="mb-3">Mengapa Memilih KarirKu?</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                Berbagai keunggulan yang membuat KarirKu menjadi pilihan utama
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex gap-4">
                <div className="flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                    <h3 className="mb-2">Lowongan Terverifikasi</h3>
                    <p className="text-gray-600">
                    Semua lowongan kerja telah diverifikasi untuk memastikan kualitas dan
                    kredibilitas perusahaan.
                    </p>
                </div>
                </div>

                <div className="flex gap-4">
                <div className="flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                    <h3 className="mb-2">Proses Mudah & Cepat</h3>
                    <p className="text-gray-600">
                    Platform yang user-friendly memudahkan Anda mencari dan melamar pekerjaan
                    hanya dalam beberapa klik.
                    </p>
                </div>
                </div>

                <div className="flex gap-4">
                <div className="flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                    <h3 className="mb-2">Rekomendasi Personal</h3>
                    <p className="text-gray-600">
                    Algoritma cerdas kami memberikan rekomendasi pekerjaan yang sesuai dengan
                    profil dan preferensi Anda.
                    </p>
                </div>
                </div>

                <div className="flex gap-4">
                <div className="flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                    <h3 className="mb-2">Dukungan 24/7</h3>
                    <p className="text-gray-600">
                    Tim support kami siap membantu Anda kapan saja untuk memastikan pengalaman
                    terbaik dalam mencari kerja.
                    </p>
                </div>
                </div>
            </div>
            </div>
        </section>
        </div>
    );
}
