"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Users, Building2, ExternalLink, Sparkles, TrendingUp, Star, Globe, X, Eye, CheckCircle2, FileText, Calendar, Shield } from "lucide-react";
import { fetchCompaniesFromDatabase } from "@/lib/utils/companyData";
import type { Company } from "@/lib/types";
import {ImageWithFallback} from "@/components/figma/ImageWithFallback";
import type { Profile } from "@/lib/types";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";

interface CompaniesPageClientProps {
    companies: Company[];
    profile: Profile | null;
    userId: string;
}

export function CompaniesPageClient({ companies, profile, userId }: CompaniesPageClientProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [filters, setFilters] = useState({
        type: "all",
        industry: "all",
        location: "all",
    });
    const [activeTab, setActiveTab] = useState("all");
    const [savedCompanies, setSavedCompanies] = useState<string[]>([]);

    // Load saved companies from localStorage
    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem(`saved_companies_${userId}`);
            if (saved) {
                setSavedCompanies(JSON.parse(saved));
            }
        }
    }, [userId]);


    // Handle filter changes
    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    // Handle tab changes
    const handleTabChange = (value: string) => {
        setActiveTab(value);
    };

    // Toggle save company
    const toggleSaveCompany = (companyId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSavedCompanies((prev) => {
            const newSaved = prev.includes(companyId)
                ? prev.filter((id) => id !== companyId)
                : [...prev, companyId];
            localStorage.setItem(`saved_companies_${userId}`, JSON.stringify(newSaved));
            return newSaved;
        });
    };

    // Filter companies based on search and filters
    const filteredCompanies = useMemo(() => {
        return companies.filter((company) => {
            const companyLocation = company.location || company.location_city || '';
            const companyIndustry = company.industry || '';
            
            const matchesSearch =
                !searchQuery.trim() ||
                company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                companyIndustry.toLowerCase().includes(searchQuery.toLowerCase()) ||
                companyLocation.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesIndustry = filters.industry === "all" || companyIndustry === filters.industry;
            const matchesLocation = filters.location === "all" || companyLocation === filters.location;

            return matchesSearch && matchesIndustry && matchesLocation;
        });
    }, [companies, searchQuery, filters]);

    // Get unique industries and locations for filters
    const industries = useMemo(() => {
        const unique = Array.from(new Set(companies.map((c) => c.industry).filter((i): i is string => i !== null && i !== undefined)));
        return unique.sort();
    }, [companies]);

    const locations = useMemo(() => {
        const unique = Array.from(new Set(companies.map((c) => c.location)));
        return unique.sort();
    }, [companies]);

    // Helper function to get industry color
    const getIndustryColor = (industry: string) => {
        const colors: Record<string, string> = {
            "Technology": "bg-blue-50 text-blue-700",
            "Design & Creative": "bg-pink-50 text-pink-700",
            "Marketing": "bg-purple-50 text-purple-700",
            "E-Commerce": "bg-orange-50 text-orange-700",
            "Finance": "bg-green-50 text-green-700",
        };
        return colors[industry] || "bg-gray-50 text-gray-700";
    };

    return (
        <div className="space-y-6">
            {/* Search and Filters */}
            <div className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                        type="text"
                        placeholder="Cari perusahaan, industri, atau lokasi..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <div className="flex gap-4 flex-wrap">
                    <select
                        value={filters.industry || "all"}
                        onChange={(e) => handleFilterChange("industry", e.target.value)}
                        className="px-4 py-2 border rounded-lg"
                    >
                        <option value="all">Semua Industri</option>
                        {industries.map((industry) => (
                            <option key={industry} value={industry}>
                                {industry}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filters.location || "all"}
                        onChange={(e) => handleFilterChange("location", e.target.value)}
                        className="px-4 py-2 border rounded-lg"
                    >
                        <option value="all">Semua Lokasi</option>
                        {locations.map((location) => (
                            <option key={location} value={location}>
                                {location}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Companies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCompanies.map((company) => (
                    <div
                        key={company.id}
                        className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group"
                    >
                        {/* Header - Logo & Rating */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 group-hover:scale-110 transition-transform shadow-sm">
                                <ImageWithFallback
                                    src={company.logo_url || company.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&size=128&background=6366f1&color=ffffff&bold=true&format=png`}
                                    alt={company.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                        {/* Company Name */}
                        <h3 className="text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">
                            {company.name}
                        </h3>

                        {/* Industry Badge */}
                        {company.industry && (
                            <div className="mb-4">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs ${getIndustryColor(company.industry)}`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                    {company.industry}
                                </span>
                            </div>
                        )}

                        {/* Info Items */}
                        <div className="space-y-2.5 mb-4">
                            {(company.location || company.location_city) && (
                                <div className="flex items-start gap-2 text-sm text-gray-600">
                                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <span>{company.location || company.location_city}</span>
                                        {company.address && (
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{company.address}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                            {company.openPositions !== undefined && company.openPositions > 0 && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <TrendingUp className="w-4 h-4 text-green-500" />
                                    <span>{company.openPositions} posisi terbuka</span>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        {company.description && (
                            <p className="text-sm text-gray-600 mb-5 line-clamp-3 leading-relaxed">
                                {company.description}
                            </p>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => setSelectedCompany(company)}
                            >
                                <Eye className="w-4 h-4 mr-2" />
                                Lihat Detail Perusahaan
                            </Button>
                            <Link 
                                href={`/job-seeker/jobs?company=${encodeURIComponent(company.name)}`}
                                className="w-full py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2 group/btn"
                            >
                                <span>Lihat Lowongan ({company.openPositions || 0})</span>
                                <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            {filteredCompanies.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-600">Tidak ada perusahaan ditemukan</p>
                </div>
            )}

            {/* Company Detail Modal */}
            {selectedCompany && (
                <Dialog open={!!selectedCompany} onOpenChange={() => setSelectedCompany(null)}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-3">
                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shadow-md">
                                    <ImageWithFallback
                                        src={selectedCompany.logo_url || selectedCompany.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedCompany.name)}&size=128&background=6366f1&color=ffffff&bold=true&format=png`}
                                        alt={selectedCompany.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">{selectedCompany.name}</h2>
                                    {selectedCompany.industry && (
                                        <Badge className={`mt-1 ${getIndustryColor(selectedCompany.industry)}`}>
                                            {selectedCompany.industry}
                                        </Badge>
                                    )}
                                </div>
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-6 mt-4">
                            {/* Status Badge */}
                            <div className="flex items-center gap-2">
                                {selectedCompany.status === 'approved' && selectedCompany.is_approved && (
                                    <Badge className="bg-green-100 text-green-700 border-green-300 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Terverifikasi
                                    </Badge>
                                )}
                                {selectedCompany.is_blocked && (
                                    <Badge variant="destructive" className="flex items-center gap-1">
                                        <Shield className="w-3 h-3" />
                                        Diblokir
                                    </Badge>
                                )}
                            </div>

                            {/* Company Description */}
                            {selectedCompany.description && (
                                <Card>
                                    <CardContent className="p-4">
                                        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                            <Building2 className="w-5 h-5" />
                                            Tentang Perusahaan
                                        </h3>
                                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                            {selectedCompany.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Company Information Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(selectedCompany.location_city || selectedCompany.location_province) && (
                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                <MapPin className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                                                <div className="flex-1">
                                                    <p className="text-sm text-gray-500 mb-1">Lokasi</p>
                                                    <p className="font-medium text-gray-900">
                                                        {selectedCompany.location_city || ""}
                                                        {selectedCompany.location_province && `, ${selectedCompany.location_province}`}
                                                    </p>
                                                    {selectedCompany.address && (
                                                        <p className="text-sm text-gray-600 mt-1">{selectedCompany.address}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {selectedCompany.website_url && (
                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                <Globe className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                                                <div className="flex-1">
                                                    <p className="text-sm text-gray-500 mb-1">Website</p>
                                                    <a
                                                        href={selectedCompany.website_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 break-all"
                                                    >
                                                        {selectedCompany.website_url}
                                                        <ExternalLink className="w-4 h-4 shrink-0" />
                                                    </a>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {selectedCompany.industry && (
                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                <Sparkles className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                                                <div className="flex-1">
                                                    <p className="text-sm text-gray-500 mb-1">Industri</p>
                                                    <p className="font-medium text-gray-900">{selectedCompany.industry}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {selectedCompany.size && (
                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                <Users className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                                                <div className="flex-1">
                                                    <p className="text-sm text-gray-500 mb-1">Ukuran Perusahaan</p>
                                                    <p className="font-medium text-gray-900">{selectedCompany.size} karyawan</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {selectedCompany.openPositions !== undefined && selectedCompany.openPositions > 0 && (
                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                <TrendingUp className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                                                <div className="flex-1">
                                                    <p className="text-sm text-gray-500 mb-1">Lowongan Tersedia</p>
                                                    <p className="font-medium text-gray-900">{selectedCompany.openPositions} posisi terbuka</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {selectedCompany.license_url && (
                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                <FileText className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                                                <div className="flex-1">
                                                    <p className="text-sm text-gray-500 mb-1">Surat Izin</p>
                                                    <a
                                                        href={selectedCompany.license_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                                    >
                                                        Lihat Dokumen
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {selectedCompany.created_at && (
                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                <Calendar className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                                                <div className="flex-1">
                                                    <p className="text-sm text-gray-500 mb-1">Bergabung Sejak</p>
                                                    <p className="font-medium text-gray-900">
                                                        {new Date(selectedCompany.created_at).toLocaleDateString('id-ID', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>

                            {/* Action Button */}
                            <div className="flex gap-3 pt-4">
                                <Button
                                    asChild
                                    className="flex-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white"
                                >
                                    <Link href={`/job-seeker/jobs?company=${encodeURIComponent(selectedCompany.name)}`}>
                                        Lihat Semua Lowongan ({selectedCompany.openPositions || 0})
                                        <ExternalLink className="w-4 h-4 ml-2" />
                                    </Link>
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedCompany(null)}
                                >
                                    Tutup
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}