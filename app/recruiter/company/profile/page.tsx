import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CompanyProfileForm } from "@/components/recruiter/CompanyProfileForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import type { Company } from "@/lib/types";

async function getCompanyProfile(recruiterId: string): Promise<Company | null> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("recruiter_id", recruiterId)
        .single();

    if (error) {
        // Jika tidak ada data, return null (bukan error)
        if (error.code === 'PGRST116') {
            return null;
        }
        console.error("Error fetching company:", error);
        return null;
    }

    return data as Company;
}

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

export default async function CompanyProfilePage() {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/");
    }

    const profile = await getUserProfile(user.id);
    if (!profile || (profile as any).role !== "recruiter") {
        redirect("/");
    }

    const company = await getCompanyProfile(user.id);

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
                        <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Profile Perusahaan
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Lengkapi informasi perusahaan yang Anda wakili
                        </p>
                    </div>
                </div>
            </div>

            {!company && (
                <Card className="border-0 bg-yellow-50">
                    <CardHeader>
                        <CardTitle className="text-yellow-900">Belum Ada Profile Perusahaan</CardTitle>
                        <CardDescription className="text-yellow-700">
                            Anda belum memiliki profile perusahaan. Silakan lengkapi form di bawah untuk membuat profile perusahaan baru.
                        </CardDescription>
                    </CardHeader>
                </Card>
            )}

            <CompanyProfileForm initialData={company} />
        </div>
    );
}

