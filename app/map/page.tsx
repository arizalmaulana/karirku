"use client";

import { useState, useEffect } from "react";
import { JobMap } from "../../components/JobMap";
import { JobDetail } from "../../components/JobDetail";
import type { Job } from "../../types/job";
import { ArrowLeft, MapPin, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import Link from "next/link";

export default function MapPage() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadJobs() {
      try {
        const response = await fetch("/api/jobs");
        if (!response.ok) {
          throw new Error("Gagal mengambil data lowongan");
        }
        const data = await response.json();
        setJobs(data.jobs || []);
      } catch (error) {
        console.error("Error loading jobs:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadJobs();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Memuat peta lowongan kerja...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon" className="hover:bg-gray-100">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-gray-900">Peta Lowongan Kerja</h1>
                  <p className="text-gray-600 text-sm">
                    Jelajahi lowongan kerja di seluruh Indonesia
                  </p>
                </div>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
              <div className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg font-medium">
                {jobs.filter(j => j.coordinates).length} Lowongan
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <JobMap 
            jobs={jobs}
            onJobSelect={(job) => setSelectedJob(job)}
            height="calc(100vh - 180px)"
          />
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
    </div>
  );
}
