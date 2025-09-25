'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import CartRecommendations from './CartRecommendations'

interface CartItem {
  id: string
  product_id: string
  quantity: number
  added_at: string
  subtotal: number
  subtotal_display: string
  product: {
    id: string
    name: string
    sku: string
    price: number
    price_display: string
    image_url: string
    category: string
    vintage?: number
    stock_quantity: number
    in_stock: boolean
    alcohol_content?: number
    volume: number
  }
  warnings?: Array<{
    type: string
    message: string
    available?: number
  }>
}

interface CartSummary {
  total_items: number
  total_bottles: number
  total_products: number
  subtotal: number
  subtotal_display: string
  currency: string
  estimated_weight: number
  validations: {
    has_items: boolean
    all_in_stock: boolean
    all_available: boolean
    minimum_order_met: boolean
    maximum_bottles_limit: boolean
  }
  age_verification_required: boolean
  shipping_eligible: boolean
}

interface Cart {
  id: string
  user_id: string
  items: CartItem[]
  summary: CartSummary
  issues?: {
    out_of_stock_items: Array<{
      item_id: string
      product_name: string
      message: string
    }>
    unavailable_quantities: Array<{
      item_id: string
      product_name: string
      requested: number
      available: number
      message: string
    }>
  }
}

interface CartComponentProps {
  cart?: Cart
  loading?: boolean
  error?: string
  onUpdateQuantity?: (itemId: string, quantity: number) => Promise<void>
  onRemoveItem?: (itemId: string) => Promise<void>
  onProceedToCheckout?: () => void
  className?: string
}

