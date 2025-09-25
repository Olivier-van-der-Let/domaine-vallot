'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { WineProduct } from '@/types'

export interface AddToCartButtonProps {
  product: WineProduct | any // Support both type systems
  quantity: number
  onAdd: (productId: string, quantity: number) => Promise<boolean>
  variant?: 'primary' | 'secondary'
  locale?: string
  className?: string
  disabled?: boolean
}

const buttonStates = {
  idle: 'idle',
  loading: 'loading',
  success: 'success',
  error: 'error'
} as const

type ButtonState = typeof buttonStates[keyof typeof buttonStates]

const stateConfig = {
  idle: {
    text: { en: 'Add to Cart', fr: 'Ajouter au Panier' },
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10l.938 10.314A2 2 0 0116.938 16H7.062a2 2 0 01-1.937-1.686L7 4z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9v2m3-2v2m3-2v2" />
      </svg>
    ),
    className: ''
  },
  loading: {
    text: { en: 'Adding...', fr: 'Ajout...' },
    icon: (
      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
    ),
    className: 'cursor-wait'
  },
  success: {
    text: { en: 'Added!', fr: 'Ajouté!' },
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    className: 'bg-heritage-olive-600 hover:bg-heritage-olive-700 scale-105'
  },
  error: {
    text: { en: 'Try Again', fr: 'Réessayer' },
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
    className: 'bg-heritage-rouge-600 hover:bg-heritage-rouge-700 animate-pulse'
  }
}

