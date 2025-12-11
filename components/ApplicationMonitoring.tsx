"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Briefcase, Calendar, Building2, Loader2 } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  tanggalLamaran: string;
  status: "Terkirim" | "Diproses" | "Diterima" | "Ditolak";
}

const statusColors: Record<Application["status"], string> = {
  Terkirim: "bg-gray-500",
  Diproses: "bg-blue-500",
  Diterima: "bg-green-500",
  Ditolak: "bg-red-500",
};

const statusLabels: Record<string, Application["status"]> = {
  submitted: "Terkirim",
  review: "Diproses",
  accepted: "Diterima",
  rejected: "Ditolak",
};

export function ApplicationMonitoring() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const supabase = useMemo(() => createBrowserClient(), []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchApplications = async () => {
      try {
        // Fetch from database
        const { data: dbApplications, error } = await supabase
          .from("applications")
          .select(`
            id,
            status,
            submitted_at,
            job_listings!inner (
              title,
              company_name
            )
          `)
          .eq("job_seeker_id", user.id)
          .order("submitted_at", { ascending: false });

        if (error) {
          console.error("Error fetching applications:", error);
          // Fallback to localStorage
          const localApps = JSON.parse(localStorage.getItem("applications") || "[]");
          setApplications(
            localApps.map((app: any) => ({
              id: app.id || `local-${Date.now()}`,
              jobTitle: app.jobTitle || app.job_listings?.title || "Unknown",
              company: app.company || app.job_listings?.company_name || "Unknown",
              tanggalLamaran: app.tanggalLamaran || app.submitted_at || new Date().toISOString(),
              status: statusLabels[app.status] || "Terkirim",
            }))
          );
          setLoading(false);
          return;
        }

        // Transform database data
        const transformed = (dbApplications || []).map((app: any) => ({
          id: app.id,
          jobTitle: app.job_listings?.title || "Unknown",
          company: app.job_listings?.company_name || "Unknown",
          tanggalLamaran: app.submitted_at,
          status: statusLabels[app.status] || "Terkirim",
        }));

        // Also check localStorage for any local applications
        const localApps = JSON.parse(localStorage.getItem("applications") || "[]");
        const localTransformed = localApps.map((app: any) => ({
          id: app.id || `local-${Date.now()}-${Math.random()}`,
          jobTitle: app.jobTitle || "Unknown",
          company: app.company || "Unknown",
          tanggalLamaran: app.tanggalLamaran || new Date().toISOString(),
          status: statusLabels[app.status] || "Terkirim",
        }));

        setApplications([...transformed, ...localTransformed]);
      } catch (err) {
        console.error("Error:", err);
        // Fallback to localStorage
        const localApps = JSON.parse(localStorage.getItem("applications") || "[]");
        setApplications(
          localApps.map((app: any) => ({
            id: app.id || `local-${Date.now()}`,
            jobTitle: app.jobTitle || "Unknown",
            company: app.company || "Unknown",
            tanggalLamaran: app.tanggalLamaran || new Date().toISOString(),
            status: statusLabels[app.status] || "Terkirim",
          }))
        );
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel("applications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "applications",
          filter: `job_seeker_id=eq.${user.id}`,
        },
        () => {
          fetchApplications();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, supabase]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monitoring Lamaran</CardTitle>
          <CardDescription>Daftar lamaran pekerjaan yang telah dikirim</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monitoring Lamaran</CardTitle>
        <CardDescription>Daftar lamaran pekerjaan yang telah dikirim</CardDescription>
      </CardHeader>
      <CardContent>
        {applications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>Belum ada lamaran yang dikirim</p>
            <p className="text-sm mt-2">Mulai kirim lamaran untuk melihat statusnya di sini</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <div
                key={application.id}
                className="rounded-xl border p-4 hover:border-blue-500 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <p className="font-semibold text-gray-900">{application.company}</p>
                    </div>
                    <p className="text-gray-700 mb-3">{application.jobTitle}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(application.tanggalLamaran)}</span>
                      </div>
                    </div>
                  </div>
                  <Badge
                    className={`${statusColors[application.status]} text-white`}
                  >
                    {application.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}













