'use client';

import { CheckCircle2, Clock, XCircle, FileSearch, Hourglass } from "lucide-react";
import { cn } from "@/components/ui/utils";
import type { ApplicationStatus } from "@/lib/types";

interface TimelineEvent {
    status: ApplicationStatus;
    label: string;
    description: string;
    icon: React.ReactNode;
    date?: string;
}

interface ApplicationTimelineProps {
    currentStatus: ApplicationStatus;
    submittedAt: string;
    updatedAt?: string;
}

const statusTimeline: TimelineEvent[] = [
    {
        status: "submitted",
        label: "Dikirim",
        description: "Lamaran Anda telah dikirim",
        icon: <CheckCircle2 className="h-5 w-5" />,
    },
    {
        status: "review",
        label: "Dalam Review",
        description: "Lamaran sedang ditinjau oleh recruiter",
        icon: <FileSearch className="h-5 w-5" />,
    },
    {
        status: "interview",
        label: "Interview",
        description: "Anda diundang untuk interview",
        icon: <Clock className="h-5 w-5" />,
    },
    {
        status: "accepted",
        label: "Diterima",
        description: "Selamat! Lamaran Anda diterima",
        icon: <CheckCircle2 className="h-5 w-5" />,
    },
    {
        status: "rejected",
        label: "Ditolak",
        description: "Lamaran Anda ditolak",
        icon: <XCircle className="h-5 w-5" />,
    },
];

function getStatusIndex(status: ApplicationStatus): number {
    const index = statusTimeline.findIndex(s => s.status === status);
    return index >= 0 ? index : 0;
}

function isStatusCompleted(currentStatus: ApplicationStatus, checkStatus: ApplicationStatus): boolean {
    const currentIndex = getStatusIndex(currentStatus);
    const checkIndex = getStatusIndex(checkStatus);
    return checkIndex <= currentIndex;
}

function isStatusActive(currentStatus: ApplicationStatus, checkStatus: ApplicationStatus): boolean {
    return currentStatus === checkStatus;
}

export function ApplicationTimeline({ 
    currentStatus, 
    submittedAt, 
    updatedAt 
}: ApplicationTimelineProps) {
    const currentIndex = getStatusIndex(currentStatus);
    const isRejected = currentStatus === "rejected";

    return (
        <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />

            <div className="space-y-6">
                {statusTimeline.map((event, index) => {
                    const isCompleted = isStatusCompleted(currentStatus, event.status);
                    const isActive = isStatusActive(currentStatus, event.status);
                    const isPast = index < currentIndex;
                    // Show event jika:
                    // 1. Status saat ini
                    // 2. Status yang sudah dilalui (past)
                    // 3. Status submitted (selalu tampilkan)
                    // 4. Status rejected jika current status adalah rejected
                    const showEvent = 
                        event.status === currentStatus || 
                        isPast || 
                        event.status === "submitted" ||
                        (isRejected && event.status === "rejected");

                    if (!showEvent) return null;

                    return (
                        <div key={event.status} className="relative flex items-start gap-4">
                            {/* Icon */}
                            <div
                                className={cn(
                                    "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                                    isCompleted && !isRejected
                                        ? "bg-green-500 border-green-500 text-white"
                                        : isActive
                                        ? "bg-purple-500 border-purple-500 text-white"
                                        : isRejected && event.status === "rejected"
                                        ? "bg-red-500 border-red-500 text-white"
                                        : "bg-white border-gray-300 text-gray-400"
                                )}
                            >
                                {event.icon}
                            </div>

                            {/* Content */}
                            <div className="flex-1 pt-1">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p
                                            className={cn(
                                                "font-semibold",
                                                isCompleted || isActive
                                                    ? "text-gray-900"
                                                    : "text-gray-400"
                                            )}
                                        >
                                            {event.label}
                                        </p>
                                        <p
                                            className={cn(
                                                "text-sm mt-1",
                                                isCompleted || isActive
                                                    ? "text-gray-600"
                                                    : "text-gray-400"
                                            )}
                                        >
                                            {event.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Date */}
                                {isActive && (
                                    <p className="text-xs text-gray-500 mt-2">
                                        {event.status === "submitted"
                                            ? `Dikirim: ${new Date(submittedAt).toLocaleDateString("id-ID", {
                                                  year: "numeric",
                                                  month: "long",
                                                  day: "numeric",
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                              })}`
                                            : updatedAt
                                            ? `Diupdate: ${new Date(updatedAt).toLocaleDateString("id-ID", {
                                                  year: "numeric",
                                                  month: "long",
                                                  day: "numeric",
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                              })}`
                                            : null}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

