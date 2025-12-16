import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/'
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')

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
      // Exchange code for session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error exchanging code for session:', error)
        // Redirect to login with error message
        return NextResponse.redirect(
          new URL(`/?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
        )
      }

      // Get user role from metadata or profile
      if (data?.user) {
        const userMetadata = data.user.user_metadata
        const role = userMetadata?.role || 'jobseeker'
        
        // Determine redirect path based on role
        const roleRedirectMap: Record<string, string> = {
          admin: '/admin/dashboard',
          recruiter: '/recruiter/dashboard',
          jobseeker: '/job-seeker/dashboard',
        }
        
        const redirectPath = roleRedirectMap[role] || '/job-seeker/dashboard'
        
        // Redirect to appropriate dashboard
        return NextResponse.redirect(new URL(redirectPath, requestUrl.origin))
      }
    } else if (tokenHash && type) {
      // Handle token-based confirmation (for password reset, etc.)
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as any,
      })

      if (error) {
        console.error('Error verifying OTP:', error)
        return NextResponse.redirect(
          new URL(`/?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
        )
      }

      if (data?.user) {
        const userMetadata = data.user.user_metadata
        const role = userMetadata?.role || 'jobseeker'
        
        const roleRedirectMap: Record<string, string> = {
          admin: '/admin/dashboard',
          recruiter: '/recruiter/dashboard',
          jobseeker: '/job-seeker/dashboard',
        }
        
        const redirectPath = roleRedirectMap[role] || '/job-seeker/dashboard'
        return NextResponse.redirect(new URL(redirectPath, requestUrl.origin))
      }
    }
  }

  // Fallback: redirect to home or specified next URL
  return NextResponse.redirect(new URL(next, requestUrl.origin))
}


