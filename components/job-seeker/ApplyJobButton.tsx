'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ApplicationFormEnhanced } from "@/components/job-seeker/ApplicationFormEnhanced";
import { useAuth } from "@/lib/auth-context";
import { LoginDialog } from "@/components/LoginDialog";
import { RegisterDialog } from "@/components/RegisterDialog";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { Send } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface ApplyJobButtonProps {
    jobId: string;
    jobTitle: string;
    existingApplication?: { id: string; status: string } | null;
}

export function ApplyJobButton({ jobId, jobTitle, existingApplication }: ApplyJobButtonProps) {
    const { user, loading } = useAuth();
    const [showApplicationForm, setShowApplicationForm] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [profile, setProfile] = useState<Profile | null>(null);
    const supabase = createBrowserClient();

    // Fetch profile when user is available
    useEffect(() => {
        if (user) {
            const fetchProfile = async () => {
                const { data, error } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", user.id)
                    .single();

                if (!error && data) {
                    setProfile(data as Profile);
                }
            };
            fetchProfile();
        } else {
            setProfile(null);
        }
    }, [user, supabase]);

    // Listen for application submitted event to close modal
    useEffect(() => {
        const handleApplicationSubmitted = (event: CustomEvent) => {
            if (event.detail?.jobId === jobId) {
                setShowApplicationForm(false);
            }
        };

        window.addEventListener('application-submitted', handleApplicationSubmitted as EventListener);
        return () => {
            window.removeEventListener('application-submitted', handleApplicationSubmitted as EventListener);
        };
    }, [jobId]);

    const handleApply = () => {
        if (loading) return;
        
        if (!user) {
            setShowLogin(true);
            return;
        }
        
        setShowApplicationForm(true);
    };

    if (existingApplication) {
        return (
            <div className="space-y-4">
                <p className="text-sm text-gray-500">
                    Anda sudah melamar untuk posisi ini
                </p>
                <Badge variant="outline" className="w-full justify-center py-2">
                    Status: {existingApplication.status}
                </Badge>
                <Button variant="outline" className="w-full" asChild>
                    <Link href="/job-seeker/applications">
                        Lihat Status Lamaran
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <>
            <Button 
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-md" 
                size="lg" 
                onClick={handleApply}
            >
                <Send className="mr-2 h-4 w-4" />
                Lamar Sekarang
            </Button>

            {/* Login Dialog */}
            <LoginDialog
                open={showLogin}
                onClose={() => setShowLogin(false)}
                onSwitchToRegister={() => {
                    setShowLogin(false);
                    setShowRegister(true);
                }}
                redirectTo={`/job-seeker/jobs/${jobId}`}
                message="Anda harus login untuk melamar pekerjaan."
            />

            {/* Register Dialog */}
            <RegisterDialog
                open={showRegister}
                onClose={() => setShowRegister(false)}
                onSwitchToLogin={() => {
                    setShowRegister(false);
                    setShowLogin(true);
                }}
            />

            {/* Application Form Modal */}
            {user && (
                <Dialog open={showApplicationForm} onOpenChange={setShowApplicationForm}>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Lamar Pekerjaan</DialogTitle>
                            <DialogDescription>
                                {jobTitle}
                            </DialogDescription>
                        </DialogHeader>
                        <ApplicationFormEnhanced 
                            jobId={jobId}
                            jobTitle={jobTitle}
                            profile={profile}
                        />
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}

