import { createSupabaseServerClient } from "@/lib/supabase/server";
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
    
    return (data || []) as Profile[];
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
                <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg shadow-indigo-500/30" size="lg" asChild>
                    <Link href="/admin/users/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Pengguna
                    </Link>
                </Button>
            </div>

            <Card className="border border-purple-200 bg-gradient-to-br from-blue-100 to-pink-100/50 shadow-sm rounded-2xl p-6">
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
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Lokasi</TableHead>
                                    <TableHead>Skills</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Tanggal Bergabung</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">
                                            {user.full_name || "Tidak ada nama"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getRoleBadgeVariant(user.role)}>
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{user.location_city || "-"}</TableCell>
                                        <TableCell>
                                            {user.skills && user.skills.length > 0
                                                ? user.skills.slice(0, 3).join(", ")
                                                : "-"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.is_approved ? "default" : "secondary"}>
                                                {user.is_approved ? "Aktif" : "Tidak Aktif"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {formatDateIndonesianShort(user.created_at)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/admin/users/${user.id}`}>
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/admin/users/${user.id}/edit`}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button variant="ghost" size="sm" asChild>
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

