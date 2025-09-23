'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { UserPlus, CheckCircle, AlertCircle, Building, User } from 'lucide-react'
import { InputField, CheckboxField, SelectField } from '@/components/ui/form/FormField'
import { Button } from '@/components/ui/form/Button'
import { AgeVerification } from '@/components/verification/AgeVerification'
import { useAuth } from '@/components/auth/AuthProvider'
import { registerSchema, type RegisterData } from '@/lib/validators/schemas'
import { cn } from '@/lib/utils'

interface RegisterFormProps {
  locale: string
  className?: string
  redirectTo?: string
  onSuccess?: () => void
  showHeader?: boolean
  onSwitchToLogin?: () => void
}

export function RegisterForm({
  locale,
  className,
  redirectTo,
  onSuccess,
  showHeader = true,
  onSwitchToLogin
}: RegisterFormProps) {
  const t = useTranslations('Auth')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signUp } = useAuth()
  const [authError, setAuthError] = useState<string | null>(null)

  const clearError = () => setAuthError(null)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showAgeVerification, setShowAgeVerification] = useState(false)
  const [ageVerified, setAgeVerified] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)

  const redirect = redirectTo || searchParams.get('redirect') || `/${locale}`

  const form = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phone: '',
      birthDate: '',
      preferredLanguage: locale as 'en' | 'fr',
      marketingConsent: false,
      newsletterConsent: false,
      isBusiness: false,
      companyName: '',
      vatNumber: '',
      termsAccepted: false,
      privacyAccepted: false
    }
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    clearErrors
  } = form

  const watchIsBusiness = watch('isBusiness')
  const watchBirthDate = watch('birthDate')

  const onSubmit = async (data: RegisterData) => {
    try {
      clearError()
      clearErrors()

      // Age verification check
      if (!ageVerified && watchBirthDate) {
        const birthDate = new Date(watchBirthDate)
        const age = new Date().getFullYear() - birthDate.getFullYear()
        if (age < 18) {
          setShowAgeVerification(true)
          return
        }
      }

      // Create the account with Supabase
      const result = await signUp(data.email, data.password, {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        birthDate: data.birthDate,
        preferredLanguage: data.preferredLanguage,
        marketingConsent: data.marketingConsent || false,
        newsletterConsent: data.newsletterConsent || false,
        isBusiness: data.isBusiness || false,
        companyName: data.companyName,
        vatNumber: data.vatNumber
      })

      if (result.error) {
        setAuthError(result.error)
        return
      }

      setRegistrationSuccess(true)

      // Brief delay to show success message
      setTimeout(() => {
        if (onSuccess) {
          onSuccess()
        } else {
          router.push(redirect)
        }
      }, 2000)
    } catch (err) {
      console.error('Registration error:', err)
    }
  }

  const handleAgeVerified = (ageData: { birthDate: string; isValid: boolean }) => {
    if (ageData.isValid) {
      setAgeVerified(true)
      setValue('birthDate', ageData.birthDate)
      setShowAgeVerification(false)
    }
  }

  const handleInputChange = () => {
    if (authError) {
      clearError()
    }
  }

  if (showAgeVerification) {
    return (
      <div className={cn('w-full max-w-md mx-auto', className)}>
        <AgeVerification
          onVerified={handleAgeVerified}
          onSkip={() => setShowAgeVerification(false)}
          required={false}
        />
      </div>
    )
  }

  if (registrationSuccess) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t('accountCreated')}
        </h3>
        <p className="text-gray-600 mb-4">
          {t('emailVerificationSent')}
        </p>
        <p className="text-sm text-gray-500">
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
            {t('registerTitle')}
          </h1>
          <p className="text-gray-600">
            {t('registerSubtitle')}
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

        {/* Account type selection */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setValue('isBusiness', false)}
              className={cn(
                'p-3 rounded-lg border-2 flex flex-col items-center space-y-2 transition-colors',
                !watchIsBusiness
                  ? 'border-wine-500 bg-wine-50 text-wine-700'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <User className="w-6 h-6" />
              <span className="text-sm font-medium">Personal</span>
            </button>
            <button
              type="button"
              onClick={() => setValue('isBusiness', true)}
              className={cn(
                'p-3 rounded-lg border-2 flex flex-col items-center space-y-2 transition-colors',
                watchIsBusiness
                  ? 'border-wine-500 bg-wine-50 text-wine-700'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <Building className="w-6 h-6" />
              <span className="text-sm font-medium">Business</span>
            </button>
          </div>
        </div>

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

        {/* Name fields */}
        <div className="grid grid-cols-2 gap-4">
          <InputField
            {...register('firstName')}
            id="firstName"
            type="text"
            label={t('firstName')}
            placeholder="John"
            error={errors.firstName?.message}
            required
            autoComplete="given-name"
            onChange={(e) => {
              register('firstName').onChange(e)
              handleInputChange()
            }}
          />
          <InputField
            {...register('lastName')}
            id="lastName"
            type="text"
            label={t('lastName')}
            placeholder="Doe"
            error={errors.lastName?.message}
            required
            autoComplete="family-name"
            onChange={(e) => {
              register('lastName').onChange(e)
              handleInputChange()
            }}
          />
        </div>

        {/* Business fields */}
        {watchIsBusiness && (
          <>
            <InputField
              {...register('companyName')}
              id="companyName"
              type="text"
              label={t('companyName')}
              placeholder="Your Company Name"
              error={errors.companyName?.message}
              required={watchIsBusiness}
              autoComplete="organization"
            />
            <InputField
              {...register('vatNumber')}
              id="vatNumber"
              type="text"
              label={t('vatNumber')}
              placeholder="FR12345678901"
              error={errors.vatNumber?.message}
              hint="Format: Country code + VAT number (e.g., FR12345678901)"
            />
          </>
        )}

        {/* Contact fields */}
        <InputField
          {...register('phone')}
          id="phone"
          type="tel"
          label={t('phone')}
          placeholder="+33 1 23 45 67 89"
          error={errors.phone?.message}
          autoComplete="tel"
        />

        <InputField
          {...register('birthDate')}
          id="birthDate"
          type="date"
          label={t('birthDate')}
          error={errors.birthDate?.message}
          required
          max={new Date(new Date().getFullYear() - 16, 11, 31).toISOString().split('T')[0]}
          min={new Date(new Date().getFullYear() - 100, 0, 1).toISOString().split('T')[0]}
        />

        {/* Language preference */}
        <SelectField
          {...register('preferredLanguage')}
          label={t('preferredLanguage')}
          options={[
            { value: 'en', label: t('english') },
            { value: 'fr', label: t('french') }
          ]}
          error={errors.preferredLanguage?.message}
        />

        {/* Password fields */}
        <InputField
          {...register('password')}
          id="password"
          type="password"
          label={t('password')}
          placeholder="••••••••"
          error={errors.password?.message}
          required
          autoComplete="new-password"
          showPasswordToggle
          showPassword={showPassword}
          onPasswordToggle={() => setShowPassword(!showPassword)}
          hint={t('passwordRequirements')}
        />

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
        />

        {/* Consent checkboxes */}
        <div className="space-y-4">
          <CheckboxField
            id="termsAccepted"
            checked={watch('termsAccepted')}
            onChange={(checked) => setValue('termsAccepted', checked)}
            error={errors.termsAccepted?.message}
          >
            <span className="text-sm">
              {t('termsAndPrivacy')}{' '}
              <Link href={`/${locale}/legal/terms`} className="text-wine-600 hover:text-wine-500" target="_blank">
                Terms of Service
              </Link>
              {' and '}
              <Link href={`/${locale}/legal/privacy`} className="text-wine-600 hover:text-wine-500" target="_blank">
                Privacy Policy
              </Link>
            </span>
          </CheckboxField>

          <CheckboxField
            id="marketingConsent"
            checked={watch('marketingConsent')}
            onChange={(checked) => setValue('marketingConsent', checked)}
          >
            <span className="text-sm">{t('marketingConsent')}</span>
          </CheckboxField>
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          fullWidth
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          {t('createAccount')}
        </Button>

        {/* Sign in link */}
        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            {t('hasAccount')}{' '}
            {onSwitchToLogin ? (
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="font-medium text-wine-600 hover:text-wine-500"
              >
                {t('signIn')}
              </button>
            ) : (
              <Link
                href={`/${locale}/login${searchParams.get('redirect') ? `?redirect=${encodeURIComponent(searchParams.get('redirect')!)}` : ''}`}
                className="font-medium text-wine-600 hover:text-wine-500"
              >
                {t('signIn')}
              </Link>
            )}
          </p>
        </div>
      </form>
    </div>
  )
}

// Standalone register page component
export function RegisterPage({ params: { locale } }: { params: { locale: string } }) {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <RegisterForm locale={locale} />
        </div>
      </div>
    </div>
  )
}