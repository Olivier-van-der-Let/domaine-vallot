'use client'

import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import { Toast, ToastProps } from './Toast'
import { WineProduct } from '@/types'

interface ToastContextType {
  showToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => string
  showSuccess: (title: string, message: string, wine?: WineProduct) => string
  showError: (title: string, message: string) => string
  showWarning: (title: string, message: string) => string
  showInfo: (title: string, message: string) => string
  dismissToast: (id: string) => void
  dismissAll: () => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: React.ReactNode
  maxToasts?: number
}

interface ToastState extends Omit<ToastProps, 'onClose'> {
  id: string
}

export function ToastProvider({ children, maxToasts = 5 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastState[]>([])
  const counterRef = useRef(0)

  const generateId = useCallback(() => {
    return `toast-${Date.now()}-${++counterRef.current}`
  }, [])

  const showToast = useCallback((toastProps: Omit<ToastProps, 'id' | 'onClose'>): string => {
    const id = generateId()

    setToasts(current => {
      const newToasts = [
        ...current,
        { ...toastProps, id }
      ]

      // Limit the number of toasts
      if (newToasts.length > maxToasts) {
        return newToasts.slice(-maxToasts)
      }

      return newToasts
    })

    return id
  }, [generateId, maxToasts])

  const showSuccess = useCallback((
    title: string,
    message: string,
    wine?: WineProduct
  ): string => {
    return showToast({
      type: 'success',
      title,
      message,
      wine,
      duration: 5000
    })
  }, [showToast])

  const showError = useCallback((title: string, message: string): string => {
    return showToast({
      type: 'error',
      title,
      message,
      duration: 7000 // Keep error messages visible longer
    })
  }, [showToast])

  const showWarning = useCallback((title: string, message: string): string => {
    return showToast({
      type: 'warning',
      title,
      message,
      duration: 6000
    })
  }, [showToast])

  const showInfo = useCallback((title: string, message: string): string => {
    return showToast({
      type: 'info',
      title,
      message,
      duration: 4000
    })
  }, [showToast])

  const dismissToast = useCallback((id: string) => {
    setToasts(current => current.filter(toast => toast.id !== id))
  }, [])

  const dismissAll = useCallback(() => {
    setToasts([])
  }, [])

  const contextValue: ToastContextType = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    dismissToast,
    dismissAll
  }

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            className="pointer-events-auto"
            style={{
              // Stagger the toasts with a slight offset
              transform: `translateY(${index * 4}px)`,
              zIndex: 50 + toasts.length - index
            }}
          >
            <Toast
              {...toast}
              onClose={() => dismissToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// Hook for wine-specific toast messages
export function useWineToast() {
  const { showSuccess, showError, showWarning } = useToast()

  const showWineAddedToCart = useCallback((wine: WineProduct, quantity: number = 1) => {
    const quantityText = quantity === 1 ? 'bottle' : 'bottles'
    return showSuccess(
      'Added to Cart!',
      `${quantity} ${quantityText} added to your cart`,
      wine
    )
  }, [showSuccess])

  const showWineOutOfStock = useCallback((wine: WineProduct) => {
    return showWarning(
      'Out of Stock',
      `${wine.name} is currently unavailable`,
      wine
    )
  }, [showWarning])

  const showWineAddError = useCallback((wine: WineProduct, error: string) => {
    return showError(
      'Failed to Add Wine',
      error || 'Unable to add wine to cart. Please try again.'
    )
  }, [showError])

  const showCartUpdated = useCallback((wine: WineProduct, newQuantity: number) => {
    const quantityText = newQuantity === 1 ? 'bottle' : 'bottles'
    return showSuccess(
      'Cart Updated',
      `${wine.name} quantity updated to ${newQuantity} ${quantityText}`,
      wine
    )
  }, [showSuccess])

  const showWineRemoved = useCallback((wine: WineProduct) => {
    return showSuccess(
      'Removed from Cart',
      `${wine.name} has been removed from your cart`,
      wine
    )
  }, [showSuccess])

  const showAgeVerificationRequired = useCallback(() => {
    return showWarning(
      'Age Verification Required',
      'You must be 18+ to purchase wine. Please verify your age to continue.'
    )
  }, [showWarning])

  return {
    showWineAddedToCart,
    showWineOutOfStock,
    showWineAddError,
    showCartUpdated,
    showWineRemoved,
    showAgeVerificationRequired
  }
}

// Hook for cart-specific feedback with haptic support
export function useCartFeedback() {
  const { showSuccess, showError, showWarning } = useToast()

  // Haptic feedback for mobile devices
  const triggerHaptic = useCallback((type: 'success' | 'warning' | 'error' = 'success') => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      // Different vibration patterns for different types
      switch (type) {
        case 'success':
          navigator.vibrate(50) // Quick success tap
          break
        case 'warning':
          navigator.vibrate([100, 50, 100]) // Double tap for warning
          break
        case 'error':
          navigator.vibrate([200, 100, 200]) // Longer pattern for errors
          break
      }
    }
  }, [])

  const showCartSuccess = useCallback((message: string, wine?: WineProduct) => {
    triggerHaptic('success')
    return showSuccess('Cart Updated', message, wine)
  }, [showSuccess, triggerHaptic])

  const showCartError = useCallback((message: string) => {
    triggerHaptic('error')
    return showError('Cart Error', message)
  }, [showError, triggerHaptic])

  const showCartWarning = useCallback((message: string) => {
    triggerHaptic('warning')
    return showWarning('Cart Warning', message)
  }, [showWarning, triggerHaptic])

  return {
    showCartSuccess,
    showCartError,
    showCartWarning,
    triggerHaptic
  }
}