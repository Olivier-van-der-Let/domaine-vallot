'use client'

import React, { useState, useEffect } from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import CartComponent from '@/components/cart/CartComponent'
import { CartItemWithProduct, CartSummary, VATCalculation } from '@/types'

interface CartPageProps {
  params: { locale: string }
}

export default function CartPage({
  params: { locale }
}: CartPageProps) {
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
    fetchCart()
  }, [])

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

      // Calculate VAT if cart has items
      if (result.data?.items?.length > 0) {
        await calculateVAT(result.data.summary.subtotalEur)
      } else {
        setVatCalculation(null)
      }
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
          countryCode: 'FR', // Default to France, could be dynamic based on user location
          productCategory: 'wine'
        })
      })

      if (response.ok) {
        const result = await response.json()
        setVatCalculation(result.data)
      }
    } catch (error) {
      console.error('Error calculating VAT:', error)
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 font-playfair">
              {locale === 'fr' ? 'Votre Panier' : 'Your Cart'}
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

          {cartItems.length > 0 && (
            <button
              onClick={handleClearCart}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              {locale === 'fr' ? 'Vider le panier' : 'Clear Cart'}
            </button>
          )}
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
            <div className="lg:col-span-2">
              <CartComponent
                items={cartItems}
                locale={locale}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                updatingItemId={updating}
              />
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6 h-fit">
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

                {vatCalculation && (
                  <div className="flex justify-between text-gray-600">
                    <span>
                      TVA ({(vatCalculation.vatRate * 100).toFixed(1)}%)
                    </span>
                    <span>€{vatCalculation.vatAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="border-t pt-3">
                  <div className="flex justify-between font-semibold text-gray-900 text-lg">
                    <span>{locale === 'fr' ? 'Total' : 'Total'}</span>
                    <span>€{totalWithVAT.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  href={`/${locale}/checkout`}
                  className="w-full bg-purple-600 text-white py-3 px-4 rounded-md font-medium hover:bg-purple-700 transition-colors text-center block"
                >
                  {locale === 'fr' ? 'Passer la commande' : 'Proceed to Checkout'}
                </Link>

                <Link
                  href={`/${locale}/products`}
                  className="w-full bg-gray-100 text-gray-900 py-3 px-4 rounded-md font-medium hover:bg-gray-200 transition-colors text-center block"
                >
                  {locale === 'fr' ? 'Continuer les achats' : 'Continue Shopping'}
                </Link>
              </div>

              {/* Shipping Info */}
              <div className="mt-6 pt-6 border-t text-sm text-gray-600">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>
                    {locale === 'fr' ? 'Livraison gratuite dès 75€' : 'Free shipping from €75'}
                  </span>
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    {locale === 'fr' ? 'Paiement sécurisé' : 'Secure payment'}
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