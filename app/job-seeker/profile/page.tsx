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
        <div className="space-y-6">
            {/* Header dengan gradient */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 p-8 text-white shadow-lg">
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-2">Profil Saya</h1>
                    <p className="text-purple-100">
                        Kelola informasi profil Anda untuk meningkatkan peluang matching pekerjaan
                    </p>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
            </div>

            {/* Profile Form */}
            <ProfileForm initialData={profile} />
        </div>
    );
}

