import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/'
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Handle error dari Supabase (misalnya 403)
  if (error) {
    console.error('Auth callback error:', error, errorDescription)
    const errorMessage = errorDescription || error || 'Terjadi kesalahan saat konfirmasi email'
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(errorMessage)}`, requestUrl.origin)
    )
  }

  // Handle email confirmation
  if (code || tokenHash) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    if (code) {
      try {
        // Exchange code for session
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        
        if (exchangeError) {
          console.error('Error exchanging code for session:', exchangeError)
          // Handle error 403 khusus
          if (exchangeError.message?.includes('403') || exchangeError.status === 403) {
            return NextResponse.redirect(
              new URL(`/?error=${encodeURIComponent('URL redirect belum di-whitelist di Supabase Dashboard. Silakan hubungi administrator.')}`, requestUrl.origin)
            )
          }
          // Redirect to login with error message
          return NextResponse.redirect(
            new URL(`/?error=${encodeURIComponent(exchangeError.message || 'Gagal konfirmasi email')}`, requestUrl.origin)
          )
        }

        // Verify session setelah exchange
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.error('Error getting user after exchange:', userError)
          return NextResponse.redirect(
            new URL(`/?error=${encodeURIComponent('Gagal mendapatkan data user setelah konfirmasi')}`, requestUrl.origin)
          )
        }

        // Get user role from metadata or profile
        const userMetadata = user.user_metadata
        const role = userMetadata?.role || 'jobseeker'
        
        // Buat notifikasi di database untuk konfirmasi email berhasil
        try {
          const adminClient = createSupabaseAdminClient()
          if (adminClient) {
            // Gunakan function create_notification yang sudah dibuat
            await adminClient.rpc('create_notification', {
              p_user_id: user.id,
              p_title: 'Email Berhasil Dikonfirmasi',
              p_message: 'Selamat! Email Anda telah berhasil dikonfirmasi. Akun Anda sekarang aktif dan siap digunakan.',
              p_type: 'success',
              p_link: null
            } as any)
          }
        } catch (notifError) {
          // Jangan gagalkan proses jika notifikasi gagal dibuat
          console.error('Error creating notification:', notifError)
        }
        
        // Determine redirect path based on role
        const roleRedirectMap: Record<string, string> = {
          admin: '/admin/dashboard',
          recruiter: '/recruiter/dashboard',
          jobseeker: '/job-seeker/dashboard',
        }
        
        const redirectPath = roleRedirectMap[role] || '/job-seeker/dashboard'
        
        // Redirect dengan query parameter untuk toast notification
        const redirectUrl = new URL(redirectPath, requestUrl.origin)
        redirectUrl.searchParams.set('emailConfirmed', 'true')
        
        // Redirect to appropriate dashboard
        return NextResponse.redirect(redirectUrl)
      } catch (err: any) {
        console.error('Unexpected error in callback:', err)
        return NextResponse.redirect(
          new URL(`/?error=${encodeURIComponent(err.message || 'Terjadi kesalahan tidak terduga')}`, requestUrl.origin)
        )
      }
    } else if (tokenHash && type) {
      try {
        // Handle token-based confirmation (for password reset, etc.)
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as any,
        })

        if (verifyError) {
          console.error('Error verifying OTP:', verifyError)
          return NextResponse.redirect(
            new URL(`/?error=${encodeURIComponent(verifyError.message || 'Gagal verifikasi token')}`, requestUrl.origin)
          )
        }

        if (data?.user) {
          const userMetadata = data.user.user_metadata
          const role = userMetadata?.role || 'jobseeker'
          
          // Buat notifikasi di database untuk konfirmasi email berhasil
          try {
            const adminClient = createSupabaseAdminClient()
            if (adminClient) {
              await adminClient.rpc('create_notification', {
                p_user_id: data.user.id,
                p_title: 'Email Berhasil Dikonfirmasi',
                p_message: 'Selamat! Email Anda telah berhasil dikonfirmasi. Akun Anda sekarang aktif dan siap digunakan.',
                p_type: 'success',
                p_link: null
              } as any)
            }
          } catch (notifError) {
            console.error('Error creating notification:', notifError)
          }
          
          const roleRedirectMap: Record<string, string> = {
            admin: '/admin/dashboard',
            recruiter: '/recruiter/dashboard',
            jobseeker: '/job-seeker/dashboard',
          }
          
          const redirectPath = roleRedirectMap[role] || '/job-seeker/dashboard'
          const redirectUrl = new URL(redirectPath, requestUrl.origin)
          redirectUrl.searchParams.set('emailConfirmed', 'true')
          
          return NextResponse.redirect(redirectUrl)
        }
      } catch (err: any) {
        console.error('Unexpected error in token verification:', err)
        return NextResponse.redirect(
          new URL(`/?error=${encodeURIComponent(err.message || 'Terjadi kesalahan tidak terduga')}`, requestUrl.origin)
        )
      }
    }
  }

  // Fallback: redirect to home or specified next URL
  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