export default function AddToCartButton({
  product,
  quantity,
  onAdd,
  variant = 'primary',
  locale = 'en',
  className = '',
  disabled = false
}: AddToCartButtonProps) {
  const [state, setState] = useState<ButtonState>(buttonStates.idle)
  const [lastSuccessTime, setLastSuccessTime] = useState<number>(0)

  // Auto-reset success state after 2 seconds
  useEffect(() => {
    let timer: NodeJS.Timeout

    if (state === buttonStates.success) {
      timer = setTimeout(() => {
        setState(buttonStates.idle)
      }, 2000)
    } else if (state === buttonStates.error) {
      timer = setTimeout(() => {
        setState(buttonStates.idle)
      }, 3000)
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [state])

  // Check if product is in stock
  const isInStock = product.in_stock ?? product.isInStock ?? (product.stockQuantity ?? product.stock_quantity) > 0
  const isOutOfStock = !isInStock

  const handleClick = async () => {
    if (disabled || isOutOfStock || state === buttonStates.loading) {
      return
    }

    // Prevent double-clicks within 1 second
    const now = Date.now()
    if (now - lastSuccessTime < 1000) {
      return
    }

    setState(buttonStates.loading)

    try {
      const success = await onAdd(product.id, quantity)

      if (success) {
        setState(buttonStates.success)
        setLastSuccessTime(now)

        // Trigger haptic feedback on mobile
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(50) // Quick success vibration
        }
      } else {
        setState(buttonStates.error)
      }
    } catch (error) {
      console.error('Add to cart error:', error)
      setState(buttonStates.error)
    }
  }

  const currentState = stateConfig[state]
  const buttonText = currentState.text[locale as 'en' | 'fr'] || currentState.text.en

  const baseClasses = variant === 'primary'
    ? 'bg-heritage-rouge-700 hover:bg-heritage-rouge-800 text-white'
    : 'border-2 border-heritage-rouge-700 text-heritage-rouge-700 hover:bg-heritage-rouge-700 hover:text-white'

  const isButtonDisabled = disabled || isOutOfStock || state === buttonStates.loading

  // Out of stock button
  if (isOutOfStock) {
    return (
      <button
        disabled
        className={cn(
          'w-full flex items-center justify-center gap-3 px-8 py-4 rounded-lg font-semibold text-lg',
          'bg-heritage-slate-300 text-heritage-slate-500 cursor-not-allowed',
          'shadow-lg transition-none',
          className
        )}
        data-testid="add-to-cart-button-out-of-stock"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
        </svg>
        {locale === 'fr' ? 'Rupture de Stock' : 'Out of Stock'}
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={isButtonDisabled}
      className={cn(
        'w-full flex items-center justify-center gap-3 px-8 py-4 rounded-lg font-semibold text-lg',
        'shadow-lg transition-all duration-200 ease-out',
        'focus:outline-none focus:ring-2 focus:ring-heritage-rouge-300 focus:ring-offset-2',
        'active:scale-95',
        baseClasses,
        currentState.className,
        isButtonDisabled && 'opacity-50 cursor-not-allowed',
        // Prevent text selection
        'select-none',
        // Smooth transforms
        'transform-gpu',
        className
      )}
      data-testid="add-to-cart-button"
      aria-label={
        state === buttonStates.loading
          ? (locale === 'fr' ? 'Ajout en cours...' : 'Adding to cart...')
          : `${buttonText} - ${product.name || ''}`
      }
      aria-disabled={isButtonDisabled}
    >
      {/* Icon with smooth transitions */}
      <span
        className={cn(
          'transition-transform duration-200',
          state === buttonStates.success && 'animate-bounce'
        )}
      >
        {currentState.icon}
      </span>

      {/* Text with smooth transitions */}
      <span className="relative">
        <span
          className={cn(
            'transition-all duration-200',
            state === buttonStates.loading && 'opacity-75'
          )}
        >
          {buttonText}
        </span>

        {/* Quantity indicator for success state */}
        {state === buttonStates.success && quantity > 1 && (
          <span className="ml-2 text-sm opacity-90">
            ({quantity} {locale === 'fr' ? 'bouteilles' : 'bottles'})
          </span>
        )}
      </span>

      {/* Subtle pulse animation for loading state */}
      {state === buttonStates.loading && (
        <div className="absolute inset-0 rounded-lg bg-white/10 animate-pulse" />
      )}
    </button>
  )
}

// Enhanced version with wine-specific features
interface EnhancedAddToCartButtonProps extends AddToCartButtonProps {
  showStock?: boolean
  showVintage?: boolean
  maxQuantity?: number
}

export function EnhancedAddToCartButton({
  product,
  quantity,
  onAdd,
  variant = 'primary',
  locale = 'en',
  className = '',
  disabled = false,
  showStock = true,
  showVintage = false,
  maxQuantity
}: EnhancedAddToCartButtonProps) {
  const stockQuantity = product.stockQuantity ?? product.stock_quantity ?? 0
  const isLowStock = stockQuantity > 0 && stockQuantity <= 5
  const vintage = product.vintage ?? product.vintage_display

  return (
    <div className="space-y-3">
      {/* Stock and vintage info */}
      {(showStock || showVintage) && (
        <div className="flex items-center justify-between text-sm">
          {showStock && (
            <div className={cn(
              'flex items-center gap-1',
              isLowStock ? 'text-heritage-rouge-600' : 'text-heritage-olive-600'
            )}>
              <div className={cn(
                'w-2 h-2 rounded-full',
                isLowStock ? 'bg-heritage-rouge-600' : 'bg-heritage-olive-600'
              )} />
              {stockQuantity > 0 ? (
                <>
                  {stockQuantity} {locale === 'fr' ? 'en stock' : 'in stock'}
                  {isLowStock && ` (${locale === 'fr' ? 'stock faible' : 'low stock'})`}
                </>
              ) : (
                locale === 'fr' ? 'Rupture de stock' : 'Out of stock'
              )}
            </div>
          )}

          {showVintage && vintage && (
            <div className="text-heritage-slate-600">
              {locale === 'fr' ? 'Millésime' : 'Vintage'} {vintage}
            </div>
          )}
        </div>
      )}

      {/* Max quantity warning */}
      {maxQuantity && quantity >= maxQuantity && (
        <div className="text-sm text-heritage-golden-600 bg-heritage-golden-50 px-3 py-2 rounded-lg">
          {locale === 'fr'
            ? `Quantité maximale: ${maxQuantity} bouteilles`
            : `Maximum quantity: ${maxQuantity} bottles`
          }
        </div>
      )}

      {/* The button */}
      <AddToCartButton
        product={product}
        quantity={quantity}
        onAdd={onAdd}
        variant={variant}
        locale={locale}
        className={className}
        disabled={disabled || (maxQuantity ? quantity > maxQuantity : false)}
      />
    </div>
  )
}