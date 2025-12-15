import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import type { JobListing } from "@/lib/types";
import type { Job } from "@/types/job";
import { extractEducationFromJob, extractExperienceFromJob } from "@/lib/utils/jobMatching";

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
 * Generate logo URL berdasarkan company name (fallback)
 * Menggunakan ui-avatars untuk generate logo otomatis
 */
function getCompanyLogo(companyName: string): string {
  // Generate consistent logo menggunakan ui-avatars dengan warna yang lebih menarik
  const colors = [
    '6366f1', // indigo
    '8b5cf6', // purple
    'ec4899', // pink
    'f59e0b', // amber
    '10b981', // emerald
    '3b82f6', // blue
  ];
  
  // Generate color index berdasarkan nama perusahaan (konsisten)
  let hash = 0;
  for (let i = 0; i < companyName.length; i++) {
    hash = companyName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % colors.length;
  const color = colors[colorIndex];

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&size=128&background=${color}&color=ffffff&bold=true&format=png`;
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
export function convertJobListingToJob(jobListing: JobListing, logoUrl?: string): Job {
  const location = jobListing.location_province
    ? `${jobListing.location_city}, ${jobListing.location_province}`
    : jobListing.location_city;

  // Use provided logoUrl, or fallback to getCompanyLogo
  const logo = logoUrl || getCompanyLogo(jobListing.company_name);

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
    logo: logo,
    category: determineCategory(jobListing),
    level: determineLevel(jobListing),
    // Preserve fields untuk match score calculation
    skills_required: jobListing.skills_required || null,
    major_required: jobListing.major_required || null,
    education_required: extractEducationFromJob(jobListing),
    experience_required: extractExperienceFromJob(jobListing),
  };
}

/**
 * Fetch semua jobs dari database dengan logo perusahaan
 * Filter out job listings dari perusahaan yang diblokir
 */
export async function fetchJobsFromDatabase(): Promise<Job[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("job_listings")
    .select("*")
    .eq("is_closed", false) // Hanya ambil lowongan yang belum ditutup
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching jobs:", error);
    return [];
  }

  if (!data) {
    return [];
  }

  // Fetch company data from companies table (integrate companies and job_listings)
  const companyNames = [...new Set(data.map((job: any) => job.company_name))];
  const { data: companiesData } = await supabase
    .from("companies")
    .select("name, logo_url, industry, location_city, location_province, website_url, description, is_blocked")
    .in("name", companyNames);

  // Create maps for company data and blocked companies
  const companyDataMap = new Map<string, any>();
  const blockedCompanies = new Set<string>();
  
  if (companiesData) {
    companiesData.forEach((company: any) => {
      // Track blocked companies
      if (company.is_blocked === true) {
        blockedCompanies.add(company.name);
      }
      
      companyDataMap.set(company.name, {
        logo_url: company.logo_url,
        industry: company.industry,
        location_city: company.location_city,
        location_province: company.location_province,
        website_url: company.website_url,
        description: company.description,
        is_blocked: company.is_blocked,
      });
    });
  }

  // Filter out jobs from blocked companies
  const filteredJobs = data.filter((job: any) => {
    // If company exists in companies table, check is_blocked
    const companyData = companyDataMap.get(job.company_name);
    if (companyData) {
      return companyData.is_blocked !== true;
    }
    // If company doesn't exist in companies table, include it (backward compatibility)
    return true;
  });

  return filteredJobs.map((jobListing: any) => {
    const companyData = companyDataMap.get(jobListing.company_name);
    
    // Use company data from companies table if available, otherwise use job_listings data
    const logoUrl = companyData?.logo_url || null;
    const locationCity = companyData?.location_city || jobListing.location_city;
    const locationProvince = companyData?.location_province || jobListing.location_province;
    
    // Create job listing with integrated company data
    const integratedJobListing: JobListing = {
      ...jobListing,
      location_city: locationCity,
      location_province: locationProvince,
    };
    
    return convertJobListingToJob(integratedJobListing, logoUrl || undefined);
  });
}

/**
 * Integrate company data from companies table with job listing
 */
export async function integrateCompanyData(jobListing: JobListing): Promise<JobListing> {
  const supabase = await createSupabaseServerClient();
  
  // Fetch company data from companies table
  const { data: companyData } = await supabase
    .from("companies")
    .select("logo_url, industry, location_city, location_province, website_url, description")
    .eq("name", jobListing.company_name)
    .maybeSingle();

  if (!companyData) {
    return jobListing;
  }

  // Integrate company data with job listing
  // Use company data if job listing doesn't have it, otherwise keep job listing data
  const company = companyData as any;
  return {
    ...jobListing,
    location_city: company?.location_city || jobListing.location_city,
    location_province: company?.location_province || jobListing.location_province,
  };
}

/**
 * Fetch stats untuk landing page
 * Exclude blocked companies from stats
 */
export async function fetchStats() {
  const supabase = await createSupabaseServerClient();

  // Fetch blocked company names
  const { data: blockedCompaniesData } = await supabase
    .from("companies")
    .select("name")
    .eq("is_blocked", true);

  const blockedCompanyNames = new Set(
    (blockedCompaniesData || []).map((c: { name: string }) => c.name)
  );

  // Fetch total jobs (exclude jobs from blocked companies)
  const { data: allJobs } = await supabase
    .from("job_listings")
    .select("id, company_name")
    .eq("is_closed", false);

  const validJobs = (allJobs || []).filter((job: any) => 
    !blockedCompanyNames.has(job.company_name)
  );

  // Fetch unique companies (exclude blocked)
  const { data: companiesData } = await supabase
    .from("companies")
    .select("name")
    .neq("is_blocked", true);

  const uniqueCompanies = new Set(
    (companiesData || []).map((c: { name: string }) => c.name)
  );

  // Try to use admin client for stats (bypasses RLS)
  const adminClient = createSupabaseAdminClient();
  const statsClient = adminClient || supabase;
  
  console.log("Using admin client:", !!adminClient, "Service role key available:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

  // Fetch total users (profiles) - only job seekers
  const { data: jobseekerProfiles, error: jobseekerError } = await statsClient
    .from("profiles")
    .select("id, role")
    .eq("role", "jobseeker");

  if (jobseekerError) {
    console.error("Error fetching jobseekers:", jobseekerError);
  }

  const totalUsers = jobseekerProfiles?.length || 0;
  const jobseekerIds = (jobseekerProfiles || []).map((p: any) => p.id);

  console.log("Jobseekers found:", totalUsers, "IDs:", jobseekerIds.length);

  // Fetch accepted applications count - only from jobseekers
  let acceptedCount = 0;
  if (jobseekerIds.length > 0) {
    const { data: acceptedApps, error: acceptedError } = await statsClient
      .from("applications")
      .select("id, status, job_seeker_id")
      .eq("status", "accepted")
      .in("job_seeker_id", jobseekerIds);
    
    if (acceptedError) {
      console.error("Error fetching accepted applications:", acceptedError);
    }
    
    acceptedCount = acceptedApps?.length || 0;
    console.log("Accepted applications found:", acceptedCount);
  } else {
    // Try to get all accepted apps and filter by jobseeker role
    const { data: allAcceptedApps, error: allAcceptedError } = await statsClient
      .from("applications")
      .select("id, status, job_seeker_id, profiles!inner(role)")
      .eq("status", "accepted")
      .eq("profiles.role", "jobseeker");
    
    if (allAcceptedError) {
      console.error("Error fetching all accepted applications:", allAcceptedError);
    } else {
      acceptedCount = allAcceptedApps?.length || 0;
      console.log("Accepted applications (via join):", acceptedCount);
    }
  }

  return {
    totalJobs: validJobs.length,
    totalCompanies: uniqueCompanies.size,
    totalUsers: totalUsers || 0,
    acceptedApplications: acceptedCount || 0,
  };
}

