'use client'

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { Customer, CustomerRegistrationData } from '@/types'

interface AuthUser extends Customer {
  isAuthenticated: boolean
}

interface UseAuthReturn {
  // User state
  user: AuthUser | null
  loading: boolean
  error: string | null

  // Authentication status
  isAuthenticated: boolean
  isLoading: boolean

  // Actions
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  register: (data: CustomerRegistrationData) => Promise<boolean>
  updateProfile: (updates: Partial<Customer>) => Promise<boolean>
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>
  requestPasswordReset: (email: string) => Promise<boolean>
  resetPassword: (token: string, newPassword: string) => Promise<boolean>
  verifyEmail: (token: string) => Promise<boolean>
  refreshUser: () => Promise<void>

  // Age verification
  isAgeVerified: boolean
  verifyAge: (method: 'id_document' | 'third_party' | 'manual', data?: any) => Promise<boolean>

  // Session management
  extendSession: () => Promise<void>
  clearError: () => void
}

// Auth Context for provider pattern
const AuthContext = createContext<UseAuthReturn | null>(null)

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Computed values
  const isAuthenticated = user?.isAuthenticated || false
  const isLoading = loading
  const isAgeVerified = user?.ageVerified || false

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Fetch current user
  const fetchUser = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })

      if (response.ok) {
        const result = await response.json()
        const userData = result.data
        setUser({
          ...userData,
          isAuthenticated: true
        })
      } else if (response.status === 401) {
        // Not authenticated
        setUser(null)
      } else {
        throw new Error('Failed to fetch user')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Login
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null)
      setLoading(true)

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Login failed')
      }

      const result = await response.json()
      const userData = result.data

      setUser({
        ...userData,
        isAuthenticated: true
      })

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // Logout
  const logout = useCallback(async () => {
    try {
      setError(null)

      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })

      setUser(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed')
      // Still clear user on logout attempt
      setUser(null)
    }
  }, [])

  // Register
  const register = useCallback(async (data: CustomerRegistrationData): Promise<boolean> => {
    try {
      setError(null)
      setLoading(true)

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Registration failed')
      }

      const result = await response.json()
      const userData = result.data

      setUser({
        ...userData,
        isAuthenticated: true
      })

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<Customer>): Promise<boolean> => {
    if (!user) return false

    try {
      setError(null)

      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Profile update failed')
      }

      const result = await response.json()
      const updatedUser = result.data

      setUser({
        ...updatedUser,
        isAuthenticated: true
      })

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profile update failed')
      return false
    }
  }, [user])

  // Change password
  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      setError(null)

      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Password change failed')
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password change failed')
      return false
    }
  }, [])

  // Request password reset
  const requestPasswordReset = useCallback(async (email: string): Promise<boolean> => {
    try {
      setError(null)

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Password reset request failed')
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset request failed')
      return false
    }
  }, [])

  // Reset password with token
  const resetPassword = useCallback(async (token: string, newPassword: string): Promise<boolean> => {
    try {
      setError(null)

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Password reset failed')
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed')
      return false
    }
  }, [])

  // Verify email
  const verifyEmail = useCallback(async (token: string): Promise<boolean> => {
    try {
      setError(null)

      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ token })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Email verification failed')
      }

      // Refresh user data after verification
      await fetchUser()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Email verification failed')
      return false
    }
  }, [fetchUser])

  // Verify age
  const verifyAge = useCallback(async (method: 'id_document' | 'third_party' | 'manual', data?: any): Promise<boolean> => {
    try {
      setError(null)

      const response = await fetch('/api/age-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          method,
          ...data
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Age verification failed')
      }

      // Refresh user data after verification
      await fetchUser()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Age verification failed')
      return false
    }
  }, [fetchUser])

  // Extend session
  const extendSession = useCallback(async () => {
    try {
      await fetch('/api/auth/extend-session', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (err) {
      console.warn('Failed to extend session:', err)
    }
  }, [])

  // Refresh user data
  const refreshUser = useCallback(async () => {
    await fetchUser()
  }, [fetchUser])

  // Load user on mount
  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  // Auto-extend session for authenticated users
  useEffect(() => {
    if (!isAuthenticated) return

    const interval = setInterval(() => {
      extendSession()
    }, 15 * 60 * 1000) // Extend every 15 minutes

    return () => clearInterval(interval)
  }, [isAuthenticated, extendSession])

  return {
    // User state
    user,
    loading,
    error,

    // Authentication status
    isAuthenticated,
    isLoading,

    // Actions
    login,
    logout,
    register,
    updateProfile,
    changePassword,
    requestPasswordReset,
    resetPassword,
    verifyEmail,
    refreshUser,

    // Age verification
    isAgeVerified,
    verifyAge,

    // Session management
    extendSession,
    clearError
  }
}

// Context provider component
interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth()

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use auth context
export function useAuthContext(): UseAuthReturn {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

// Hook for protected routes
export function useRequireAuth(redirectTo: string = '/login') {
  const { isAuthenticated, isLoading } = useAuth()
  const [shouldRedirect, setShouldRedirect] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setShouldRedirect(true)
    }
  }, [isAuthenticated, isLoading])

  return {
    isAuthenticated,
    isLoading,
    shouldRedirect,
    redirectTo
  }
}

// Hook for guest-only routes (login, register pages)
export function useRequireGuest(redirectTo: string = '/') {
  const { isAuthenticated, isLoading } = useAuth()
  const [shouldRedirect, setShouldRedirect] = useState(false)

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setShouldRedirect(true)
    }
  }, [isAuthenticated, isLoading])

  return {
    isAuthenticated,
    isLoading,
    shouldRedirect,
    redirectTo
  }
}

// Hook for session management
export function useSession() {
  const { user, isAuthenticated, isLoading, extendSession } = useAuth()

  // Session timeout warning
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return

    // Show warning 5 minutes before session expires (assuming 30min session)
    const warningTimer = setTimeout(() => {
      setShowTimeoutWarning(true)
    }, 25 * 60 * 1000) // 25 minutes

    return () => clearTimeout(warningTimer)
  }, [isAuthenticated, user?.updatedAt])

  const extendSessionAndHideWarning = useCallback(async () => {
    await extendSession()
    setShowTimeoutWarning(false)
  }, [extendSession])

  return {
    user,
    isAuthenticated,
    isLoading,
    showTimeoutWarning,
    extendSession: extendSessionAndHideWarning,
    dismissWarning: () => setShowTimeoutWarning(false)
  }
}