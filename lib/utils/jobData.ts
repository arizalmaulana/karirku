import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { JobListing } from "@/lib/types";
import type { Job } from "@/types/job";

/**
 * Format employment type dari database ke format yang digunakan di UI
 */
function formatEmploymentType(type: string): string {
  const typeMap: Record<string, string> = {
    fulltime: "Full-time",
    parttime: "Part-time",
    contract: "Contract",
    internship: "Internship",
    remote: "Remote",
    hybrid: "Hybrid",
  };
  return typeMap[type] || type;
}

/**
 * Format salary dari min_salary dan max_salary
 */
function formatSalary(
  minSalary: number | null,
  maxSalary: number | null,
  currency: string | null = "IDR"
): string {
  if (!minSalary && !maxSalary) {
    return "Gaji tidak disebutkan";
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: currency || "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (minSalary && maxSalary) {
    return `${formatCurrency(minSalary)} - ${formatCurrency(maxSalary)}`;
  } else if (minSalary) {
    return `Mulai dari ${formatCurrency(minSalary)}`;
  } else if (maxSalary) {
    return `Hingga ${formatCurrency(maxSalary)}`;
  }

  return "Gaji tidak disebutkan";
}

/**
 * Format waktu relatif dari timestamp
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return "Hari ini";
  } else if (diffInDays === 1) {
    return "1 hari yang lalu";
  } else if (diffInDays < 7) {
    return `${diffInDays} hari yang lalu`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} minggu yang lalu`;
  } else if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return `${months} bulan yang lalu`;
  } else {
    const years = Math.floor(diffInDays / 365);
    return `${years} tahun yang lalu`;
  }
}

/**
 * Generate logo URL berdasarkan company name (placeholder)
 * Bisa diganti dengan logo dari database jika ada
 */
function getCompanyLogo(companyName: string): string {
  // Untuk sekarang menggunakan placeholder, bisa diganti dengan logo dari database
  const logoMap: Record<string, string> = {
    "TechCorp Indonesia": "https://images.unsplash.com/photo-1549924231-f129b911e442?w=100&h=100&fit=crop",
    "Creative Studio": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=100&h=100&fit=crop",
    "Growth Marketing Co": "https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=100&h=100&fit=crop",
    "Startup Innovate": "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop",
    "E-Commerce Giant": "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=100&h=100&fit=crop",
    "AppDev Solutions": "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=100&h=100&fit=crop",
    "Brand Creative Agency": "https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=100&h=100&fit=crop",
    "SaaS Company": "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=100&h=100&fit=crop",
    "Cloud Solutions Ltd": "https://images.unsplash.com/photo-1549924231-f129b911e442?w=100&h=100&fit=crop",
    "Influencer Marketing Hub": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=100&h=100&fit=crop",
    "Analytics Pro": "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop",
    "FinTech Innovators": "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=100&h=100&fit=crop",
  };

  return (
    logoMap[companyName] ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&size=100&background=random`
  );
}

/**
 * Tentukan category berdasarkan skills atau title (fallback jika tidak ada di database)
 */
function determineCategory(job: JobListing): string {
  // Jika sudah ada di database, gunakan itu
  if (job.category) {
    return job.category;
  }

  // Fallback: Cek dari skills_required terlebih dahulu
  const skills = job.skills_required || [];
  const title = job.title.toLowerCase();

  if (
    skills.some((s) =>
      ["react", "javascript", "typescript", "node", "python", "java", "backend", "frontend"].includes(
        s.toLowerCase()
      )
    ) ||
    title.includes("developer") ||
    title.includes("engineer") ||
    title.includes("programmer")
  ) {
    return "Technology";
  }

  if (
    skills.some((s) => ["figma", "design", "ui", "ux", "photoshop", "illustrator"].includes(s.toLowerCase())) ||
    title.includes("designer") ||
    title.includes("design")
  ) {
    return "Design";
  }

  if (
    skills.some((s) => ["marketing", "seo", "sem", "social media", "content"].includes(s.toLowerCase())) ||
    title.includes("marketing") ||
    title.includes("content")
  ) {
    return "Marketing";
  }

  if (
    title.includes("manager") ||
    title.includes("business") ||
    title.includes("product") ||
    title.includes("sales")
  ) {
    return "Business";
  }

  return "Technology"; // Default
}

/**
 * Tentukan level berdasarkan title atau requirements (fallback jika tidak ada di database)
 */
function determineLevel(job: JobListing): string {
  // Jika sudah ada di database, gunakan itu
  if (job.job_level) {
    return job.job_level;
  }

  // Fallback
  const title = job.title.toLowerCase();
  const requirements = job.requirements || [];

  if (
    title.includes("senior") ||
    title.includes("lead") ||
    title.includes("principal") ||
    requirements.some((r) => r.toLowerCase().includes("5+") || r.toLowerCase().includes("senior"))
  ) {
    return "Senior Level";
  }

  if (
    title.includes("junior") ||
    title.includes("entry") ||
    title.includes("fresh") ||
    requirements.some((r) => r.toLowerCase().includes("fresh graduate") || r.toLowerCase().includes("entry"))
  ) {
    return "Entry Level";
  }

  return "Mid Level"; // Default
}

/**
 * Convert JobListing dari database ke format Job untuk UI
 */
export function convertJobListingToJob(jobListing: JobListing): Job {
  const location = jobListing.location_province
    ? `${jobListing.location_city}, ${jobListing.location_province}`
    : jobListing.location_city;

  return {
    id: jobListing.id,
    title: jobListing.title,
    company: jobListing.company_name,
    location: location,
    type: formatEmploymentType(jobListing.employment_type),
    salary: formatSalary(jobListing.min_salary, jobListing.max_salary, jobListing.currency),
    description: jobListing.description || "",
    requirements: jobListing.requirements || [],
    posted: formatRelativeTime(jobListing.created_at),
    logo: getCompanyLogo(jobListing.company_name),
    category: determineCategory(jobListing),
    level: determineLevel(jobListing),
    // Preserve fields untuk match score calculation
    skills_required: jobListing.skills_required || null,
    major_required: jobListing.major_required || null,
  };
}

/**
 * Fetch semua jobs dari database
 */
export async function fetchJobsFromDatabase(): Promise<Job[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("job_listings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching jobs:", error);
    return [];
  }

  if (!data) {
    return [];
  }

  return data.map(convertJobListingToJob);
}

/**
 * Fetch stats untuk landing page
 */
export async function fetchStats() {
  const supabase = await createSupabaseServerClient();

  // Fetch total jobs
  const { count: totalJobs } = await supabase
    .from("job_listings")
    .select("*", { count: "exact", head: true });

  // Fetch unique companies
  const { data: companiesData } = await supabase
    .from("job_listings")
    .select("company_name");

  const uniqueCompanies = new Set(
    (companiesData || []).map((c: { company_name: string }) => c.company_name)
  );

  // Fetch total users (profiles)
  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  return {
    totalJobs: totalJobs || 0,
    totalCompanies: uniqueCompanies.size,
    totalUsers: totalUsers || 0,
  };
}

