"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { JobCard } from "./JobCard";
import { JobFilters } from "./JobFilters";
import { JobDetail } from "./JobDetail";
import { MapModal } from "./MapModal";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Search, Map, Sparkles, TrendingUp, Zap, Briefcase, Users, Building2 } from "lucide-react";
import type { Job } from "../types/job";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useAuth } from "@/lib/auth-context";
import { createBrowserClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/types";

interface HomePageClientProps {
  initialJobs: Job[];
  stats: {
    totalJobs: number;
    totalCompanies: number;
    totalUsers: number;
  };
}

export function HomePageClient({ initialJobs, stats }: HomePageClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [filters, setFilters] = useState({
    type: "all",
    category: "all",
    level: "all",
  });
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = useMemo(() => createBrowserClient(), []);

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (!loading && user) {
      // Fetch user profile to get role
      supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data: profile }) => {
          if (profile) {
            const role = profile.role as UserRole;
            const roleRedirectMap: Record<UserRole, string> = {
              admin: "/admin/dashboard",
              recruiter: "/recruiter/dashboard",
              jobseeker: "/job-seeker/dashboard",
            };
            const destination = roleRedirectMap[role] || "/job-seeker/dashboard";
            router.push(destination);
          } else {
            // If no profile, default to job-seeker dashboard
            router.push("/job-seeker/dashboard");
          }
        })
        .catch(() => {
          // On error, default to job-seeker dashboard
          router.push("/job-seeker/dashboard");
        });
    }
  }, [user, loading, router, supabase]);

  // Check for jobId in URL params to open job detail after login
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const jobId = params.get("jobId");
      if (jobId) {
        const job = initialJobs.find((j) => j.id === jobId);
        if (job) {
          setSelectedJob(job);
          // Clean up URL
          window.history.replaceState({}, "", window.location.pathname);
        }
      }
    }
  }, [initialJobs]);

  // Don't render landing page if user is logged in (will redirect)
  if (!loading && user) {
    return null;
  }

  const filteredJobs = initialJobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase());

    // Mapping untuk type: database value (fulltime, parttime, etc) ke display value (Full-time, Part-time, etc)
    const typeMapping: Record<string, string> = {
      fulltime: "Full-time",
      parttime: "Part-time",
      contract: "Contract",
      internship: "Internship",
      remote: "Remote",
      hybrid: "Hybrid",
    };
    
    // Check if filter matches: job.type sudah dalam format display (Full-time), filter dalam format database (fulltime)
    // Jadi kita perlu membandingkan job.type dengan mapped value
    const matchesType = 
      filters.type === "all" || 
      job.type === typeMapping[filters.type] ||
      job.type === filters.type; // Fallback untuk direct match

    const matchesCategory = filters.category === "all" || job.category === filters.category;
    const matchesLevel = filters.level === "all" || job.level === filters.level;

    return matchesSearch && matchesType && matchesCategory && matchesLevel;
  });

  return (
    <>
      {/* Hero Section with Illustration */}
      <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white py-20 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6 animate-fade-in">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span style={{ fontSize: '14px' }}>✨ Temukan karir impian Anda bersama kami</span>
              </div>

              {/* Heading */}
              <h1 className="mb-6 animate-slide-in-up" style={{ fontSize: '48px', lineHeight: '1.2', letterSpacing: '-0.02em' }}>
                Raih Karir yang{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">Cemerlang</span>
                  <span className="absolute bottom-2 left-0 w-full h-3 bg-yellow-300/40 -rotate-1 rounded"></span>
                </span>
              </h1>
              <p className="mb-8 text-indigo-100 animate-slide-in-up" style={{ fontSize: '18px', animationDelay: '0.1s', lineHeight: '1.7' }}>
                Jelajahi ribuan lowongan kerja dari perusahaan terpercaya di seluruh Indonesia. Mulai perjalanan karir Anda hari ini!
              </p>

              {/* Search Bar */}
              <div className="glass rounded-2xl p-2 flex gap-2 shadow-2xl animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="flex-1 flex items-center gap-3 px-4 bg-white rounded-xl">
                  <Search className="w-5 h-5 text-indigo-500" />
                  <Input
                    type="text"
                    placeholder="Cari posisi, perusahaan, atau kata kunci..."
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

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mt-10 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <div className="p-2 bg-yellow-400/20 rounded-lg backdrop-blur-sm">
                      <Briefcase className="w-5 h-5 text-yellow-300" />
                    </div>
                  </div>
                  <div style={{ fontSize: '28px' }} className="font-bold">{stats.totalJobs}+</div>
                  <div className="text-indigo-200" style={{ fontSize: '14px' }}>Lowongan Aktif</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <div className="p-2 bg-cyan-400/20 rounded-lg backdrop-blur-sm">
                      <Building2 className="w-5 h-5 text-cyan-300" />
                    </div>
                  </div>
                  <div style={{ fontSize: '28px' }} className="font-bold">{stats.totalCompanies}+</div>
                  <div className="text-indigo-200" style={{ fontSize: '14px' }}>Perusahaan</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <div className="p-2 bg-pink-400/20 rounded-lg backdrop-blur-sm">
                      <Users className="w-5 h-5 text-pink-300" />
                    </div>
                  </div>
                  <div style={{ fontSize: '28px' }} className="font-bold">{stats.totalUsers}+</div>
                  <div className="text-indigo-200" style={{ fontSize: '14px' }}>Pengguna Aktif</div>
                </div>
              </div>
            </div>

            {/* Right Illustration */}
            <div className="hidden lg:block relative animate-float">
              <div className="relative">
                {/* Main Image */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20 backdrop-blur-sm">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1739298061740-5ed03045b280?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWFtJTIwY29sbGFib3JhdGlvbiUyMG9mZmljZXxlbnwxfHx8fDE3NjQwMDc0ODJ8MA&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Team Collaboration"
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 to-transparent"></div>
                </div>

                {/* Floating Cards */}
                <div className="absolute -top-6 -left-6 bg-white rounded-2xl shadow-xl p-4 animate-pulse-glow" style={{ animationDelay: '0s' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-gray-900" style={{ fontSize: '12px' }}>Success Rate</div>
                      <div className="gradient-text-cyan" style={{ fontSize: '20px' }}>95%</div>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-xl p-4 animate-pulse-glow" style={{ animationDelay: '1s' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-gray-900" style={{ fontSize: '12px' }}>Fast Response</div>
                      <div className="gradient-text" style={{ fontSize: '20px' }}>24 Jam</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <JobFilters
              filters={filters}
              onFilterChange={setFilters}
            />
          </aside>

          {/* Job Listings */}
          <main className="lg:col-span-3">
            <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-gray-900 mb-1">Lowongan Tersedia</h2>
                <p className="text-gray-600" style={{ fontSize: '14px' }}>
                  Menampilkan{" "}
                  <span className="font-semibold gradient-text-cyan">
                    {filteredJobs.length}
                  </span>{" "}
                  lowongan kerja yang sesuai
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowMap(true)}
                className="flex items-center gap-2 border-2 border-cyan-200 text-cyan-700 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 hover:border-cyan-400 transition-all"
              >
                <Map className="w-4 h-4" />
                Lihat di Map
              </Button>
            </div>

            <div className="space-y-4">
              {filteredJobs.map((job, index) => (
                <div 
                  key={job.id}
                  className="animate-slide-in-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <JobCard
                    job={job}
                    onClick={() => setSelectedJob(job)}
                  />
                </div>
              ))}

              {filteredJobs.length === 0 && (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-10 h-10 text-indigo-400" />
                  </div>
                  <h3 className="text-gray-900 mb-2">Tidak ada lowongan ditemukan</h3>
                  <p className="text-gray-600">
                    Coba ubah filter atau kata kunci pencarian Anda
                  </p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <JobDetail
          job={selectedJob}
          open={!!selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      )}

      {/* Map Modal */}
      <MapModal
        jobs={filteredJobs}
        open={showMap}
        onClose={() => setShowMap(false)}
        onJobSelect={(job) => setSelectedJob(job)}
      />
    </>
  );
}

