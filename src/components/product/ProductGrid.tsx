'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface WineProduct {
  id: string
  name: string
  slug?: string
  sku: string
  price: number
  price_display: string
  category: string
  vintage?: number
  image_url: string
  producer?: string
  region?: string
  alcohol_content?: number
  stock_quantity: number
  in_stock: boolean
  is_organic?: boolean
  is_featured?: boolean
}

interface ProductGridProps {
  products?: WineProduct[]
  loading?: boolean
  error?: string
  onProductClick?: (product: WineProduct) => void
  className?: string
  itemsPerRow?: 2 | 3 | 4 | 6
  showQuickAdd?: boolean
  maxItems?: number
}

export default function ProductGrid({
  products = [],
  loading = false,
  error = null,
  onProductClick,
  className = '',
  itemsPerRow = 3,
  showQuickAdd = true,
  maxItems
}: ProductGridProps) {
  const router = useRouter()
  const [addingToCart, setAddingToCart] = useState<string | null>(null)

  const displayProducts = maxItems ? products.slice(0, maxItems) : products

  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
  }

  const handleProductClick = (product: WineProduct) => {
    if (onProductClick) {
      onProductClick(product)
    } else {
      // Use slug if available, fallback to generated slug or ID
      const identifier = product.slug || generateSlugFromProduct(product) || product.id
      router.push(`/products/${identifier}`)
    }
  }

  // Generate slug consistent with API
  const generateSlugFromProduct = (product: WineProduct) => {
    if (!product.name) return null

    const slug = product.name
      .toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ÿý]/g, 'y')
      .replace(/[ñ]/g, 'n')
      .replace(/[ç]/g, 'c')
      .replace(/[«»"']/g, '') // Remove quotes and guillemets
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens

    return product.vintage ? `${slug}-${product.vintage}` : slug
  }

  const handleQuickAdd = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault()
    e.stopPropagation()

    setAddingToCart(productId)

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          quantity: 1
        })
      })

      if (response.ok) {
        // Show success feedback
        // You might want to trigger a cart update event here
        console.log('Product added to cart')
      } else {
        console.error('Failed to add product to cart')
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
    } finally {
      setAddingToCart(null)
    }
  }

  if (loading) {
    return (
      <div
        className={`grid ${gridCols[itemsPerRow]} gap-6 ${className}`}
        data-testid="product-grid"
      >
        {Array.from({ length: itemsPerRow * 2 }).map((_, index) => (
          <ProductSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12" data-testid="error-message">
        <div className="text-red-600 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Products</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          data-testid="retry-button"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (displayProducts.length === 0) {
    return (
      <div className="text-center py-12" data-testid="empty-state">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
        <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
      </div>
    )
  }

  return (
    <div
      className={`grid ${gridCols[itemsPerRow]} gap-6 ${className}`}
      data-testid="product-grid"
    >
      {displayProducts.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onProductClick={handleProductClick}
          onQuickAdd={showQuickAdd ? handleQuickAdd : undefined}
          isAddingToCart={addingToCart === product.id}
        />
      ))}
    </div>
  )
}

interface ProductCardProps {
  product: WineProduct
  onProductClick: (product: WineProduct) => void
  onQuickAdd?: (e: React.MouseEvent, productId: string) => void
  isAddingToCart: boolean
}

function ProductCard({ product, onProductClick, onQuickAdd, isAddingToCart }: ProductCardProps) {
  return (
    <div
      className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={() => onProductClick(product)}
      data-testid="product-card"
    >
      {/* Product Image */}
      <div className="aspect-[3/4] bg-gray-100 rounded-t-lg overflow-hidden">
        <Image
          src={product.image_url || '/images/default-wine.svg'}
          alt={product.name}
          width={300}
          height={400}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          data-testid="product-image"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = '/images/default-wine.svg'
          }}
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {!product.in_stock && (
            <span className="px-2 py-1 bg-red-600 text-white text-xs font-medium rounded">
              Out of Stock
            </span>
          )}
          {product.is_organic && (
            <span className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded">
              Organic
            </span>
          )}
          {product.is_featured && (
            <span className="px-2 py-1 bg-purple-600 text-white text-xs font-medium rounded">
              Featured
            </span>
          )}
        </div>

        {/* Quick Add Button */}
        {onQuickAdd && product.in_stock && (
          <button
            onClick={(e) => onQuickAdd(e, product.id)}
            disabled={isAddingToCart}
            className="absolute bottom-2 right-2 bg-white text-gray-900 px-3 py-2 rounded-md text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md hover:bg-gray-50 disabled:opacity-50"
            data-testid="quick-add-button"
          >
            {isAddingToCart ? 'Adding...' : 'Quick Add'}
          </button>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Producer & Region */}
        {(product.producer || product.region) && (
          <p className="text-sm text-gray-600 mb-1">
            {[product.producer, product.region].filter(Boolean).join(' • ')}
          </p>
        )}

        {/* Product Name */}
        <h3
          className="font-medium text-gray-900 mb-1 line-clamp-2"
          data-testid="product-name"
        >
          {product.name}
        </h3>

        {/* Vintage & Category */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          {product.vintage && <span>{product.vintage}</span>}
          <span className="capitalize">{product.category?.replace('_', ' ')}</span>
          {product.alcohol_content && <span>{product.alcohol_content}% ABV</span>}
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div>
            <span
              className="text-lg font-semibold text-gray-900"
              data-testid="product-price"
            >
              €{product.price_display !== 'NaN' ? product.price_display : product.price?.toFixed(2) || '0.00'}
            </span>
            <span className="text-sm text-gray-600 ml-1">per bottle</span>
          </div>

          {/* Stock Indicator */}
          <div className="flex items-center text-sm">
            {product.in_stock ? (
              product.stock_quantity <= 5 ? (
                <span className="text-orange-600">Only {product.stock_quantity} left</span>
              ) : (
                <span className="text-green-600">In Stock</span>
              )
            ) : (
              <span className="text-red-600">Out of Stock</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="aspect-[3/4] bg-gray-200 rounded-t-lg animate-pulse" />
      <div className="p-4">
        <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse" />
        <div className="h-5 bg-gray-200 rounded mb-2 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
        <div className="flex justify-between items-center">
          <div className="h-6 bg-gray-200 rounded w-20 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
        </div>
      </div>
    </div>
  )
}