'use client';

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JobCard } from "@/components/JobCard";
import { JobFilters } from "@/components/JobFilters";
import { MapModal } from "@/components/MapModal";
import { 
    Search, 
    Map, 
    Bookmark,
    BookmarkCheck,
    Sparkles,
    Briefcase
} from "lucide-react";
import type { Job } from "@/types/job";
import type { Profile } from "@/lib/types";
import { calculateMatchScore as calculateMatchScoreUtil } from "@/lib/utils/jobMatching";

interface JobsPageClientProps {
    jobs: Job[];
    profile: Profile | null;
    userId: string;
    initialJobId?: string;
    initialCompany?: string;
}

export function JobsPageClient({ jobs, profile, userId, initialJobId, initialCompany }: JobsPageClientProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState(initialCompany || "");
    const [showMap, setShowMap] = useState(false);
    const [filters, setFilters] = useState({
        type: "all",
        category: "all",
        level: "all",
    });
    const [activeTab, setActiveTab] = useState("all");
    const [savedJobs, setSavedJobs] = useState<string[]>([]);

    // Load saved jobs from localStorage
    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem(`saved_jobs_${userId}`);
            if (saved) {
                setSavedJobs(JSON.parse(saved));
            }
        }
    }, [userId]);

    // Check for jobId in URL params to redirect to job detail after login
    useEffect(() => {
        if (initialJobId) {
            router.push(`/job-seeker/jobs/${initialJobId}`);
        }
    }, [initialJobId, router]);

    // Helper function to convert display type to database type
    const getDatabaseTypeFromDisplay = (displayType: string): string => {
        const typeMap: Record<string, string> = {
            "Full-time": "fulltime",
            "Part-time": "parttime",
            "Contract": "contract",
            "Internship": "internship",
            "Remote": "remote",
            "Hybrid": "hybrid",
        };
        return typeMap[displayType] || displayType.toLowerCase();
    };

    // Helper function to calculate match score (using same logic as dashboard)
    const calculateMatchScore = (job: Job, userProfile: Profile | null): number => {
        if (!userProfile) {
            return 0;
        }
        
        return calculateMatchScoreUtil(
            userProfile.skills || [],
            job.skills_required || null,
            userProfile.major || null,
            job.major_required || null
        );
    };

    // Filter jobs based on active tab and filters
    const filteredJobs = useMemo(() => {
        let result = jobs;

        // Apply tab filter
        if (activeTab === "bookmark") {
            result = result.filter((job) => savedJobs.includes(job.id));
        } else if (activeTab === "matched" && profile) {
            // Filter jobs based on profile skills (simple matching)
            if (profile.skills && profile.skills.length > 0) {
                const userSkills = profile.skills.map(s => s.toLowerCase());
                result = result.filter((job) => {
                    // Simple matching: check if job description or requirements contain user skills
                    const jobText = `${job.description} ${job.requirements?.join(' ')}`.toLowerCase();
                    return userSkills.some(skill => jobText.includes(skill));
                });
            } else {
                result = [];
            }
        }

        // Apply search query and filters
        return result.filter((job) => {
            const matchesSearch =
                !searchQuery.trim() ||
                job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                job.location.toLowerCase().includes(searchQuery.toLowerCase());

            // Fix type filter: convert display type to database type for comparison
            const jobDbType = getDatabaseTypeFromDisplay(job.type);
            const matchesType = filters.type === "all" || jobDbType === filters.type;
            const matchesCategory = filters.category === "all" || job.category === filters.category;
            const matchesLevel = filters.level === "all" || job.level === filters.level;

            return matchesSearch && matchesType && matchesCategory && matchesLevel;
        });
    }, [jobs, searchQuery, filters, activeTab, savedJobs, profile]);

    // Toggle save job
    const toggleSaveJob = (jobId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSavedJobs((prev) => {
            const newSaved = prev.includes(jobId)
                ? prev.filter((id) => id !== jobId)
                : [...prev, jobId];
            if (typeof window !== "undefined") {
                localStorage.setItem(`saved_jobs_${userId}`, JSON.stringify(newSaved));
            }
            return newSaved;
        });
    };

    // Handle job click - navigate to detail page
    const handleJobClick = (job: Job) => {
        router.push(`/job-seeker/jobs/${job.id}`);
    };

    return (
        <>
            <div className="container mx-auto px-2 py-4">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {/* Filters Sidebar */}
                    <aside className="lg:col-span-1 border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50 shadow-sm rounded-2xl p-4">
                        <JobFilters
                            filters={filters}
                            onFilterChange={setFilters}
                        />
                    </aside>

                    {/* Job Listings */}
                    <main className="lg:col-span-3">
                        {/* Header */}
                        <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
                            <div>
                                <h2 className="text-3xl font-bold text-purple-900">Lowongan Tersedia</h2>
                                <p className="text-gray-600" style={{ fontSize: '14px' }}>
                                    Menampilkan{" "}
                                    <span className="font-semibold gradient-text-cyan">
                                        {filteredJobs.length}
                                    </span>{" "}
                                    lowongan kerja yang sesuai
                                </p>
                            </div>
                            {/* <Button 
                                variant="outline" 
                                onClick={() => setShowMap(true)}
                                className="flex items-center gap-2 border-2 border-cyan-200 text-cyan-700 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 hover:border-cyan-400 transition-all"
                            >
                                <Map className="w-4 h-4" />
                                Lihat di Map
                            </Button> */}
                        </div>

                        {/* Search Bar */}
                        <div className="mb-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Cari posisi, perusahaan, atau kata kunci..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 h-12 border-2 focus-visible:ring-0 focus-visible:ring-offset-0"
                                />
                            </div>
                        </div>

                        {/* Tabs */}
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-4">
                            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 bg-gray-100 p-1 rounded-lg">
                                <TabsTrigger value="all" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-purple-600">
                                    <Briefcase className="h-4 w-4" />
                                    Semua
                                </TabsTrigger>
                                <TabsTrigger value="bookmark" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-purple-600">
                                    <BookmarkCheck className="h-4 w-4" />
                                    Disimpan ({savedJobs.length})
                                </TabsTrigger>
                                <TabsTrigger value="matched" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-purple-600">
                                    <Sparkles className="h-4 w-4" />
                                    Job Matcher
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="all" className="mt-4">
                                <JobListContent
                                    jobs={filteredJobs}
                                    savedJobs={savedJobs}
                                    onToggleSave={toggleSaveJob}
                                    onJobClick={handleJobClick}
                                />
                            </TabsContent>

                            <TabsContent value="bookmark" className="mt-4">
                                {savedJobs.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Bookmark className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500">Belum ada lowongan yang disimpan</p>
                                    </div>
                                ) : (
                                    <JobListContent
                                        jobs={filteredJobs}
                                        savedJobs={savedJobs}
                                        onToggleSave={toggleSaveJob}
                                        onJobClick={handleJobClick}
                                    />
                                )}
                            </TabsContent>

                            <TabsContent value="matched" className="mt-4">
                                {!profile ? (
                                    <div className="text-center py-8">
                                        <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500 mb-4">Lengkapi profil untuk mendapatkan rekomendasi</p>
                                    </div>
                                ) : filteredJobs.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500">Tidak ada lowongan yang cocok dengan profil Anda</p>
                                    </div>
                                ) : (
                                    <JobListContentWithMatch
                                        jobs={filteredJobs}
                                        savedJobs={savedJobs}
                                        profile={profile}
                                        onToggleSave={toggleSaveJob}
                                        onJobClick={handleJobClick}
                                    />
                                )}
                            </TabsContent>
                        </Tabs>
                    </main>
                </div>
            </div>

            {/* Map Modal */}
            <MapModal
                jobs={filteredJobs}
                open={showMap}
                onClose={() => setShowMap(false)}
                onJobSelect={(job) => handleJobClick(job)}
            />
        </>
    );
}

