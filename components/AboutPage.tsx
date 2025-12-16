"use client";

import { useState } from "react";
import { Card } from "./ui/card";
import { Target, Users, Award, Rocket, CheckCircle2, Sparkles, Heart, Shield, Mail, MapPin, Phone, MessageCircle } from "lucide-react";

// Component untuk foto tim dengan error handling
function TeamMemberPhoto({ src, name }: { src: string; name: string }) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=128&background=6366f1&color=ffffff&bold=true`);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={name}
      className="w-full h-full object-cover"
      onError={handleError}
    />
  );
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  location?: string;
  image?: string;
}

interface AboutPageProps {
  stats: {
    totalJobs: number;
    totalCompanies: number;
    totalUsers: number;
    acceptedApplications: number;
  };
}

const teamMembers: TeamMember[] = [
  {
    id: "1",
    name: "Mutiara Adhanie",
    role: "Administrator",
    email: "mutiaraadhanie@gmail.com",
    phone: "+62 812-1029-7813",
    location: "Bandung, Indonesia",
    image: "/developer/mute.jpeg"
  },

  {
    id: "2",
    name: "Muhamad Arizal Maulana",
    role: "Technical Lead",
    email: "arizalmaulana602@gmail.com",
    phone: "+62 812-1061-7530",
    location: "Bandung, Indonesia",
    image: "/developer/izal.jpeg"
  },

  {
    id: "3",
    name: "Ilham Amri Rozak",
    role: "UI/UX Designer",
    email: "ilhamamrirozak@gmail.com",
    phone: "+62 822-6849-3749",
    location: "Bandung, Indonesia",
    image: "/developer/ozak.jpeg"
  },
  
  {
    id: "4",
    name: "Rizqy Fathurrahman",
    role: "Customer Support",
    email: "rizkyfathurrahman11@gmail.com",
    phone: "+62 812-1869-2394",
    location: "Bandung, Indonesia",
    image: "/developer/rizqi.jpeg"
  }
];
  
export function AboutPage({ stats }: AboutPageProps) {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white py-12 sm:py-16 lg:py-20 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="container mx-auto px-3 sm:px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/20 backdrop-blur-sm rounded-full mb-4 sm:mb-6 animate-fade-in text-xs sm:text-sm">
              <Heart className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
              <span>Dipercaya oleh ribuan pencari kerja</span>
            </div>

            <h1 className="mb-3 sm:mb-4 animate-slide-in-up text-3xl sm:text-4xl lg:text-5xl xl:text-[48px] font-bold" style={{ lineHeight: '1.2', letterSpacing: '-0.02em' }}>
              Tentang{" "}
              <span className="relative inline-block">
                <span className="relative z-10">KarirKu</span>
                <span className="absolute bottom-2 left-0 w-full h-3 bg-yellow-300/30 -rotate-1"></span>
              </span>
            </h1>
            <p className="text-indigo-100 animate-slide-in-up text-sm sm:text-base lg:text-lg px-2" style={{ animationDelay: '0.1s' }}>
              Platform terpercaya untuk menghubungkan talenta terbaik dengan perusahaan impian
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card className="group relative p-8 border-2 border-gray-200/50 hover:border-indigo-500/30 hover:shadow-xl transition-all duration-300 overflow-hidden bg-gradient-to-br from-white to-purple-50/30">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Misi Kami</h2>
              </div>
              <p className="text-gray-600 leading-relaxed" style={{ fontSize: '15px', lineHeight: '1.7' }}>
                Memudahkan setiap individu menemukan pekerjaan yang sesuai dengan passion dan
                keahlian mereka, sambil membantu perusahaan mendapatkan talenta terbaik untuk
                mengembangkan bisnis mereka.
              </p>
            </div>
          </Card>

          <Card className="group relative p-8 border-2 border-gray-200/50 hover:border-indigo-500/30 hover:shadow-xl transition-all duration-300 overflow-hidden bg-gradient-to-br from-white to-purple-50/30">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Visi Kami</h2>
              </div>
              <p className="text-gray-600 leading-relaxed" style={{ fontSize: '15px', lineHeight: '1.7' }}>
                Menjadi platform pencari kerja nomor satu di Indonesia yang dipercaya oleh jutaan
                pencari kerja dan ribuan perusahaan untuk membangun karir dan tim yang sukses.
              </p>
            </div>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <Card className="group relative p-6 text-center border-2 border-gray-200/50 hover:border-indigo-500/30 hover:shadow-xl transition-all duration-300 overflow-hidden bg-gradient-to-br from-white to-purple-50/30">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="gradient-text mb-2 font-bold" style={{ fontSize: '32px' }}>
                {stats.totalJobs >= 1000 ? `${(stats.totalJobs / 1000).toFixed(1)}k+` : stats.totalJobs.toLocaleString('id-ID')}
              </div>
              <p className="text-gray-600 font-medium">Lowongan Aktif</p>
            </div>
          </Card>
          <Card className="group relative p-6 text-center border-2 border-gray-200/50 hover:border-indigo-500/30 hover:shadow-xl transition-all duration-300 overflow-hidden bg-gradient-to-br from-white to-purple-50/30">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="gradient-text mb-2 font-bold" style={{ fontSize: '32px' }}>
                {stats.totalCompanies >= 1000 ? `${(stats.totalCompanies / 1000).toFixed(1)}k+` : stats.totalCompanies.toLocaleString('id-ID')}
              </div>
              <p className="text-gray-600 font-medium">Perusahaan</p>
            </div>
          </Card>
          <Card className="group relative p-6 text-center border-2 border-gray-200/50 hover:border-indigo-500/30 hover:shadow-xl transition-all duration-300 overflow-hidden bg-gradient-to-br from-white to-purple-50/30">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="gradient-text mb-2 font-bold" style={{ fontSize: '32px' }}>
                {stats.totalUsers >= 1000 ? `${(stats.totalUsers / 1000).toFixed(1)}k+` : stats.totalUsers.toLocaleString('id-ID')}
              </div>
              <p className="text-gray-600 font-medium">Pencari Kerja</p>
            </div>
          </Card>
          <Card className="group relative p-6 text-center border-2 border-gray-200/50 hover:border-indigo-500/30 hover:shadow-xl transition-all duration-300 overflow-hidden bg-gradient-to-br from-white to-purple-50/30">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="gradient-text mb-2 font-bold" style={{ fontSize: '32px' }}>
                {stats.acceptedApplications >= 1000 ? `${(stats.acceptedApplications / 1000).toFixed(1)}k+` : stats.acceptedApplications.toLocaleString('id-ID')}
              </div>
              <p className="text-gray-600 font-medium">Sukses Diterima</p>
            </div>
          </Card>
        </div>

        {/* Values */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-full mb-4">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="text-indigo-600" style={{ fontSize: '14px' }}>Nilai-Nilai Kami</span>
            </div>
            <h2 className="mb-3">Fondasi Kesuksesan</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Nilai-nilai yang menjadi fondasi dalam setiap langkah kami
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="group relative p-6 border-2 border-gray-200/50 hover:border-indigo-500/30 hover:shadow-xl transition-all duration-300 overflow-hidden bg-gradient-to-br from-white to-purple-50/30">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/30">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">Integritas</h3>
                <p className="text-gray-600" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  Kami berkomitmen untuk selalu transparan dan jujur dalam setiap interaksi
                  dengan pengguna dan mitra kami.
                </p>
              </div>
            </Card>

            <Card className="group relative p-6 border-2 border-gray-200/50 hover:border-indigo-500/30 hover:shadow-xl transition-all duration-300 overflow-hidden bg-gradient-to-br from-white to-purple-50/30">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-orange-500/30">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">Kolaborasi</h3>
                <p className="text-gray-600" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  Kami percaya pada kekuatan kolaborasi antara pencari kerja, perusahaan, dan
                  tim kami untuk mencapai kesuksesan bersama.
                </p>
              </div>
            </Card>

            <Card className="group relative p-6 border-2 border-gray-200/50 hover:border-indigo-500/30 hover:shadow-xl transition-all duration-300 overflow-hidden bg-gradient-to-br from-white to-purple-50/30">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">Inovasi</h3>
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
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-full mb-4">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span className="text-indigo-600" style={{ fontSize: '14px' }}>Keunggulan Kami</span>
            </div>
            <h2 className="mb-3">Mengapa Memilih KarirKu?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Berbagai keunggulan yang membuat KarirKu menjadi pilihan utama
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="flex gap-4 p-6 border-2 border-gray-200/50 hover:border-indigo-500/30 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-purple-50/30">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-md">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">Lowongan Terverifikasi</h3>
                <p className="text-gray-600" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  Semua lowongan kerja telah diverifikasi untuk memastikan kualitas dan
                  kredibilitas perusahaan.
                </p>
              </div>
            </Card>

            <Card className="flex gap-4 p-6 border-2 border-gray-200/50 hover:border-indigo-500/30 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-purple-50/30">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-md">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">Proses Mudah & Cepat</h3>
                <p className="text-gray-600" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  Platform yang user-friendly memudahkan Anda mencari dan melamar pekerjaan
                  hanya dalam beberapa klik.
                </p>
              </div>
            </Card>

            <Card className="flex gap-4 p-6 border-2 border-gray-200/50 hover:border-indigo-500/30 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-purple-50/30">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-md">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">Rekomendasi Personal</h3>
                <p className="text-gray-600" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  Algoritma cerdas kami memberikan rekomendasi pekerjaan yang sesuai dengan
                  profil dan preferensi Anda.
                </p>
              </div>
            </Card>

            <Card className="flex gap-4 p-6 border-2 border-gray-200/50 hover:border-indigo-500/30 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-purple-50/30">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-md">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">Dukungan 24/7</h3>
                <p className="text-gray-600" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  Tim support kami siap membantu Anda kapan saja untuk memastikan pengalaman
                  terbaik dalam mencari kerja.
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-12 mt-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-full mb-4">
              <Users className="w-4 h-4 text-indigo-600" />
              <span className="text-indigo-600" style={{ fontSize: '14px' }}>Tim Kami</span>
            </div>
            <h2 className="mb-3 text-3xl font-bold text-gray-900">Kenali Tim KarirKu</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Tim profesional yang berdedikasi untuk membantu Anda menemukan karir impian
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((member) => (
              <Card 
                key={member.id}
                className="group relative p-6 border-2 border-gray-200/50 hover:border-indigo-500/30 hover:shadow-xl transition-all duration-300 overflow-hidden bg-gradient-to-br from-white to-purple-50/30 text-center"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  {/* Profile Photo */}
                  <div className="mb-4 flex justify-center">
                    <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl ring-2 ring-indigo-100 group-hover:ring-indigo-300 transition-all duration-300 group-hover:scale-105">
                      {member.image ? (
                        <TeamMemberPhoto src={member.image} name={member.name} />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-4xl font-bold">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Member Info */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                    {member.name}
                  </h3>
                  
                  <p className="text-indigo-600 font-medium mb-4" style={{ fontSize: '14px' }}>
                    {member.role}
                  </p>

                  <div className="space-y-2">
                    {member.email && (
                      <div className="flex items-center justify-center gap-2 text-gray-600" style={{ fontSize: '14px' }}>
                        <Mail className="w-4 h-4 text-indigo-500" />
                        <span>{member.email}</span>
                      </div>
                    )}
                    {member.phone && (
                      <div className="flex items-center justify-center gap-2 text-gray-600" style={{ fontSize: '14px' }}>
                        <Phone className="w-4 h-4 text-indigo-500" />
                        <span>{member.phone}</span>
                      </div>
                    )}
                    {member.location && (
                      <div className="flex items-center justify-center gap-2 text-gray-600" style={{ fontSize: '14px' }}>
                        <MapPin className="w-4 h-4 text-indigo-500" />
                        <span>{member.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Badge */}
                  <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full text-sm font-semibold shadow-md">
                    <Award className="w-4 h-4" />
                    {member.role}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Contact Admin Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-full mb-4">
              <MessageCircle className="w-4 h-4 text-indigo-600" />
              <span className="text-indigo-600" style={{ fontSize: '14px' }}>Hubungi Kami</span>
            </div>
            <h2 className="mb-3 text-3xl font-bold text-gray-900">Kontak Admin</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Butuh bantuan? Tim kami siap membantu Anda kapan saja
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="group relative p-6 border-2 border-gray-200/50 hover:border-indigo-500/30 hover:shadow-xl transition-all duration-300 overflow-hidden bg-gradient-to-br from-white to-purple-50/30 text-center">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-300">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Email</h3>
                <p className="text-gray-600 mb-3" style={{ fontSize: '14px' }}>
                  Kirim email kepada kami
                </p>
                <a 
                  href="mailto:mutiaraadhanie@gmail.com" 
                  className="text-indigo-600 hover:text-indigo-700 font-medium text-sm transition-colors"
                >
                  mutiaraadhanie@gmail.com
                </a>
              </div>
            </Card>

            <Card className="group relative p-6 border-2 border-gray-200/50 hover:border-indigo-500/30 hover:shadow-xl transition-all duration-300 overflow-hidden bg-gradient-to-br from-white to-purple-50/30 text-center">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform duration-300">
                  <Phone className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Telepon</h3>
                <p className="text-gray-600 mb-3" style={{ fontSize: '14px' }}>
                  Hubungi kami via telepon
                </p>
                <a 
                  href="tel:+6281234567890" 
                  className="text-indigo-600 hover:text-indigo-700 font-medium text-sm transition-colors"
                >
                  +62 812-1029-7813
                </a>
              </div>
            </Card>

            <Card className="group relative p-6 border-2 border-gray-200/50 hover:border-indigo-500/30 hover:shadow-xl transition-all duration-300 overflow-hidden bg-gradient-to-br from-white to-purple-50/30 text-center">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">WhatsApp</h3>
                <p className="text-gray-600 mb-3" style={{ fontSize: '14px' }}>
                  Chat dengan kami via WhatsApp
                </p>
                <a 
                  href="https://wa.me/6281234567890" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-700 font-medium text-sm transition-colors"
                >
                  +62 812-1029-7813
                </a>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}