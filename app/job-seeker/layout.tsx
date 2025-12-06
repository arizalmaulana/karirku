import { JobSeekerSidebar } from "@/components/job-seeker/sidebar";

interface JobSeekerLayoutProps {
    children: React.ReactNode;
}

export default function JobSeekerLayout({ children }: JobSeekerLayoutProps) {
    return (
        <div className="flex min-h-screen bg-gray-50/50">
            <JobSeekerSidebar />
            <main className="flex-1 p-3 sm:p-4 lg:p-5 lg:ml-64">
                {children}
            </main>
        </div>
    );
}

