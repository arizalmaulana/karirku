import { createSupabaseServerClient } from "@/lib/supabase/server";
import { UserEditForm } from "@/components/admin/UserEditForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getUser(id: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !data) {
        return null;
    }
    return data;
}

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await getUser(id);

    if (!user) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-semibold text-gray-900">Edit Pengguna</h1>
                <p className="text-gray-500 mt-1">
                    Perbarui informasi pengguna
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Informasi Pengguna</CardTitle>
                    <CardDescription>
                        Perbarui informasi yang diperlukan untuk pengguna
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <UserEditForm initialData={user} userId={id} />
                </CardContent>
            </Card>
        </div>
    );
}


