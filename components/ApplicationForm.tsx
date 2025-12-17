"use client";

import { useState, useEffect } from "react";
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
import type { Profile } from "@/lib/types";

interface ApplicationFormProps {
  job: Job;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  profile?: Profile | null;
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

export function ApplicationForm({ job, open, onClose, onSuccess, profile }: ApplicationFormProps) {
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
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  const supabase = createBrowserClient();

  // Auto-fill form from profile when modal opens
  useEffect(() => {
    if (open && profile && !isAutoFilled) {
      const autoFill = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        
        // Map education to dropdown values
        const mapEducation = (edu: string | null | undefined): string => {
          if (!edu) return "";
          const eduLower = edu.toLowerCase();
          if (eduLower.includes("sma") || eduLower.includes("smk")) return "SMA/SMK";
          if (eduLower.includes("d3") || eduLower.includes("diploma")) return "D3";
          if (eduLower.includes("s1") || eduLower.includes("sarjana") || eduLower.includes("strata 1")) return "S1";
          if (eduLower.includes("s2") || eduLower.includes("magister") || eduLower.includes("strata 2")) return "S2";
          // Default to S1 if major exists
          return profile.major ? "S1" : "";
        };

        setFormData(prev => ({
          ...prev,
          namaLengkap: profile.full_name || prev.namaLengkap,
          email: user?.email || prev.email,
          nomorTelepon: profile.phone || prev.nomorTelepon,
          domisili: profile.location_city || prev.domisili,
          pendidikanTerakhir: mapEducation(profile.education) || prev.pendidikanTerakhir,
          pengalamanKerja: profile.experience || prev.pengalamanKerja,
          skill: profile.skills ? profile.skills.join(", ") : prev.skill,
          // Portfolio tidak ada di Profile, biarkan user isi manual
          portfolio: prev.portfolio,
        }));
        setIsAutoFilled(true);
        toast.success("Form diisi otomatis dari profil Anda");
      };
      
      autoFill();
    }
  }, [open, profile, isAutoFilled, supabase]);

  // Reset auto-fill flag when modal closes
  useEffect(() => {
    if (!open) {
      setIsAutoFilled(false);
    }
  }, [open]);

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

      // Upload CV file to applications bucket
      let cvUrl: string | null = null;
      const cvFileName = `cv_${user.id}_${Date.now()}.pdf`;
      const { data: cvData, error: cvError } = await supabase.storage
        .from("applications")
        .upload(cvFileName, formData.cvFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (cvError) {
        console.error("Error uploading CV:", cvError);
        toast.error(`Gagal mengunggah CV: ${cvError.message}`);
        setIsSubmitting(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("applications")
        .getPublicUrl(cvFileName);
      cvUrl = publicUrl;

      // Upload additional document if exists to applications bucket
      let docUrl: string | null = null;
      if (formData.dokumenTambahan) {
        const docExt = formData.dokumenTambahan.type === "application/pdf" ? "pdf" : "jpg";
        const docFileName = `doc_${user.id}_${Date.now()}.${docExt}`;
        const { data: docData, error: docError } = await supabase.storage
          .from("applications")
          .upload(docFileName, formData.dokumenTambahan);

        if (docError) {
          console.warn("Additional doc upload error:", docError);
          // Continue without additional doc if upload fails
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from("applications")
            .getPublicUrl(docFileName);
          docUrl = publicUrl;
        }
      }

      // Try to find job in database by title and company
      let jobListingId: string | null = null;
      const jobListingResult = await supabase
        .from("job_listings")
        .select("id")
        .eq("title", job.title)
        .eq("company_name", job.company)
        .limit(1)
        .maybeSingle();

      if (!jobListingResult.error && jobListingResult.data) {
        jobListingId = (jobListingResult.data as { id: string }).id;
      }

      // Ensure we have a valid job_id
      const finalJobId = jobListingId || job.id;
      if (!finalJobId) {
        throw new Error("Job ID tidak ditemukan. Silakan coba lagi.");
      }

      // Prepare application data
      const applicationData = {
        job_id: finalJobId,
        job_seeker_id: user.id,
        status: "submitted" as const,
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
      const { error: insertError } = await supabase
        .from("applications")
        .insert([applicationData] as any);

      if (insertError) {
        console.error("Database insert error:", insertError);
        toast.error(`Gagal menyimpan lamaran: ${insertError.message}`);
        setIsSubmitting(false);
        return;
      }

      toast.success("Lamaran berhasil dikirim!");
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
            <Label htmlFor="namaLengkap">
              Nama Lengkap <span className="text-red-500">*</span>
            </Label>
            <Input
              id="namaLengkap"
              value={formData.namaLengkap}
              onChange={(e) => setFormData({ ...formData, namaLengkap: e.target.value })}
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
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
            <Label htmlFor="nomorTelepon">
              Nomor Telepon <span className="text-red-500">*</span>
            </Label>
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
            <Label htmlFor="domisili">
              Domisili <span className="text-red-500">*</span>
            </Label>
            <Input
              id="domisili"
              value={formData.domisili}
              onChange={(e) => setFormData({ ...formData, domisili: e.target.value })}
              required
            />
          </div>

          {/* Pendidikan Terakhir */}
          <div className="space-y-2">
            <Label htmlFor="pendidikanTerakhir">
              Pendidikan Terakhir <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.pendidikanTerakhir}
              onValueChange={(value) => setFormData({ ...formData, pendidikanTerakhir: value })}
              required
            >
              <SelectTrigger 
                id="pendidikanTerakhir"
                className="w-full h-10 border-0 hover:border-0 focus:ring-2 focus:ring-purple-500 focus:border-0 bg-gray-50 hover:bg-gray-100"
              >
                <SelectValue placeholder="Pilih pendidikan terakhir" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="SMA/SMK" className="cursor-pointer hover:bg-purple-50 focus:bg-purple-50">
                  SMA/SMK
                </SelectItem>
                <SelectItem value="D3" className="cursor-pointer hover:bg-purple-50 focus:bg-purple-50">
                  D3
                </SelectItem>
                <SelectItem value="S1" className="cursor-pointer hover:bg-purple-50 focus:bg-purple-50">
                  S1
                </SelectItem>
                <SelectItem value="S2" className="cursor-pointer hover:bg-purple-50 focus:bg-purple-50">
                  S2
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pengalaman Kerja */}
          <div className="space-y-2">
            <Label htmlFor="pengalamanKerja">
              Pengalaman Kerja <span className="text-red-500">*</span>
            </Label>
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
            <Label htmlFor="skill">
              Skill <span className="text-red-500">*</span>
            </Label>
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
            <Label htmlFor="cvFile">
              Upload CV (PDF, maks 5MB) <span className="text-red-500">*</span>
            </Label>
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

          {/* Buttons */}
          <div className="flex gap-3 pt-4 flex-col sm:flex-row">
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:shadow-lg transition-all"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Kirim Lamaran
                </>
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="hover:bg-gray-500 text-gray-700 border-0 bg-gray-400 shadow-sm transition-colors"
            >
              Batal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

