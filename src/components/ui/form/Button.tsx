'use client'

import { forwardRef, ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  ...props
}, ref) => {
  const baseClasses = [
    'inline-flex items-center justify-center font-medium rounded-md',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'transition-colors duration-200',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  ]

  const variantClasses = {
    primary: [
      'bg-wine-600 text-white shadow-sm',
      'hover:bg-wine-700 focus:ring-wine-500',
      'disabled:hover:bg-wine-600'
    ],
    secondary: [
      'bg-gray-100 text-gray-900 shadow-sm',
      'hover:bg-gray-200 focus:ring-gray-500',
      'disabled:hover:bg-gray-100'
    ],
    outline: [
      'border border-gray-300 bg-white text-gray-700 shadow-sm',
      'hover:bg-gray-50 focus:ring-gray-500',
      'disabled:hover:bg-white'
    ],
    ghost: [
      'text-gray-700',
      'hover:bg-gray-100 focus:ring-gray-500',
      'disabled:hover:bg-transparent'
    ],
    danger: [
      'bg-red-600 text-white shadow-sm',
      'hover:bg-red-700 focus:ring-red-500',
      'disabled:hover:bg-red-600'
    ]
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  const fullWidthClass = fullWidth ? 'w-full' : ''

  return (
    <button
      ref={ref}
      className={cn(
        ...baseClasses,
        ...variantClasses[variant],
        sizeClasses[size],
        fullWidthClass,
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      )}
      {!loading && leftIcon && (
        <span className="mr-2">{leftIcon}</span>
      )}
      {children}
      {!loading && rightIcon && (
        <span className="ml-2">{rightIcon}</span>
      )}
    </button>
  )
})

Button.displayName = 'Button'