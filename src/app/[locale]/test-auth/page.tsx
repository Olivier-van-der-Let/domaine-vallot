'use client'

import { useAuthModal } from '@/components/auth/AuthModal'
import { Button } from '@/components/ui/form/Button'
import { useAuth } from '@/components/auth/AuthProvider'

export default function TestAuthPage() {
  const { openModal } = useAuthModal()
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">
            Authentication Modal Test
          </h1>

          {user ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-800">
                  Welcome, {user.email}! You are authenticated.
                </p>
              </div>
              <Button
                onClick={signOut}
                variant="outline"
                fullWidth
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600 mb-6">
                Test the authentication modal system
              </p>

              <Button
                onClick={() => openModal('login')}
                fullWidth
              >
                Open Login Modal
              </Button>

              <Button
                onClick={() => openModal('register')}
                variant="outline"
                fullWidth
              >
                Open Register Modal
              </Button>

              <Button
                onClick={() => openModal('forgot-password')}
                variant="ghost"
                fullWidth
              >
                Open Forgot Password Modal
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}