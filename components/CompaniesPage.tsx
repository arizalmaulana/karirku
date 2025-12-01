import { useState } from "react";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Search, MapPin, Users, Building2, ExternalLink, Sparkles, TrendingUp, Star } from "lucide-react";
import { companies } from "../data/companies";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function CompaniesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCompanies = companies.filter((company) => {
    return (
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white py-20 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 right-10 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-cyan-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6 animate-fade-in">
                <Building2 className="w-4 h-4" />
                <span style={{ fontSize: '14px' }}>🏢 Lebih dari 500+ perusahaan terpercaya</span>
              </div>

              <h1 className="mb-4 animate-slide-in-up" style={{ fontSize: '48px', lineHeight: '1.2', letterSpacing: '-0.02em' }}>
                Jelajahi Perusahaan{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">Terbaik</span>
                  <span className="absolute bottom-2 left-0 w-full h-3 bg-yellow-300/40 -rotate-1 rounded"></span>
                </span>
              </h1>
              <p className="mb-8 text-indigo-100 animate-slide-in-up" style={{ animationDelay: '0.1s', lineHeight: '1.7' }}>
                Temukan perusahaan impian Anda dan lihat lowongan yang tersedia
              </p>

              {/* Search Bar */}
              <div className="glass rounded-2xl p-2 flex gap-2 shadow-2xl animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="flex-1 flex items-center gap-3 px-4 bg-white rounded-xl">
                  <Search className="w-5 h-5 text-indigo-500" />
                  <Input
                    type="text"
                    placeholder="Cari perusahaan, industri, atau lokasi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-900 bg-transparent"
                  />
                </div>
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg px-8 hover:shadow-cyan-500/50 transition-all"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Cari
                </Button>
              </div>
            </div>

            {/* Right Illustration */}
            <div className="hidden lg:block relative animate-float">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20 backdrop-blur-sm">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1630283017802-785b7aff9aac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjB3b3Jrc3BhY2V8ZW58MXx8fHwxNzYzOTkxNTg0fDA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Modern Office"
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Companies Grid */}
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-gray-900 mb-1">Perusahaan Terdaftar</h2>
          <p className="text-gray-600" style={{ fontSize: '14px' }}>
            Menampilkan <span className="font-semibold gradient-text-cyan">{filteredCompanies.length}</span> perusahaan terpercaya
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company, index) => (
            <div
              key={company.id}
              className="animate-slide-in-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <Card className="group relative p-6 hover:shadow-2xl transition-all duration-300 border-2 border-gray-200/60 hover:border-indigo-300 h-full flex flex-col overflow-hidden card-hover">
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Shimmer effect */}
                <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100"></div>

                {/* Star rating badge */}
                <div className="absolute top-4 right-4 bg-white rounded-full px-3 py-1 shadow-md flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  <span className="text-gray-900" style={{ fontSize: '12px' }}>4.5</span>
                </div>

                <div className="relative flex flex-col h-full">
                  {/* Company Logo */}
                  <div className="mb-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center overflow-hidden ring-2 ring-gray-100 group-hover:ring-indigo-300 transition-all duration-300 group-hover:scale-110">
                      <img
                        src={company.logo}
                        alt={company.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Company Info */}
                  <div className="flex-1">
                    <h3 className="mb-2 group-hover:text-indigo-600 transition-colors">{company.name}</h3>
                    <Badge 
                      className="mb-4 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border-2 border-indigo-200 shadow-sm px-3 py-1.5 font-medium"
                    >
                      <Sparkles className="w-3 h-3 mr-1.5" />
                      {company.industry}
                    </Badge>

                    <div className="space-y-2 mb-4 text-gray-600" style={{ fontSize: '14px' }}>
                      <div className="flex items-center gap-2 group/item hover:text-indigo-600 transition-colors">
                        <div className="p-1.5 bg-indigo-50 rounded-lg group-hover/item:bg-indigo-100 transition-colors">
                          <MapPin className="w-4 h-4 text-indigo-500" />
                        </div>
                        <span className="font-medium">{company.location}</span>
                      </div>
                      <div className="flex items-center gap-2 group/item hover:text-purple-600 transition-colors">
                        <div className="p-1.5 bg-purple-50 rounded-lg group-hover/item:bg-purple-100 transition-colors">
                          <Users className="w-4 h-4 text-purple-500" />
                        </div>
                        <span className="font-medium">{company.size} karyawan</span>
                      </div>
                      <div className="flex items-center gap-2 group/item hover:text-cyan-600 transition-colors">
                        <div className="p-1.5 bg-cyan-50 rounded-lg group-hover/item:bg-cyan-100 transition-colors">
                          <TrendingUp className="w-4 h-4 text-cyan-500" />
                        </div>
                        <span className="font-medium">{company.openPositions} posisi terbuka</span>
                      </div>
                    </div>

                    <p className="text-gray-600 line-clamp-3 mb-4" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                      {company.description}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg shadow-indigo-500/30 transition-all hover:shadow-indigo-500/50">
                      Lihat Lowongan ({company.openPositions})
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="border-2 border-indigo-200 text-indigo-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:border-indigo-400 transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Bottom gradient line on hover */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </Card>
            </div>
          ))}
        </div>

        {filteredCompanies.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-indigo-400" />
            </div>
            <h3 className="text-gray-900 mb-2">Tidak ada perusahaan ditemukan</h3>
            <p className="text-gray-600">
              Coba ubah kata kunci pencarian Anda
            </p>
          </div>
        )}
      </div>
    </div>
  );
}