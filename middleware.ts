import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { UserRole } from './lib/types'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Middleware HARUS membuat kliennya sendiri untuk menyegarkan sesi.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Ini adalah baris paling penting: menyegarkan sesi jika sudah kedaluwarsa.
  const { data: { user } } = await supabase.auth.getUser()

  // Skip middleware untuk root path dan auth routes
  if (req.nextUrl.pathname === '/' || req.nextUrl.pathname.startsWith('/api')) {
    return res
  }

  // Jika pengguna sedang mencoba mengakses rute admin
  if (req.nextUrl.pathname.startsWith('/admin')) {
    // Jika tidak ada pengguna yang login, alihkan ke halaman utama
    if (!user) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    // Jika ada pengguna, periksa perannya dari tabel profiles
    // Gunakan maybeSingle() untuk menghindari error jika profil belum ada
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    // Jika error (bukan karena tidak ada data), log untuk debugging
    if (error && error.code !== 'PGRST116') {
      console.error('Middleware error fetching profile for admin:', {
        error: error.message,
        code: error.code,
        path: req.nextUrl.pathname
      })
    }

    // Jika profil belum ada atau peran bukan 'admin', alihkan ke halaman utama
    if (!profile) {
      console.error('Admin access denied: No profile found', {
        userId: user.id,
        path: req.nextUrl.pathname
      })
      return NextResponse.redirect(new URL('/', req.url))
    }
    
    if ((profile.role as UserRole) !== 'admin') {
      console.log('Admin access denied: Wrong role', {
        hasProfile: !!profile,
        role: profile?.role,
        userId: user.id,
        path: req.nextUrl.pathname
      })
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // Jika pengguna sedang mencoba mengakses rute recruiter
  if (req.nextUrl.pathname.startsWith('/recruiter')) {
    if (!user) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, is_approved, company_license_url')
      .eq('id', user.id)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.error('Middleware error fetching profile for recruiter:', {
        error: error.message,
        code: error.code,
        path: req.nextUrl.pathname
      })
    }

    if (!profile || (profile.role as UserRole) !== 'recruiter') {
      console.log('Recruiter access denied:', {
        hasProfile: !!profile,
        role: profile?.role,
        userId: user.id,
        path: req.nextUrl.pathname
      })
      return NextResponse.redirect(new URL('/', req.url))
    }

    // Cek approval status untuk recruiter
    const isApproved = profile.is_approved === true
    const hasLicense = !!profile.company_license_url

    // Jika belum approved, redirect ke home dengan pesan
    if (!isApproved) {
      if (!hasLicense) {
        // Belum upload license (seharusnya tidak terjadi karena wajib saat registrasi)
        // Tapi untuk safety, redirect ke home dengan pesan
        return NextResponse.redirect(new URL('/?message=Akun Anda belum lengkap. Silakan hubungi admin.', req.url))
      } else {
        // Sudah upload tapi belum approved, redirect ke home dengan pesan
        return NextResponse.redirect(new URL('/?message=Akun Anda sedang menunggu persetujuan admin', req.url))
      }
    }
  }

  // Jika pengguna sedang mencoba mengakses rute job-seeker
  if (req.nextUrl.pathname.startsWith('/job-seeker')) {
    if (!user) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.error('Middleware error fetching profile for job-seeker:', {
        error: error.message,
        code: error.code,
        path: req.nextUrl.pathname
      })
    }

    if (!profile) {
      console.error('Job-seeker access denied: No profile found', {
        userId: user.id,
        path: req.nextUrl.pathname
      })
      return NextResponse.redirect(new URL('/', req.url))
    }
    
    if ((profile.role as UserRole) !== 'jobseeker') {
      console.log('Job-seeker access denied: Wrong role', {
        hasProfile: !!profile,
        role: profile?.role,
        userId: user.id,
        path: req.nextUrl.pathname
      })
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}