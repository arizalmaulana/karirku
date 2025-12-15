import { AboutPage } from "@/components/AboutPage";
import { fetchStats } from "@/lib/utils/jobData";

export default async function About() {
    const stats = await fetchStats();
    return <AboutPage stats={stats} />;
}
