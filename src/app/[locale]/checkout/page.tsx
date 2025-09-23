'use client'

import React, { useState, useEffect } from 'react'
import { Metadata } from 'next'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import CheckoutForm from '@/components/checkout/CheckoutForm'
import AgeVerification from '@/components/verification/AgeVerification'
import { CartItemWithProduct, CartSummary, VATCalculation, CheckoutFormData } from '@/types'

interface CheckoutPageProps {
  params: { locale: string }
}

export default function CheckoutPage({
  params: { locale }
}: CheckoutPageProps) {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([])
  const [cartSummary, setCartSummary] = useState<CartSummary>({
    itemCount: 0,
    totalQuantity: 0,
    subtotalEur: 0
  })
  const [vatCalculation, setVatCalculation] = useState<VATCalculation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [isAgeVerified, setIsAgeVerified] = useState(false)
  const [showAgeVerification, setShowAgeVerification] = useState(false)

  useEffect(() => {
    fetchCart()
    checkAgeVerification()
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
      const items = result.data?.items || []
      const summary = result.data?.summary || {
        itemCount: 0,
        totalQuantity: 0,
        subtotalEur: 0
      }

      setCartItems(items)
      setCartSummary(summary)

      // Redirect to cart if empty
      if (items.length === 0) {
        router.push(`/${locale}/cart`)
        return
      }

      // Calculate VAT
      await calculateVAT(summary.subtotalEur)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
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
        setVatCalculation(result.data)
      }
    } catch (error) {
      console.error('Error calculating VAT:', error)
    }
  }

  const checkAgeVerification = async () => {
    try {
      const response = await fetch('/api/age-verification')
      if (response.ok) {
        const result = await response.json()
        setIsAgeVerified(result.data?.verified || false)
        if (!result.data?.verified) {
          setShowAgeVerification(true)
        }
      }
    } catch (error) {
      console.error('Error checking age verification:', error)
      setShowAgeVerification(true)
    }
  }

  const handleAgeVerified = () => {
    setIsAgeVerified(true)
    setShowAgeVerification(false)
  }

  const handleCheckoutSubmit = async (formData: CheckoutFormData) => {
    try {
      setSubmitting(true)
      setError(null)

      // Create order
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          locale,
          vatCalculation
        })
      })

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json()
        throw new Error(errorData.error || 'Failed to create order')
      }

      const orderResult = await orderResponse.json()
      const order = orderResult.data

      // Redirect to order confirmation
      router.push(`/${locale}/orders/${order.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process order')
      setSubmitting(false)
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
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                  <div className="space-y-4">
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Age Verification Modal */}
      {showAgeVerification && (
        <AgeVerification
          locale={locale}
          onVerified={handleAgeVerified}
          onClose={() => router.push(`/${locale}/cart`)}
        />
      )}

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 font-playfair mb-4">
              {locale === 'fr' ? 'Finaliser la commande' : 'Checkout'}
            </h1>

            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-sm text-gray-500">
              <Link href={`/${locale}/cart`} className="hover:text-gray-700">
                {locale === 'fr' ? 'Panier' : 'Cart'}
              </Link>
              <span>/</span>
              <span className="text-gray-900">
                {locale === 'fr' ? 'Commande' : 'Checkout'}
              </span>
            </nav>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Checkout Form */}
            <div className="space-y-6">
              <CheckoutForm
                locale={locale}
                onSubmit={handleCheckoutSubmit}
                submitting={submitting}
                cartSummary={cartSummary}
                vatCalculation={vatCalculation}
              />
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6 h-fit">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                {locale === 'fr' ? 'Résumé de la commande' : 'Order Summary'}
              </h2>

              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex space-x-4">
                    <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      {item.product.images?.[0] && (
                        <img
                          src={item.product.images[0].url}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                        {item.product.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {item.product.vintage && `${item.product.vintage} • `}
                        {item.product.varietal}
                      </p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-gray-600">
                          {locale === 'fr' ? 'Qté' : 'Qty'}: {item.quantity}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          €{item.product.lineTotalEur.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pricing Summary */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>
                    {locale === 'fr' ? 'Sous-total' : 'Subtotal'} ({cartSummary.totalQuantity} {locale === 'fr' ? 'articles' : 'items'})
                  </span>
                  <span>€{cartSummary.subtotalEur.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>{locale === 'fr' ? 'Livraison' : 'Shipping'}</span>
                  <span>
                    {cartSummary.subtotalEur >= 75
                      ? locale === 'fr' ? 'Gratuite' : 'Free'
                      : '€12.00'
                    }
                  </span>
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
                    <span>
                      €{(totalWithVAT + (cartSummary.subtotalEur >= 75 ? 0 : 12)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Security badges */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{locale === 'fr' ? 'Sécurisé' : 'Secure'}</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span>{locale === 'fr' ? 'Crypté SSL' : 'SSL Encrypted'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}