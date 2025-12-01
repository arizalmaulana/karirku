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
            <div>
                <h1 className="text-3xl font-semibold text-gray-900">Profil Saya</h1>
                <p className="text-gray-500 mt-1">
                    Kelola informasi profil Anda untuk meningkatkan peluang matching pekerjaan
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Informasi Profil</CardTitle>
                    <CardDescription>
                        Lengkapi profil Anda untuk mendapatkan rekomendasi pekerjaan yang lebih akurat
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ProfileForm initialData={profile} />
                </CardContent>
            </Card>
        </div>
    );
}

