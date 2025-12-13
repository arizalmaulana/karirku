import { HomePageClient } from "@/components/HomePageClient";
import { fetchJobsFromDatabase, fetchStats } from "@/lib/utils/jobData";

export default async function HomePage() {
  // Fetch data dari database
  const jobs = await fetchJobsFromDatabase();
  const stats = await fetchStats();

  return <HomePageClient initialJobs={jobs} stats={stats} />;
}