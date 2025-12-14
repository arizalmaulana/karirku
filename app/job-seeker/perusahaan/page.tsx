import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CompaniesPageClient } from "@/components/job-seeker/companiesPageClient";
import { fetchCompaniesFromDatabase } from "@/lib/utils/companyData";

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

export default async function PerusahaanPage() {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/");
    }

    const [profile, companies] = await Promise.all([
        getUserProfile(user.id),
        fetchCompaniesFromDatabase(),
    ]);

    return (
        <CompaniesPageClient
            companies={companies}
            profile={profile}
            userId={user.id}
        />
    );
}

