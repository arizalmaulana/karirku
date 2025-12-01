import { RecruiterSidebar } from "@/components/recruiter/sidebar";

interface RecruiterLayoutProps {
    children: React.ReactNode;
}

export default function RecruiterLayout({ children }: RecruiterLayoutProps) {
    return (
        <div className="flex min-h-screen bg-gray-50/50">
            <RecruiterSidebar />
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
                {children}
            </main>
        </div>
    );
}

