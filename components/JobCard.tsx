import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { MapPin, Clock, Wallet, Sparkles, Bookmark, ArrowRight } from "lucide-react";
import type { Job } from "../types/job";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface JobCardProps {
  job: Job;
  matchScore?: number | null;
  onClick: () => void;
}

// Color mapping for job types
const typeColors = {
  "Full-time": "bg-indigo-500 text-white border-0 shadow-sm",
  "Part-time": "bg-purple-500 text-white border-0 shadow-sm",
  "Remote": "bg-green-500 text-white border-0 shadow-sm",
  "Freelance": "bg-orange-500 text-white border-0 shadow-sm",
  "Contract": "bg-indigo-500 text-white border-0 shadow-sm",
  "Internship": "bg-pink-500 text-white border-0 shadow-sm",
  "Hybrid": "bg-teal-500 text-white border-0 shadow-sm",
};

// Color mapping for categories
const categoryColors = {
  "Technology": "bg-indigo-50 text-indigo-700 border-0",
  "Design": "bg-pink-50 text-pink-700 border-0",
  "Marketing": "bg-purple-50 text-purple-700 border-0",
  "Business": "bg-cyan-50 text-cyan-700 border-0",
  "Finance": "bg-emerald-50 text-emerald-700 border-0",
  "Healthcare": "bg-red-50 text-red-700 border-0",
  "Education": "bg-blue-50 text-blue-700 border-0",
  "Other": "bg-gray-50 text-gray-700 border-0",
};

// Color mapping for levels
const levelColors = {
  "Entry Level": "bg-green-50 text-green-700 border-0",
  "Mid Level": "bg-amber-50 text-amber-700 border-0",
  "Senior Level": "bg-red-50 text-red-700 border-0",
  "Executive": "bg-gray-50 text-gray-700 border-0",
};

export function JobCard({ job, matchScore, onClick }: JobCardProps) {
  const typeColor = typeColors[job.type as keyof typeof typeColors] || "bg-gray-500 text-white";
  const categoryColor = categoryColors[job.category as keyof typeof categoryColors] || "border-0 text-gray-700 bg-gray-50";
  const levelColor = levelColors[job.level as keyof typeof levelColors] || "border-0 text-gray-700 bg-gray-50";

  return (
    <Card
      className="group relative p-6 hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-white to-purple-50/30 overflow-hidden card-hover"
      onClick={onClick}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/3 via-purple-500/3 to-pink-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100"></div>

      {/* Bookmark Icon */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
        <button className="p-2 bg-white rounded-lg shadow-md hover:bg-indigo-50 hover:shadow-lg transition-all border-0">
          <Bookmark className="w-5 h-5 text-indigo-500" />
        </button>
      </div>
      
      <div className="relative flex gap-4">
        <div className="flex-shrink-0">
          <div className="relative w-16 h-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center overflow-hidden ring-2 ring-gray-100 group-hover:ring-indigo-300/50 transition-all duration-300 group-hover:scale-105 shadow-sm group-hover:shadow-md">
            <ImageWithFallback
              src={job.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&size=128&background=6366f1&color=ffffff&bold=true`}
              alt={job.company}
              className="w-full h-full object-cover"
            />
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/10 group-hover:to-purple-500/10 transition-all duration-300"></div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-gray-900 group-hover:text-indigo-600 transition-colors font-semibold text-lg">{job.title}</h3>
                <ArrowRight className="w-4 h-4 text-indigo-500 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1" />
              </div>
              <p className="text-gray-700 font-medium">{job.company}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-gray-700 mb-4" style={{ fontSize: '14px' }}>
            <div className="flex items-center gap-1.5 group/item hover:text-indigo-600 transition-colors">
              <div className="p-1.5 bg-indigo-50 rounded-lg group-hover/item:bg-indigo-100 transition-colors">
                <MapPin className="w-4 h-4 text-indigo-500" />
              </div>
              <span className="font-medium">{job.location}</span>
            </div>
            <div className="flex items-center gap-1.5 group/item hover:text-green-600 transition-colors">
              <div className="p-1.5 bg-green-50 rounded-lg group-hover/item:bg-green-100 transition-colors">
                <Wallet className="w-4 h-4 text-green-500" />
              </div>
              <span className="font-medium">{job.salary}</span>
            </div>
            <div className="flex items-center gap-1.5 group/item hover:text-amber-600 transition-colors">
              <div className="p-1.5 bg-amber-50 rounded-lg group-hover/item:bg-amber-100 transition-colors">
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <span className="font-medium">{job.posted}</span>
            </div>
          </div>

          <p className="text-gray-700 line-clamp-2 mb-4" style={{ fontSize: '14px', lineHeight: '1.6' }}>
            {job.description}
          </p>

          <div className="flex items-center gap-2 flex-wrap justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge 
                className={`${categoryColor} px-3 py-1.5 font-medium transition-all hover:scale-105`}
              >
                <Sparkles className="w-3 h-3 mr-1.5" />
                {job.category}
              </Badge>
              <Badge 
                className={`${levelColor} px-3 py-1.5 font-medium transition-all hover:scale-105`}
              >
                {job.level}
              </Badge>
              
              {/* NEW indicator for recent jobs */}
              {job.posted === "1 hari yang lalu" && (
                <Badge className="bg-red-500 text-white border-0 shadow-sm px-3 py-1.5 animate-pulse">
                  🔥 Baru
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Tipe pekerjaan */}
              <Badge 
                className={`${typeColor} shadow-md px-3 py-1 badge-gradient`}
              >
                {job.type}
              </Badge>
              {/* Persentase kecocokan di samping tipe pekerjaan */}
              {matchScore !== null && matchScore !== undefined && (
                <Badge 
                  className="bg-indigo-500 text-white border-0 shadow-md px-3 py-1.5 font-semibold"
                >
                  <Sparkles className="w-3 h-3 mr-1.5" />
                  {matchScore}%
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient line on hover */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
    </Card>
  );
}


















