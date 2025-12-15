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
              <DialogTitle className="text-2xl mb-2">{job.title}</DialogTitle>
              <DialogDescription className="text-lg text-gray-700">
                {job.company}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-5 h-5" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Briefcase className="w-5 h-5" />
              <span>{job.type}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <DollarSign className="w-5 h-5" />
              <span>{job.salary}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-5 h-5" />
              <span>Diposting {job.posted}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Badge variant="outline">{job.category}</Badge>
            <Badge variant="outline">{job.level}</Badge>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Deskripsi Pekerjaan</h3>
            <p className="text-gray-700 leading-relaxed">{job.description}</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Persyaratan</h3>
            <ul className="space-y-2">
              {job.requirements.map((requirement, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-700">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{requirement}</span>
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
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      Rata-rata Sewa
                    </p>
                    <p className="font-medium mt-1">
                      {formatCurrency(livingCost.avg_rent)}
                    </p>
                  </div>
                )}
                {livingCost.avg_food && (
                  <div>
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <Utensils className="h-4 w-4" />
                      Rata-rata Makan
                    </p>
                    <p className="font-medium mt-1">
                      {formatCurrency(livingCost.avg_food)}
                    </p>
                  </div>
                )}
                {livingCost.avg_transport && (
                  <div>
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      Rata-rata Transport
                    </p>
                    <p className="font-medium mt-1">
                      {formatCurrency(livingCost.avg_transport)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <Button
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-md"
              size="lg"
              onClick={handleApply}
            >
              Lamar Sekarang
            </Button>
            <Button variant="outline" size="lg" onClick={onClose}>
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

