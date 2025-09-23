'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/form/Button'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { ForgotPasswordForm } from './ForgotPasswordForm'
import { ResetPasswordForm } from './ResetPasswordForm'
import { useAuth } from '@/components/auth/AuthProvider'
import { X, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

export type AuthModalMode = 'login' | 'register' | 'forgot-password' | 'reset-password'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultMode?: AuthModalMode
  locale: string
  redirectTo?: string
  className?: string
}

interface AuthModalState {
  mode: AuthModalMode
  resetToken?: string
  showSuccess: boolean
  successMessage?: string
}

export function AuthModal({
  isOpen,
  onClose,
  defaultMode = 'login',
  locale,
  redirectTo,
  className
}: AuthModalProps) {
  const t = useTranslations('Auth')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const isAuthenticated = !!user

  const [state, setState] = useState<AuthModalState>({
    mode: defaultMode,
    showSuccess: false
  })

  // Check for reset token in URL params
  useEffect(() => {
    const token = searchParams.get('token')
    const mode = searchParams.get('mode') as AuthModalMode

    if (token && mode === 'reset-password') {
      setState(prev => ({
        ...prev,
        mode: 'reset-password',
        resetToken: token
      }))
    }
  }, [searchParams])

  // Close modal when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      handleSuccess()
    }
  }, [isAuthenticated, isOpen])

  const setMode = (mode: AuthModalMode) => {
    setState(prev => ({ ...prev, mode, showSuccess: false }))
  }

  const handleSuccess = (message?: string) => {
    if (message) {
      setState(prev => ({ ...prev, showSuccess: true, successMessage: message }))
      // Auto-close after showing success message
      setTimeout(() => {
        onClose()
        if (redirectTo) {
          router.push(redirectTo)
        }
      }, 2000)
    } else {
      onClose()
      if (redirectTo) {
        router.push(redirectTo)
      }
    }
  }

  const handleClose = () => {
    setState(prev => ({ ...prev, showSuccess: false }))
    onClose()
  }

  const getModalTitle = () => {
    switch (state.mode) {
      case 'login':
        return t('loginTitle')
      case 'register':
        return t('registerTitle')
      case 'forgot-password':
        return t('forgotPasswordTitle')
      case 'reset-password':
        return t('resetPasswordTitle')
      default:
        return t('authentication')
    }
  }

  const getModalDescription = () => {
    switch (state.mode) {
      case 'login':
        return t('loginSubtitle')
      case 'register':
        return t('registerSubtitle')
      case 'forgot-password':
        return t('forgotPasswordSubtitle')
      case 'reset-password':
        return t('resetPasswordSubtitle')
      default:
        return ''
    }
  }

  const renderForm = () => {
    if (state.showSuccess && state.successMessage) {
      return (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('success')}
          </h3>
          <p className="text-gray-600">
            {state.successMessage}
          </p>
        </div>
      )
    }

    switch (state.mode) {
      case 'login':
        return (
          <LoginForm
            locale={locale}
            redirectTo={redirectTo}
            onSuccess={() => handleSuccess()}
            className="max-w-none"
            showHeader={false}
            onSwitchToRegister={() => setMode('register')}
            onSwitchToForgotPassword={() => setMode('forgot-password')}
          />
        )
      case 'register':
        return (
          <RegisterForm
            locale={locale}
            redirectTo={redirectTo}
            onSuccess={() => handleSuccess(t('accountCreated'))}
            className="max-w-none"
            showHeader={false}
            onSwitchToLogin={() => setMode('login')}
          />
        )
      case 'forgot-password':
        return (
          <ForgotPasswordForm
            locale={locale}
            onSuccess={() => handleSuccess(t('resetLinkSent'))}
            className="max-w-none"
            showHeader={false}
            onBackToLogin={() => setMode('login')}
          />
        )
      case 'reset-password':
        return (
          <ResetPasswordForm
            locale={locale}
            token={state.resetToken}
            onSuccess={() => handleSuccess(t('passwordResetSuccess'))}
            className="max-w-none"
            showHeader={false}
            onBackToLogin={() => setMode('login')}
          />
        )
      default:
        return null
    }
  }

  const showBackButton = state.mode !== 'login' && !state.showSuccess

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          'sm:max-w-md w-full max-h-[90vh] overflow-y-auto',
          state.mode === 'register' && 'sm:max-w-lg',
          className
        )}
        onPointerDownOutside={(e) => {
          // Prevent closing when clicking on input fields or buttons
          const target = e.target as Element
          if (target.closest('form') || target.closest('button')) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader className="relative">
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMode('login')}
              className="absolute left-0 top-0 p-1 h-auto w-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to login</span>
            </Button>
          )}

          <DialogTitle className={cn(
            "text-xl font-semibold text-center",
            showBackButton && "mr-8"
          )}>
            {getModalTitle()}
          </DialogTitle>

          {getModalDescription() && (
            <DialogDescription className="text-center text-gray-600">
              {getModalDescription()}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="mt-6">
          {renderForm()}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Context for managing auth modal state globally
import { createContext, useContext, ReactNode } from 'react'

interface AuthModalContextType {
  isOpen: boolean
  mode: AuthModalMode
  openModal: (mode?: AuthModalMode, redirectTo?: string) => void
  closeModal: () => void
  switchMode: (mode: AuthModalMode) => void
}

const AuthModalContext = createContext<AuthModalContextType | null>(null)

interface AuthModalProviderProps {
  children: ReactNode
  locale: string
}

export function AuthModalProvider({ children, locale }: AuthModalProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<AuthModalMode>('login')
  const [redirectTo, setRedirectTo] = useState<string | undefined>()

  const openModal = (modalMode: AuthModalMode = 'login', redirect?: string) => {
    setMode(modalMode)
    setRedirectTo(redirect)
    setIsOpen(true)
  }

  const closeModal = () => {
    setIsOpen(false)
    setRedirectTo(undefined)
  }

  const switchMode = (newMode: AuthModalMode) => {
    setMode(newMode)
  }

  return (
    <AuthModalContext.Provider
      value={{
        isOpen,
        mode,
        openModal,
        closeModal,
        switchMode
      }}
    >
      {children}
      <AuthModal
        isOpen={isOpen}
        onClose={closeModal}
        defaultMode={mode}
        locale={locale}
        redirectTo={redirectTo}
      />
    </AuthModalContext.Provider>
  )
}

export function useAuthModal() {
  const context = useContext(AuthModalContext)
  if (!context) {
    throw new Error('useAuthModal must be used within an AuthModalProvider')
  }
  return context
}