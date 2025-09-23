'use client'

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BaseFieldProps {
  label?: string
  error?: string
  success?: string
  hint?: string
  required?: boolean
  className?: string
  labelClassName?: string
  containerClassName?: string
}

// Input field component
interface InputFieldProps extends BaseFieldProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  showPasswordToggle?: boolean
  onPasswordToggle?: () => void
  showPassword?: boolean
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(({
  label,
  error,
  success,
  hint,
  required,
  className,
  labelClassName,
  containerClassName,
  showPasswordToggle,
  onPasswordToggle,
  showPassword,
  type,
  ...props
}, ref) => {
  const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type
  const hasError = !!error
  const hasSuccess = !!success && !hasError

  return (
    <div className={cn('space-y-1', containerClassName)}>
      {label && (
        <label
          htmlFor={props.id}
          className={cn(
            'block text-sm font-medium text-gray-700',
            labelClassName
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          ref={ref}
          type={inputType}
          className={cn(
            'appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 sm:text-sm transition-colors',
            hasError
              ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500'
              : hasSuccess
              ? 'border-green-300 text-green-900 focus:ring-green-500 focus:border-green-500'
              : 'border-gray-300 text-gray-900 focus:ring-wine-500 focus:border-wine-500',
            showPasswordToggle && ((hasError || hasSuccess) ? 'pr-16' : 'pr-10'),
            className
          )}
          aria-invalid={hasError}
          aria-describedby={
            error ? `${props.id}-error` : hint ? `${props.id}-hint` : undefined
          }
          {...props}
        />

        {showPasswordToggle && (
          <button
            type="button"
            className={cn(
              "absolute inset-y-0 right-0 flex items-center",
              (hasError || hasSuccess) ? "pr-10" : "pr-3"
            )}
            onClick={onPasswordToggle}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            )}
          </button>
        )}

        {(hasError || hasSuccess) && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {hasError ? (
              <AlertCircle className="h-4 w-4 text-red-500" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </div>
        )}
      </div>

      {error && (
        <p id={`${props.id}-error`} className="text-sm text-red-600 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
          {error}
        </p>
      )}

      {success && !error && (
        <p className="text-sm text-green-600 flex items-center">
          <CheckCircle className="h-4 w-4 mr-1 flex-shrink-0" />
          {success}
        </p>
      )}

      {hint && !error && !success && (
        <p id={`${props.id}-hint`} className="text-sm text-gray-500">
          {hint}
        </p>
      )}
    </div>
  )
})

InputField.displayName = 'InputField'

// Textarea field component
interface TextareaFieldProps extends BaseFieldProps, Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(({
  label,
  error,
  success,
  hint,
  required,
  className,
  labelClassName,
  containerClassName,
  ...props
}, ref) => {
  const hasError = !!error
  const hasSuccess = !!success && !hasError

  return (
    <div className={cn('space-y-1', containerClassName)}>
      {label && (
        <label
          htmlFor={props.id}
          className={cn(
            'block text-sm font-medium text-gray-700',
            labelClassName
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <textarea
          ref={ref}
          className={cn(
            'appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 sm:text-sm transition-colors',
            hasError
              ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500'
              : hasSuccess
              ? 'border-green-300 text-green-900 focus:ring-green-500 focus:border-green-500'
              : 'border-gray-300 text-gray-900 focus:ring-wine-500 focus:border-wine-500',
            className
          )}
          aria-invalid={hasError}
          aria-describedby={
            error ? `${props.id}-error` : hint ? `${props.id}-hint` : undefined
          }
          {...props}
        />

        {(hasError || hasSuccess) && (
          <div className="absolute top-2 right-2 pointer-events-none">
            {hasError ? (
              <AlertCircle className="h-4 w-4 text-red-500" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </div>
        )}
      </div>

      {error && (
        <p id={`${props.id}-error`} className="text-sm text-red-600 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
          {error}
        </p>
      )}

      {success && !error && (
        <p className="text-sm text-green-600 flex items-center">
          <CheckCircle className="h-4 w-4 mr-1 flex-shrink-0" />
          {success}
        </p>
      )}

      {hint && !error && !success && (
        <p id={`${props.id}-hint`} className="text-sm text-gray-500">
          {hint}
        </p>
      )}
    </div>
  )
})

TextareaField.displayName = 'TextareaField'

// Select field component
interface SelectFieldProps extends BaseFieldProps {
  options: Array<{ value: string; label: string; disabled?: boolean }>
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  multiple?: boolean
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(({
  label,
  error,
  success,
  hint,
  required,
  className,
  labelClassName,
  containerClassName,
  options,
  placeholder,
  ...props
}, ref) => {
  const hasError = !!error
  const hasSuccess = !!success && !hasError

  return (
    <div className={cn('space-y-1', containerClassName)}>
      {label && (
        <label
          htmlFor={props.value}
          className={cn(
            'block text-sm font-medium text-gray-700',
            labelClassName
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          ref={ref}
          className={cn(
            'appearance-none block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 sm:text-sm transition-colors bg-white',
            hasError
              ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500'
              : hasSuccess
              ? 'border-green-300 text-green-900 focus:ring-green-500 focus:border-green-500'
              : 'border-gray-300 text-gray-900 focus:ring-wine-500 focus:border-wine-500',
            className
          )}
          aria-invalid={hasError}
          aria-describedby={
            error ? `${props.value}-error` : hint ? `${props.value}-hint` : undefined
          }
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        {(hasError || hasSuccess) && (
          <div className="absolute inset-y-0 right-8 pr-3 flex items-center pointer-events-none">
            {hasError ? (
              <AlertCircle className="h-4 w-4 text-red-500" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </div>
        )}
      </div>

      {error && (
        <p id={`${props.value}-error`} className="text-sm text-red-600 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
          {error}
        </p>
      )}

      {success && !error && (
        <p className="text-sm text-green-600 flex items-center">
          <CheckCircle className="h-4 w-4 mr-1 flex-shrink-0" />
          {success}
        </p>
      )}

      {hint && !error && !success && (
        <p id={`${props.value}-hint`} className="text-sm text-gray-500">
          {hint}
        </p>
      )}
    </div>
  )
})

SelectField.displayName = 'SelectField'

// Checkbox field component
interface CheckboxFieldProps extends BaseFieldProps {
  checked?: boolean
  onChange?: (checked: boolean) => void
  children: React.ReactNode
}

export const CheckboxField = forwardRef<HTMLInputElement, CheckboxFieldProps>(({
  error,
  success,
  hint,
  className,
  containerClassName,
  children,
  checked,
  onChange,
  ...props
}, ref) => {
  const hasError = !!error
  const hasSuccess = !!success && !hasError

  return (
    <div className={cn('space-y-1', containerClassName)}>
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            ref={ref}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange?.(e.target.checked)}
            className={cn(
              'focus:ring-wine-500 h-4 w-4 text-wine-600 border-gray-300 rounded transition-colors',
              hasError && 'border-red-300',
              className
            )}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${props.id}-error` : hint ? `${props.id}-hint` : undefined
            }
            {...props}
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor={props.id} className="text-gray-700">
            {children}
          </label>
        </div>
      </div>

      {error && (
        <p id={`${props.id}-error`} className="text-sm text-red-600 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
          {error}
        </p>
      )}

      {success && !error && (
        <p className="text-sm text-green-600 flex items-center">
          <CheckCircle className="h-4 w-4 mr-1 flex-shrink-0" />
          {success}
        </p>
      )}

      {hint && !error && !success && (
        <p id={`${props.id}-hint`} className="text-sm text-gray-500">
          {hint}
        </p>
      )}
    </div>
  )
})

CheckboxField.displayName = 'CheckboxField'