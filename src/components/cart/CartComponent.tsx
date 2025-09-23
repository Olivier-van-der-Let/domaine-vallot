'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

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
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.68 8.28A2 2 0 006.38 22h11.24a2 2 0 001.06-.82L21 13M7 13v6a2 2 0 002 2h6a2 2 0 002-2v-6" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Your Cart is Empty</h3>
        <p className="text-gray-600 mb-4">Add some wines to get started!</p>
        <Link
          href="/products"
          className="inline-block bg-gray-900 text-white px-6 py-3 rounded-md font-medium hover:bg-gray-800"
        >
          Browse Wines
        </Link>
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-red-800 mb-2">Cart Issues</h3>
          <ul className="text-sm text-red-700 space-y-1">
            {cart.issues.out_of_stock_items.map(issue => (
              <li key={issue.item_id}>• {issue.product_name}: {issue.message}</li>
            ))}
            {cart.issues.unavailable_quantities.map(issue => (
              <li key={issue.item_id}>• {issue.product_name}: {issue.message}</li>
            ))}
          </ul>
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

  return (
    <div
      className={`bg-white border rounded-lg p-4 ${hasWarnings ? 'border-red-200' : 'border-gray-200'}`}
      data-testid="cart-item"
    >
      <div className="flex items-start gap-4">
        {/* Product Image */}
        <div className="flex-shrink-0 w-20 h-24 bg-gray-100 rounded-lg overflow-hidden">
          <Image
            src={item.product.image_url}
            alt={item.product.name}
            width={80}
            height={96}
            className="w-full h-full object-cover"
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
            <button
              onClick={() => onRemove(item.id)}
              disabled={isUpdating}
              className="text-gray-400 hover:text-red-600 disabled:opacity-50"
              data-testid="remove-item-button"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          {/* Warnings */}
          {hasWarnings && (
            <div className="mb-3">
              {item.warnings?.map((warning, index) => (
                <p key={index} className="text-sm text-red-600">
                  {warning.message}
                </p>
              ))}
            </div>
          )}

          {/* Quantity and Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center border border-gray-300 rounded-md" data-testid="quantity-controls">
              <button
                onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                disabled={isUpdating || item.quantity <= 1}
                className="px-3 py-1 text-gray-600 hover:text-gray-900 disabled:opacity-50"
                data-testid="decrease-quantity"
              >
                -
              </button>
              <span className="px-4 py-1 border-l border-r border-gray-300 min-w-[3rem] text-center">
                {item.quantity}
              </span>
              <button
                onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                disabled={isUpdating || item.quantity >= item.product.stock_quantity}
                className="px-3 py-1 text-gray-600 hover:text-gray-900 disabled:opacity-50"
                data-testid="increase-quantity"
              >
                +
              </button>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-600">€{item.product.price_display} each</p>
              <p className="text-lg font-semibold text-gray-900">€{item.subtotal_display}</p>
            </div>
          </div>
        </div>
      </div>

      {isUpdating && (
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
          <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
          Updating...
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

  return (
    <div className="bg-gray-50 rounded-lg p-6 sticky top-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span>Items ({summary.total_items})</span>
          <span>€{summary.subtotal_display}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Shipping</span>
          <span>Calculated at checkout</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>VAT</span>
          <span>Calculated at checkout</span>
        </div>
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
        onClick={onProceedToCheckout}
        disabled={!canCheckout}
        className="w-full bg-gray-900 text-white px-6 py-3 rounded-md font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        data-testid="checkout-button"
      >
        {canCheckout ? 'Proceed to Checkout' : 'Cannot Proceed to Checkout'}
      </button>

      <div className="mt-4 text-xs text-gray-600 space-y-1">
        <p>• Free shipping on orders over €75</p>
        <p>• Secure checkout with SSL encryption</p>
        <p>• Age verification required upon delivery</p>
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