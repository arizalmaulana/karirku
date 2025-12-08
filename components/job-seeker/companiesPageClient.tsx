"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Users, Building2, ExternalLink, Sparkles, TrendingUp, Star } from "lucide-react";
import { companies, Company } from "@/data/companies";
import {ImageWithFallback} from "@/components/figma/ImageWithFallback";
import type { Profile } from "@/lib/types";

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
            const matchesSearch =
                !searchQuery.trim() ||
                company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                company.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
                company.location.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesIndustry = filters.industry === "all" || company.industry === filters.industry;
            const matchesLocation = filters.location === "all" || company.location === filters.location;

            return matchesSearch && matchesIndustry && matchesLocation;
        });
    }, [companies, searchQuery, filters]);

    // Get unique industries and locations for filters
    const industries = useMemo(() => {
        const unique = Array.from(new Set(companies.map((c) => c.industry)));
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
                        value={filters.industry}
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
                        value={filters.location}
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
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 group-hover:scale-110 transition-transform">
                                <ImageWithFallback
                                    src={company.logo}
                                    alt={company.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-lg">
                                <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
                                <span className="text-sm text-orange-700">4.5</span>
                            </div>
                        </div>

                        {/* Company Name */}
                        <h3 className="text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">
                            {company.name}
                        </h3>

                        {/* Industry Badge */}
                        <div className="mb-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs ${getIndustryColor(company.industry)}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                {company.industry}
                            </span>
                        </div>

                        {/* Info Items */}
                        <div className="space-y-2.5 mb-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span>{company.location}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Users className="w-4 h-4 text-gray-400" />
                                <span>{company.size} karyawan</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <TrendingUp className="w-4 h-4 text-green-500" />
                                <span>{company.openPositions} posisi terbuka</span>
                            </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-600 mb-5 line-clamp-3 leading-relaxed">
                            {company.description}
                        </p>

                        {/* Action Button */}
                        <button className="w-full py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2 group/btn">
                            <span>Lihat Lowongan ({company.openPositions})</span>
                            <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    </div>
                ))}
            </div>

            {filteredCompanies.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-600">Tidak ada perusahaan ditemukan</p>
                </div>
            )}
        </div>
    );
}