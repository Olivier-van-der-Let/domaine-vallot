'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export interface OrderStatus {
  id: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  created_at: string
  updated_at: string
  estimated_delivery?: string
  tracking_number?: string
  items: OrderItem[]
  customer_email: string
  total_amount: number
  shipping_address: any
  notes?: string[]
}

export interface OrderItem {
  id: string
  product_name: string
  quantity: number
  price: number
  image_url?: string
}

export interface OrderUpdate {
  id: string
  order_id: string
  status: string
  message: string
  timestamp: string
  metadata?: any
}

interface UseOrderTrackingReturn {
  order: OrderStatus | null
  updates: OrderUpdate[]
  loading: boolean
  error: string | null
  refreshOrder: () => Promise<void>
  subscribeToUpdates: (orderId: string) => void
  unsubscribeFromUpdates: () => void
}

export function useOrderTracking(orderId?: string): UseOrderTrackingReturn {
  const [order, setOrder] = useState<OrderStatus | null>(null)
  const [updates, setUpdates] = useState<OrderUpdate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastUpdateTimestamp = useRef<string | null>(null)

  const fetchOrder = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/orders/${id}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch order')
      }

      const result = await response.json()
      setOrder(result.data)

      // Also fetch recent updates
      await fetchUpdates(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order')
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchUpdates = useCallback(async (id: string) => {
    try {
      const params = new URLSearchParams()
      if (lastUpdateTimestamp.current) {
        params.append('since', lastUpdateTimestamp.current)
      }

      const response = await fetch(`/api/orders/${id}/updates?${params.toString()}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const result = await response.json()
        const newUpdates = result.data || []

        if (newUpdates.length > 0) {
          setUpdates(prev => {
            // Merge new updates with existing ones, avoiding duplicates
            const existingIds = new Set(prev.map(u => u.id))
            const uniqueNewUpdates = newUpdates.filter((u: OrderUpdate) => !existingIds.has(u.id))
            const combined = [...prev, ...uniqueNewUpdates]

            // Sort by timestamp, most recent first
            return combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          })

          // Update the last timestamp
          lastUpdateTimestamp.current = newUpdates[0].timestamp
        }
      }
    } catch (err) {
      console.error('Failed to fetch order updates:', err)
    }
  }, [])

  const refreshOrder = useCallback(async () => {
    if (orderId) {
      await fetchOrder(orderId)
    }
  }, [orderId, fetchOrder])

  const subscribeToUpdates = useCallback((id: string) => {
    // Clear any existing subscription
    unsubscribeFromUpdates()

    // Initial fetch
    fetchOrder(id)

    // Set up polling for real-time updates
    intervalRef.current = setInterval(() => {
      fetchUpdates(id)
    }, 15000) // Poll every 15 seconds
  }, [fetchOrder, fetchUpdates])

  const unsubscribeFromUpdates = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Auto-subscribe if orderId is provided
  useEffect(() => {
    if (orderId) {
      subscribeToUpdates(orderId)
    }

    return () => {
      unsubscribeFromUpdates()
    }
  }, [orderId, subscribeToUpdates, unsubscribeFromUpdates])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribeFromUpdates()
    }
  }, [unsubscribeFromUpdates])

  return {
    order,
    updates,
    loading,
    error,
    refreshOrder,
    subscribeToUpdates,
    unsubscribeFromUpdates
  }
}

// Helper functions for order status
export const getOrderStatusColor = (status: OrderStatus['status']): string => {
  switch (status) {
    case 'pending':
      return 'yellow'
    case 'processing':
      return 'blue'
    case 'shipped':
      return 'indigo'
    case 'delivered':
      return 'green'
    case 'cancelled':
      return 'red'
    default:
      return 'gray'
  }
}

export const getOrderStatusLabel = (status: OrderStatus['status'], locale: 'en' | 'fr' = 'en'): string => {
  const labels = {
    en: {
      pending: 'Order Received',
      processing: 'Processing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    },
    fr: {
      pending: 'Commande reçue',
      processing: 'En préparation',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      cancelled: 'Annulée'
    }
  }

  return labels[locale][status] || status
}

export const getPaymentStatusColor = (status: OrderStatus['payment_status']): string => {
  switch (status) {
    case 'pending':
      return 'yellow'
    case 'paid':
      return 'green'
    case 'failed':
      return 'red'
    case 'refunded':
      return 'purple'
    default:
      return 'gray'
  }
}

export const getPaymentStatusLabel = (status: OrderStatus['payment_status'], locale: 'en' | 'fr' = 'en'): string => {
  const labels = {
    en: {
      pending: 'Payment Pending',
      paid: 'Paid',
      failed: 'Payment Failed',
      refunded: 'Refunded'
    },
    fr: {
      pending: 'Paiement en attente',
      paid: 'Payé',
      failed: 'Paiement échoué',
      refunded: 'Remboursé'
    }
  }

  return labels[locale][status] || status
}

export const getOrderProgress = (status: OrderStatus['status']): number => {
  switch (status) {
    case 'pending':
      return 25
    case 'processing':
      return 50
    case 'shipped':
      return 75
    case 'delivered':
      return 100
    case 'cancelled':
      return 0
    default:
      return 0
  }
}