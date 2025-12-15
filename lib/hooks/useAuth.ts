'use client';

import { useEffect, useState, useMemo } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';
import { useRouter } from 'next/navigation';

export function useAuth() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = useMemo(() => createBrowserClient(), []);
    const router = useRouter();

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            // Jika error atau data tidak ada, coba buat profil default
            if (error || !data) {
                // Cek apakah error karena RLS atau karena profil belum ada
                if (error && error.code !== 'PGRST116') {
                    // Error selain "not found", coba buat profil
                    try {
                        const { data: userData } = await supabase.auth.getUser();
                        if (userData?.user) {
                            const userMetadata = userData.user.user_metadata;
                            const defaultRole = (userMetadata?.role as string) || 'jobseeker';
                            
                            // Untuk jobseeker, langsung aktif (is_approved = true)
                            // Untuk recruiter, perlu approval admin (is_approved = false)
                            const isJobseeker = defaultRole === 'jobseeker';
                            const shouldAutoApprove = isJobseeker || defaultRole === 'admin';
                            
                            // Coba buat profil dengan is_approved sesuai role
                            const { error: createError } = await (supabase
                                .from('profiles') as any)
                                .upsert({
                                    id: userId,
                                    full_name: userMetadata?.full_name || null,
                                    role: defaultRole,
                                    email: userData.user.email || null,
                                    is_approved: shouldAutoApprove ? true : false, // Jobseeker langsung aktif, recruiter perlu approval
                                }, {
                                    onConflict: 'id',
                                });

                            if (!createError) {
                                // Untuk jobseeker, pastikan is_approved = true setelah dibuat
                                if (isJobseeker) {
                                    const { error: updateError } = await (supabase
                                        .from('profiles') as any)
                                        .update({ is_approved: true })
                                        .eq('id', userId);
                                    
                                    if (updateError) {
                                        console.warn('Could not update is_approved for jobseeker:', updateError);
                                    }
                                }
                                
                                // Fetch ulang setelah dibuat
                                const { data: newData } = await supabase
                                    .from('profiles')
                                    .select('*')
                                    .eq('id', userId)
                                    .maybeSingle();
                                setProfile(newData);
                            } else {
                                console.warn('Could not create profile:', createError);
                                setProfile(null);
                            }
                        } else {
                            setProfile(null);
                        }
                    } catch (createErr) {
                        console.warn('Error creating profile in useAuth:', createErr);
                        setProfile(null);
                    }
                } else {
                    // Profil belum ada atau tidak ditemukan, coba buat profil default
                    try {
                        const { data: userData } = await supabase.auth.getUser();
                        if (userData?.user) {
                            const userMetadata = userData.user.user_metadata;
                            const defaultRole = (userMetadata?.role as string) || 'jobseeker';
                            const isJobseeker = defaultRole === 'jobseeker';
                            const shouldAutoApprove = isJobseeker || defaultRole === 'admin';
                            
                            // Buat profil baru
                            const { error: createError } = await (supabase
                                .from('profiles') as any)
                                .insert({
                                    id: userId,
                                    full_name: userMetadata?.full_name || null,
                                    role: defaultRole,
                                    email: userData.user.email || null,
                                    is_approved: shouldAutoApprove ? true : false,
                                });

                            if (!createError) {
                                // Untuk jobseeker, pastikan is_approved = true
                                if (isJobseeker) {
                                    const { error: updateError } = await (supabase
                                        .from('profiles') as any)
                                        .update({ is_approved: true })
                                        .eq('id', userId);
                                    
                                    if (updateError) {
                                        console.warn('Could not update is_approved for jobseeker:', updateError);
                                    }
                                }
                                
                                // Fetch ulang setelah dibuat
                                const { data: newData } = await supabase
                                    .from('profiles')
                                    .select('*')
                                    .eq('id', userId)
                                    .maybeSingle();
                                setProfile(newData);
                            } else {
                                console.warn('Could not create profile:', createError);
                                setProfile(null);
                            }
                        } else {
                            setProfile(null);
                        }
                    } catch (createErr) {
                        console.warn('Error creating profile in useAuth:', createErr);
                        setProfile(null);
                    }
                }
            } else {
                // Profil ditemukan, pastikan jobseeker memiliki is_approved = true
                const profileRole = (data as any)?.role;
                const isApproved = (data as any)?.is_approved;
                
                if (profileRole === 'jobseeker' && isApproved !== true) {
                    // Update is_approved untuk jobseeker yang belum aktif
                    console.log('Updating is_approved to true for jobseeker...');
                    const { error: updateError } = await (supabase
                        .from('profiles') as any)
                        .update({ is_approved: true })
                        .eq('id', userId);
                    
                    if (!updateError) {
                        // Fetch ulang setelah update
                        const { data: updatedData } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', userId)
                            .maybeSingle();
                        setProfile(updatedData);
                    } else {
                        console.warn('Could not update is_approved for jobseeker:', updateError);
                        setProfile(data);
                    }
                } else {
                    // Profil sudah benar, set data
                    setProfile(data);
                }
            }
        } catch (error: any) {
            // Log error dengan lebih detail untuk debugging
            console.warn('Error fetching profile in useAuth:', {
                message: error?.message,
                code: error?.code,
                details: error?.details,
                hint: error?.hint,
                error,
            });
            setProfile(null);
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        router.push('/');
        router.refresh();
    };

    return {
        user,
        profile,
        loading,
        signOut,
    };
}

