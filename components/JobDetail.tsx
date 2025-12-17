"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { MapPin, Briefcase, Clock, DollarSign, CheckCircle2, Home, Utensils, Car } from "lucide-react";
import type { Job } from "../types/job";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useAuth } from "@/lib/auth-context";
import { LoginDialog } from "./LoginDialog";
import { RegisterDialog } from "./RegisterDialog";
import { ApplicationForm } from "./ApplicationForm";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Profile, LivingCost } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

interface JobDetailProps {
    job: Job;
  open: boolean;
  onClose: () => void;
}

function formatCurrency(amount: number | null): string {
  if (!amount) return "Tidak disebutkan";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

// Color mapping for categories
const categoryColors: Record<string, string> = {
  "Technology": "bg-indigo-50 text-indigo-700 border border-indigo-200",
  "Design": "bg-pink-50 text-pink-700 border border-pink-200",
  "Marketing": "bg-purple-50 text-purple-700 border border-purple-200",
  "Business": "bg-cyan-50 text-cyan-700 border border-cyan-200",
  "Finance": "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "Healthcare": "bg-red-50 text-red-700 border border-red-200",
  "Education": "bg-blue-50 text-blue-700 border border-blue-200",
  "Other": "bg-gray-50 text-gray-700 border border-gray-200",
};

// Color mapping for levels
const levelColors: Record<string, string> = {
  "Entry Level": "bg-green-50 text-green-700 border border-green-200",
  "Mid Level": "bg-amber-50 text-amber-700 border border-amber-200",
  "Senior Level": "bg-red-50 text-red-700 border border-red-200",
  "Executive": "bg-gray-50 text-gray-700 border border-gray-200",
};

function getCategoryColor(category: string): string {
  return categoryColors[category] || "bg-gray-50 text-gray-700 border border-gray-200";
}

function getLevelColor(level: string): string {
  return levelColors[level] || "bg-gray-50 text-gray-700 border border-gray-200";
}

export function JobDetail({ job, open, onClose }: JobDetailProps) {
  const { user, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [livingCost, setLivingCost] = useState<LivingCost | null>(null);
  const supabase = createBrowserClient();

  // Fetch profile when user is available
  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (!error && data) {
          setProfile(data as Profile);
        }
      };
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [user, supabase]);

  // Fetch living cost based on job location_city
  useEffect(() => {
    if (open && job.location) {
      const fetchLivingCost = async () => {
        // Extract city from location (format: "City, Province" or just "City")
        const cityName = job.location.split(",")[0].trim();
        
        if (!cityName) return;

        // Try exact match first
        let { data, error } = await supabase
          .from("living_costs")
          .select("*")
          .eq("city", cityName)
          .maybeSingle();

        // If not found, try case-insensitive match
        if (error || !data) {
          const { data: data2, error: error2 } = await supabase
            .from("living_costs")
            .select("*")
            .ilike("city", cityName)
            .maybeSingle();
          
          if (!error2 && data2) {
            data = data2;
            error = null;
          }
        }

        // If still not found, try partial match
        if (error || !data) {
          const { data: data3, error: error3 } = await supabase
            .from("living_costs")
            .select("*")
            .ilike("city", `%${cityName}%`)
            .maybeSingle();
          
          if (!error3 && data3) {
            data = data3;
          }
        }

        if (!error && data) {
          setLivingCost(data as LivingCost);
        } else {
          setLivingCost(null);
        }
      };
      
      fetchLivingCost();
    } else {
      setLivingCost(null);
    }
  }, [open, job.location, supabase]);

  const handleApply = () => {
    if (loading) return;
    
    if (!user) {
      setShowLogin(true);
      return;
    }
    
    setShowApplicationForm(true);
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4 mb-4">
            <ImageWithFallback
              src={job.logo}
              alt={job.company}
              className="w-20 h-20 rounded-lg object-cover border"
            />
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2 text-gray-900">{job.title}</DialogTitle>
              <DialogDescription className="text-lg text-gray-800 font-medium">
                {job.company}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-gray-800">
              <MapPin className="w-5 h-5 text-indigo-600" />
              <span className="font-medium">{job.location}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-800">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              <span className="font-medium">{job.type}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-800">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="font-medium">{job.salary}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-800">
              <Clock className="w-5 h-5 text-amber-600" />
              <span className="font-medium">Diposting {job.posted}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Badge className={getCategoryColor(job.category)}>{job.category}</Badge>
            <Badge className={getLevelColor(job.level)}>{job.level}</Badge>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Deskripsi Pekerjaan</h3>
            <p className="text-gray-800 leading-relaxed text-base">{job.description}</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900">Persyaratan</h3>
            <ul className="space-y-2">
              {job.requirements.map((requirement, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-800">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-base">{requirement}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Biaya Hidup */}
          {livingCost && (
            <Card>
              <CardHeader>
                <CardTitle>Biaya Hidup di {livingCost.city}</CardTitle>
                <CardDescription>
                  Estimasi biaya hidup per bulan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {livingCost.avg_rent && (
                  <div>
                    <p className="text-sm text-gray-700 font-medium flex items-center gap-2">
                      <Home className="h-4 w-4 text-indigo-600" />
                      Rata-rata Sewa
                    </p>
                    <p className="font-semibold mt-1 text-gray-900 text-lg">
                      {formatCurrency(livingCost.avg_rent)}
                    </p>
                  </div>
                )}
                {livingCost.avg_food && (
                  <div>
                    <p className="text-sm text-gray-700 font-medium flex items-center gap-2">
                      <Utensils className="h-4 w-4 text-indigo-600" />
                      Rata-rata Makan
                    </p>
                    <p className="font-semibold mt-1 text-gray-900 text-lg">
                      {formatCurrency(livingCost.avg_food)}
                    </p>
                  </div>
                )}
                {livingCost.avg_transport && (
                  <div>
                    <p className="text-sm text-gray-700 font-medium flex items-center gap-2">
                      <Car className="h-4 w-4 text-indigo-600" />
                      Rata-rata Transport
                    </p>
                    <p className="font-semibold mt-1 text-gray-900 text-lg">
                      {formatCurrency(livingCost.avg_transport)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <Button
              className="flex-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-md"
              size="lg"
              onClick={handleApply}
            >
              Lamar Sekarang
            </Button>
            <Button variant="outline" size="lg" onClick={onClose} className="border-gray-300/40 text-gray-700 hover:bg-gray-50 hover:border-indigo-300/50">
              Tutup
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Login Dialog */}
      <LoginDialog
        open={showLogin}
        onClose={() => setShowLogin(false)}
        onSwitchToRegister={() => {
          setShowLogin(false);
          setShowRegister(true);
        }}
        // Setelah login dari flow "Lamar Sekarang", arahkan ke halaman lowongan dengan jobId
        redirectTo={`/job-seeker/jobs?jobId=${job.id}`}
        message="Anda harus login untuk melamar pekerjaan."
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

      {/* Application Form */}
      {user && (
        <ApplicationForm
          job={job}
          open={showApplicationForm}
          onClose={() => setShowApplicationForm(false)}
          onSuccess={() => {
            setShowApplicationForm(false);
            onClose();
          }}
          profile={profile}
        />
      )}
    </Dialog>
  );
}

