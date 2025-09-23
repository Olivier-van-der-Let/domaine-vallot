'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { InputField } from '@/components/ui/form/FormField'
import { Button } from '@/components/ui/form/Button'
import { useAuth } from '@/components/auth/AuthProvider'
import { forgotPasswordSchema, type ForgotPasswordData } from '@/lib/validators/schemas'
import { cn } from '@/lib/utils'

interface ForgotPasswordFormProps {
  locale: string
  className?: string
  onSuccess?: () => void
  showHeader?: boolean
  onBackToLogin?: () => void
}

export function ForgotPasswordForm({
  locale,
  className,
  onSuccess,
  showHeader = true,
  onBackToLogin
}: ForgotPasswordFormProps) {
  const t = useTranslations('Auth')
  const { resetPassword } = useAuth()
  const [authError, setAuthError] = useState<string | null>(null)

  const clearError = () => setAuthError(null)

  const [emailSent, setEmailSent] = useState(false)

  const form = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ''
    }
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    clearErrors
  } = form

  const watchedEmail = watch('email')

  const onSubmit = async (data: ForgotPasswordData) => {
    try {
      clearError()
      clearErrors()

      const result = await resetPassword(data.email)

      if (result.error) {
        setAuthError(result.error)
        return
      }

      setEmailSent(true)
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      console.error('Password reset request error:', err)
    }
  }

  const handleInputChange = () => {
    if (authError) {
      clearError()
    }
  }

  if (emailSent) {
    return (
      <div className={cn('w-full max-w-md mx-auto text-center', className)}>
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {t('resetLinkSent')}
        </h2>

        <p className="text-gray-600 mb-6">
          We've sent a password reset link to <strong>{watchedEmail}</strong>
        </p>

        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Didn't receive the email? Check your spam folder or try again.
          </p>

          <Button
            onClick={() => setEmailSent(false)}
            variant="outline"
            fullWidth
          >
            Send another email
          </Button>

          <div className="text-center">
            {onBackToLogin ? (
              <button
                type="button"
                onClick={onBackToLogin}
                className="text-sm text-wine-600 hover:text-wine-500 font-medium inline-flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                {t('backToLogin')}
              </button>
            ) : (
              <Link
                href={`/${locale}/login`}
                className="text-sm text-wine-600 hover:text-wine-500 font-medium inline-flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                {t('backToLogin')}
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('w-full max-w-md mx-auto', className)}>
      {showHeader && (
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-wine-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-wine-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('forgotPasswordTitle')}
          </h1>

          <p className="text-gray-600">
            {t('forgotPasswordSubtitle')}
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
          autoFocus
          onChange={(e) => {
            register('email').onChange(e)
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
          <Mail className="w-4 h-4 mr-2" />
          {t('sendResetLink')}
        </Button>

        {/* Back to login link */}
        <div className="text-center pt-4 border-t border-gray-200">
          {onBackToLogin ? (
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-sm text-wine-600 hover:text-wine-500 font-medium inline-flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              {t('backToLogin')}
            </button>
          ) : (
            <Link
              href={`/${locale}/login`}
              className="text-sm text-wine-600 hover:text-wine-500 font-medium inline-flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              {t('backToLogin')}
            </Link>
          )}
        </div>
      </form>
    </div>
  )
}

// Standalone forgot password page component
export function ForgotPasswordPage({ params: { locale } }: { params: { locale: string } }) {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <ForgotPasswordForm locale={locale} />
        </div>
      </div>
    </div>
  )
}