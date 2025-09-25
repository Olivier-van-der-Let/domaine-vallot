'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CartItemWithProduct, CartSummary, VATCalculation } from '@/types'

interface CartPageProps {
  params: Promise<{ locale: string }>
}

export default function CartPage({
  params
}: CartPageProps) {
  const [locale, setLocale] = useState<string>('en')
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([])
  const [cartSummary, setCartSummary] = useState<CartSummary>({
    itemCount: 0,
    totalQuantity: 0,
    subtotalEur: 0
  })
  const [vatCalculation, setVatCalculation] = useState<VATCalculation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    params.then(({ locale: resolvedLocale }) => {
      setLocale(resolvedLocale)
      fetchCart()
    })
  }, [params])

  const fetchCart = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/cart')

      if (!response.ok) {
        throw new Error('Failed to fetch cart')
      }

      const result = await response.json()
      setCartItems(result.data?.items || [])
      setCartSummary(result.data?.summary || {
        itemCount: 0,
        totalQuantity: 0,
        subtotalEur: 0
      })

      // Skip VAT calculation for now to avoid API errors
      // Will be calculated at checkout
      setVatCalculation(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setCartItems([])
      setCartSummary({
        itemCount: 0,
        totalQuantity: 0,
        subtotalEur: 0
      })
      setVatCalculation(null)
    } finally {
      setLoading(false)
    }
  }

  const calculateVAT = async (subtotal: number) => {
    try {
      const response = await fetch('/api/vat/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: subtotal,
          countryCode: 'FR',
          productCategory: 'wine'
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setVatCalculation(result.data)
        } else {
          // Set a fallback VAT calculation if API fails
          setVatCalculation({
            grossAmount: subtotal * 1.20, // 20% VAT fallback
            netAmount: subtotal,
            vatAmount: subtotal * 0.20,
            vatRate: 0.20
          })
        }
      } else {
        // Handle non-200 responses gracefully
        setVatCalculation({
          grossAmount: subtotal * 1.20,
          netAmount: subtotal,
          vatAmount: subtotal * 0.20,
          vatRate: 0.20
        })
      }
    } catch (error) {
      console.error('Error calculating VAT:', error)
      // Set fallback VAT on error
      setVatCalculation({
        grossAmount: subtotal * 1.20,
        netAmount: subtotal,
        vatAmount: subtotal * 0.20,
        vatRate: 0.20
      })
    }
  }

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId)
      return
    }

    try {
      setUpdating(itemId)

      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: newQuantity })
      })

      if (!response.ok) {
        throw new Error('Failed to update quantity')
      }

      // Refresh cart after successful update
      await fetchCart()
    } catch (error) {
      console.error('Error updating quantity:', error)
      setError('Failed to update quantity')
    } finally {
      setUpdating(null)
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    try {
      setUpdating(itemId)

      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to remove item')
      }

      // Refresh cart after successful removal
      await fetchCart()
    } catch (error) {
      console.error('Error removing item:', error)
      setError('Failed to remove item')
    } finally {
      setUpdating(null)
    }
  }

  const handleClearCart = async () => {
    if (!cartItems.length) return

    try {
      setLoading(true)

      // Remove all items one by one
      await Promise.all(
        cartItems.map(item =>
          fetch(`/api/cart/${item.id}`, { method: 'DELETE' })
        )
      )

      // Refresh cart
      await fetchCart()
    } catch (error) {
      console.error('Error clearing cart:', error)
      setError('Failed to clear cart')
    } finally {
      setLoading(false)
    }
  }

  const totalWithVAT = vatCalculation
    ? vatCalculation.grossAmount
    : cartSummary.subtotalEur

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex space-x-4">
                      <div className="w-20 h-20 bg-gray-200 rounded"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 h-fit">
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 font-playfair">
            {locale === 'fr' ? 'Panier' : 'Shopping Cart'}
          </h1>
          <p className="text-gray-600 mt-2">
            {cartSummary.itemCount > 0
              ? locale === 'fr'
                ? `${cartSummary.itemCount} article${cartSummary.itemCount > 1 ? 's' : ''} dans votre panier`
                : `${cartSummary.itemCount} item${cartSummary.itemCount > 1 ? 's' : ''} in your cart`
              : locale === 'fr'
                ? 'Votre panier est vide'
                : 'Your cart is empty'
            }
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.68 8.28A2 2 0 006.38 22h11.24a2 2 0 001.06-.82L21 13M7 13v6a2 2 0 002 2h6a2 2 0 002-2v-6" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {locale === 'fr' ? 'Votre panier est vide' : 'Your cart is empty'}
            </h2>
            <p className="text-gray-600 mb-8">
              {locale === 'fr'
                ? 'Découvrez notre sélection de vins biodynamiques exceptionnels.'
                : 'Discover our selection of exceptional biodynamic wines.'
              }
            </p>
            <Link
              href={`/${locale}/products`}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors"
            >
              {locale === 'fr' ? 'Découvrir nos vins' : 'Browse Wines'}
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <CartItemCard
                  key={item.id}
                  item={item}
                  locale={locale}
                  isUpdating={updating === item.id}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveItem}
                />
              ))}
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6 h-fit sticky top-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {locale === 'fr' ? 'Résumé de la commande' : 'Order Summary'}
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>
                    {locale === 'fr' ? 'Sous-total' : 'Subtotal'} ({cartSummary.totalQuantity} {locale === 'fr' ? 'articles' : 'items'})
                  </span>
                  <span>€{cartSummary.subtotalEur.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>
                    {locale === 'fr' ? 'Livraison' : 'Shipping'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {locale === 'fr' ? 'Calculé au checkout' : 'Calculated at checkout'}
                  </span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>
                    {locale === 'fr' ? 'TVA' : 'VAT'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {locale === 'fr' ? 'Calculé au checkout' : 'Calculated at checkout'}
                  </span>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between font-semibold text-gray-900 text-lg">
                    <span>{locale === 'fr' ? 'Total' : 'Total'}</span>
                    <span>€{cartSummary.subtotalEur.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Age Verification Warning */}
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-amber-800">
                    {locale === 'fr' ? 'Vérification d\'âge requise (18+)' : 'Age verification required (18+)'}
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <Link
                  href={`/${locale}/checkout`}
                  className="w-full bg-purple-600 text-white py-3 px-4 rounded-md font-medium hover:bg-purple-700 transition-colors text-center block flex items-center justify-center gap-2"
                >
                  <span>{locale === 'fr' ? 'Passer la commande' : 'Proceed to Checkout'}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>

                <Link
                  href={`/${locale}/products`}
                  className="w-full bg-gray-100 text-gray-900 py-3 px-4 rounded-md font-medium hover:bg-gray-200 transition-colors text-center block"
                >
                  {locale === 'fr' ? 'Continuer les achats' : 'Continue Shopping'}
                </Link>

                {cartItems.length > 0 && (
                  <button
                    onClick={handleClearCart}
                    className="w-full text-sm text-red-600 hover:text-red-700 font-medium py-2"
                  >
                    {locale === 'fr' ? 'Vider le panier' : 'Clear Cart'}
                  </button>
                )}
              </div>

              {/* Trust Signals */}
              <div className="pt-4 border-t text-sm text-gray-600 space-y-2">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>
                    {locale === 'fr' ? 'Livraison gratuite dès 75€' : 'Free shipping from €75'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>
                    {locale === 'fr' ? 'Paiement sécurisé avec Mollie' : 'Secure payment with Mollie'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>
                    {locale === 'fr' ? 'Expédition avec Sendcloud' : 'Shipping with Sendcloud'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface CartItemCardProps {
  item: CartItemWithProduct
  locale: string
  isUpdating: boolean
  onUpdateQuantity: (itemId: string, quantity: number) => Promise<void>
  onRemoveItem: (itemId: string) => Promise<void>
}

function CartItemCard({ item, locale, isUpdating, onUpdateQuantity, onRemoveItem }: CartItemCardProps) {
  const [imageLoading, setImageLoading] = useState(true)
  const [removeConfirmation, setRemoveConfirmation] = useState(false)

  return (
    <div className={`bg-white border rounded-lg p-4 transition-all duration-200 hover:shadow-sm ${
      isUpdating ? 'opacity-75 pointer-events-none' : ''
    }`}>
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
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoading ? 'opacity-0' : 'opacity-100'
            }`}
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
                <span className="capitalize">{item.product.category?.replace('_', ' ') || 'Wine'}</span>
                {item.product.volume && <span>{item.product.volume}ml</span>}
              </div>
            </div>
            {removeConfirmation ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onRemoveItem(item.id)
                    setRemoveConfirmation(false)
                  }}
                  disabled={isUpdating}
                  className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {locale === 'fr' ? 'Oui' : 'Yes'}
                </button>
                <button
                  onClick={() => setRemoveConfirmation(false)}
                  className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  {locale === 'fr' ? 'Non' : 'No'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setRemoveConfirmation(true)}
                disabled={isUpdating}
                className="text-gray-400 hover:text-red-600 disabled:opacity-50 transition-colors duration-200"
                title={locale === 'fr' ? 'Retirer l\'article' : 'Remove item'}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>

          {/* Quantity and Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center border border-gray-300 rounded-md shadow-sm">
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                  disabled={isUpdating || item.quantity <= 1}
                  className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  title={locale === 'fr' ? 'Diminuer la quantité' : 'Decrease quantity'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <div className="px-4 py-2 border-l border-r border-gray-300 min-w-[3rem] text-center bg-gray-50">
                  <span className="font-medium">{item.quantity}</span>
                  {item.quantity > 1 && (
                    <span className="text-xs text-gray-500 block leading-none">
                      {locale === 'fr' ? 'bouteilles' : 'bottles'}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  disabled={isUpdating || item.quantity >= item.product.stock_quantity}
                  className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  title={locale === 'fr' ? 'Augmenter la quantité' : 'Increase quantity'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
              {item.product.stock_quantity <= 5 && (
                <span className="ml-2 px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded-full">
                  {locale === 'fr' ? `Plus que ${item.product.stock_quantity} en stock` : `Only ${item.product.stock_quantity} left`}
                </span>
              )}
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-600">€{item.product.price_display} {locale === 'fr' ? 'chacun' : 'each'}</p>
              <p className="text-lg font-semibold text-gray-900">€{item.subtotalEur.toFixed(2)}</p>
              {item.quantity > 1 && (
                <p className="text-xs text-gray-500">
                  €{(item.subtotalEur / item.quantity).toFixed(2)} {locale === 'fr' ? 'par bouteille' : 'per bottle'}
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
            <span>{locale === 'fr' ? 'Mise à jour...' : 'Updating...'}</span>
          </div>
        </div>
      )}
    </div>
  )
}