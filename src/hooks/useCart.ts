'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { CartItemWithProduct, CartSummary, CartValidation } from '@/types'

// Debounce utility for cart updates
const useDebounce = (callback: Function, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout>()

  return useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => callback(...args), delay)
  }, [callback, delay])
}

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
  updateShippingCost: (shippingCost: number) => void

  // Computed values
  itemCount: number
  totalQuantity: number
  subtotal: number
  isEmpty: boolean

  // Cart object for checkout components
  cart: {
    items: CartItemWithProduct[]
    total: number
    subtotal: number
    shipping_cost: number
    vat_amount: number
    vat_rate: number
    discount_amount: number
  } | null
}

export function useCart(): UseCartReturn {
  const [items, setItems] = useState<CartItemWithProduct[]>([])
  const [summary, setSummary] = useState<CartSummary>({
    itemCount: 0,
    totalQuantity: 0,
    subtotalEur: 0
  })
  const [shippingCost, setShippingCost] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const pendingUpdatesRef = useRef<Map<string, { quantity: number, timestamp: number }>>(new Map())

  // Debounced server sync for batch updates
  const debouncedSyncWithServer = useDebounce(async () => {
    const pendingUpdates = Array.from(pendingUpdatesRef.current.entries())
    if (pendingUpdates.length === 0) return

    try {
      // Process all pending updates
      const updatePromises = pendingUpdates.map(([itemId, { quantity }]) =>
        fetch(`/api/cart/${itemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ quantity })
        })
      )

      const responses = await Promise.all(updatePromises)
      const failedUpdates = responses.filter(r => !r.ok)

      if (failedUpdates.length > 0) {
        throw new Error('Some updates failed')
      }

      // Clear pending updates and refresh
      pendingUpdatesRef.current.clear()
      await fetchCart()
    } catch (error) {
      console.error('Batch update failed:', error)
      // Force refresh to get server state
      await fetchCart()
    }
  }, 1000) // 1 second debounce

  // Fetch cart data with improved error handling
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/cart', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 401) {
        // User not authenticated - this is expected behavior
        console.log('🛒 Cart fetch: User not authenticated')
        setItems([])
        setSummary({
          itemCount: 0,
          totalQuantity: 0,
          subtotalEur: 0
        })
        return
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to fetch cart')
      }

      const result = await response.json()
      const cartItems = result.data?.items || []
      const cartSummary = result.data?.summary || {
        itemCount: 0,
        totalQuantity: 0,
        subtotalEur: 0
      }

      console.log('🛒 Cart fetched successfully:', {
        itemCount: cartItems.length,
        totalQuantity: cartSummary.totalQuantity,
        subtotal: cartSummary.subtotalEur
      })

      setItems(cartItems)
      setSummary(cartSummary)
    } catch (err) {
      console.error('Cart fetch error:', err)
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

  // Update item quantity with optimistic updates and debounced sync
  const updateQuantity = useCallback(async (itemId: string, quantity: number): Promise<boolean> => {
    if (quantity <= 0) {
      // Handle remove by calling the API directly to avoid circular dependency
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
    }

    // Find the item to update
    const itemToUpdate = items.find(item => item.id === itemId)
    if (!itemToUpdate) {
      setError('Item not found in cart')
      return false
    }

    try {
      setError(null)
      setUpdating(itemId)

      // Optimistic update - update UI immediately
      const updatedItems = items.map(item => {
        if (item.id === itemId) {
          const updatedItem = {
            ...item,
            quantity,
            subtotalEur: (item.product.priceEur || 0) * quantity
          }
          return updatedItem
        }
        return item
      })

      // Update summary optimistically
      const newTotalQuantity = updatedItems.reduce((sum, item) => sum + item.quantity, 0)
      const newSubtotal = updatedItems.reduce((sum, item) => sum + (item.subtotalEur || 0), 0)
      const updatedSummary = {
        itemCount: updatedItems.length,
        totalQuantity: newTotalQuantity,
        subtotalEur: newSubtotal
      }

      // Apply optimistic updates
      setItems(updatedItems)
      setSummary(updatedSummary)

      // Track pending update for debounced sync
      pendingUpdatesRef.current.set(itemId, { quantity, timestamp: Date.now() })

      // Trigger debounced server sync
      debouncedSyncWithServer()

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update quantity')
      return false
    } finally {
      setUpdating(null)
    }
  }, [items, summary, debouncedSyncWithServer, fetchCart])

  // Remove item from cart with optimistic updates
  const removeItem = useCallback(async (itemId: string): Promise<boolean> => {
    // Store original values for rollback
    const originalItems = [...items]
    const originalSummary = { ...summary }

    try {
      setError(null)
      setUpdating(itemId)

      // Optimistic update - remove item from UI immediately
      const updatedItems = items.filter(item => item.id !== itemId)

      // Update summary optimistically
      const newTotalQuantity = updatedItems.reduce((sum, item) => sum + item.quantity, 0)
      const newSubtotal = updatedItems.reduce((sum, item) => sum + (item.subtotalEur || 0), 0)
      const updatedSummary = {
        itemCount: updatedItems.length,
        totalQuantity: newTotalQuantity,
        subtotalEur: newSubtotal
      }

      // Apply optimistic updates
      setItems(updatedItems)
      setSummary(updatedSummary)

      // Make API call
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove item')
      }

      // Refresh with server data to ensure consistency
      await fetchCart()
      return true
    } catch (err) {
      // Rollback optimistic updates on error
      setItems(originalItems)
      setSummary(originalSummary)
      setError(err instanceof Error ? err.message : 'Failed to remove item')
      return false
    } finally {
      setUpdating(null)
    }
  }, [items, summary, fetchCart])

  // Add item to cart with improved authentication handling
  const addItem = useCallback(async (productId: string, quantity: number = 1): Promise<boolean> => {
    try {
      setError(null)
      setUpdating(productId)

      // Check if item already exists
      const existingItem = items.find(item => item.productId === productId)

      if (existingItem) {
        // If item exists, update quantity instead
        return await updateQuantity(existingItem.id, existingItem.quantity + quantity)
      }

      // Make API call first for new items (we need product data)
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

      if (response.status === 401) {
        throw new Error('Please sign in to add items to cart')
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to add item to cart')
      }

      console.log('🛒 Item added to cart successfully:', { productId, quantity })

      // Refresh cart data to get the new item with full product details
      await fetchCart()
      return true
    } catch (err) {
      console.error('Add to cart error:', err)
      setError(err instanceof Error ? err.message : 'Failed to add item')
      return false
    } finally {
      setUpdating(null)
    }
  }, [items, fetchCart, updateQuantity])

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

  // Update shipping cost
  const updateShippingCost = useCallback((cost: number) => {
    setShippingCost(cost)
  }, [])

  // Load cart on mount
  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  // Computed values
  const itemCount = summary.itemCount
  const totalQuantity = summary.totalQuantity
  const subtotal = summary.subtotalEur
  const isEmpty = items.length === 0

  // Calculate VAT and total with shipping
  const vatRate = 0.20
  const vatAmount = Math.round((subtotal + shippingCost) * vatRate)
  const totalWithShipping = subtotal + shippingCost + vatAmount

  // Cart object for checkout components
  const cart = items.length > 0 ? {
    items: items.map(item => ({
      id: item.id,
      name: item.product.name,
      price: item.product.priceEur || 0,
      quantity: item.quantity,
      image_url: item.product.image_url,
      vintage: item.product.vintage,
      weight: 750 // Default wine bottle weight in grams
    })),
    total: totalWithShipping,
    subtotal: subtotal,
    shipping_cost: shippingCost,
    vat_amount: vatAmount,
    vat_rate: vatRate,
    discount_amount: 0
  } : null

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
    updateShippingCost,

    // Computed values
    itemCount,
    totalQuantity,
    subtotal,
    isEmpty,

    // Cart object for checkout
    cart
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