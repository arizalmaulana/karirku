import { createSupabaseServerClient } from "@/lib/supabase/server";
import { JobSearch } from "@/components/job-seeker/JobSearch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";

async function getUserProfile(userId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

    if (error || !data) {
        return null;
    }
    return data;
}

async function getAllJobs() {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("job_listings")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching jobs:", error);
        return [];
    }
    return data || [];
}

async function getLivingCosts() {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("living_costs")
        .select("*")
        .order("city", { ascending: true });

    if (error) {
        console.error("Error fetching living costs:", error);
        return [];
    }
    return data || [];
}

export default async function JobsPage() {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/");
    }

    const profile = await getUserProfile(user.id);
    const [allJobs, livingCosts] = await Promise.all([
        getAllJobs(),
        getLivingCosts(),
    ]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div>
                <h1 className="text-3xl font-semibold text-gray-900">Cari Lowongan</h1>
                <p className="text-gray-500 mt-1">
                    Temukan pekerjaan yang sesuai dengan skill dan preferensi Anda
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Rekomendasi Pekerjaan</CardTitle>
                    <CardDescription>
                        {profile
                            ? "Hasil pencocokan otomatis berdasarkan skill Anda"
                            : "Lengkapi profil untuk mendapatkan rekomendasi yang lebih akurat"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <JobSearch
                        jobs={allJobs}
                        profile={profile}
                        livingCosts={livingCosts}
                    />
                </CardContent>
            </Card>
        </div>
    );
}

