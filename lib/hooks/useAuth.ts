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
                            
                            // Coba buat profil
                            const { error: createError } = await (supabase
                                .from('profiles') as any)
                                .upsert({
                                    id: userId,
                                    full_name: userMetadata?.full_name || null,
                                    role: defaultRole,
                                }, {
                                    onConflict: 'id',
                                });

                            if (!createError) {
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
                    // Profil belum ada atau tidak ditemukan, set null
                    setProfile(null);
                }
            } else {
                // Profil ditemukan, set data
                setProfile(data);
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

