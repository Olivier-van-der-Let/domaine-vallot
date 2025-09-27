'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import CheckoutForm from '@/components/checkout/CheckoutForm'
import OrderSummary from '@/components/checkout/OrderSummary'
import { useCart } from '@/hooks/useCart'

interface CheckoutPageProps {
  params: Promise<{ locale: string }>
}

export default function CheckoutPage({ params }: CheckoutPageProps) {
  const { user, loading: authLoading } = useAuth()
  const { cart, loading: cartLoading, error: cartError } = useCart()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [locale, setLocale] = useState<string>('')

  // Resolve async params
  useEffect(() => {
    params.then(p => setLocale(p.locale))
  }, [params])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user && locale) {
      router.push(`/${locale}/login?redirect=checkout`)
    }
  }, [user, authLoading, router, locale])

  // Redirect to cart if empty
  useEffect(() => {
    if (!cartLoading && cart && cart.items.length === 0 && locale) {
      router.push(`/${locale}/cart`)
    }
  }, [cart, cartLoading, router, locale])

  const handleOrderSubmit = async (orderData: any) => {
    setIsProcessing(true)
    setCheckoutError(null)

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
        credentials: 'include'
      })

      const result = await response.json()

      if (!response.ok) {
        // Handle specific error codes
        if (response.status === 409) {
          throw new Error(
            locale === 'fr'
              ? `Problème de stock détecté. ${result.issues?.length || 0} article(s) ne sont plus disponibles.`
              : `Stock issues detected. ${result.issues?.length || 0} item(s) are no longer available.`
          )
        }

        if (response.status === 402) {
          throw new Error(
            locale === 'fr'
              ? 'Échec du traitement du paiement. Veuillez réessayer.'
              : 'Payment processing failed. Please try again.'
          )
        }

        if (response.status === 400) {
          throw new Error(
            locale === 'fr'
              ? `Données de commande invalides: ${result.error || 'Erreur inconnue'}`
              : `Invalid order data: ${result.error || 'Unknown error'}`
          )
        }

        throw new Error(result.error || 'Failed to create order')
      }

      // Redirect to Mollie payment page
      if (result.order?.payment?.payment_url) {
        window.location.href = result.order.payment.payment_url
      } else {
        throw new Error(
          locale === 'fr'
            ? 'URL de paiement manquante. Veuillez contacter le support.'
            : 'No payment URL received. Please contact support.'
        )
      }

    } catch (error) {
      console.error('Checkout error:', error)
      setCheckoutError(error instanceof Error ? error.message : 'Checkout failed')
    } finally {
      setIsProcessing(false)
    }
  }

  // Show loading state
  if (authLoading || cartLoading) {
    return <CheckoutSkeleton />
  }

  // Show error state
  if (cartError) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm p-6 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Checkout</h2>
          <p className="text-gray-600 mb-4">{cartError}</p>
          <button
            onClick={() => router.push(`/${locale}/cart`)}
            className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800"
          >
            Return to Cart
          </button>
        </div>
      </div>
    )
  }

  // Don't render if cart is empty or user not authenticated
  if (!user || !cart || cart.items.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="flex mb-4" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              <li>
                <button
                  onClick={() => router.push(`/${locale}/cart`)}
                  className="hover:text-gray-700"
                >
                  Cart
                </button>
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 mx-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="font-medium text-gray-900">Checkout</span>
              </li>
            </ol>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Secure Checkout</h1>
          <p className="text-gray-600">Complete your wine order with secure payment</p>
        </div>

        {/* Error Message */}
        {checkoutError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-medium text-red-800">Checkout Error</h3>
                <p className="text-red-700 text-sm">{checkoutError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Checkout Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <CheckoutForm
              cart={cart}
              user={user}
              onSubmit={handleOrderSubmit}
              isProcessing={isProcessing}
              locale={locale}
            />
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <OrderSummary cart={cart} />
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="text-sm">
              <h4 className="font-medium text-blue-800 mb-1">Secure Payment</h4>
              <p className="text-blue-700">
                Your payment is processed securely by Mollie with industry-standard encryption.
                We never store your payment details on our servers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CheckoutSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          {/* Header */}
          <div className="mb-8">
            <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-96"></div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="space-y-6">
                  <div className="h-6 bg-gray-200 rounded w-32"></div>
                  <div className="space-y-4">
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
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
    </div>
  )
}