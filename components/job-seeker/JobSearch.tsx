'use client';

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Briefcase, MapPin, Search, Filter, X, DollarSign } from "lucide-react";
import { findMatchingJobs } from "@/lib/utils/jobMatching";
import type { JobListing, Profile, LivingCost, EmploymentType } from "@/lib/types";

interface JobSearchProps {
    jobs: JobListing[];
    profile: Profile | null;
    livingCosts: LivingCost[];
}

function formatCurrency(amount: number | null): string {
    if (!amount) return "Tidak disebutkan";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
}

export function JobSearch({ jobs, profile, livingCosts }: JobSearchProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [locationFilter, setLocationFilter] = useState("");
    const [employmentTypeFilter, setEmploymentTypeFilter] = useState<string>("");
    const [minSalaryFilter, setMinSalaryFilter] = useState("");
    const [maxSalaryFilter, setMaxSalaryFilter] = useState("");
    const [minMatchScore, setMinMatchScore] = useState(0);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    // Get unique cities from jobs
    const availableCities = useMemo(() => {
        const cities = new Set<string>();
        jobs.forEach((job) => {
            if (job.location_city) cities.add(job.location_city);
        });
        return Array.from(cities).sort();
    }, [jobs]);

    // Get unique employment types
    const employmentTypes: EmploymentType[] = ['fulltime', 'parttime', 'contract', 'internship', 'remote', 'hybrid'];
    
    const getEmploymentTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            fulltime: 'Full Time',
            parttime: 'Part Time',
            contract: 'Contract',
            internship: 'Internship',
            remote: 'Remote',
            hybrid: 'Hybrid',
        };
        return labels[type] || type;
    };

    // Filter and match jobs
    const filteredJobs = useMemo(() => {
        let result = jobs;

        // Apply search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (job) =>
                    job.title.toLowerCase().includes(query) ||
                    job.company_name.toLowerCase().includes(query) ||
                    job.description?.toLowerCase().includes(query) ||
                    job.skills_required?.some(skill => skill.toLowerCase().includes(query))
            );
        }

        // Apply location filter
        if (locationFilter) {
            result = result.filter(
                (job) =>
                    job.location_city.toLowerCase().includes(locationFilter.toLowerCase()) ||
                    job.location_province?.toLowerCase().includes(locationFilter.toLowerCase())
            );
        }

        // Apply employment type filter
        if (employmentTypeFilter) {
            result = result.filter((job) => job.employment_type === employmentTypeFilter);
        }

        // Apply salary filters
        if (minSalaryFilter) {
            const minSalary = parseInt(minSalaryFilter);
            result = result.filter((job) => {
                if (job.max_salary) return job.max_salary >= minSalary;
                if (job.min_salary) return job.min_salary >= minSalary;
                return false;
            });
        }

        if (maxSalaryFilter) {
            const maxSalary = parseInt(maxSalaryFilter);
            result = result.filter((job) => {
                if (job.min_salary) return job.min_salary <= maxSalary;
                return false;
            });
        }

        // Calculate match scores if profile exists
        if (profile) {
            const matched = findMatchingJobs(profile, result, locationFilter);
            return matched.filter((job) => job.matchScore >= minMatchScore);
        }

        return result;
    }, [jobs, profile, searchQuery, locationFilter, employmentTypeFilter, minSalaryFilter, maxSalaryFilter, minMatchScore]);

    const hasActiveFilters = searchQuery || locationFilter || employmentTypeFilter || minSalaryFilter || maxSalaryFilter || minMatchScore > 0;

    const resetFilters = () => {
        setSearchQuery("");
        setLocationFilter("");
        setEmploymentTypeFilter("");
        setMinSalaryFilter("");
        setMaxSalaryFilter("");
        setMinMatchScore(0);
    };

    return (
        <div className="space-y-6">
            {/* Main Search Bar */}
            <Card>
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input
                                placeholder="Cari berdasarkan judul, perusahaan, atau skill..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-12 text-base"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                >
                                    <Filter className="h-4 w-4 mr-2" />
                                    Filter Lanjutan
                                </Button>
                                {hasActiveFilters && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={resetFilters}
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Reset
                                    </Button>
                                )}
                            </div>
                            <p className="text-sm text-gray-500">
                                {filteredJobs.length} lowongan ditemukan
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
                <Card>
                    <CardHeader>
                        <CardTitle>Filter Lanjutan</CardTitle>
                        <CardDescription>
                            Sempitkan pencarian dengan filter yang lebih spesifik
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Lokasi</label>
                                <Select value={locationFilter} onValueChange={setLocationFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Semua Lokasi" />
                                    </SelectTrigger>
                                    <SelectContent className="!bg-white text-black border border-gray-200">
                                        <SelectItem value="" className="!bg-white text-black hover:bg-gray-100" >Semua Lokasi</SelectItem>
                                        {availableCities.map((city) => (
                                            <SelectItem key={city} value={city} className="!bg-white text-black hover:bg-gray-100"  >
                                                {city}
                                            </SelectItem>
                                        ))}
                                        
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tipe Pekerjaan</label>
                                <Select value={employmentTypeFilter} onValueChange={setEmploymentTypeFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Semua Tipe" />
                                    </SelectTrigger>
                                    <SelectContent className="!bg-white text-black border border-gray-200">
                                        <SelectItem value="">Semua Tipe</SelectItem>
                                        {employmentTypes.map((type) => (
                                            <SelectItem key={type} value={type} className="!bg-white text-black hover:bg-gray-100">
                                                {getEmploymentTypeLabel(type)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Gaji Minimum</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="number"
                                        placeholder="Min. gaji"
                                        value={minSalaryFilter}
                                        onChange={(e) => setMinSalaryFilter(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Gaji Maksimum</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="number"
                                        placeholder="Max. gaji"
                                        value={maxSalaryFilter}
                                        onChange={(e) => setMaxSalaryFilter(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                        </div>

                        {profile && (
                            <>
                                <Separator className="my-4" />
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Min. Match Score</label>
                                    <Select
                                        value={minMatchScore.toString()}
                                        onValueChange={(value) => setMinMatchScore(parseInt(value))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0">Semua (0%+)</SelectItem>
                                            <SelectItem value="25">Cukup Cocok (25%+)</SelectItem>
                                            <SelectItem value="50">Sangat Cocok (50%+)</SelectItem>
                                            <SelectItem value="75">Sempurna (75%+)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Active Filters Display */}
            {hasActiveFilters && (
                <div className="flex flex-wrap gap-2">
                    {searchQuery && (
                        <Badge variant="secondary" className="gap-2">
                            Pencarian: {searchQuery}
                            <button onClick={() => setSearchQuery("")}>
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}
                    {locationFilter && (
                        <Badge variant="secondary" className="gap-2">
                            Lokasi: {locationFilter}
                            <button onClick={() => setLocationFilter("")}>
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}
                    {employmentTypeFilter && (
                        <Badge variant="secondary" className="gap-2">
                            Tipe: {getEmploymentTypeLabel(employmentTypeFilter)}
                            <button onClick={() => setEmploymentTypeFilter("")}>
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}
                    {minSalaryFilter && (
                        <Badge variant="secondary" className="gap-2">
                            Min. Gaji: {formatCurrency(parseInt(minSalaryFilter))}
                            <button onClick={() => setMinSalaryFilter("")}>
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}
                    {maxSalaryFilter && (
                        <Badge variant="secondary" className="gap-2">
                            Max. Gaji: {formatCurrency(parseInt(maxSalaryFilter))}
                            <button onClick={() => setMaxSalaryFilter("")}>
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}
                    {minMatchScore > 0 && (
                        <Badge variant="secondary" className="gap-2">
                            Match: {minMatchScore}%+
                            <button onClick={() => setMinMatchScore(0)}>
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}
                </div>
            )}

            {/* Results */}
            <div className="space-y-4">

                {filteredJobs.length > 0 ? (
                    filteredJobs.map((job: any) => (
                        <div
                            key={job.id}
                            className="rounded-2xl border p-6 hover:border-blue-500 transition"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {job.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {job.company_name}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="h-4 w-4" />
                                            {job.location_city}
                                            {job.location_province && `, ${job.location_province}`}
                                        </span>
                                        <Badge variant="outline">{job.employment_type}</Badge>
                                    </div>
                                </div>
                                {job.matchScore !== undefined && (
                                    <Badge
                                        variant={job.matchScore >= 50 ? "default" : "secondary"}
                                    >
                                        {job.matchScore}% Match
                                    </Badge>
                                )}
                            </div>

                            {job.skills_required && job.skills_required.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {job.skills_required.slice(0, 5).map((skill: string, index: number) => (
                                        <Badge key={index} variant="secondary">
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            <div className="mt-4 flex flex-col gap-1 text-sm text-gray-500">
                                <span>
                                    Estimasi Gaji:{" "}
                                    {job.min_salary && job.max_salary
                                        ? `${formatCurrency(job.min_salary)} - ${formatCurrency(job.max_salary)}`
                                        : job.min_salary
                                        ? `Mulai dari ${formatCurrency(job.min_salary)}`
                                        : "Tidak disebutkan"}
                                </span>
                            </div>

                            <Button className="mt-4 w-full" variant="secondary" asChild>
                                <Link href={`/job-seeker/jobs/${job.id}`}>
                                    <Briefcase className="mr-2 h-4 w-4" />
                                    Lihat Detail & Lamar
                                </Link>
                            </Button>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-500 mb-4">
                            Tidak ada lowongan yang sesuai dengan filter Anda
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSearchQuery("");
                                setLocationFilter("");
                                setMinMatchScore(0);
                            }}
                        >
                            Reset Filter
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

