import { JobSeekerSidebar } from "@/components/job-seeker/sidebar";

interface JobSeekerLayoutProps {
    children: React.ReactNode;
}

export default function JobSeekerLayout({ children }: JobSeekerLayoutProps) {
    return (
        <div className="flex min-h-screen bg-gray-50/50">
            <JobSeekerSidebar />
            <main className="flex-1 w-full p-3 sm:p-4 lg:p-5 lg:ml-0 lg:pl-72">
                <div className="overflow-x-hidden">
                    {children}
                </div>
            </main>
        </div>
    );
}

