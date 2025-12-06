"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { MapPin, Briefcase, Clock, DollarSign, CheckCircle2 } from "lucide-react";
import type { Job } from "../types/job";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useAuth } from "@/lib/auth-context";
import { LoginDialog } from "./LoginDialog";
import { ApplicationForm } from "./ApplicationForm";

interface JobDetailProps {
    job: Job;
  open: boolean;
  onClose: () => void;
}

export function JobDetail({ job, open, onClose }: JobDetailProps) {
  const { user, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);

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

          <div className="flex gap-3 pt-4 border-t">
            <Button
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
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
          // You might want to handle register dialog here
        }}
        // Setelah login dari flow "Lamar Sekarang", arahkan ke halaman lowongan dengan jobId
        redirectTo={`/job-seeker/jobs?jobId=${job.id}`}
        message="Anda harus login untuk melamar pekerjaan."
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
        />
      )}
    </Dialog>
  );
}

