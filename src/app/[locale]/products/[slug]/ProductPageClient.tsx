'use client'

import React, { useState } from 'react'
import ProductDetail from '@/components/product/ProductDetail'
import { useCartWithFeedback } from '@/hooks/useCartWithFeedback'
import { WineProduct } from '@/types'

interface ProductPageClientProps {
  product: WineProduct
  locale?: string
  relatedProducts?: WineProduct[]
}

export default function ProductPageClient({
  product,
  locale = 'en',
  relatedProducts = []
}: ProductPageClientProps) {
  const { addItem, loading: cartLoading, recentlyAdded } = useCartWithFeedback()
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  const handleAddToCart = async (productId: string, quantity: number): Promise<void> => {
    try {
      setIsAddingToCart(true)
      // Use the enhanced addItem that includes feedback
      const success = await addItem(productId, quantity, product)

      // The toast feedback is now handled automatically by useCartWithFeedback
      // No need for manual console.log or error handling here
    } catch (error) {
      console.error('Error adding to cart:', error)
    } finally {
      setIsAddingToCart(false)
    }
  }

  return (
    <ProductDetail
      product={product}
      locale={locale}
      relatedProducts={relatedProducts}
      onAddToCart={handleAddToCart}
      isAddingToCart={isAddingToCart}
    />
  )
}