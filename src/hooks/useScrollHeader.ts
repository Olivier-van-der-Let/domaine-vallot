'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export interface ScrollHeaderState {
  isScrolled: boolean
  scrollY: number
  scrollDirection: 'up' | 'down' | null
  isVisible: boolean
}

interface UseScrollHeaderOptions {
  threshold?: number
  hideOnDown?: boolean
  throttleMs?: number
}

/**
 * Custom hook for tracking scroll position and managing header visibility
 * Optimized for performance with requestAnimationFrame and throttling
 *
 * @param options Configuration options
 * @returns ScrollHeaderState with current scroll state
 */
export function useScrollHeader(options: UseScrollHeaderOptions = {}): ScrollHeaderState {
  const {
    threshold = 50,
    hideOnDown = true,
    throttleMs = 16 // 60fps
  } = options

  const [state, setState] = useState<ScrollHeaderState>({
    isScrolled: false,
    scrollY: 0,
    scrollDirection: null,
    isVisible: true
  })

  // Use refs to track values without triggering re-renders
  const lastScrollY = useRef(0)
  const lastDirection = useRef<'up' | 'down' | null>(null)
  const isThrottled = useRef(false)
  const rafId = useRef<number | null>(null)

  const updateScrollState = useCallback(() => {
    const currentScrollY = window.pageYOffset || document.documentElement.scrollTop

    // Calculate scroll direction
    let direction: 'up' | 'down' | null = null
    if (currentScrollY > lastScrollY.current) {
      direction = 'down'
    } else if (currentScrollY < lastScrollY.current) {
      direction = 'up'
    }

    // Only update direction if it has changed to reduce re-renders
    const directionChanged = direction !== lastDirection.current
    lastDirection.current = direction

    // Determine visibility based on scroll direction and position
    let isVisible = true
    if (hideOnDown && direction === 'down' && currentScrollY > threshold) {
      isVisible = false
    } else if (direction === 'up' || currentScrollY <= threshold) {
      isVisible = true
    }

    // Update state only if values have actually changed
    setState(prevState => {
      const newState = {
        isScrolled: currentScrollY > threshold,
        scrollY: currentScrollY,
        scrollDirection: direction,
        isVisible
      }

      // Only update if something has changed to avoid unnecessary re-renders
      if (
        newState.isScrolled !== prevState.isScrolled ||
        newState.scrollY !== prevState.scrollY ||
        (directionChanged && newState.scrollDirection !== prevState.scrollDirection) ||
        newState.isVisible !== prevState.isVisible
      ) {
        return newState
      }

      return prevState
    })

    lastScrollY.current = currentScrollY
  }, [threshold, hideOnDown])

  // Throttled scroll handler using requestAnimationFrame
  const handleScroll = useCallback(() => {
    if (isThrottled.current) return

    isThrottled.current = true

    // Use requestAnimationFrame for smooth updates
    rafId.current = requestAnimationFrame(() => {
      updateScrollState()

      // Reset throttle after specified time
      setTimeout(() => {
        isThrottled.current = false
      }, throttleMs)
    })
  }, [updateScrollState, throttleMs])

  useEffect(() => {
    // Set initial scroll position
    updateScrollState()

    // Add passive scroll listener for better performance
    const scrollOptions = { passive: true, capture: false }
    window.addEventListener('scroll', handleScroll, scrollOptions)

    // Cleanup function
    return () => {
      window.removeEventListener('scroll', handleScroll)

      // Cancel any pending animation frame
      if (rafId.current) {
        cancelAnimationFrame(rafId.current)
      }
    }
  }, [handleScroll, updateScrollState])

  // Handle resize events to recalculate on viewport changes
  useEffect(() => {
    const handleResize = () => {
      // Recalculate scroll state on resize
      updateScrollState()
    }

    window.addEventListener('resize', handleResize, { passive: true })

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [updateScrollState])

  return state
}

/**
 * Simplified hook for basic scroll detection without direction tracking
 * Useful when you only need to know if the page is scrolled
 */
export function useScrolled(threshold: number = 50): boolean {
  const [isScrolled, setIsScrolled] = useState(false)
  const isThrottled = useRef(false)

  const handleScroll = useCallback(() => {
    if (isThrottled.current) return

    isThrottled.current = true

    requestAnimationFrame(() => {
      const scrollY = window.pageYOffset || document.documentElement.scrollTop
      setIsScrolled(scrollY > threshold)

      setTimeout(() => {
        isThrottled.current = false
      }, 16)
    })
  }, [threshold])

  useEffect(() => {
    // Set initial state
    const scrollY = window.pageYOffset || document.documentElement.scrollTop
    setIsScrolled(scrollY > threshold)

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll, threshold])

  return isScrolled
}

/**
 * Hook for managing scroll-to-top functionality
 * Returns a function to smoothly scroll to the top of the page
 */
export function useScrollToTop() {
  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }, [])

  return scrollToTop
}

export default useScrollHeader