// Job List Content Component
interface JobListContentProps {
    jobs: Job[];
    savedJobs: string[];
    onToggleSave: (jobId: string, e: React.MouseEvent) => void;
    onJobClick: (job: Job) => void;
}

function JobListContent({ jobs, savedJobs, onToggleSave, onJobClick }: JobListContentProps) {
    if (jobs.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-10 h-10 text-indigo-400" />
                </div>
                <h3 className="text-gray-900 mb-2">Tidak ada lowongan ditemukan</h3>
                <p className="text-gray-600">
                    Coba ubah filter atau kata kunci pencarian Anda
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {jobs.map((job, index) => (
                <div 
                    key={job.id}
                    className="animate-slide-in-up relative"
                    style={{ animationDelay: `${index * 0.05}s` }}
                >
                    <div className="absolute top-4 right-4 z-10">
                        <button
                            onClick={(e) => onToggleSave(job.id, e)}
                            className="p-2 bg-white rounded-lg shadow-md hover:bg-purple-50 transition-colors"
                        >
                            {savedJobs.includes(job.id) ? (
                                <BookmarkCheck className="w-5 h-5 text-purple-600 fill-purple-600" />
                            ) : (
                                <Bookmark className="w-5 h-5 text-gray-400 hover:text-purple-600 transition" />
                            )}
                        </button>
                    </div>
                    <JobCard
                        job={job}
                        onClick={() => onJobClick(job)}
                    />
                </div>
            ))}
        </div>
    );
}

// Job List Content with Match Score Component
interface JobListContentWithMatchProps {
    jobs: Job[];
    savedJobs: string[];
    profile: Profile;
    onToggleSave: (jobId: string, e: React.MouseEvent) => void;
    onJobClick: (job: Job) => void;
}

function JobListContentWithMatch({ jobs, savedJobs, profile, onToggleSave, onJobClick }: JobListContentWithMatchProps) {
    // Calculate match scores for all jobs
    const jobsWithScores = useMemo(() => {
        return jobs.map(job => {
            const matchScore = calculateMatchScoreUtil(
                profile.skills || [],
                job.skills_required || null,
                profile.major || null,
                job.major_required || null
            );
            
            return { job, matchScore };
        }).sort((a, b) => b.matchScore - a.matchScore);
    }, [jobs, profile]);

    if (jobsWithScores.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-10 h-10 text-indigo-400" />
                </div>
                <h3 className="text-gray-900 mb-2">Tidak ada lowongan ditemukan</h3>
                <p className="text-gray-600">
                    Coba ubah filter atau kata kunci pencarian Anda
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {jobsWithScores.map(({ job, matchScore }, index) => (
                <div 
                    key={job.id}
                    className="animate-slide-in-up relative"
                    style={{ animationDelay: `${index * 0.05}s` }}
                >
                    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                        
                        <button
                            onClick={(e) => onToggleSave(job.id, e)}
                            className="p-2 bg-white rounded-lg shadow-md hover:bg-purple-50 transition-colors"
                        >
                            {savedJobs.includes(job.id) ? (
                                <BookmarkCheck className="w-5 h-5 text-purple-600 fill-purple-600" />
                            ) : (
                                <Bookmark className="w-5 h-5 text-gray-400 hover:text-purple-600 transition" />
                            )}
                        </button>
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1.5 rounded-lg shadow-md text-sm font-semibold">
                            {matchScore}%
                        </div>
                    </div>
                    <JobCard
                        job={job}
                        onClick={() => onJobClick(job)}
                    />
                </div>
            ))}
        </div>
    );
}



