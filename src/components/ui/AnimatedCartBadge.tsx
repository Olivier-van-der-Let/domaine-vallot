'use client'

import React, { useEffect, useState, useRef } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedCartBadgeProps {
  count: number
  className?: string
  maxCount?: number
}

export function AnimatedCartBadge({
  count,
  className = '',
  maxCount = 99
}: AnimatedCartBadgeProps) {
  const [displayCount, setDisplayCount] = useState(count)
  const [isAnimating, setIsAnimating] = useState(false)
  const [animationType, setAnimationType] = useState<'bounce' | 'pulse' | 'scale'>('bounce')
  const prevCountRef = useRef(count)

  // Format count for display
  const formatCount = (num: number): string => {
    if (num > maxCount) return `${maxCount}+`
    return num.toString()
  }

  // Animate when count changes
  useEffect(() => {
    const prevCount = prevCountRef.current

    if (count !== prevCount) {
      // Determine animation type based on change
      if (count > prevCount) {
        // Items added - use bounce
        setAnimationType('bounce')
      } else if (count < prevCount) {
        // Items removed - use pulse
        setAnimationType('pulse')
      } else {
        // Generic change - use scale
        setAnimationType('scale')
      }

      // Trigger animation
      setIsAnimating(true)

      // Update display count after a short delay for smooth transition
      const updateTimer = setTimeout(() => {
        setDisplayCount(count)
      }, count > prevCount ? 100 : 0)

      // Reset animation state
      const resetTimer = setTimeout(() => {
        setIsAnimating(false)
      }, 1000)

      prevCountRef.current = count

      return () => {
        clearTimeout(updateTimer)
        clearTimeout(resetTimer)
      }
    }
  }, [count])

  // Don't render if count is 0
  if (count === 0) return null

  const animationClasses = {
    bounce: 'animate-bounce',
    pulse: 'animate-pulse',
    scale: 'animate-ping'
  }

  return (
    <div className="relative">
      {/* Main badge */}
      <span
        className={cn(
          'absolute -top-1 -right-1 flex items-center justify-center font-bold shadow-lg',
          'transform transition-all duration-200 ease-out',
          'bg-heritage-rouge text-heritage-limestone text-xs rounded-full',
          // Size based on content
          count > maxCount
            ? 'h-6 w-8 px-1' // Wider for 99+
            : 'h-5 w-5',      // Square for single/double digits
          // Animation classes
          isAnimating && animationClasses[animationType],
          isAnimating && 'scale-110',
          // Accessibility
          'ring-2 ring-white ring-offset-0',
          className
        )}
        data-testid="cart-badge"
        aria-label={`${count} items in cart`}
      >
        {formatCount(displayCount)}
      </span>

      {/* Pulse ring effect for additions */}
      {isAnimating && animationType === 'bounce' && (
        <span
          className={cn(
            'absolute -top-1 -right-1 rounded-full',
            'bg-heritage-rouge opacity-25 animate-ping',
            count > maxCount ? 'h-6 w-8' : 'h-5 w-5'
          )}
          aria-hidden="true"
        />
      )}
    </div>
  )
}

// Higher-order component for cart icons with animated badge
interface CartIconWithBadgeProps {
  count: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  'aria-label'?: string
}

export function CartIconWithBadge({
  count,
  className = '',
  size = 'md',
  onClick,
  'aria-label': ariaLabel
}: CartIconWithBadgeProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  const containerSizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex items-center justify-center rounded-full',
        'text-heritage-slate hover:text-heritage-rouge hover:bg-heritage-limestone-100/50',
        'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-heritage-golden/50 focus:ring-offset-2',
        containerSizeClasses[size],
        className
      )}
      aria-label={ariaLabel || `Shopping cart ${count > 0 ? `with ${count} items` : '(empty)'}`}
    >
      {/* Cart Icon */}
      <svg
        className={cn(sizeClasses[size], 'mx-auto my-auto')}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10l.938 10.314A2 2 0 0116.938 16H7.062a2 2 0 01-1.937-1.686L7 4z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 9v2m3-2v2m3-2v2"
        />
      </svg>

      {/* Animated Badge */}
      <AnimatedCartBadge count={count} />
    </button>
  )
}

// Hook for cart badge animations triggered externally
export function useCartBadgeAnimation() {
  const [triggerAnimation, setTriggerAnimation] = useState<{
    type: 'bounce' | 'pulse' | 'scale'
    timestamp: number
  } | null>(null)

  const animateBadge = (type: 'bounce' | 'pulse' | 'scale' = 'bounce') => {
    setTriggerAnimation({
      type,
      timestamp: Date.now()
    })

    // Reset after animation
    setTimeout(() => {
      setTriggerAnimation(null)
    }, 1000)
  }

  return {
    triggerAnimation,
    animateBadge,
    isAnimating: triggerAnimation !== null
  }
}

// Component for inline cart count with subtle animations
interface InlineCartCountProps {
  count: number
  locale?: string
  className?: string
  showZero?: boolean
}

export function InlineCartCount({
  count,
  locale = 'en',
  className = '',
  showZero = false
}: InlineCartCountProps) {
  const [prevCount, setPrevCount] = useState(count)
  const [isIncreasing, setIsIncreasing] = useState(false)

  useEffect(() => {
    if (count !== prevCount) {
      setIsIncreasing(count > prevCount)
      setPrevCount(count)
    }
  }, [count, prevCount])

  if (!showZero && count === 0) return null

  const itemText = count === 1
    ? (locale === 'fr' ? 'article' : 'item')
    : (locale === 'fr' ? 'articles' : 'items')

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 transition-all duration-200',
        isIncreasing && 'animate-pulse text-heritage-rouge-600',
        className
      )}
    >
      <span className="font-medium">{count}</span>
      <span className="text-sm opacity-75">{itemText}</span>
    </span>
  )
}

export default AnimatedCartBadge