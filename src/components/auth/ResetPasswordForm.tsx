'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, CheckCircle, AlertCircle } from 'lucide-react'
import { InputField } from '@/components/ui/form/FormField'
import { Button } from '@/components/ui/form/Button'
import { useAuth } from '@/components/auth/AuthProvider'
import { resetPasswordSchema, type ResetPasswordData } from '@/lib/validators/schemas'
import { cn } from '@/lib/utils'

interface ResetPasswordFormProps {
  locale: string
  token?: string
  className?: string
  onSuccess?: () => void
  showHeader?: boolean
  onBackToLogin?: () => void
}

export function ResetPasswordForm({
  locale,
  token,
  className,
  onSuccess,
  showHeader = true,
  onBackToLogin
}: ResetPasswordFormProps) {
  const t = useTranslations('Auth')
  const router = useRouter()
  const { updatePassword } = useAuth()
  const [authError, setAuthError] = useState<string | null>(null)

  const clearError = () => setAuthError(null)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  const form = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: token || '',
      password: '',
      confirmPassword: ''
    }
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    clearErrors
  } = form

  const onSubmit = async (data: ResetPasswordData) => {
    try {
      clearError()
      clearErrors()

      const result = await updatePassword(data.password)

      if (result.error) {
        setAuthError(result.error)
        return
      }

      setResetSuccess(true)

      // Brief delay to show success message, then redirect to login
      setTimeout(() => {
        if (onSuccess) {
          onSuccess()
        } else {
          router.push(`/${locale}/login`)
        }
      }, 2000)
    } catch (err) {
      console.error('Password reset error:', err)
    }
  }

  const handleInputChange = () => {
    if (authError) {
      clearError()
    }
  }

  if (resetSuccess) {
    return (
      <div className={cn('w-full max-w-md mx-auto text-center', className)}>
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {t('passwordResetSuccess')}
        </h2>

        <p className="text-gray-600 mb-4">
          Your password has been successfully reset. You can now sign in with your new password.
        </p>

        <p className="text-sm text-gray-500">
          Redirecting to login...
        </p>
      </div>
    )
  }

  return (
    <div className={cn('w-full max-w-md mx-auto', className)}>
      {showHeader && (
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-wine-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-wine-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('resetPasswordTitle')}
          </h1>

          <p className="text-gray-600">
            {t('resetPasswordSubtitle')}
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

        {/* Hidden token field */}
        <input type="hidden" {...register('token')} />

        {/* New password field */}
        <InputField
          {...register('password')}
          id="password"
          type="password"
          label={t('newPassword')}
          placeholder="••••••••"
          error={errors.password?.message}
          required
          autoComplete="new-password"
          autoFocus
          showPasswordToggle
          showPassword={showPassword}
          onPasswordToggle={() => setShowPassword(!showPassword)}
          hint={t('passwordRequirements')}
          onChange={(e) => {
            register('password').onChange(e)
            handleInputChange()
          }}
        />

        {/* Confirm password field */}
        <InputField
          {...register('confirmPassword')}
          id="confirmPassword"
          type="password"
          label={t('confirmPassword')}
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          required
          autoComplete="new-password"
          showPasswordToggle
          showPassword={showConfirmPassword}
          onPasswordToggle={() => setShowConfirmPassword(!showConfirmPassword)}
          onChange={(e) => {
            register('confirmPassword').onChange(e)
            handleInputChange()
          }}
        />

        {/* Submit button */}
        <Button
          type="submit"
          fullWidth
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          <Lock className="w-4 h-4 mr-2" />
          {t('resetPassword')}
        </Button>

        {/* Back to login link */}
        <div className="text-center pt-4 border-t border-gray-200">
          {onBackToLogin ? (
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-sm text-wine-600 hover:text-wine-500 font-medium"
            >
              {t('backToLogin')}
            </button>
          ) : (
            <Link
              href={`/${locale}/login`}
              className="text-sm text-wine-600 hover:text-wine-500 font-medium"
            >
              {t('backToLogin')}
            </Link>
          )}
        </div>
      </form>
    </div>
  )
}

// Reset password page with URL token handling
export function ResetPasswordPage({
  params: { locale },
  searchParams
}: {
  params: { locale: string }
  searchParams: { token?: string }
}) {
  const token = searchParams.token

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Invalid Reset Link
            </h2>
            <p className="text-gray-600 mb-6">
              This password reset link is invalid or has expired.
            </p>
            <Link
              href={`/${locale}/forgot-password`}
              className="text-wine-600 hover:text-wine-500 font-medium"
            >
              Request a new reset link
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <ResetPasswordForm locale={locale} token={token} />
        </div>
      </div>
    </div>
  )
}