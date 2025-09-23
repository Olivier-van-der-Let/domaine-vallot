'use client'

import { useState, useEffect, useCallback } from 'react'
import { CartItemWithProduct, CartSummary, CartValidation } from '@/types'

interface UseCartReturn {
  // State
  items: CartItemWithProduct[]
  summary: CartSummary
  loading: boolean
  error: string | null
  updating: string | null

  // Actions
  addItem: (productId: string, quantity?: number) => Promise<boolean>
  updateQuantity: (itemId: string, quantity: number) => Promise<boolean>
  removeItem: (itemId: string) => Promise<boolean>
  clearCart: () => Promise<boolean>
  refreshCart: () => Promise<void>
  validateCart: () => Promise<CartValidation>

  // Computed values
  itemCount: number
  totalQuantity: number
  subtotal: number
  isEmpty: boolean
}

export function useCart(): UseCartReturn {
  const [items, setItems] = useState<CartItemWithProduct[]>([])
  const [summary, setSummary] = useState<CartSummary>({
    itemCount: 0,
    totalQuantity: 0,
    subtotalEur: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  // Fetch cart data
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/cart', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch cart')
      }

      const result = await response.json()
      const cartItems = result.data?.items || []
      const cartSummary = result.data?.summary || {
        itemCount: 0,
        totalQuantity: 0,
        subtotalEur: 0
      }

      setItems(cartItems)
      setSummary(cartSummary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cart')
      setItems([])
      setSummary({
        itemCount: 0,
        totalQuantity: 0,
        subtotalEur: 0
      })
    } finally {
      setLoading(false)
    }
  }, [])

  // Add item to cart
  const addItem = useCallback(async (productId: string, quantity: number = 1): Promise<boolean> => {
    try {
      setError(null)
      setUpdating(productId)

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          productId,
          quantity
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add item to cart')
      }

      await fetchCart()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item')
      return false
    } finally {
      setUpdating(null)
    }
  }, [fetchCart])

  // Update item quantity
  const updateQuantity = useCallback(async (itemId: string, quantity: number): Promise<boolean> => {
    if (quantity <= 0) {
      return await removeItem(itemId)
    }

    try {
      setError(null)
      setUpdating(itemId)

      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ quantity })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update quantity')
      }

      await fetchCart()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update quantity')
      return false
    } finally {
      setUpdating(null)
    }
  }, [fetchCart])

  // Remove item from cart
  const removeItem = useCallback(async (itemId: string): Promise<boolean> => {
    try {
      setError(null)
      setUpdating(itemId)

      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove item')
      }

      await fetchCart()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item')
      return false
    } finally {
      setUpdating(null)
    }
  }, [fetchCart])

  // Clear entire cart
  const clearCart = useCallback(async (): Promise<boolean> => {
    if (items.length === 0) return true

    try {
      setError(null)
      setLoading(true)

      // Remove all items
      const removePromises = items.map(item =>
        fetch(`/api/cart/${item.id}`, {
          method: 'DELETE',
          credentials: 'include'
        })
      )

      const responses = await Promise.all(removePromises)
      const failedRequests = responses.filter(response => !response.ok)

      if (failedRequests.length > 0) {
        throw new Error('Failed to clear some items from cart')
      }

      await fetchCart()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cart')
      return false
    } finally {
      setLoading(false)
    }
  }, [items, fetchCart])

  // Validate cart (check availability, prices, etc.)
  const validateCart = useCallback(async (): Promise<CartValidation> => {
    try {
      const response = await fetch('/api/cart/validate', {
        method: 'POST',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to validate cart')
      }

      const result = await response.json()
      return result.data || {
        isValid: false,
        errorMessage: 'Unknown validation error',
        invalidItems: []
      }
    } catch (err) {
      return {
        isValid: false,
        errorMessage: err instanceof Error ? err.message : 'Validation failed',
        invalidItems: []
      }
    }
  }, [])

  // Refresh cart data
  const refreshCart = useCallback(async () => {
    await fetchCart()
  }, [fetchCart])

  // Load cart on mount
  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  // Computed values
  const itemCount = summary.itemCount
  const totalQuantity = summary.totalQuantity
  const subtotal = summary.subtotalEur
  const isEmpty = items.length === 0

  return {
    // State
    items,
    summary,
    loading,
    error,
    updating,

    // Actions
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart,
    validateCart,

    // Computed values
    itemCount,
    totalQuantity,
    subtotal,
    isEmpty
  }
}

// Hook for quick cart operations (add to cart without full cart state)
export function useQuickCart() {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const quickAdd = useCallback(async (productId: string, quantity: number = 1): Promise<boolean> => {
    try {
      setError(null)
      setLoading(productId)

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          productId,
          quantity
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add item to cart')
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item')
      return false
    } finally {
      setLoading(null)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    quickAdd,
    loading,
    error,
    clearError
  }
}

// Hook for cart persistence (localStorage backup)
export function useCartPersistence() {
  const STORAGE_KEY = 'domaine-vallot-cart'

  const saveCartToStorage = useCallback((items: CartItemWithProduct[]) => {
    try {
      const cartData = {
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          addedAt: item.addedAt
        })),
        timestamp: new Date().toISOString()
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cartData))
    } catch (error) {
      console.warn('Failed to save cart to localStorage:', error)
    }
  }, [])

  const loadCartFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return null

      const cartData = JSON.parse(stored)

      // Check if data is not too old (e.g., 7 days)
      const dataAge = Date.now() - new Date(cartData.timestamp).getTime()
      const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

      if (dataAge > maxAge) {
        localStorage.removeItem(STORAGE_KEY)
        return null
      }

      return cartData.items
    } catch (error) {
      console.warn('Failed to load cart from localStorage:', error)
      return null
    }
  }, [])

  const clearStoredCart = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.warn('Failed to clear stored cart:', error)
    }
  }, [])

  return {
    saveCartToStorage,
    loadCartFromStorage,
    clearStoredCart
  }
}