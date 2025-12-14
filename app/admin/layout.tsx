import { AdminSidebar } from "@/components/admin/sidebar";

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    return (
        <div className="flex min-h-screen bg-gray-50/50">
            <AdminSidebar />
            <main className="flex-1 p-3 sm:p-4 lg:p-5 lg:ml-64">
                {children}
            </main>
        </div>
    );
}