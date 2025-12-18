import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Eye, UserCheck, UserX, Plus, Pencil, Trash2 } from "lucide-react";
import type { Profile } from "@/lib/types";
import { formatDateIndonesianShort } from "@/lib/utils/dateFormat";

async function getUsers(filter?: string) {
    const supabase = await createSupabaseServerClient();
    
    // First, check if current user is admin
    const {
        data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
        console.error("No authenticated user");
        return [];
    }

    // Get current user's profile to check role
    const { data: currentProfile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", currentUser.id)
        .single();

    if (profileError || !currentProfile) {
        console.error("Error fetching current profile:", profileError);
        return [];
    }

    const profile = currentProfile as { role: string };
    if (profile.role !== "admin") {
        console.error("User is not admin");
        return [];
    }

    // Build query based on filter
    let query = supabase.from("profiles").select("*");
    
    if (filter === "pending") {
        query = query.eq("role", "recruiter").eq("is_approved", false);
    }

    // Try to fetch all users
    // This will work if the RLS policy "Admin can read all profiles" exists
    // If it doesn't work, you need to run the SQL in supabase/admin_policies.sql
    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching users:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("Error hint:", error.hint);
        
        // If RLS policy error, provide helpful message
        if (error.code === "42501" || error.message?.includes("policy")) {
            console.error(
                "RLS Policy Error: Please run the SQL in supabase/admin_policies.sql to allow admin access"
            );
        }
        return [];
    }

    if (!data || data.length === 0) {
        return [];
    }

    // Get emails from auth.users using admin client
    const adminClient = createSupabaseAdminClient();
    const hasServiceRoleKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    // Log untuk debugging di production
    if (!hasServiceRoleKey) {
        console.warn("⚠️ SUPABASE_SERVICE_ROLE_KEY tidak ditemukan. Email akan diambil dari tabel profiles.");
    }
    
    const usersWithEmail = await Promise.all(
        (data as Profile[]).map(async (profile) => {
            let email: string | null = null;
            
            if (adminClient) {
                try {
                    // Get user email from auth.users using admin client
                    const { data: authUser, error: authError } = await adminClient.auth.admin.getUserById(profile.id);
                    if (!authError && authUser?.user) {
                        email = authUser.user.email || null;
                    } else if (authError) {
                        console.error(`Error fetching email for user ${profile.id}:`, authError.message);
                    }
                } catch (err: any) {
                    console.error(`Error fetching email for user ${profile.id}:`, err?.message || err);
                }
            } else {
                // Fallback: gunakan email dari profiles jika ada
                email = profile.email || null;
            }
            
            return {
                ...profile,
                email: email || profile.email || null,
            };
        })
    );
    
    return usersWithEmail as Profile[];
}

function getRoleBadgeColor(role: string): string {
    const colors: Record<string, string> = {
        admin: "bg-red-500 text-white border-0",
        recruiter: "bg-indigo-500 text-white border-0",
        jobseeker: "bg-blue-500 text-white border-0",
    };
    return colors[role.toLowerCase()] || "bg-gray-100 text-gray-700 border-0";
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

function getApprovalStatusColor(isApproved: boolean): string {
    return isApproved 
        ? "bg-green-100 text-green-700 border-0"
        : "bg-yellow-100 text-yellow-700 border-0";
}

export default async function UsersManagementPage({ 
    searchParams 
}: { 
    searchParams?: { filter?: string } 
}) {
    const filter = searchParams?.filter;
    const users = await getUsers(filter);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="text-3xl font-semibold text-blue-900">Manajemen Pengguna</h1>
                <p className="text-gray-500 mt-1">
                    Kelola dan pantau semua pengguna di platform
                </p>
                </div>
                <Button className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg transition-all" size="lg" asChild>
                    <Link href="/admin/users/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Pengguna
                    </Link>
                </Button>
            </div>

            <Card className="border-0 bg-gradient-to-br from-purple-100 to-blue-100/50 shadow-sm rounded-2xl p-6">
                <CardHeader>
                    <CardTitle>
                        {filter === "pending" ? "Recruiter Menunggu Persetujuan" : "Daftar Pengguna"}
                    </CardTitle>
                    <CardDescription>
                        {filter === "pending" 
                            ? `${users.length} recruiter menunggu persetujuan`
                            : `Total ${users.length} pengguna terdaftar`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {users.length > 0 ? (
                        <div className="border-0 rounded-lg overflow-hidden shadow-sm bg-white">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-400">
                                        <TableHead className="font-semibold text-center">Nama</TableHead>
                                        <TableHead className="font-semibold text-center">Email</TableHead>
                                        <TableHead className="font-semibold text-center">Role</TableHead>
                                        <TableHead className="font-semibold text-center">Lokasi</TableHead>
                                        <TableHead className="font-semibold text-center">Skills</TableHead>
                                        <TableHead className="font-semibold text-center">Status</TableHead>
                                        <TableHead className="font-semibold text-center">Tanggal Bergabung</TableHead>
                                        <TableHead className="font-semibold text-center">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.id} className="hover:bg-gray-50/50 bg-white">
                                        <TableCell className="font-medium text-center">
                                            {user.full_name || "Tidak ada nama"}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {user.email || "-"}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge className={getRoleBadgeColor(user.role)}>
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">{user.location_city || "-"}</TableCell>
                                        <TableCell className="text-center">
                                            {user.skills && user.skills.length > 0
                                                ? user.skills.slice(0, 3).join(", ")
                                                : "-"}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge className={getApprovalStatusColor(user.is_approved || false)}>
                                                {user.is_approved ? "Aktif" : "Tidak Aktif"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {formatDateIndonesianShort(user.created_at)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center gap-2">
                                                <Button variant="ghost" size="sm" asChild className="cursor-pointer h-7 w-7 p-0 hover:bg-blue-50 transition-all" title="Lihat Detail">
                                                    <Link href={`/admin/users/${user.id}`}>
                                                        <Eye className="h-4 w-4 text-blue-600" />
                                                    </Link>
                                                </Button>
                                                <Button variant="ghost" size="sm" asChild className="cursor-pointer h-7 w-7 p-0 hover:bg-green-50 transition-all" title="Edit Pengguna">
                                                    <Link href={`/admin/users/${user.id}/edit`}>
                                                        <Pencil className="h-4 w-4 text-green-600" />
                                                    </Link>
                                                </Button>
                                                <Button variant="ghost" size="sm" asChild className="cursor-pointer h-7 w-7 p-0 hover:bg-red-50 transition-all" title="Hapus Pengguna">
                                                    <Link href={`/admin/users/${user.id}/delete`}>
                                                        <Trash2 className="h-4 w-4 text-red-600" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-500">Belum ada pengguna terdaftar</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

