import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/job-seeker/ProfileForm";
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

export default async function ProfilePage() {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/");
    }

    const profile = await getUserProfile(user.id);

    return (
        <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
            {/* Header dengan gradient */}
            <div className="text-2xl sm:text-3xl font-bold text-purple-900">
                <div className="relative z-10">
                    <h1 className="text-2xl sm:text-3xl font-bold mb-2">Profil Saya</h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-2">
                        Kelola informasi profil Anda untuk meningkatkan peluang matching pekerjaan
                    </p>
                </div>
            </div>

            {/* Profile Form */}
            <ProfileForm initialData={profile} />
        </div>
    );
}

