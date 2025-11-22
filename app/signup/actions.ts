// src/app/signup/actions.ts
'use server';

import { SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@/lib/supabase/client';
import { Database, UserRole } from '@/lib/types';

// Definisikan tipe hasil
type SignUpResult = { error?: string, success?: boolean };

export async function signUp(email: string, password: string, selectedRole: UserRole): Promise<SignUpResult> {
  const supabase = createBrowserClient() as SupabaseClient<Database>;

  // 1. Panggil Supabase Auth (Trigger DB berjalan, membuat profile default 'jobseeker')
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    return { error: authError.message };
  }

  const userId = authData.user?.id;

  if (userId) {
    // 2. Update role di tabel profiles ke peran yang dipilih oleh pengguna
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        role: selectedRole,
      } as never)
      .eq('id', userId);

    if (profileError) {
      console.error("Error setting role in profiles:", profileError);
      // PENTING: Pertimbangkan untuk menghapus user auth jika update profile gagal
      return { error: 'Pendaftaran berhasil, tetapi gagal mengatur peran. Hubungi admin.' };
    }
  }
  
  return { success: true };
}