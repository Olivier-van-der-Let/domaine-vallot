/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react'
import { useScrollHeader, useScrolled, useScrollToTop } from '../useScrollHeader'

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => {
  setTimeout(cb, 16)
  return 1
})

global.cancelAnimationFrame = jest.fn()

// Mock window scroll properties
Object.defineProperty(window, 'pageYOffset', {
  writable: true,
  value: 0
})

Object.defineProperty(document.documentElement, 'scrollTop', {
  writable: true,
  value: 0
})

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn()
})

describe('useScrollHeader', () => {
  beforeEach(() => {
    // Reset scroll position
    window.pageYOffset = 0
    document.documentElement.scrollTop = 0
    jest.clearAllMocks()
  })

  describe('Basic functionality', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useScrollHeader())

      expect(result.current.isScrolled).toBe(false)
      expect(result.current.scrollY).toBe(0)
      expect(result.current.scrollDirection).toBe(null)
      expect(result.current.isVisible).toBe(true)
    })

    it('should detect when scrolled past threshold', async () => {
      const { result } = renderHook(() => useScrollHeader({ threshold: 50 }))

      act(() => {
        window.pageYOffset = 100
        window.dispatchEvent(new Event('scroll'))
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 20))
      })

      expect(result.current.isScrolled).toBe(true)
      expect(result.current.scrollY).toBe(100)
    })

    it('should respect custom threshold values', async () => {
      const { result } = renderHook(() => useScrollHeader({ threshold: 100 }))

      act(() => {
        window.pageYOffset = 50
        window.dispatchEvent(new Event('scroll'))
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 20))
      })

      expect(result.current.isScrolled).toBe(false)

      act(() => {
        window.pageYOffset = 150
        window.dispatchEvent(new Event('scroll'))
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 20))
      })

      expect(result.current.isScrolled).toBe(true)
    })
  })
})

describe('useScrolled (simplified hook)', () => {
  beforeEach(() => {
    window.pageYOffset = 0
    document.documentElement.scrollTop = 0
    jest.clearAllMocks()
  })

  it('should return boolean scroll state', async () => {
    const { result } = renderHook(() => useScrolled(50))

    expect(result.current).toBe(false)

    act(() => {
      window.pageYOffset = 100
      window.dispatchEvent(new Event('scroll'))
    })

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20))
    })

    expect(result.current).toBe(true)
  })
})

describe('useScrollToTop', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should provide scroll to top function', () => {
    const { result } = renderHook(() => useScrollToTop())

    act(() => {
      result.current()
    })

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: 'smooth'
    })
  })

  it('should be stable across re-renders', () => {
    const { result, rerender } = renderHook(() => useScrollToTop())
    const firstFunction = result.current

    rerender()

    expect(result.current).toBe(firstFunction)
  })
})