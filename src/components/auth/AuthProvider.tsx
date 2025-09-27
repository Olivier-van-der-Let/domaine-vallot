'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import type { User, Session } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import type { Customer } from '@/types'

interface AuthContextType {
  user: User | null
  customer: Customer | null
  session: Session | null
  loading: boolean
  isAdmin: boolean
  signingIn: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error?: string }>
  updatePassword: (password: string) => Promise<{ error?: string }>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [signingIn, setSigningIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Get current session and user data with improved error handling
  const getSession = async (retryCount = 0) => {
    try {
      // Get session first, then user data
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError && !sessionError.message.includes('session_not_found')) {
        console.error('Session fetch error:', sessionError)
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError && !userError.message.includes('session_not_found')) {
        console.error('User fetch error:', userError)
      }

      // Update states
      setSession(session)
      setUser(user)

      // Get customer profile if user exists and session is valid
      if (user && session) {
        await getCustomerProfile(user.id)
        await checkAdminStatus(user.id)
      } else {
        setCustomer(null)
        setIsAdmin(false)
      }

      // Log authentication state for debugging
      console.log('🔐 Auth state updated:', {
        hasUser: !!user,
        hasSession: !!session,
        userId: user?.id?.substring(0, 8) || 'none',
        sessionValid: session ? !session.expires_at || new Date(session.expires_at) > new Date() : false
      })

      return !!(user && session)
    } catch (error) {
      console.error('Session fetch error:', error)
      return false
    } finally {
      if (retryCount === 0) {
        setLoading(false)
      }
    }
  }

  // Get customer profile from database
  const getCustomerProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Customer profile error:', error)
        return
      }

      if (data) {
        // Transform database fields to match Customer interface
        const customerData: Customer = {
          id: data.id,
          email: data.email,
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          phone: data.phone || '',
          birthDate: data.birth_date || '',
          preferredLanguage: data.preferred_language || 'en',
          marketingConsent: data.marketing_consent || false,
          newsletterConsent: data.newsletter_consent || false,
          ageVerified: data.age_verified || false,
          ageVerifiedAt: data.age_verified_at || '',
          ageVerificationMethod: data.age_verification_method || undefined,
          isBusiness: data.is_business || false,
          vatNumber: data.vat_number || '',
          vatValidated: data.vat_validated || false,
          vatValidatedAt: data.vat_validated_at || '',
          companyName: data.company_name || '',
          totalOrders: data.total_orders || 0,
          totalSpentEur: data.total_spent_eur || 0,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        }

        setCustomer(customerData)
      }
    } catch (error) {
      console.error('Customer profile fetch error:', error)
    }
  }

  // Check if user is admin
  const checkAdminStatus = async (userId: string) => {
    try {
      // Check if user is in admin_users table
      const { data, error } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Admin check error:', error)
        setIsAdmin(false)
        return
      }

      // User is admin if found in admin_users table
      setIsAdmin(!!data)
    } catch (error) {
      console.error('Admin status check error:', error)
      setIsAdmin(false)
    }
  }

  // Sign in with improved session synchronization
  const signIn = async (email: string, password: string) => {
    setSigningIn(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()

      if (!response.ok) {
        return { error: result.error || 'Login failed' }
      }

      // Retry session refresh with exponential backoff to ensure auth state synchronization
      let sessionFound = false
      const maxRetries = 5

      for (let attempt = 0; attempt < maxRetries && !sessionFound; attempt++) {
        if (attempt > 0) {
          // Wait with exponential backoff: 100ms, 200ms, 400ms, 800ms, 1600ms
          await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt - 1)))
        }

        sessionFound = await getSession(attempt)

        if (sessionFound) {
          console.log(`Session synchronized after ${attempt + 1} attempt(s)`)
          break
        }
      }

      if (!sessionFound) {
        console.warn('Session not found after maximum retries, but login API succeeded')
        // Force a final session refresh
        await getSession()
      }

      return {}
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    } finally {
      setSigningIn(false)
    }
  }

  // Sign up with improved session synchronization
  const signUp = async (email: string, password: string, metadata: any = {}) => {
    setSigningIn(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          confirmPassword: password, // The API route expects this
          ...metadata
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        return { error: result.error || 'Registration failed' }
      }

      // Retry session refresh with exponential backoff
      let sessionFound = false
      const maxRetries = 5

      for (let attempt = 0; attempt < maxRetries && !sessionFound; attempt++) {
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt - 1)))
        }

        sessionFound = await getSession(attempt)

        if (sessionFound) {
          console.log(`Registration session synchronized after ${attempt + 1} attempt(s)`)
          break
        }
      }

      if (!sessionFound) {
        console.warn('Registration session not found after maximum retries')
        await getSession()
      }

      return {}
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    } finally {
      setSigningIn(false)
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setCustomer(null)
      setSession(null)
      router.refresh()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (!response.ok) {
        return { error: result.error || 'Password reset failed' }
      }

      return {}
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  }

  // Update password
  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password
      })

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  }

  // Refresh user data
  const refreshUser = async () => {
    await getSession()
  }

  // Initialize auth state
  useEffect(() => {
    getSession()

    // Listen for auth changes with improved session handling
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', event, {
        hasSession: !!session,
        hasUser: !!session?.user,
        sessionExpiry: session?.expires_at ? new Date(session.expires_at).toISOString() : null
      })

      setSession(session)

      // Use getUser() for secure user data
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error && !error.message.includes('session_not_found')) {
        console.error('Error getting user during auth state change:', error)
      }

      setUser(user)

      if (user && session) {
        await getCustomerProfile(user.id)
        await checkAdminStatus(user.id)
      } else {
        setCustomer(null)
        setIsAdmin(false)
      }

      // Handle specific auth events
      if (event === 'SIGNED_OUT') {
        setCustomer(null)
        setIsAdmin(false)
        // Don't immediately refresh, let the component handle redirects
        console.log('🚪 User signed out, clearing auth state')
      }

      if (event === 'SIGNED_IN') {
        console.log('✅ User signed in successfully')
        // Redirect to intended page or dashboard after short delay for state sync
        setTimeout(() => {
          const redirectTo = new URLSearchParams(window.location.search).get('redirect')
          if (redirectTo) {
            console.log('🔄 Redirecting to:', redirectTo)
            router.push(redirectTo)
          }
        }, 100)
      }

      if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token refreshed successfully')
      }

      if (event === 'PASSWORD_RECOVERY') {
        // User clicked on password reset link
        router.push(`/reset-password?token=${session?.access_token}`)
      }

      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [router, supabase.auth])

  // Protect routes
  useEffect(() => {
    if (!loading) {
      const isAuthRoute = pathname?.includes('/login') ||
                         pathname?.includes('/register') ||
                         pathname?.includes('/forgot-password') ||
                         pathname?.includes('/reset-password')

      const isAdminRoute = pathname?.includes('/admin')
      const isUserProtectedRoute = pathname?.includes('/profile') ||
                                  pathname?.includes('/orders')

      // Redirect authenticated users away from auth pages
      if (user && isAuthRoute) {
        // If user was trying to access admin and is admin, redirect to admin
        const redirectParam = new URLSearchParams(window.location.search).get('redirect')
        if (redirectParam?.includes('/admin') && isAdmin) {
          router.push(redirectParam)
        } else {
          router.push('/')
        }
        return
      }

      // Handle admin route protection
      if (isAdminRoute) {
        if (!user) {
          // Redirect unauthenticated users to login with admin redirect
          const currentPath = encodeURIComponent(pathname || '/admin')
          router.push(`/login?redirect=${currentPath}&message=Please login to access admin panel`)
          return
        } else if (user && !isAdmin) {
          // Redirect non-admin users away from admin routes
          router.push('/?message=Admin access required')
          return
        }
      }

      // Handle other protected routes
      if (!user && isUserProtectedRoute) {
        const currentPath = encodeURIComponent(pathname || '/')
        router.push(`/login?redirect=${currentPath}`)
        return
      }
    }
  }, [user, loading, isAdmin, pathname, router])

  const value = {
    user,
    customer,
    session,
    loading,
    signingIn,
    isAdmin,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Higher-order component for protected routes
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { user, loading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
      if (!loading && !user) {
        const currentPath = encodeURIComponent(pathname || '/')
        router.push(`/login?redirect=${currentPath}`)
      }
    }, [user, loading, router, pathname])

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-wine-600"></div>
        </div>
      )
    }

    if (!user) {
      return null
    }

    return <Component {...props} />
  }
}