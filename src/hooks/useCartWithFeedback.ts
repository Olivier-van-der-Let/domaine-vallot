'use client'

import { useCart } from './useCart'
import { useWineToast, useCartFeedback } from '@/components/ui/ToastProvider'
import { useCallback, useState } from 'react'
import { WineProduct } from '@/types'

// Extended cart hook with integrated feedback system
export function useCartWithFeedback() {
  const cart = useCart()
  const { showWineAddedToCart, showWineOutOfStock, showWineAddError, showCartUpdated, showWineRemoved } = useWineToast()
  const { showCartSuccess, showCartError, triggerHaptic } = useCartFeedback()
  const [recentlyAdded, setRecentlyAdded] = useState<string[]>([])

  // Track recently added items for animations
  const addToRecentlyAdded = useCallback((productId: string) => {
    setRecentlyAdded(prev => [...prev, productId])

    // Remove from recently added after 3 seconds
    setTimeout(() => {
      setRecentlyAdded(prev => prev.filter(id => id !== productId))
    }, 3000)
  }, [])

  // Enhanced addItem with feedback
  const addItemWithFeedback = useCallback(async (
    productId: string,
    quantity: number = 1,
    wine?: WineProduct
  ): Promise<boolean> => {
    try {
      const success = await cart.addItem(productId, quantity)

      if (success) {
        // Add to recently added for visual feedback
        addToRecentlyAdded(productId)

        // Show success toast with wine details if available
        if (wine) {
          showWineAddedToCart(wine, quantity)
        } else {
          showCartSuccess(
            `${quantity} ${quantity === 1 ? 'item' : 'items'} added to cart`
          )
        }

        // Trigger haptic feedback
        triggerHaptic('success')

        return true
      } else {
        // Handle specific failure cases
        if (wine?.stock_quantity === 0 || wine?.stockQuantity === 0) {
          showWineOutOfStock(wine)
        } else if (wine) {
          showWineAddError(wine, 'Unable to add wine to cart')
        } else {
          showCartError('Failed to add item to cart')
        }

        return false
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

      if (wine) {
        showWineAddError(wine, errorMessage)
      } else {
        showCartError(errorMessage)
      }

      return false
    }
  }, [cart.addItem, showWineAddedToCart, showWineOutOfStock, showWineAddError, showCartSuccess, showCartError, triggerHaptic, addToRecentlyAdded])

  // Enhanced updateQuantity with feedback
  const updateQuantityWithFeedback = useCallback(async (
    itemId: string,
    quantity: number,
    wine?: WineProduct
  ): Promise<boolean> => {
    try {
      const success = await cart.updateQuantity(itemId, quantity)

      if (success) {
        if (wine) {
          showCartUpdated(wine, quantity)
        } else {
          showCartSuccess(`Quantity updated to ${quantity}`)
        }

        triggerHaptic('success')
        return true
      } else {
        showCartError('Failed to update quantity')
        return false
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update quantity'
      showCartError(errorMessage)
      return false
    }
  }, [cart.updateQuantity, showCartUpdated, showCartSuccess, showCartError, triggerHaptic])

  // Enhanced removeItem with feedback
  const removeItemWithFeedback = useCallback(async (
    itemId: string,
    wine?: WineProduct
  ): Promise<boolean> => {
    try {
      const success = await cart.removeItem(itemId)

      if (success) {
        if (wine) {
          showWineRemoved(wine)
        } else {
          showCartSuccess('Item removed from cart')
        }

        triggerHaptic('success')
        return true
      } else {
        showCartError('Failed to remove item')
        return false
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove item'
      showCartError(errorMessage)
      return false
    }
  }, [cart.removeItem, showWineRemoved, showCartSuccess, showCartError, triggerHaptic])

  // Enhanced clearCart with feedback
  const clearCartWithFeedback = useCallback(async (): Promise<boolean> => {
    try {
      const success = await cart.clearCart()

      if (success) {
        showCartSuccess('Cart cleared successfully')
        triggerHaptic('success')
        return true
      } else {
        showCartError('Failed to clear cart')
        return false
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear cart'
      showCartError(errorMessage)
      return false
    }
  }, [cart.clearCart, showCartSuccess, showCartError, triggerHaptic])

  // Quick add function for product grids/lists
  const quickAddWithFeedback = useCallback(async (
    productId: string,
    wine?: WineProduct,
    quantity: number = 1
  ): Promise<boolean> => {
    // Check stock before attempting to add
    if (wine) {
      const stockQuantity = wine.stock_quantity ?? wine.stockQuantity ?? 0
      if (stockQuantity === 0) {
        showWineOutOfStock(wine)
        return false
      }

      if (quantity > stockQuantity) {
        showCartError(`Only ${stockQuantity} bottles available`)
        return false
      }
    }

    return await addItemWithFeedback(productId, quantity, wine)
  }, [addItemWithFeedback, showWineOutOfStock, showCartError])

  // Get wine product data from cart item
  const getWineFromCartItem = useCallback((itemId: string): WineProduct | undefined => {
    const item = cart.items.find(item => item.id === itemId)
    return item?.product as WineProduct | undefined
  }, [cart.items])

  // Bulk operations with feedback
  const bulkUpdateQuantities = useCallback(async (
    updates: Array<{ itemId: string; quantity: number }>
  ): Promise<boolean> => {
    const results = await Promise.all(
      updates.map(({ itemId, quantity }) => {
        const wine = getWineFromCartItem(itemId)
        return updateQuantityWithFeedback(itemId, quantity, wine)
      })
    )

    const successCount = results.filter(Boolean).length
    const totalCount = results.length

    if (successCount === totalCount) {
      showCartSuccess(`Updated ${totalCount} items successfully`)
      return true
    } else if (successCount > 0) {
      showCartError(`Updated ${successCount} of ${totalCount} items`)
      return false
    } else {
      showCartError('Failed to update cart items')
      return false
    }
  }, [updateQuantityWithFeedback, getWineFromCartItem, showCartSuccess, showCartError])

  // Return enhanced cart interface
  return {
    // Original cart properties
    ...cart,

    // Enhanced methods with feedback
    addItem: addItemWithFeedback,
    updateQuantity: updateQuantityWithFeedback,
    removeItem: removeItemWithFeedback,
    clearCart: clearCartWithFeedback,

    // New methods
    quickAdd: quickAddWithFeedback,
    bulkUpdateQuantities,
    getWineFromCartItem,

    // Visual feedback state
    recentlyAdded,

    // Utility methods
    isRecentlyAdded: (productId: string) => recentlyAdded.includes(productId)
  }
}

// Hook for cart animations and visual effects
export function useCartAnimations() {
  const [animatingItems, setAnimatingItems] = useState<Set<string>>(new Set())
  const [badgeAnimation, setBadgeAnimation] = useState<'idle' | 'bounce' | 'pulse'>('idle')

  const animateItem = useCallback((itemId: string, duration: number = 1000) => {
    setAnimatingItems(prev => new Set([...prev, itemId]))

    setTimeout(() => {
      setAnimatingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }, duration)
  }, [])

  const animateBadge = useCallback((type: 'bounce' | 'pulse' = 'bounce') => {
    setBadgeAnimation(type)

    setTimeout(() => {
      setBadgeAnimation('idle')
    }, 1000)
  }, [])

  const isItemAnimating = useCallback((itemId: string): boolean => {
    return animatingItems.has(itemId)
  }, [animatingItems])

  return {
    animateItem,
    animateBadge,
    isItemAnimating,
    badgeAnimation,
    animatingItems: Array.from(animatingItems)
  }
}