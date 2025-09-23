'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Wine, Calendar, AlertTriangle } from 'lucide-react'
import { InputField, SelectField } from '@/components/ui/form/FormField'
import { Button } from '@/components/ui/form/Button'
import { cn } from '@/lib/utils'

interface AgeVerificationProps {
  onVerified: (ageData: {
    birthDate: string
    isValid: boolean
  }) => void
  onSkip?: () => void
  required?: boolean
  className?: string
}

export function AgeVerification({
  onVerified,
  onSkip,
  required = true,
  className
}: AgeVerificationProps) {
  const t = useTranslations('AgeVerification')
  const [birthDate, setBirthDate] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Generate day options (1-31)
  const dayOptions = Array.from({ length: 31 }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1)
  }))

  // Generate month options
  const monthOptions = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ]

  // Generate year options (current year - 100 to current year - 16)
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 85 }, (_, i) => {
    const year = currentYear - 16 - i
    return { value: String(year), label: String(year) }
  })

  const validateAge = (dateString: string): boolean => {
    const birthDate = new Date(dateString)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 >= 18
    }

    return age >= 18
  }

  const handleDateSubmit = async () => {
    if (!birthDate) {
      setError(t('birthDateRequired'))
      return
    }

    setLoading(true)
    setError('')

    try {
      const isValid = validateAge(birthDate)

      if (!isValid) {
        setError(t('underAge'))
        setLoading(false)
        return
      }

      // Call the onVerified callback with the age data
      onVerified({
        birthDate,
        isValid: true
      })
    } catch (err) {
      setError('An error occurred during age verification')
    } finally {
      setLoading(false)
    }
  }

  const handleDateChange = (value: string) => {
    setBirthDate(value)
    setError('')
  }

  return (
    <div className={cn(
      'bg-white rounded-lg shadow-lg border border-gray-200 p-6 max-w-md mx-auto',
      className
    )}>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-wine-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Wine className="w-8 h-8 text-wine-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {t('title')}
        </h2>
        <p className="text-sm text-gray-600">
          {t('description')}
        </p>
      </div>

      {/* Age verification form */}
      <div className="space-y-4">
        <InputField
          id="birthDate"
          type="date"
          label={t('birthDate')}
          value={birthDate}
          onChange={(e) => handleDateChange(e.target.value)}
          error={error}
          required={required}
          max={new Date(currentYear - 16, 11, 31).toISOString().split('T')[0]}
          min={new Date(currentYear - 100, 0, 1).toISOString().split('T')[0]}
        />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col space-y-3">
          <Button
            onClick={handleDateSubmit}
            loading={loading}
            fullWidth
            disabled={!birthDate}
          >
            <Calendar className="w-4 h-4 mr-2" />
            {t('verify')}
          </Button>

          {!required && onSkip && (
            <Button
              onClick={onSkip}
              variant="ghost"
              fullWidth
              disabled={loading}
            >
              Skip for now
            </Button>
          )}
        </div>
      </div>

      {/* Legal notice */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Your information is processed according to our privacy policy.
          Age verification is required by law for alcohol purchases.
        </p>
      </div>
    </div>
  )
}

// Modal wrapper for age verification
interface AgeVerificationModalProps extends AgeVerificationProps {
  isOpen: boolean
  onClose: () => void
}

export function AgeVerificationModal({
  isOpen,
  onClose,
  onVerified,
  ...props
}: AgeVerificationModalProps) {
  if (!isOpen) return null

  const handleVerified = (ageData: { birthDate: string; isValid: boolean }) => {
    onVerified(ageData)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal content */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <AgeVerification
            onVerified={handleVerified}
            className="shadow-none border-none"
            {...props}
          />
        </div>
      </div>
    </div>
  )
}