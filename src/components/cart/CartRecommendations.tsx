'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useQuickCart } from '@/hooks/useCart'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  price_display: string
  image_url: string
  category: string
  vintage?: number
  volume: number
  rating?: number
  in_stock: boolean
  stock_quantity: number
  description?: string
  varietal?: string
  region?: string
}

interface CartRecommendationsProps {
  currentCartItems?: Array<{ product_id: string; product: { category: string; varietal?: string } }>
  maxRecommendations?: number
  className?: string
}

export default function CartRecommendations({
  currentCartItems = [],
  maxRecommendations = 4,
  className = ''
}: CartRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { quickAdd, loading: addingToCart, error: addError, clearError } = useQuickCart()

  useEffect(() => {
    fetchRecommendations()
  }, [currentCartItems])

  const fetchRecommendations = async () => {
    try {
      setLoading(true)
      setError(null)

      // Extract categories and varietals from current cart items
      const categories = currentCartItems.map(item => item.product.category).filter(Boolean)
      const varietals = currentCartItems.map(item => item.product.varietal).filter(Boolean)
      const currentProductIds = currentCartItems.map(item => item.product_id)

      const params = new URLSearchParams({
        limit: maxRecommendations.toString(),
        exclude: currentProductIds.join(','),
        recommendations: 'true'
      })

      if (categories.length > 0) {
        params.append('categories', categories.join(','))
      }
      if (varietals.length > 0) {
        params.append('varietals', varietals.join(','))
      }

      const response = await fetch(`/api/products?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations')
      }

      const result = await response.json()
      setRecommendations(result.data?.items || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recommendations')
      setRecommendations([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async (product: Product) => {
    clearError()
    const success = await quickAdd(product.id, 1)
    if (success) {
      // Optionally show success message or update recommendations
      await fetchRecommendations()
    }
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: maxRecommendations }).map((_, index) => (
            <div key={index} className="space-y-3">
              <div className="aspect-[3/4] bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || recommendations.length === 0) {
    return null // Don't show anything if there's an error or no recommendations
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-6">
        <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" clipRule="evenodd" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900">You Might Also Like</h3>
      </div>

      {addError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{addError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {recommendations.map((product) => (
          <RecommendationCard
            key={product.id}
            product={product}
            onAddToCart={handleAddToCart}
            isAddingToCart={addingToCart === product.id}
          />
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 text-center">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
        >
          <span>Browse all wines</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </div>
  )
}

interface RecommendationCardProps {
  product: Product
  onAddToCart: (product: Product) => void
  isAddingToCart: boolean
}

function RecommendationCard({ product, onAddToCart, isAddingToCart }: RecommendationCardProps) {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  return (
    <div className="group relative bg-gray-50 rounded-lg p-4 hover:shadow-md transition-all duration-200">
      {/* Product Image */}
      <div className="aspect-[3/4] mb-3 relative overflow-hidden rounded-lg bg-white">
        <Link href={`/products/${product.slug}`}>
          {!imageError ? (
            <>
              {imageLoading && (
                <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                </div>
              )}
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className={`object-cover group-hover:scale-105 transition-transform duration-300 ${
                  imageLoading ? 'opacity-0' : 'opacity-100'
                }`}
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageLoading(false)
                  setImageError(true)
                }}
              />
            </>
          ) : (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </Link>

        {/* Stock indicator */}
        {!product.in_stock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">
              Out of Stock
            </span>
          </div>
        )}

        {product.in_stock && product.stock_quantity <= 3 && (
          <div className="absolute top-2 right-2">
            <span className="bg-amber-500 text-white px-2 py-1 rounded text-xs font-medium">
              Low Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-2">
        <Link href={`/products/${product.slug}`}>
          <h4 className="font-medium text-gray-900 line-clamp-2 hover:text-gray-600 transition-colors duration-200">
            {product.name}
          </h4>
        </Link>

        <div className="text-xs text-gray-500 space-y-1">
          {product.vintage && <p>{product.vintage}</p>}
          {product.varietal && <p>{product.varietal}</p>}
          {product.region && <p>{product.region}</p>}
          <p className="capitalize">{product.category.replace('_', ' ')}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold text-gray-900">
            €{product.price_display}
          </div>

          {product.rating && (
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" clipRule="evenodd" />
              </svg>
              <span className="text-xs text-gray-600">{product.rating}</span>
            </div>
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={() => onAddToCart(product)}
          disabled={!product.in_stock || isAddingToCart}
          className="w-full mt-3 bg-gray-900 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isAddingToCart ? (
            <>
              <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div>
              <span>Adding...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add to Cart</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}