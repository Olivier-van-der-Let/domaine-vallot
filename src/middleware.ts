import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const intlMiddleware = createMiddleware(routing)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if this is an admin route
  const isAdminRoute = pathname.includes('/admin')

  if (isAdminRoute) {
    try {
      // Create a response to get access to cookies
      const response = NextResponse.next()

      // Create Supabase client with cookies from the request
      const supabase = createServerComponentClient({ cookies: () => cookies() })

      // Get the current user session
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error || !session) {
        // Redirect unauthenticated users to login
        const loginUrl = new URL('/en/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        loginUrl.searchParams.set('message', 'Please login to access admin panel')
        return NextResponse.redirect(loginUrl)
      }

      // Check if user is admin
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', session.user.id)
        .single()

      if (adminError && adminError.code !== 'PGRST116') {
        console.error('Admin check error:', adminError)
        const homeUrl = new URL('/en', request.url)
        homeUrl.searchParams.set('message', 'Error checking admin status')
        return NextResponse.redirect(homeUrl)
      }

      if (!adminData) {
        // Redirect non-admin users to home
        const homeUrl = new URL('/en', request.url)
        homeUrl.searchParams.set('message', 'Admin access required')
        return NextResponse.redirect(homeUrl)
      }

      // User is authenticated and is admin, continue to admin route
      return intlMiddleware(request)
    } catch (error) {
      console.error('Middleware error:', error)
      const homeUrl = new URL('/en', request.url)
      homeUrl.searchParams.set('message', 'An error occurred')
      return NextResponse.redirect(homeUrl)
    }
  }

  // For non-admin routes, use the internationalization middleware
  return intlMiddleware(request)
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
}