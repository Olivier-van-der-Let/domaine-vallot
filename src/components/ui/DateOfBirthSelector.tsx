'use client'

import React from 'react'

interface DateOfBirthSelectorProps {
  value: {
    day: number | null
    month: number | null
    year: number | null
  }
  onChange: (value: { day: number | null; month: number | null; year: number | null }) => void
  locale: string
  error?: string
  required?: boolean
}

const DateOfBirthSelector: React.FC<DateOfBirthSelectorProps> = ({
  value,
  onChange,
  locale,
  error,
  required = true
}) => {
  const currentYear = new Date().getFullYear()
  const minYear = currentYear - 120
  const maxYear = currentYear - 16

  const days = Array.from({ length: 31 }, (_, i) => i + 1)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i)

  const monthNames = locale === 'fr' ? [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ] : [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const handleDayChange = (day: string) => {
    onChange({
      ...value,
      day: day ? parseInt(day) : null
    })
  }

  const handleMonthChange = (month: string) => {
    onChange({
      ...value,
      month: month ? parseInt(month) : null
    })
  }

  const handleYearChange = (year: string) => {
    onChange({
      ...value,
      year: year ? parseInt(year) : null
    })
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {locale === 'fr' ? 'Date de naissance' : 'Date of Birth'} {required && '*'}
      </label>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label htmlFor="birth-day" className="sr-only">
            {locale === 'fr' ? 'Jour' : 'Day'}
          </label>
          <select
            id="birth-day"
            value={value.day || ''}
            onChange={(e) => handleDayChange(e.target.value)}
            required={required}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              error ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            data-testid="birth-day"
          >
            <option value="">
              {locale === 'fr' ? 'Jour' : 'Day'}
            </option>
            {days.map(day => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="birth-month" className="sr-only">
            {locale === 'fr' ? 'Mois' : 'Month'}
          </label>
          <select
            id="birth-month"
            value={value.month || ''}
            onChange={(e) => handleMonthChange(e.target.value)}
            required={required}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              error ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            data-testid="birth-month"
          >
            <option value="">
              {locale === 'fr' ? 'Mois' : 'Month'}
            </option>
            {months.map(month => (
              <option key={month} value={month}>
                {monthNames[month - 1]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="birth-year" className="sr-only">
            {locale === 'fr' ? 'Année' : 'Year'}
          </label>
          <select
            id="birth-year"
            value={value.year || ''}
            onChange={(e) => handleYearChange(e.target.value)}
            required={required}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              error ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            data-testid="birth-year"
          >
            <option value="">
              {locale === 'fr' ? 'Année' : 'Year'}
            </option>
            {years.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600" data-testid="birth-date-error">
          {error}
        </p>
      )}

      <p className="mt-1 text-xs text-gray-500">
        {locale === 'fr'
          ? 'Vous devez avoir au moins 18 ans pour commander du vin'
          : 'You must be at least 18 years old to order wine'
        }
      </p>
    </div>
  )
}

export default DateOfBirthSelector