export default function CartComponent({
  cart,
  loading = false,
  error = null,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  className = ''
}: CartComponentProps) {
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (!onUpdateQuantity) return

    setUpdatingItems(prev => new Set(prev).add(itemId))

    try {
      await onUpdateQuantity(itemId, newQuantity)
    } catch (error) {
      console.error('Failed to update quantity:', error)
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    if (!onRemoveItem) return

    setUpdatingItems(prev => new Set(prev).add(itemId))

    try {
      await onRemoveItem(itemId)
    } catch (error) {
      console.error('Failed to remove item:', error)
      setUpdatingItems(prev => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }

  if (loading) {
    return <CartSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Cart</h3>
        <p className="text-gray-600">{error}</p>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-gray-300 mb-6">
          <svg className="mx-auto h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.68 8.28A2 2 0 006.38 22h11.24a2 2 0 001.06-.82L21 13M7 13v6a2 2 0 002 2h6a2 2 0 002-2v-6" />
          </svg>
        </div>
        <h3 className="text-2xl font-medium text-gray-900 mb-3">Your Cart is Empty</h3>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Discover our exquisite collection of wines from Domaine Vallot.
          Each bottle tells a story of craftsmanship and tradition.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-8 py-3 rounded-md font-medium hover:bg-gray-800 transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Browse All Wines
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-white text-gray-700 px-8 py-3 rounded-md font-medium border border-gray-300 hover:bg-gray-50 transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to Home
          </Link>
        </div>

        {/* Featured categories */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">Popular categories:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {['Red Wines', 'White Wines', 'Rosé', 'Champagne', 'Organic'].map((category) => (
              <Link
                key={category}
                href={`/products?category=${category.toLowerCase().replace(' ', '_')}`}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors duration-200"
              >
                {category}
              </Link>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`max-w-4xl mx-auto ${className}`} data-testid="cart-component">
      {/* Cart Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2" data-testid="cart-title">
          Shopping Cart
        </h1>
        <p className="text-gray-600">
          {cart.summary.total_items} {cart.summary.total_items === 1 ? 'item' : 'items'} in your cart
        </p>
      </div>

      {/* Issues Notifications */}
      {(cart.issues?.out_of_stock_items.length || cart.issues?.unavailable_quantities.length) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <h3 className="text-sm font-semibold text-red-800">Cart Issues Found</h3>
          </div>
          <div className="text-sm text-red-700 space-y-2">
            {cart.issues.out_of_stock_items.map(issue => (
              <div key={issue.item_id} className="flex items-start gap-2 p-2 bg-red-100 rounded">
                <svg className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 008.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                </svg>
                <div>
                  <strong>{issue.product_name}</strong>: {issue.message}
                </div>
              </div>
            ))}
            {cart.issues.unavailable_quantities.map(issue => (
              <div key={issue.item_id} className="flex items-start gap-2 p-2 bg-red-100 rounded">
                <svg className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <strong>{issue.product_name}</strong>: {issue.message}
                  <br />
                  <span className="text-xs text-red-600">
                    Requested: {issue.requested}, Available: {issue.available}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {cart.items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                isUpdating={updatingItems.has(item.id)}
                onQuantityChange={handleQuantityChange}
                onRemove={handleRemoveItem}
              />
            ))}
          </div>
        </div>

        {/* Cart Summary */}
        <div className="lg:col-span-1">
          <CartSummary
            summary={cart.summary}
            onProceedToCheckout={onProceedToCheckout}
          />
        </div>
      </div>

      {/* Cart Recommendations */}
      {cart.items.length > 0 && (
        <div className="mt-12">
          <CartRecommendations
            currentCartItems={cart.items}
            maxRecommendations={4}
          />
        </div>
      )}
    </div>
  )
}

interface CartItemProps {
  item: CartItem
  isUpdating: boolean
  onQuantityChange: (itemId: string, quantity: number) => Promise<void>
  onRemove: (itemId: string) => Promise<void>
}

function CartItem({ item, isUpdating, onQuantityChange, onRemove }: CartItemProps) {
  const hasWarnings = item.warnings && item.warnings.length > 0
  const [imageLoading, setImageLoading] = useState(true)
  const [removeConfirmation, setRemoveConfirmation] = useState(false)

  return (
    <div
      className={`bg-white border rounded-lg p-4 transition-all duration-200 ${hasWarnings ? 'border-red-200 bg-red-50/30' : 'border-gray-200'} ${isUpdating ? 'opacity-75 pointer-events-none' : 'hover:shadow-sm'}`}
      data-testid="cart-item"
    >
      <div className="flex items-start gap-4">
        {/* Product Image */}
        <div className="flex-shrink-0 w-20 h-24 bg-gray-100 rounded-lg overflow-hidden relative">
          {imageLoading && (
            <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            </div>
          )}
          <Image
            src={item.product.image_url}
            alt={item.product.name}
            width={80}
            height={96}
            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
            onLoad={() => setImageLoading(false)}
            onError={() => setImageLoading(false)}
          />
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {item.product.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {item.product.vintage && <span>{item.product.vintage}</span>}
                <span className="capitalize">{item.product.category.replace('_', ' ')}</span>
                {item.product.volume && <span>{item.product.volume}ml</span>}
              </div>
            </div>
            {removeConfirmation ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onRemove(item.id)
                    setRemoveConfirmation(false)
                  }}
                  disabled={isUpdating}
                  className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  Yes
                </button>
                <button
                  onClick={() => setRemoveConfirmation(false)}
                  className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setRemoveConfirmation(true)}
                disabled={isUpdating}
                className="text-gray-400 hover:text-red-600 disabled:opacity-50 transition-colors duration-200"
                data-testid="remove-item-button"
                title="Remove item"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>

          {/* Warnings */}
          {hasWarnings && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-1 mb-1">
                <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-red-800">Attention</span>
              </div>
              {item.warnings?.map((warning, index) => (
                <p key={index} className="text-sm text-red-600 ml-5">
                  {warning.message}
                </p>
              ))}
            </div>
          )}

          {/* Quantity and Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center border border-gray-300 rounded-md shadow-sm" data-testid="quantity-controls">
                <button
                  onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                  disabled={isUpdating || item.quantity <= 1}
                  className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  data-testid="decrease-quantity"
                  title="Decrease quantity"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <div className="px-4 py-2 border-l border-r border-gray-300 min-w-[3rem] text-center bg-gray-50">
                  <span className="font-medium">{item.quantity}</span>
                  {item.quantity > 1 && (
                    <span className="text-xs text-gray-500 block leading-none">bottles</span>
                  )}
                </div>
                <button
                  onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                  disabled={isUpdating || item.quantity >= item.product.stock_quantity}
                  className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  data-testid="increase-quantity"
                  title="Increase quantity"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
              {item.product.stock_quantity <= 5 && (
                <span className="ml-2 px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded-full">
                  Only {item.product.stock_quantity} left
                </span>
              )}
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-600">€{item.product.price_display} each</p>
              <p className="text-lg font-semibold text-gray-900">€{item.subtotal_display}</p>
              {item.quantity > 1 && (
                <p className="text-xs text-gray-500">
                  €{(parseFloat(item.subtotal_display) / item.quantity).toFixed(2)} per bottle
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {isUpdating && (
        <div className="absolute inset-0 bg-white/75 rounded-lg flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-gray-700 bg-white px-3 py-2 rounded-md shadow-sm border">
            <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
            <span>Updating...</span>
          </div>
        </div>
      )}
    </div>
  )
}

interface CartSummaryProps {
  summary: CartSummary
  onProceedToCheckout?: () => void
}

function CartSummary({ summary, onProceedToCheckout }: CartSummaryProps) {
  const canCheckout = summary.validations.has_items &&
                     summary.validations.all_in_stock &&
                     summary.validations.all_available &&
                     summary.validations.minimum_order_met

  const [isProcessing, setIsProcessing] = useState(false)

  const handleCheckout = async () => {
    if (!canCheckout || !onProceedToCheckout) return

    setIsProcessing(true)
    try {
      await onProceedToCheckout()
    } catch (error) {
      console.error('Checkout error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-6 sticky top-4 border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900">Order Summary</h3>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            Items ({summary.total_items})
          </span>
          <span className="font-medium">€{summary.subtotal_display}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Shipping</span>
          <span className="text-sm text-gray-500">Calculated at checkout</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">VAT</span>
          <span className="text-sm text-gray-500">Calculated at checkout</span>
        </div>
        {summary.total_bottles && (
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <span className="text-sm text-gray-600">Total bottles</span>
            <span className="text-sm font-medium text-gray-900">{summary.total_bottles}</span>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 pt-4 mb-6">
        <div className="flex justify-between font-semibold text-lg" data-testid="cart-total">
          <span>Subtotal</span>
          <span>€{summary.subtotal_display}</span>
        </div>
      </div>

      {/* Validations */}
      {!summary.validations.minimum_order_met && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            Minimum order value is €10.00
          </p>
        </div>
      )}

      {!summary.validations.maximum_bottles_limit && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">
            Maximum 100 bottles per order for shipping
          </p>
        </div>
      )}

      {summary.age_verification_required && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-sm text-amber-800">
            Age verification required (18+)
          </p>
        </div>
      )}

      <button
        onClick={handleCheckout}
        disabled={!canCheckout || isProcessing}
        className="w-full bg-gray-900 text-white px-6 py-3 rounded-md font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
        data-testid="checkout-button"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
            <span>Processing...</span>
          </>
        ) : (
          <>
            <span>{canCheckout ? 'Proceed to Checkout' : 'Cannot Proceed to Checkout'}</span>
            {canCheckout && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            )}
          </>
        )}
      </button>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-1 gap-2 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Free shipping on orders over €75</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Secure checkout with SSL encryption</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-3 h-3 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>Age verification required (18+)</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function CartSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-white border rounded-lg p-4">
              <div className="flex gap-4">
                <div className="w-20 h-24 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4 animate-pulse"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
                    <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
            <div className="space-y-2 mb-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )
}