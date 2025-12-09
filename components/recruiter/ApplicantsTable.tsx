'use client';

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import Link from "next/link";
import { Search, Eye, FileText } from "lucide-react";

interface ApplicantsTableProps {
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
        draft: "Draft",
        submitted: "Dikirim",
        review: "Dalam Review",
        interview: "Interview",
        accepted: "Diterima",
        rejected: "Ditolak",
    };
    return labels[status] || status;
}

// Extract phone and email from cover_letter JSON or profiles
function extractApplicationData(application: any) {
    let phone = "-";
    let email = "-";

    // First, try to get from profiles
    if (application.profiles?.phone) {
        phone = application.profiles.phone;
    }
    if (application.profiles?.email) {
        email = application.profiles.email;
    }

    // If not in profiles, try to extract from cover_letter JSON
    if (application.cover_letter && (phone === "-" || email === "-")) {
        try {
            const coverLetterData = JSON.parse(application.cover_letter);
            if (phone === "-" && coverLetterData.nomorTelepon) {
                phone = coverLetterData.nomorTelepon;
            }
            if (email === "-" && coverLetterData.email) {
                email = coverLetterData.email;
            }
        } catch (e) {
            // If not JSON, might be plain text
            // Try to extract email from plain text
            if (email === "-") {
                const emailMatch = application.cover_letter.match(/[\w\.-]+@[\w\.-]+\.\w+/);
                if (emailMatch) {
                    email = emailMatch[0];
                }
            }
        }
    }

    return { phone, email };
}

