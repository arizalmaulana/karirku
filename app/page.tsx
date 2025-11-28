'use client';

import { useState } from "react";
// import { JobCard } from "../components/JobCard";
// import { JobFilters } from "../components/JobFilters";
// import { JobDetail } from "../components/JobDetail";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { jobs } from "@/data/jobs";
import { CompaniesPage } from "@/components/CompaniesPage";
import { AboutPage } from "@/components/AboutPage";
import { LoginDialog } from "@/components/LoginDialog";
import { RegisterDialog } from "@/components/RegisterDialog";
// import type { Job } from "@/types/job";


export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  requirements: string[];
  posted: string;
  logo: string;
  category: string;
  level: string;
}


export default function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [currentPage, setCurrentPage] = useState<"jobs" | "companies" | "about">("jobs");
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [filters, setFilters] = useState({
    type: "all",
    category: "all",
    level: "all",
  });

  // const filteredJobs = jobs.filter((job) => {
  //   const matchesSearch =
  //     job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //     job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //     job.location.toLowerCase().includes(searchQuery.toLowerCase());

  //   const matchesType = filters.type === "all" || job.type === filters.type;
  //   const matchesCategory = filters.category === "all" || job.category === filters.category;
  //   const matchesLevel = filters.level === "all" || job.level === filters.level;

  //   return matchesSearch && matchesType && matchesCategory && matchesLevel;
  // });

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Conditional Page Rendering */}
      {currentPage === "jobs" && (
        <>
          {/* Hero Section */}
          <section className="bg-linear-to-r from-blue-600 to-blue-800 text-white py-16">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto text-center">
                <h1 className="mb-4">Temukan Pekerjaan Impian Anda</h1>
                <p className="mb-8 text-blue-100">
                  Ribuan lowongan kerja dari perusahaan terpercaya menanti Anda
                </p>
                
                {/* Search Bar */}
                <div className="bg-white rounded-lg p-2 flex gap-2 shadow-lg">
                  {/* <div className="flex-1 flex items-center gap-2 px-3">
                    <Search className="w-5 h-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Cari posisi, perusahaan, atau kata kunci..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-900"
                    />
                  </div> */}
                  <Button size="lg">Cari</Button>
                </div>
              </div>
            </div>
          </section>

          {/* Main Content */}
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Filters Sidebar */}
              {/* <aside className="lg:col-span-1">
                <JobFilters filters={filters} onFilterChange={setFilters} />
              </aside> */}

              {/* Job Listings */}
              <main className="lg:col-span-3">
                {/* <div className="mb-6">
                  <p className="text-gray-600">
                    Menampilkan <span className="font-semibold">{filteredJobs.length}</span> lowongan kerja
                  </p>
                </div> */}

                {/* <div className="space-y-4">
                  {filteredJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onClick={() => setSelectedJob(job)}
                    />
                  ))}

                  {filteredJobs.length === 0 && (
                    <div className="text-center py-16">
                      <p className="text-gray-500">Tidak ada lowongan yang sesuai dengan pencarian Anda</p>
                    </div>
                  )}
                </div> */}
              </main>
            </div>
          </div>
        </>
      )}

      {currentPage === "companies" && <CompaniesPage />}
      
      {currentPage === "about" && <AboutPage />}

      {/* Job Detail Modal */}
      {/* {selectedJob && (
        <JobDetail
          job={selectedJob}
          open={!!selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      )} */}

      {/* Login Dialog */}
      <LoginDialog
        open={showLogin}
        onClose={() => setShowLogin(false)}
        onSwitchToRegister={() => {
          setShowLogin(false);
          setShowRegister(true);
        }}
      />

      {/* Register Dialog */}
      <RegisterDialog
        open={showRegister}
        onClose={() => setShowRegister(false)}
        onSwitchToLogin={() => {
          setShowRegister(false);
          setShowLogin(true);
        }}
      />
    </main>
  );

}
