'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, LogIn, AlertCircle, CheckCircle } from 'lucide-react'
import { InputField, CheckboxField } from '@/components/ui/form/FormField'
import { Button } from '@/components/ui/form/Button'
import { useAuth } from '@/components/auth/AuthProvider'
import { loginSchema, type LoginData } from '@/lib/validators/schemas'
import { cn } from '@/lib/utils'

interface LoginFormProps {
  locale: string
  className?: string
  redirectTo?: string
  onSuccess?: () => void
  showHeader?: boolean
  onSwitchToRegister?: () => void
  onSwitchToForgotPassword?: () => void
}

export function LoginForm({
  locale,
  className,
  redirectTo,
  onSuccess,
  showHeader = true,
  onSwitchToRegister,
  onSwitchToForgotPassword
}: LoginFormProps) {
  const t = useTranslations('Auth')
  const router = useRouter()
  const searchParams = useSearchParams()
  // Fix: Use signingIn instead of loading for auth operations
  // signingIn tracks the actual sign-in process state
  // loading is for initial auth state setup and remains true during app initialization
  const { signIn, signingIn } = useAuth()
  const [authError, setAuthError] = useState<string | null>(null)

  const [showPassword, setShowPassword] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)

  const redirect = redirectTo || searchParams.get('redirect') || `/${locale}`

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors
  } = form

  const onSubmit = async (data: LoginData) => {
    try {
      setAuthError(null)
      clearErrors()

      const result = await signIn(data.email, data.password)

      if (result.error) {
        setAuthError(result.error)
        return
      }

      setLoginSuccess(true)

      // Brief delay to show success message
      setTimeout(() => {
        if (onSuccess) {
          onSuccess()
        } else {
          router.push(redirect)
        }
      }, 1000)
    } catch (err) {
      setAuthError('An unexpected error occurred')
      console.error('Login error:', err)
    }
  }

  const handleInputChange = () => {
    // Clear errors when user starts typing
    if (authError) {
      setAuthError(null)
    }
  }

  if (loginSuccess) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t('loginSuccess')}
        </h3>
        <p className="text-gray-600">
          Redirecting you now...
        </p>
      </div>
    )
  }

  return (
    <div className={cn('w-full max-w-md mx-auto', className)}>
      {showHeader && (
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('loginTitle')}
          </h1>
          <p className="text-gray-600">
            {t('loginSubtitle')}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Global error message */}
        {authError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{authError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Email field */}
        <InputField
          {...register('email')}
          id="email"
          type="email"
          label={t('email')}
          placeholder="your@email.com"
          error={errors.email?.message}
          required
          autoComplete="email"
          onChange={(e) => {
            register('email').onChange(e)
            handleInputChange()
          }}
        />

        {/* Password field */}
        <InputField
          {...register('password')}
          id="password"
          type="password"
          label={t('password')}
          placeholder="••••••••"
          error={errors.password?.message}
          required
          autoComplete="current-password"
          showPasswordToggle
          showPassword={showPassword}
          onPasswordToggle={() => setShowPassword(!showPassword)}
          onChange={(e) => {
            register('password').onChange(e)
            handleInputChange()
          }}
        />

        {/* Remember me and forgot password */}
        <div className="flex items-center justify-between">
          <CheckboxField
            {...register('rememberMe')}
            id="rememberMe"
          >
            {t('rememberMe')}
          </CheckboxField>

          {onSwitchToForgotPassword ? (
            <button
              type="button"
              onClick={onSwitchToForgotPassword}
              className="text-sm text-wine-600 hover:text-wine-500 font-medium"
            >
              {t('forgotPassword')}
            </button>
          ) : (
            <Link
              href={`/${locale}/forgot-password`}
              className="text-sm text-wine-600 hover:text-wine-500 font-medium"
            >
              {t('forgotPassword')}
            </Link>
          )}
        </div>

        {/* Submit button - Fix: Use signingIn for auth loading state */}
        {/* signingIn is cleared in finally block of AuthProvider.signIn() */}
        {/* isSubmitting is react-hook-form state for form validation */}
        <Button
          type="submit"
          fullWidth
          loading={signingIn || isSubmitting}
          disabled={signingIn || isSubmitting}
        >
          <LogIn className="w-4 h-4 mr-2" />
          {t('signIn')}
        </Button>

        {/* Sign up link */}
        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            {t('noAccount')}{' '}
            {onSwitchToRegister ? (
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="font-medium text-wine-600 hover:text-wine-500"
              >
                {t('signUp')}
              </button>
            ) : (
              <Link
                href={`/${locale}/register${searchParams.get('redirect') ? `?redirect=${encodeURIComponent(searchParams.get('redirect')!)}` : ''}`}
                className="font-medium text-wine-600 hover:text-wine-500"
              >
                {t('signUp')}
              </Link>
            )}
          </p>
        </div>
      </form>
    </div>
  )
}

// Standalone login page component
export function LoginPage({ params: { locale } }: { params: { locale: string } }) {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <LoginForm locale={locale} />
        </div>
      </div>
    </div>
  )
}