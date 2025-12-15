'use client';

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { Eye, Filter } from "lucide-react";

interface ApplicationsListProps {
    applications: any[];
    jobs: any[];
    initialJobFilter?: string;
    initialStatusFilter?: string;
}

function getStatusBadgeVariant(status: string) {
    switch (status) {
        case "accepted":
            return "default";
        case "rejected":
            return "destructive";
        case "interview":
            return "secondary";
        case "review":
            return "outline";
        default:
            return "outline";
    }
}

function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
        submitted: "Dikirim",
        review: "Dalam Review",
        interview: "Interview",
        accepted: "Diterima",
        rejected: "Ditolak",
    };
    return labels[status] || status;
}

export function ApplicationsList({
    applications,
    jobs,
    initialJobFilter,
    initialStatusFilter,
}: ApplicationsListProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [jobFilter, setJobFilter] = useState(initialJobFilter || "");
    const [statusFilter, setStatusFilter] = useState(initialStatusFilter || "");

    const filteredApplications = useMemo(() => {
        let result = applications;

        if (jobFilter) {
            result = result.filter((app) => app.job_id === jobFilter);
        }

        if (statusFilter) {
            result = result.filter((app) => app.status === statusFilter);
        }

        return result;
    }, [applications, jobFilter, statusFilter]);

    const handleFilterChange = (type: 'job' | 'status', value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        
        if (type === 'job') {
            setJobFilter(value);
            if (value) {
                params.set('job', value);
            } else {
                params.delete('job');
            }
        } else {
            setStatusFilter(value);
            if (value) {
                params.set('status', value);
            } else {
                params.delete('status');
            }
        }

        router.push(`/recruiter/applications?${params.toString()}`);
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Filter Lowongan
                    </label>
                    <Select value={jobFilter} onValueChange={(value) => handleFilterChange('job', value)}>
                        <SelectTrigger className="bg-gray-200">
                            <SelectValue placeholder="Semua Lowongan" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-200">
                            <SelectItem value="" className="bg-gray-200 hover:bg-gray-300">Semua Lowongan</SelectItem>
                            {jobs.map((job) => (
                                <SelectItem key={job.id} value={job.id} className="bg-gray-200 hover:bg-gray-300">
                                    {job.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Filter Status</label>
                    <Select value={statusFilter} onValueChange={(value) => handleFilterChange('status', value)}>
                        <SelectTrigger className="bg-gray-200">
                            <SelectValue placeholder="Semua Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-200">
                            <SelectItem value="" className="bg-gray-200 hover:bg-gray-300">Semua Status</SelectItem>
                            <SelectItem value="submitted" className="bg-gray-200 hover:bg-gray-300">Dikirim</SelectItem>
                            <SelectItem value="review" className="bg-gray-200 hover:bg-gray-300">Dalam Review</SelectItem>
                            <SelectItem value="interview" className="bg-gray-200 hover:bg-gray-300">Interview</SelectItem>
                            <SelectItem value="accepted" className="bg-gray-200 hover:bg-gray-300">Diterima</SelectItem>
                            <SelectItem value="rejected" className="bg-gray-200 hover:bg-gray-300">Ditolak</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Results */}
            <div className="space-y-4">
                <p className="text-sm text-gray-500">
                    Menampilkan {filteredApplications.length} dari {applications.length} lamaran
                </p>

                {filteredApplications.length > 0 ? (
                    filteredApplications.map((app: any) => (
                        <div
                            key={app.id}
                            className="rounded-xl border p-6 hover:border-blue-500 transition"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {app.profiles?.full_name || "Unknown"}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {app.job_listings?.title || "Unknown"}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {app.job_listings?.company_name || "Unknown"}
                                    </p>
                                </div>
                                <Badge variant={getStatusBadgeVariant(app.status)}>
                                    {getStatusLabel(app.status)}
                                </Badge>
                            </div>

                            {app.profiles?.skills && app.profiles.skills.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {app.profiles.skills.slice(0, 5).map((skill: string, index: number) => (
                                        <Badge key={index} variant="secondary">
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            <div className="mt-4 flex items-center justify-between">
                                <p className="text-sm text-gray-500">
                                    Dikirim pada{" "}
                                    {new Date(app.submitted_at).toLocaleDateString("id-ID", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </p>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/recruiter/applications/${app.id}`}>
                                        <Eye className="h-4 w-4 mr-2" />
                                        Lihat Detail
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-500 mb-4">
                            Tidak ada lamaran yang sesuai dengan filter
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setJobFilter("");
                                setStatusFilter("");
                                router.push("/recruiter/applications");
                            }}
                        >
                            Reset Filter
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

