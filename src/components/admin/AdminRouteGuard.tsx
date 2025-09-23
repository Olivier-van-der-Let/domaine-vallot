'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface AdminRouteGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function AdminRouteGuard({ children, fallback }: AdminRouteGuardProps) {
  const { user, isAdmin, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Redirect to login if not authenticated
        router.push('/login?message=Please login to access admin panel')
        return
      }

      if (!isAdmin) {
        // Redirect to home if not admin
        router.push('/?message=Admin access required')
        return
      }
    }
  }, [user, isAdmin, loading, router])

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wine-600"></div>
        <span className="ml-3 text-gray-600">Checking access...</span>
      </div>
    )
  }

  // Show fallback if not authenticated or not admin
  if (!user || !isAdmin) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">Admin privileges required to access this page.</p>
        </div>
      </div>
    )
  }

  // User is authenticated and is admin, show children
  return <>{children}</>
}