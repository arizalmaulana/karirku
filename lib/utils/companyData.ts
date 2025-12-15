import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Company } from "@/lib/types";

/**
 * Generate logo URL berdasarkan company name
 */
function getCompanyLogo(companyName: string): string {
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
 * Tentukan industry berdasarkan company name atau jobs
 */
function determineIndustry(companyName: string, jobs: any[]): string {
  const name = companyName.toLowerCase();

  // Cek dari nama perusahaan
  if (name.includes("tech") || name.includes("software") || name.includes("app") || name.includes("cloud")) {
    return "Technology";
  }

  if (name.includes("creative") || name.includes("design") || name.includes("brand")) {
    return "Design & Creative";
  }

  if (name.includes("marketing") || name.includes("growth") || name.includes("influencer")) {
    return "Marketing";
  }

  if (name.includes("e-commerce") || name.includes("ecommerce")) {
    return "E-Commerce";
  }

  if (name.includes("fintech") || name.includes("finance")) {
    return "Finance";
  }

  // Cek dari kategori jobs jika ada
  if (jobs.length > 0) {
    const categories = jobs.map((j) => j.category || "Technology");
    const mostCommon = categories.reduce((a, b, _, arr) =>
      arr.filter((v) => v === a).length >= arr.filter((v) => v === b).length ? a : b
    );
    return mostCommon;
  }

  return "Technology"; // Default
}

/**
 * Tentukan size berdasarkan jumlah jobs
 */
function determineSize(openPositions: number): string {
  if (openPositions >= 20) {
    return "1000+";
  } else if (openPositions >= 15) {
    return "500-1000";
  } else if (openPositions >= 10) {
    return "250-500";
  } else if (openPositions >= 5) {
    return "100-250";
  } else if (openPositions >= 3) {
    return "50-100";
  } else {
    return "20-50";
  }
}

/**
 * Generate description berdasarkan company name dan jobs
 */
function generateDescription(companyName: string, jobs: any[]): string {
  const name = companyName.toLowerCase();

  if (name.includes("tech")) {
    return "Perusahaan teknologi terkemuka yang fokus pada pengembangan solusi software enterprise dan cloud computing untuk berbagai industri.";
  }

  if (name.includes("creative") || name.includes("design")) {
    return "Agensi kreatif yang mengkhususkan diri dalam branding, UI/UX design, dan digital marketing untuk klien lokal dan internasional.";
  }

  if (name.includes("marketing")) {
    return "Agensi digital marketing full-service yang membantu brand berkembang melalui strategi marketing yang data-driven dan inovatif.";
  }

  if (name.includes("startup")) {
    return "Startup SaaS yang berkembang pesat, membangun platform collaboration tools untuk tim modern dengan fokus pada produktivitas.";
  }

  if (name.includes("e-commerce")) {
    return "Platform e-commerce terbesar di Indonesia dengan jutaan pengguna aktif, menyediakan berbagai produk dan layanan marketplace.";
  }

  if (name.includes("app")) {
    return "Software house yang mengkhususkan diri dalam pengembangan mobile applications dan custom software solutions untuk berbagai industri.";
  }

  if (name.includes("cloud")) {
    return "Perusahaan cloud infrastructure dan DevOps solutions yang membantu bisnis melakukan digital transformation dan cloud migration.";
  }

  if (name.includes("fintech") || name.includes("finance")) {
    return "Startup fintech yang menghadirkan solusi pembayaran digital dan financial services yang inovatif untuk transformasi ekonomi digital.";
  }

  return `${companyName} adalah perusahaan yang menawarkan berbagai peluang karir menarik di berbagai bidang.`;
}

/**
 * Fetch companies dari database
 * Mengambil dari tabel companies jika ada, jika tidak aggregate dari job_listings
 */
export async function fetchCompaniesFromDatabase(): Promise<Company[]> {
  const supabase = await createSupabaseServerClient();
  
  // Coba ambil dari tabel companies dulu (exclude blocked companies)
  const { data: companiesData, error: companiesError } = await supabase
    .from("companies")
    .select("*")
    .neq("is_blocked", true) // Exclude blocked companies
    .order("name", { ascending: true });

  // Jika tabel companies ada dan berisi data, gunakan data tersebut
  if (!companiesError && companiesData && companiesData.length > 0) {
    // Ambil jumlah job listings per company
    const { data: jobsData } = await supabase
      .from("job_listings")
      .select("company_name")
      .order("created_at", { ascending: false });

    // Hitung jumlah job per company
    const jobCounts = new Map<string, number>();
    if (jobsData) {
      jobsData.forEach((job: any) => {
        const count = jobCounts.get(job.company_name) || 0;
        jobCounts.set(job.company_name, count + 1);
      });
    }

    // Convert ke format Company dengan computed fields
    const companies: Company[] = companiesData.map((company: any) => {
      const openPositions = jobCounts.get(company.name) || 0;
      const location = company.location_province
        ? `${company.location_city || ''}, ${company.location_province}`
        : company.location_city || '';

      return {
        id: company.id,
        name: company.name,
        logo_url: company.logo_url,
        industry: company.industry || determineIndustry(company.name, []),
        location_city: company.location_city,
        location_province: company.location_province,
        address: company.address || null,
        description: company.description || generateDescription(company.name, []),
        website_url: company.website_url,
        size: company.size || determineSize(openPositions),
        recruiter_id: company.recruiter_id || null,
        license_url: company.license_url || null,
        is_approved: company.is_approved || null,
        status: company.status || null,
        is_blocked: company.is_blocked || null,
        blocked_reason: company.blocked_reason || null,
        created_at: company.created_at,
        updated_at: company.updated_at,
        // Computed fields
        logo: company.logo_url || getCompanyLogo(company.name),
        location: location,
        openPositions: openPositions,
      };
    });

    return companies.sort((a, b) => (b.openPositions || 0) - (a.openPositions || 0));
  }

  // Fallback: Aggregate dari job_listings jika tabel companies belum ada atau kosong
  // First, get blocked company names
  const { data: blockedCompaniesData } = await supabase
    .from("companies")
    .select("name")
    .eq("is_blocked", true);

  const blockedCompanyNames = new Set(
    (blockedCompaniesData || []).map((c: { name: string }) => c.name)
  );

  const { data: jobsData, error: jobsError } = await supabase
    .from("job_listings")
    .select("id, company_name, location_city, location_province, employment_type, title, description")
    .eq("is_closed", false)
    .order("created_at", { ascending: false });

  if (jobsError) {
    console.error("Error fetching companies from job_listings:", jobsError);
    return [];
  }

  if (!jobsData || jobsData.length === 0) {
    return [];
  }

  // Filter out jobs from blocked companies
  const validJobs = jobsData.filter((job: any) => 
    !blockedCompanyNames.has(job.company_name)
  );

  // Group by company_name
  const companyMap = new Map<string, any>();

  validJobs.forEach((job: any) => {
    const companyName = job.company_name;
    if (!companyMap.has(companyName)) {
      companyMap.set(companyName, {
        company_name: companyName,
        location: job.location_province
          ? `${job.location_city}, ${job.location_province}`
          : job.location_city,
        jobs: [],
      });
    }
    companyMap.get(companyName).jobs.push(job);
  });

  // Convert to Company format
  const companies: Company[] = Array.from(companyMap.entries()).map(([companyName, data], index) => {
    const openPositions = data.jobs.length;
    const location = data.location;

    return {
      id: `company-${index + 1}-${companyName.toLowerCase().replace(/\s+/g, '-')}`,
      name: companyName,
      logo_url: null,
      industry: determineIndustry(companyName, data.jobs),
      location_city: data.location.split(',')[0]?.trim() || null,
      location_province: data.location.includes(',') ? data.location.split(',')[1]?.trim() || null : null,
      address: null,
      description: generateDescription(companyName, data.jobs),
      website_url: null,
      size: determineSize(openPositions),
      recruiter_id: null,
      license_url: null,
      is_approved: null,
      status: null,
      is_blocked: null,
      blocked_reason: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Computed fields
      logo: getCompanyLogo(companyName),
      location: location,
      openPositions: openPositions,
    };
  });

  // Sort by openPositions (descending)
  return companies.sort((a, b) => (b.openPositions || 0) - (a.openPositions || 0));
}

