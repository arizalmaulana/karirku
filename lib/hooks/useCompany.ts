'use client';

import { useEffect, useState, useMemo } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Company } from '@/lib/types';

export function useCompany(recruiterId: string | null) {
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = useMemo(() => createBrowserClient(), []);

    useEffect(() => {
        if (!recruiterId) {
            setLoading(false);
            return;
        }

        async function fetchCompany() {
            try {
                const { data, error } = await (supabase
                    .from('companies') as any)
                    .select('*')
                    .eq('recruiter_id', recruiterId)
                    .maybeSingle();

                if (error && error.code !== 'PGRST116') {
                    console.error('Error fetching company:', error);
                    setCompany(null);
                } else {
                    setCompany(data || null);
                }
            } catch (error) {
                console.error('Error in useCompany:', error);
                setCompany(null);
            } finally {
                setLoading(false);
            }
        }

        fetchCompany();
    }, [recruiterId, supabase]);

    return { company, loading };
}



