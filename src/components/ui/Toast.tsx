'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { WineProduct } from '@/types'

export interface ToastProps {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message: string
  wine?: WineProduct
  action?: {
    label: string
    onClick: () => void
  }
  duration?: number
  onClose: () => void
}

const iconMap = {
  success: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  )
}

const colorMap = {
  success: {
    container: 'bg-heritage-olive-50 border-heritage-olive-200',
    icon: 'text-heritage-olive-600',
    title: 'text-heritage-olive-800',
    message: 'text-heritage-olive-700',
    close: 'text-heritage-olive-400 hover:text-heritage-olive-600'
  },
  error: {
    container: 'bg-heritage-rouge-50 border-heritage-rouge-200',
    icon: 'text-heritage-rouge-600',
    title: 'text-heritage-rouge-800',
    message: 'text-heritage-rouge-700',
    close: 'text-heritage-rouge-400 hover:text-heritage-rouge-600'
  },
  warning: {
    container: 'bg-heritage-golden-50 border-heritage-golden-200',
    icon: 'text-heritage-golden-600',
    title: 'text-heritage-golden-800',
    message: 'text-heritage-golden-700',
    close: 'text-heritage-golden-400 hover:text-heritage-golden-600'
  },
  info: {
    container: 'bg-heritage-limestone-50 border-heritage-limestone-200',
    icon: 'text-heritage-slate-600',
    title: 'text-heritage-slate-800',
    message: 'text-heritage-slate-700',
    close: 'text-heritage-slate-400 hover:text-heritage-slate-600'
  }
}

export function Toast({
  id,
  type,
  title,
  message,
  wine,
  action,
  duration = 5000,
  onClose
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    // Trigger entrance animation
    const timer1 = setTimeout(() => setIsVisible(true), 10)

    // Auto-close timer
    let closeTimer: NodeJS.Timeout | null = null
    let progressTimer: NodeJS.Timeout | null = null

    if (duration > 0) {
      // Progress bar animation
      const startTime = Date.now()
      progressTimer = setInterval(() => {
        const elapsed = Date.now() - startTime
        const remaining = Math.max(0, duration - elapsed)
        setProgress((remaining / duration) * 100)
      }, 16) // ~60fps

      // Auto-close
      closeTimer = setTimeout(() => {
        handleClose()
      }, duration)
    }

    return () => {
      clearTimeout(timer1)
      if (closeTimer) clearTimeout(closeTimer)
      if (progressTimer) clearInterval(progressTimer)
    }
  }, [duration, onClose])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => onClose(), 300) // Match exit animation duration
  }

  const colors = colorMap[type]

  return createPortal(
    <div
      className={cn(
        "fixed top-4 right-4 z-50 w-full max-w-md",
        "transform transition-all duration-300 ease-out",
        isVisible && !isExiting
          ? "translate-x-0 opacity-100 scale-100"
          : "translate-x-full opacity-0 scale-95"
      )}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className={cn(
          "relative rounded-lg border shadow-lg backdrop-blur-sm overflow-hidden",
          colors.container
        )}
      >
        {/* Progress bar */}
        {duration > 0 && (
          <div className="absolute bottom-0 left-0 h-1 bg-black/10">
            <div
              className="h-full bg-current opacity-50 transition-all duration-75 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="p-4">
          <div className="flex items-start">
            {/* Icon */}
            <div className={cn("flex-shrink-0", colors.icon)}>
              {iconMap[type]}
            </div>

            {/* Wine bottle emoji for wine-related toasts */}
            {wine && (
              <span className="ml-2 text-lg" role="img" aria-label="wine">
                🍷
              </span>
            )}

            {/* Content */}
            <div className="ml-3 flex-1 min-w-0">
              <h4 className={cn("text-sm font-medium", colors.title)}>
                {title}
              </h4>

              <div className={cn("mt-1 text-sm", colors.message)}>
                <p>{message}</p>

                {/* Wine details */}
                {wine && (
                  <div className="mt-2 p-2 bg-white/50 rounded border border-white/20">
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="font-medium">{wine.name}</span>
                      {wine.vintage_display && (
                        <>
                          <span>•</span>
                          <span>{wine.vintage_display}</span>
                        </>
                      )}
                      {wine.price_display && (
                        <>
                          <span>•</span>
                          <span>€{wine.price_display}</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action button */}
              {action && (
                <div className="mt-3">
                  <button
                    onClick={action.onClick}
                    className={cn(
                      "text-sm font-medium underline transition-colors",
                      colors.title,
                      "hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2",
                      type === 'success' && "focus:ring-heritage-olive-500",
                      type === 'error' && "focus:ring-heritage-rouge-500",
                      type === 'warning' && "focus:ring-heritage-golden-500",
                      type === 'info' && "focus:ring-heritage-slate-500"
                    )}
                  >
                    {action.label}
                  </button>
                </div>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className={cn(
                "flex-shrink-0 ml-3 rounded-md p-1 transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-offset-2",
                colors.close,
                type === 'success' && "focus:ring-heritage-olive-500",
                type === 'error' && "focus:ring-heritage-rouge-500",
                type === 'warning' && "focus:ring-heritage-golden-500",
                type === 'info' && "focus:ring-heritage-slate-500"
              )}
              aria-label="Close notification"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}