import { CompaniesPageClient } from "./CompaniesPageClient";
import { fetchCompaniesFromDatabase } from "@/lib/utils/companyData";
import { fetchJobsFromDatabase } from "@/lib/utils/jobData";

export async function CompaniesPage() {
  const companies = await fetchCompaniesFromDatabase();
  const jobs = await fetchJobsFromDatabase();

  return <CompaniesPageClient companies={companies} jobs={jobs} />;
}

// Keep both named and default exports to support existing imports
export default CompaniesPage;