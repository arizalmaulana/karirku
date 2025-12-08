"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Upload, FileText, Loader2, X } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Job } from "@/types/job";

interface ApplicationFormProps {
  job: Job;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  namaLengkap: string;
  email: string;
  nomorTelepon: string;
  domisili: string;
  pendidikanTerakhir: string;
  pengalamanKerja: string;
  skill: string;
  portfolio: string;
  cvFile: File | null;
  dokumenTambahan: File | null;
}

export function ApplicationForm({ job, open, onClose, onSuccess }: ApplicationFormProps) {
  const [formData, setFormData] = useState<FormData>({
    namaLengkap: "",
    email: "",
    nomorTelepon: "",
    domisili: "",
    pendidikanTerakhir: "",
    pengalamanKerja: "",
    skill: "",
    portfolio: "",
    cvFile: null,
    dokumenTambahan: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createBrowserClient();

  const handleFileChange = (field: "cvFile" | "dokumenTambahan", file: File | null) => {
    if (!file) {
      setFormData((prev) => ({ ...prev, [field]: null }));
      return;
    }

    // Validate CV file (PDF, max 5MB)
    if (field === "cvFile") {
      if (file.type !== "application/pdf") {
        toast.error("CV harus dalam format PDF");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran CV maksimal 5MB");
        return;
      }
    }

    // Validate additional document (PDF/JPG)
    if (field === "dokumenTambahan") {
      const validTypes = ["application/pdf", "image/jpeg", "image/jpg"];
      if (!validTypes.includes(file.type)) {
        toast.error("Dokumen tambahan harus PDF atau JPG");
        return;
      }
    }

    setFormData((prev) => ({ ...prev, [field]: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.cvFile) {
      toast.error("CV wajib diupload");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Anda harus login untuk melamar");
        return;
      }

      // Upload CV file
      let cvUrl: string | null = null;
      try {
        const cvFileName = `cv_${user.id}_${Date.now()}.pdf`;
        const { data: cvData, error: cvError } = await supabase.storage
          .from("applications")
          .upload(cvFileName, formData.cvFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (cvError) {
          console.warn("Storage error, saving to localStorage:", cvError);
          // If storage fails, we'll store file info in localStorage as fallback
          const fileData = await formData.cvFile.text();
          localStorage.setItem(`cv_${user.id}_${Date.now()}`, fileData);
          cvUrl = `local:cv_${user.id}_${Date.now()}.pdf`;
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from("applications")
            .getPublicUrl(cvFileName);
          cvUrl = publicUrl;
        }
      } catch (storageError) {
        console.warn("Storage not available, using localStorage:", storageError);
        cvUrl = `local:cv_${user.id}_${Date.now()}.pdf`;
      }

      // Upload additional document if exists
      let docUrl: string | null = null;
      if (formData.dokumenTambahan) {
        try {
          const docExt = formData.dokumenTambahan.type === "application/pdf" ? "pdf" : "jpg";
          const docFileName = `doc_${user.id}_${Date.now()}.${docExt}`;
          const { data: docData, error: docError } = await supabase.storage
            .from("applications")
            .upload(docFileName, formData.dokumenTambahan);

          if (!docError) {
            const { data: { publicUrl } } = supabase.storage
              .from("applications")
              .getPublicUrl(docFileName);
            docUrl = publicUrl;
          } else {
            console.warn("Additional doc upload error:", docError);
            docUrl = `local:doc_${user.id}_${Date.now()}.${docExt}`;
          }
        } catch (storageError) {
          console.warn("Storage not available for additional doc:", storageError);
          docUrl = `local:doc_${user.id}_${Date.now()}`;
        }
      }

      // Try to find job in database by title and company
      let jobListingId: string | null = null;
      
      // First, try to find by job.id if it's a valid UUID
      if (job.id) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(job.id)) {
          const { data: verifyJob } = await supabase
            .from("job_listings")
            .select("id")
            .eq("id", job.id)
            .maybeSingle();
          
          if (verifyJob) {
            jobListingId = verifyJob.id;
          }
        }
      }

      // If not found by ID, try to find by title and company
      if (!jobListingId) {
        const { data: jobListing, error: jobSearchError } = await supabase
          .from("job_listings")
          .select("id")
          .eq("title", job.title)
          .eq("company_name", job.company)
          .limit(1)
          .maybeSingle();

        if (jobListing) {
          jobListingId = jobListing.id;
        } else if (jobSearchError) {
          console.warn("Error searching for job listing:", jobSearchError);
        }
      }

      // If still not found, create a new job listing in database
      if (!jobListingId) {
        console.log("Job not found, creating new job listing...");
        
        // Parse location
        const locationParts = job.location.split(",");
        const locationCity = locationParts[0]?.trim() || job.location;
        const locationProvince = locationParts[1]?.trim() || null;

        // Parse employment type
        const employmentTypeMap: Record<string, string> = {
          "Full Time": "fulltime",
          "Part Time": "parttime",
          "Contract": "contract",
          "Internship": "internship",
          "Remote": "remote",
          "Hybrid": "hybrid",
        };
        const employmentType = employmentTypeMap[job.type] || "fulltime";

        // Create job listing
        const { data: newJobListing, error: createError } = await supabase
          .from("job_listings")
          .insert({
            title: job.title,
            company_name: job.company,
            location_city: locationCity,
            location_province: locationProvince,
            employment_type: employmentType as any,
            description: job.description,
            requirements: job.requirements || [],
            skills_required: job.requirements || [],
          })
          .select("id")
          .single();

        if (createError) {
          console.error("Error creating job listing:", createError);
          // Fallback: save to localStorage only
          toast.warning("Job tidak ditemukan di database. Lamaran disimpan secara lokal.");
          const applications = JSON.parse(localStorage.getItem("applications") || "[]");
          applications.push({
            id: `local-${Date.now()}-${Math.random()}`,
            jobTitle: job.title,
            company: job.company,
            job_id: null,
            job_seeker_id: user.id,
            status: "submitted",
            cv_url: cvUrl,
            portfolio_url: formData.portfolio || null,
            cover_letter: JSON.stringify({
              namaLengkap: formData.namaLengkap,
              email: formData.email,
              nomorTelepon: formData.nomorTelepon,
              domisili: formData.domisili,
              pendidikanTerakhir: formData.pendidikanTerakhir,
              pengalamanKerja: formData.pengalamanKerja,
              skill: formData.skill,
              dokumenTambahan: docUrl,
            }),
            tanggalLamaran: new Date().toISOString(),
          });
          localStorage.setItem("applications", JSON.stringify(applications));
          toast.success("Lamaran berhasil disimpan secara lokal!");
          onClose();
          if (onSuccess) onSuccess();
          return;
        }

        if (newJobListing) {
          jobListingId = newJobListing.id;
          console.log("New job listing created:", jobListingId);
        }
      }

      // Prepare application data
      const applicationData = {
        job_id: jobListingId,
        job_seeker_id: user.id,
        status: "submitted",
        cv_url: cvUrl,
        portfolio_url: formData.portfolio || null,
        cover_letter: JSON.stringify({
          namaLengkap: formData.namaLengkap,
          email: formData.email,
          nomorTelepon: formData.nomorTelepon,
          domisili: formData.domisili,
          pendidikanTerakhir: formData.pendidikanTerakhir,
          pengalamanKerja: formData.pengalamanKerja,
          skill: formData.skill,
          dokumenTambahan: docUrl,
        }),
      };

      // Save application to database
      const { data: insertedData, error: insertError } = await supabase
        .from("applications")
        .insert(applicationData)
        .select()
        .single();

      // Always save to localStorage as backup
      const applications = JSON.parse(localStorage.getItem("applications") || "[]");
      applications.push({
        id: `local-${Date.now()}-${Math.random()}`,
        ...applicationData,
        jobTitle: job.title,
        company: job.company,
        tanggalLamaran: new Date().toISOString(),
      });
      localStorage.setItem("applications", JSON.stringify(applications));

      if (insertError) {
        console.error("Database insert error:", insertError);
        throw new Error(`Gagal menyimpan lamaran: ${insertError.message}`);
      }

      // Success - application saved
      console.log("Application saved successfully:", insertedData);
      toast.success("Lamaran berhasil dikirim!");
      
      // Dispatch custom event to notify other components
      if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("application-submitted", {
              detail: { 
                  jobId: jobListingId,
                  applicationId: insertedData?.id 
              }
          }));
      }

      setFormData({
        namaLengkap: "",
        email: "",
        nomorTelepon: "",
        domisili: "",
        pendidikanTerakhir: "",
        pengalamanKerja: "",
        skill: "",
        portfolio: "",
        cvFile: null,
        dokumenTambahan: null,
      });
      onClose();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast.error(error.message || "Gagal mengirim lamaran. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Form Lamaran Pekerjaan</DialogTitle>
          <DialogDescription>
            Lengkapi form berikut untuk melamar posisi {job.title} di {job.company}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nama Lengkap */}
          <div className="space-y-2">
            <Label htmlFor="namaLengkap">Nama Lengkap *</Label>
            <Input
              id="namaLengkap"
              value={formData.namaLengkap}
              onChange={(e) => setFormData({ ...formData, namaLengkap: e.target.value })}
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          {/* Nomor Telepon */}
          <div className="space-y-2">
            <Label htmlFor="nomorTelepon">Nomor Telepon *</Label>
            <Input
              id="nomorTelepon"
              type="tel"
              value={formData.nomorTelepon}
              onChange={(e) => setFormData({ ...formData, nomorTelepon: e.target.value })}
              required
            />
          </div>

          {/* Domisili */}
          <div className="space-y-2">
            <Label htmlFor="domisili">Domisili *</Label>
            <Input
              id="domisili"
              value={formData.domisili}
              onChange={(e) => setFormData({ ...formData, domisili: e.target.value })}
              required
            />
          </div>

          {/* Pendidikan Terakhir */}
          <div className="space-y-2">
            <Label htmlFor="pendidikanTerakhir">Pendidikan Terakhir *</Label>
            <Select
              value={formData.pendidikanTerakhir}
              onValueChange={(value) => setFormData({ ...formData, pendidikanTerakhir: value })}
              required
            >
              <SelectTrigger id="pendidikanTerakhir">
                <SelectValue placeholder="Pilih pendidikan terakhir" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SMA/SMK">SMA/SMK</SelectItem>
                <SelectItem value="D3">D3</SelectItem>
                <SelectItem value="S1">S1</SelectItem>
                <SelectItem value="S2">S2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pengalaman Kerja */}
          <div className="space-y-2">
            <Label htmlFor="pengalamanKerja">Pengalaman Kerja *</Label>
            <Textarea
              id="pengalamanKerja"
              value={formData.pengalamanKerja}
              onChange={(e) => setFormData({ ...formData, pengalamanKerja: e.target.value })}
              rows={4}
              required
            />
          </div>

          {/* Skill */}
          <div className="space-y-2">
            <Label htmlFor="skill">Skill *</Label>
            <Textarea
              id="skill"
              value={formData.skill}
              onChange={(e) => setFormData({ ...formData, skill: e.target.value })}
              rows={3}
              placeholder="Pisahkan setiap skill dengan koma"
              required
            />
          </div>

          {/* Portfolio */}
          <div className="space-y-2">
            <Label htmlFor="portfolio">Portfolio (Link) - Opsional</Label>
            <Input
              id="portfolio"
              type="url"
              value={formData.portfolio}
              onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
              placeholder="https://..."
            />
          </div>

          {/* Upload CV */}
          <div className="space-y-2">
            <Label htmlFor="cvFile">Upload CV (PDF, maks 5MB) *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="cvFile"
                type="file"
                accept=".pdf"
                onChange={(e) => handleFileChange("cvFile", e.target.files?.[0] || null)}
                className="hidden"
              />
              <label
                htmlFor="cvFile"
                className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-gray-50"
              >
                <Upload className="w-4 h-4" />
                {formData.cvFile ? formData.cvFile.name : "Pilih File CV"}
              </label>
              {formData.cvFile && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span>{(formData.cvFile.size / 1024 / 1024).toFixed(2)} MB</span>
                  <button
                    type="button"
                    onClick={() => handleFileChange("cvFile", null)}
                    className="text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Upload Dokumen Tambahan */}
          <div className="space-y-2">
            <Label htmlFor="dokumenTambahan">Upload Dokumen Tambahan (PDF/JPG) - Opsional</Label>
            <div className="flex items-center gap-2">
              <Input
                id="dokumenTambahan"
                type="file"
                accept=".pdf,.jpg,.jpeg"
                onChange={(e) => handleFileChange("dokumenTambahan", e.target.files?.[0] || null)}
                className="hidden"
              />
              <label
                htmlFor="dokumenTambahan"
                className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-gray-50"
              >
                <Upload className="w-4 h-4" />
                {formData.dokumenTambahan ? formData.dokumenTambahan.name : "Pilih File"}
              </label>
              {formData.dokumenTambahan && (
                <button
                  type="button"
                  onClick={() => handleFileChange("dokumenTambahan", null)}
                  className="text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Mengirim...
                </>
              ) : (
                "Kirim Lamaran"
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

