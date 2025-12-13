import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, UserCheck, UserX, Mail, Phone, MapPin, Briefcase, GraduationCap, Pencil, Trash2 } from "lucide-react";
import { notFound } from "next/navigation";
import { UserManagementForm } from "@/components/admin/UserManagementForm";
import { CompanyLicenseViewer } from "@/components/admin/CompanyLicenseViewer";

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
    return data as any;
}

function getRoleBadgeVariant(role: string) {
    switch (role) {
        case "admin":
            return "default";
        case "recruiter":
            return "secondary";
        case "jobseeker":
            return "outline";
        default:
            return "outline";
    }
}

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await getUser(id);

    if (!user) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/admin/users">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Kembali
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-semibold text-gray-900">Detail Pengguna</h1>
                    <p className="text-gray-500 mt-1">
                        {user.full_name || "Tidak ada nama"}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role}
                    </Badge>
                    <Button variant="outline" asChild>
                        <Link href={`/admin/users/${user.id}/edit`}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                        </Link>
                    </Button>
                    <Button variant="destructive" asChild>
                        <Link href={`/admin/users/${user.id}/delete`}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Hapus
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Pribadi</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-500">Nama Lengkap</p>
                                <p className="font-medium">{user.full_name || "Tidak ada nama"}</p>
                            </div>
                            {user.headline && (
                                <div>
                                    <p className="text-sm text-gray-500">Headline</p>
                                    <p className="font-medium">{user.headline}</p>
                                </div>
                            )}
                            {user.email && (
                                <div>
                                    <p className="text-sm text-gray-500 flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        Email
                                    </p>
                                    <p className="font-medium">{user.email}</p>
                                </div>
                            )}
                            {user.phone && (
                                <div>
                                    <p className="text-sm text-gray-500 flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        Telepon
                                    </p>
                                    <p className="font-medium">{user.phone}</p>
                                </div>
                            )}
                            {user.location_city && (
                                <div>
                                    <p className="text-sm text-gray-500 flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        Lokasi
                                    </p>
                                    <p className="font-medium">{user.location_city}</p>
                                </div>
                            )}
                            {user.bio && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Bio</p>
                                    <p className="text-sm whitespace-pre-wrap">{user.bio}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {user.skills && user.skills.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Skills</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {user.skills.map((skill: string, index: number) => (
                                        <Badge key={index} variant="outline">{skill}</Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {user.education && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5" />
                                    Pendidikan
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm whitespace-pre-wrap">{user.education}</p>
                                {user.major && (
                                    <p className="text-sm text-gray-600 mt-2">
                                        <strong>Jurusan:</strong> {user.major}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {user.experience && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Briefcase className="h-5 w-5" />
                                    Pengalaman
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm whitespace-pre-wrap">{user.experience}</p>
                            </CardContent>
                        </Card>
                    )}

                    {user.role === "recruiter" && user.company_license_url && (
                        <CompanyLicenseViewer 
                            licenseUrl={user.company_license_url} 
                            userId={user.id}
                        />
                    )}
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Akun</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-500">Role</p>
                                <Badge variant={getRoleBadgeVariant(user.role)} className="mt-1">
                                    {user.role}
                                </Badge>
                            </div>
                            {user.role === "recruiter" && (
                                <div>
                                    <p className="text-sm text-gray-500">Status Approval</p>
                                    <Badge variant={user.is_approved ? "default" : "secondary"} className="mt-1">
                                        {user.is_approved ? (
                                            <>
                                                <UserCheck className="mr-1 h-3 w-3" />
                                                Approved
                                            </>
                                        ) : (
                                            <>
                                                <UserX className="mr-1 h-3 w-3" />
                                                Pending
                                            </>
                                        )}
                                    </Badge>
                                </div>
                            )}
                            <div>
                                <p className="text-sm text-gray-500">Tanggal Bergabung</p>
                                <p className="font-medium">
                                    {new Date(user.created_at).toLocaleDateString("id-ID", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Kelola Pengguna</CardTitle>
                            <CardDescription>
                                Update role atau status approval
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <UserManagementForm user={user} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

