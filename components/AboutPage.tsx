import { Card } from "./ui/card";
import { Target, Users, Award, Rocket, CheckCircle2, Sparkles, Heart, Shield } from "lucide-react";

export function AboutPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white py-20 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6 animate-fade-in">
              <Heart className="w-4 h-4" />
              <span style={{ fontSize: '14px' }}>Dipercaya oleh ribuan pencari kerja</span>
            </div>

            <h1 className="mb-4 animate-slide-in-up" style={{ fontSize: '48px', lineHeight: '1.2', letterSpacing: '-0.02em' }}>
              Tentang{" "}
              <span className="relative inline-block">
                <span className="relative z-10">KarirKu</span>
                <span className="absolute bottom-2 left-0 w-full h-3 bg-yellow-300/30 -rotate-1"></span>
              </span>
            </h1>
            <p className="text-indigo-100 animate-slide-in-up" style={{ fontSize: '18px', animationDelay: '0.1s' }}>
              Platform terpercaya untuk menghubungkan talenta terbaik dengan perusahaan impian
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <Card className="group relative p-8 border border-gray-200/60 hover:border-indigo-500/30 hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h2>Misi Kami</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Memudahkan setiap individu menemukan pekerjaan yang sesuai dengan passion dan
                keahlian mereka, sambil membantu perusahaan mendapatkan talenta terbaik untuk
                mengembangkan bisnis mereka.
              </p>
            </div>
          </Card>

          <Card className="group relative p-8 border border-gray-200/60 hover:border-indigo-500/30 hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
                <h2>Visi Kami</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Menjadi platform pencari kerja nomor satu di Indonesia yang dipercaya oleh jutaan
                pencari kerja dan ribuan perusahaan untuk membangun karir dan tim yang sukses.
              </p>
            </div>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <Card className="group relative p-6 text-center border border-gray-200/60 hover:border-indigo-500/30 hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="gradient-text mb-2" style={{ fontSize: '32px' }}>10,000+</div>
              <p className="text-gray-600">Lowongan Aktif</p>
            </div>
          </Card>
          <Card className="group relative p-6 text-center border border-gray-200/60 hover:border-indigo-500/30 hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="gradient-text mb-2" style={{ fontSize: '32px' }}>5,000+</div>
              <p className="text-gray-600">Perusahaan</p>
            </div>
          </Card>
          <Card className="group relative p-6 text-center border border-gray-200/60 hover:border-indigo-500/30 hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="gradient-text mb-2" style={{ fontSize: '32px' }}>100,000+</div>
              <p className="text-gray-600">Pencari Kerja</p>
            </div>
          </Card>
          <Card className="group relative p-6 text-center border border-gray-200/60 hover:border-indigo-500/30 hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="gradient-text mb-2" style={{ fontSize: '32px' }}>50,000+</div>
              <p className="text-gray-600">Sukses Diterima</p>
            </div>
          </Card>
        </div>

        {/* Values */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-full mb-4">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="text-indigo-600" style={{ fontSize: '14px' }}>Nilai-Nilai Kami</span>
            </div>
            <h2 className="mb-3">Fondasi Kesuksesan</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Nilai-nilai yang menjadi fondasi dalam setiap langkah kami
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="group relative p-6 border border-gray-200/60 hover:border-indigo-500/30 hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/30">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <h3 className="mb-2">Integritas</h3>
                <p className="text-gray-600" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  Kami berkomitmen untuk selalu transparan dan jujur dalam setiap interaksi
                  dengan pengguna dan mitra kami.
                </p>
              </div>
            </Card>

            <Card className="group relative p-6 border border-gray-200/60 hover:border-indigo-500/30 hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-orange-500/30">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="mb-2">Kolaborasi</h3>
                <p className="text-gray-600" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  Kami percaya pada kekuatan kolaborasi antara pencari kerja, perusahaan, dan
                  tim kami untuk mencapai kesuksesan bersama.
                </p>
              </div>
            </Card>

            <Card className="group relative p-6 border border-gray-200/60 hover:border-indigo-500/30 hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
                <h3 className="mb-2">Inovasi</h3>
                <p className="text-gray-600" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  Kami terus berinovasi untuk memberikan pengalaman terbaik dan solusi yang
                  relevan dengan kebutuhan pasar kerja modern.
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Why Choose Us */}
        <div>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-full mb-4">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span className="text-indigo-600" style={{ fontSize: '14px' }}>Keunggulan Kami</span>
            </div>
            <h2 className="mb-3">Mengapa Memilih KarirKu?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Berbagai keunggulan yang membuat KarirKu menjadi pilihan utama
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex gap-4 p-6 rounded-xl hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 transition-all duration-300">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <h3 className="mb-2">Lowongan Terverifikasi</h3>
                <p className="text-gray-600" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  Semua lowongan kerja telah diverifikasi untuk memastikan kualitas dan
                  kredibilitas perusahaan.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-6 rounded-xl hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 transition-all duration-300">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <h3 className="mb-2">Proses Mudah & Cepat</h3>
                <p className="text-gray-600" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  Platform yang user-friendly memudahkan Anda mencari dan melamar pekerjaan
                  hanya dalam beberapa klik.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-6 rounded-xl hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 transition-all duration-300">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <h3 className="mb-2">Rekomendasi Personal</h3>
                <p className="text-gray-600" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  Algoritma cerdas kami memberikan rekomendasi pekerjaan yang sesuai dengan
                  profil dan preferensi Anda.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-6 rounded-xl hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 transition-all duration-300">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <h3 className="mb-2">Dukungan 24/7</h3>
                <p className="text-gray-600" style={{ fontSize: '14px', lineHeight: '1.6' }}>
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