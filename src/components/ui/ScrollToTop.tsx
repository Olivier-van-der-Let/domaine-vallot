'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { useScrollHeader, useScrollToTop } from '@/hooks/useScrollHeader'

interface ScrollToTopProps {
  /**
   * Threshold in pixels for when to show the button
   */
  threshold?: number
  /**
   * Position of the button
   */
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center'
  /**
   * Size variant of the button
   */
  size?: 'sm' | 'md' | 'lg'
  /**
   * Additional CSS classes
   */
  className?: string
  /**
   * Whether to show accessibility label
   */
  showLabel?: boolean
}

export default function ScrollToTop({
  threshold = 200,
  position = 'bottom-right',
  size = 'md',
  className,
  showLabel = false
}: ScrollToTopProps) {
  const { isScrolled, scrollY } = useScrollHeader({ threshold, hideOnDown: false })
  const scrollToTop = useScrollToTop()

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-center': 'bottom-6 left-1/2 transform -translate-x-1/2'
  }

  // Size classes
  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-14 h-14 text-lg'
  }

  // Don't render if not scrolled enough
  if (!isScrolled) {
    return null
  }

  return (
    <button
      onClick={scrollToTop}
      className={cn(
        // Base styles
        'fixed z-40 group',
        'bg-heritage-rouge hover:bg-heritage-rouge/90',
        'text-heritage-limestone',
        'rounded-full shadow-lg hover:shadow-xl',
        'transition-all duration-300 ease-in-out',
        'focus:outline-none focus:ring-2 focus:ring-heritage-golden/50 focus:ring-offset-2',
        'backdrop-blur-sm',
        // Animation and interaction
        'hover:scale-110 active:scale-95',
        'transform translate-y-0 opacity-100',
        // Size and position
        sizeClasses[size],
        positionClasses[position],
        className
      )}
      aria-label={showLabel ? 'Scroll to top' : undefined}
      title="Scroll to top"
    >
      {/* Arrow icon */}
      <svg
        className="w-5 h-5 mx-auto transition-transform duration-200 group-hover:-translate-y-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 10l7-7m0 0l7 7m-7-7v18"
        />
      </svg>

      {/* Optional label */}
      {showLabel && (
        <span className="sr-only">
          Scroll to top of page
        </span>
      )}

      {/* Scroll progress indicator (optional subtle enhancement) */}
      <div
        className="absolute inset-0 rounded-full border-2 border-heritage-golden/30"
        style={{
          background: `conic-gradient(from 0deg, transparent ${
            Math.min((scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 360, 360)
          }deg, transparent 0deg)`
        }}
      />
    </button>
  )
}

/**
 * Hook to control scroll-to-top button visibility and behavior
 * Can be used in other components that need scroll-based visibility
 */
export function useScrollToTopVisibility(threshold: number = 200) {
  const { isScrolled, scrollY } = useScrollHeader({ threshold, hideOnDown: false })
  const scrollToTop = useScrollToTop()

  return {
    isVisible: isScrolled,
    scrollToTop,
    scrollProgress: Math.min((scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100, 100)
  }
}