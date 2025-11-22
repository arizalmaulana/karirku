// src/lib/supabase/client.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types';

// Client untuk digunakan di Server Actions (tanpa cookie handling) dan Client Components
export const createBrowserClient = (): SupabaseClient<Database> =>
  createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );