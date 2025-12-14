import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { MapPin, Clock, Wallet, Sparkles, Bookmark, ArrowRight } from "lucide-react";
import type { Job } from "../types/job";

interface JobCardProps {
  job: Job;
  onClick: () => void;
}

// Color mapping for job types
const typeColors = {
  "Full-time": "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0",
  "Part-time": "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0",
  "Remote": "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0",
  "Freelance": "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0",
};

// Color mapping for categories
const categoryColors = {
  "Technology": "bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 border-2 border-indigo-200",
  "Design": "bg-gradient-to-r from-pink-50 to-rose-50 text-pink-700 border-2 border-pink-200",
  "Marketing": "bg-gradient-to-r from-purple-50 to-violet-50 text-purple-700 border-2 border-purple-200",
  "Business": "bg-gradient-to-r from-cyan-50 to-teal-50 text-cyan-700 border-2 border-cyan-200",
};

// Color mapping for levels
const levelColors = {
  "Entry Level": "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-2 border-green-200",
  "Mid Level": "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border-2 border-amber-200",
  "Senior Level": "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-2 border-red-200",
};

export function JobCard({ job, onClick }: JobCardProps) {
  const typeColor = typeColors[job.type as keyof typeof typeColors] || "bg-gray-500 text-white";
  const categoryColor = categoryColors[job.category as keyof typeof categoryColors] || "border-gray-200 text-gray-700 bg-gray-50";
  const levelColor = levelColors[job.level as keyof typeof levelColors] || "border-gray-200 text-gray-700 bg-gray-50";

  return (
    <Card
      className="group relative p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-gray-200/60 hover:border-indigo-300 bg-white overflow-hidden card-hover"
      onClick={onClick}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100"></div>

      {/* Bookmark Icon */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <button className="p-2 bg-white rounded-lg shadow-md hover:bg-indigo-50 transition-colors">
          <Bookmark className="w-5 h-5 text-indigo-500" />
        </button>
      </div>
      
      <div className="relative flex gap-4">
        <div className="flex-shrink-0">
          <div className="relative w-16 h-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center overflow-hidden ring-2 ring-gray-100 group-hover:ring-indigo-300 transition-all duration-300 group-hover:scale-110">
            <img
              src={job.logo}
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
                <h3 className="text-gray-900 group-hover:text-indigo-600 transition-colors">{job.title}</h3>
                <ArrowRight className="w-4 h-4 text-indigo-500 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1" />
              </div>
              <p className="text-gray-600">{job.company}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-gray-600 mb-4" style={{ fontSize: '14px' }}>
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

          <p className="text-gray-600 line-clamp-2 mb-4" style={{ fontSize: '14px', lineHeight: '1.6' }}>
            {job.description}
          </p>

          <div className="flex items-center gap-2 flex-wrap justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge 
                className={`${categoryColor} shadow-sm px-3 py-1.5 font-medium transition-all hover:scale-105`}
              >
                <Sparkles className="w-3 h-3 mr-1.5" />
                {job.category}
              </Badge>
              <Badge 
                className={`${levelColor} shadow-sm px-3 py-1.5 font-medium transition-all hover:scale-105`}
              >
                {job.level}
              </Badge>
              
              {/* NEW indicator for recent jobs */}
              {job.posted === "1 hari yang lalu" && (
                <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 shadow-sm px-3 py-1.5 animate-pulse">
                  🔥 Baru
                </Badge>
              )}
            </div>
            {/* Tipe pekerjaan di kanan bawah */}
            <Badge 
              className={`${typeColor} shadow-md px-3 py-1 badge-gradient`}
            >
              {job.type}
            </Badge>
          </div>
        </div>
      </div>

      {/* Bottom gradient line on hover */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
    </Card>
  );
}


