export function ApplicantsTable({
    applications,
    jobs,
    initialJobFilter,
    initialStatusFilter,
}: ApplicantsTableProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [jobFilter, setJobFilter] = useState(initialJobFilter && initialJobFilter !== "" ? initialJobFilter : "all");
    const [statusFilter, setStatusFilter] = useState(initialStatusFilter && initialStatusFilter !== "" ? initialStatusFilter : "all");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("newest");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const filteredApplications = useMemo(() => {
        let result = applications;

        // Filter by job
        if (jobFilter && jobFilter !== "all") {
            result = result.filter((app) => app.job_id === jobFilter);
        }

        // Filter by status
        if (statusFilter && statusFilter !== "all") {
            result = result.filter((app) => app.status === statusFilter);
        }

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter((app) => {
                const name = app.profiles?.full_name?.toLowerCase() || "";
                const jobTitle = app.job_listings?.title?.toLowerCase() || "";
                const company = app.job_listings?.company_name?.toLowerCase() || "";
                const { email } = extractApplicationData(app);
                const emailLower = email.toLowerCase();

                return (
                    name.includes(query) ||
                    jobTitle.includes(query) ||
                    company.includes(query) ||
                    emailLower.includes(query)
                );
            });
        }

        // Sort
        result = [...result].sort((a, b) => {
            if (sortBy === "newest") {
                return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
            } else if (sortBy === "oldest") {
                return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
            } else if (sortBy === "name-asc") {
                const nameA = a.profiles?.full_name || "";
                const nameB = b.profiles?.full_name || "";
                return nameA.localeCompare(nameB);
            } else if (sortBy === "name-desc") {
                const nameA = a.profiles?.full_name || "";
                const nameB = b.profiles?.full_name || "";
                return nameB.localeCompare(nameA);
            }
            return 0;
        });

        return result;
    }, [applications, jobFilter, statusFilter, searchQuery, sortBy]);

    // Pagination
    const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedApplications = filteredApplications.slice(startIndex, endIndex);

    const handleFilterChange = (type: 'job' | 'status', value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        
        if (type === 'job') {
            setJobFilter(value);
            if (value && value !== "all") {
                params.set('job', value);
            } else {
                params.delete('job');
            }
        } else {
            setStatusFilter(value);
            if (value && value !== "all") {
                params.set('status', value);
            } else {
                params.delete('status');
            }
        }

        setCurrentPage(1); // Reset to first page when filter changes
        router.push(`/recruiter/applications?${params.toString()}`);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Generate page numbers for pagination
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) {
                    pages.push(i);
                }
                pages.push('ellipsis');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('ellipsis');
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push(1);
                pages.push('ellipsis');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i);
                }
                pages.push('ellipsis');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    return (
        <div className="space-y-6 ">
            {/* Header Section */}
            <div className="space-y-4 border border-purple-200 bg-gradient-to-br from-pink-50 to-pink-100/50 shadow-sm rounded-2xl p-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Daftar Pelamar di Perusahaan Anda</h2>
                    <p className="text-sm text-blue-600 mt-1">Active Members</p>
                </div>

                {/* Search and Sort Bar */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 whitespace-nowrap">Sort by:</span>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">Newest</SelectItem>
                                <SelectItem value="oldest">Oldest</SelectItem>
                                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Filters */}
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Filter Lowongan</label>
                        <Select value={jobFilter} onValueChange={(value) => handleFilterChange('job', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Semua Lowongan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Lowongan</SelectItem>
                                {jobs.map((job) => (
                                    <SelectItem key={job.id} value={job.id}>
                                        {job.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Filter Status</label>
                        <Select value={statusFilter} onValueChange={(value) => handleFilterChange('status', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Semua Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="submitted">Dikirim</SelectItem>
                                <SelectItem value="review">Dalam Review</SelectItem>
                                <SelectItem value="interview">Interview</SelectItem>
                                <SelectItem value="accepted">Diterima</SelectItem>
                                <SelectItem value="rejected">Ditolak</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50">
                            <TableHead className="font-semibold">Name</TableHead>
                            <TableHead className="font-semibold">Nama Lowongan</TableHead>
                            <TableHead className="font-semibold">Phone Number</TableHead>
                            <TableHead className="font-semibold">Email</TableHead>
                            <TableHead className="font-semibold">CV</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedApplications.length > 0 ? (
                            paginatedApplications.map((app: any) => {
                                const { phone, email } = extractApplicationData(app);
                                return (
                                    <TableRow key={app.id} className="hover:bg-gray-50">
                                        <TableCell className="font-medium">
                                            {app.profiles?.full_name || "Unknown"}
                                        </TableCell>
                                        <TableCell>
                                            {app.job_listings?.title || "Unknown"}
                                        </TableCell>
                                        <TableCell>{phone}</TableCell>
                                        <TableCell>{email}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                {app.cv_url && (
                                                    <Button
                                                        size="sm"
                                                        asChild
                                                        className="bg-blue-500 hover:bg-blue-600 text-white border-0"
                                                    >
                                                        <a
                                                            href={app.cv_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <FileText className="h-3 w-3 mr-1" />
                                                            Lihat
                                                        </a>
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    asChild
                                                    className="bg-green-500 hover:bg-green-600 text-white border-0"
                                                >
                                                    <Link href={`/recruiter/applications/${app.id}`}>
                                                        <Eye className="h-3 w-3 mr-1" />
                                                        Detail
                                                    </Link>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12">
                                    <p className="text-gray-500">
                                        {searchQuery || jobFilter || statusFilter
                                            ? "Tidak ada pelamar yang sesuai dengan filter"
                                            : "Belum ada pelamar"}
                                    </p>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {filteredApplications.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-gray-600">
                        Showing data {startIndex + 1} to {Math.min(endIndex, filteredApplications.length)} of{" "}
                        {filteredApplications.length} entries
                    </p>
                    {totalPages > 1 && (
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    {currentPage > 1 ? (
                                        <PaginationPrevious
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handlePageChange(currentPage - 1);
                                            }}
                                            className="cursor-pointer"
                                        />
                                    ) : (
                                        <span className="pointer-events-none opacity-50">
                                            <PaginationPrevious href="#" />
                                        </span>
                                    )}
                                </PaginationItem>
                                {getPageNumbers().map((page, index) => (
                                    <PaginationItem key={index}>
                                        {page === 'ellipsis' ? (
                                            <PaginationEllipsis />
                                        ) : (
                                            <PaginationLink
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handlePageChange(page as number);
                                                }}
                                                isActive={currentPage === page}
                                                className="cursor-pointer"
                                            >
                                                {page}
                                            </PaginationLink>
                                        )}
                                    </PaginationItem>
                                ))}
                                <PaginationItem>
                                    {currentPage < totalPages ? (
                                        <PaginationNext
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handlePageChange(currentPage + 1);
                                            }}
                                            className="cursor-pointer"
                                        />
                                    ) : (
                                        <span className="pointer-events-none opacity-50">
                                            <PaginationNext href="#" />
                                        </span>
                                    )}
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    )}
                </div>
            )}
        </div>
    );
}

