import { useState } from "react";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Search, MapPin, Users, Building2, ExternalLink } from "lucide-react";
import { companies } from "../data/companies";

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
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
            <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
                <h1 className="mb-4">Jelajahi Perusahaan Terbaik</h1>
                <p className="mb-8 text-blue-100">
                Temukan perusahaan impian Anda dan lihat lowongan yang tersedia
                </p>

                {/* Search Bar */}
                <div className="bg-white rounded-lg p-2 flex gap-2 shadow-lg">
                <div className="flex-1 flex items-center gap-2 px-3">
                    <Search className="w-5 h-5 text-gray-400" />
                    <Input
                    type="text"
                    placeholder="Cari perusahaan, industri, atau lokasi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-900"
                    />
                </div>
                <Button size="lg">Cari</Button>
                </div>
            </div>
            </div>
        </section>

        {/* Companies Grid */}
        <div className="container mx-auto px-4 py-12">
            <div className="mb-6">
            <p className="text-gray-600">
                Menampilkan <span className="font-semibold">{filteredCompanies.length}</span> perusahaan
            </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company) => (
                <Card key={company.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col h-full">
                    {/* Company Logo */}
                    <div className="mb-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        <img
                        src={company.logo}
                        alt={company.name}
                        className="w-full h-full object-cover"
                        />
                    </div>
                    </div>

                    {/* Company Info */}
                    <div className="flex-1">
                    <h3 className="mb-2">{company.name}</h3>
                    <Badge variant="secondary" className="mb-3">
                        {company.industry}
                    </Badge>

                    <div className="space-y-2 mb-4 text-gray-600">
                        <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{company.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{company.size} karyawan</span>
                        </div>
                        <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        <span>{company.openPositions} posisi terbuka</span>
                        </div>
                    </div>

                    <p className="text-gray-600 line-clamp-3 mb-4">
                        {company.description}
                    </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                    <Button className="flex-1">
                        Lihat Lowongan ({company.openPositions})
                    </Button>
                    <Button variant="outline" size="icon">
                        <ExternalLink className="w-4 h-4" />
                    </Button>
                    </div>
                </div>
                </Card>
            ))}
            </div>

            {filteredCompanies.length === 0 && (
            <div className="text-center py-16">
                <p className="text-gray-500">
                Tidak ada perusahaan yang sesuai dengan pencarian Anda
                </p>
            </div>
            )}
        </div>
        </div>
    );
}
