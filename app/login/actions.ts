// src/app/login/actions.ts
'use server';

import { createBrowserClient } from '@/lib/supabase/client';
import { redirect } from 'next/navigation';
import { UserRole } from '@/lib/types';

type SignInResult = { error?: string };

export async function signIn(email: string, password: string): Promise<SignInResult | void> {
  const supabase = createBrowserClient();

  // 1. Autentikasi Kredensial (Sesuai Sequence Diagram: Cek Kredensial di DB)
  const { error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    return { error: 'Login Gagal: ' + authError.message };
  }

  // Ambil data user yang baru saja login (Sesuai Sequence Diagram: Return Auth Result)
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // 2. Ambil Role dari tabel profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single<{ role: UserRole }>(); // Menggunakan tipe UserRole

    if (profileError || !profileData) {
      return { error: 'Gagal mendapatkan peran pengguna. Hubungi Admin.' };
    }

    const userRole = profileData.role;
    
    // 3. Redirect Role-Based (Sesuai Sequence Diagram: Display Dashboard)
    const dashboardRoutes: Record<UserRole, string> = {
        'admin': '/admin/dashboard',
        'recruiter': '/recruiter/dashboard',
        'jobseeker': '/jobseeker/dashboard',
    };

    if (dashboardRoutes[userRole]) {
        redirect(dashboardRoutes[userRole]);
    } else {
        return { error: 'Peran tidak valid.' };
    }
  }

  return { error: 'Terjadi kesalahan tidak terduga saat login.' };
}