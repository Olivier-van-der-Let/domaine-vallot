'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useOrderTracking } from '@/hooks/useOrderTracking'

interface PaymentSuccessPageProps {
  params: { locale: string }
}

export default function PaymentSuccessPage({ params }: PaymentSuccessPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')
  const { order, loading, error } = useOrderTracking(orderId || undefined)
  const [countdown, setCountdown] = useState(10)

  const locale = params.locale as 'en' | 'fr'

  // Redirect countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      router.push(`/${locale}`)
    }
  }, [countdown, router, locale])

  const messages = {
    en: {
      title: 'Payment Successful!',
      subtitle: 'Thank you for your order',
      description: 'Your payment has been processed successfully. You will receive a confirmation email shortly.',
      orderNumber: 'Order Number',
      orderStatus: 'Order Status',
      estimatedDelivery: 'Estimated Delivery',
      redirecting: 'Redirecting to home page in',
      seconds: 'seconds',
      trackOrder: 'Track Your Order',
      continueShopping: 'Continue Shopping',
      orderDetails: 'Order Details',
      items: 'items',
      total: 'Total',
      loadingOrder: 'Loading order details...',
      orderNotFound: 'Order not found',
      paymentConfirmed: 'Payment Confirmed',
      processing: 'Processing'
    },
    fr: {
      title: 'Paiement réussi !',
      subtitle: 'Merci pour votre commande',
      description: 'Votre paiement a été traité avec succès. Vous recevrez un email de confirmation sous peu.',
      orderNumber: 'Numéro de commande',
      orderStatus: 'Statut de la commande',
      estimatedDelivery: 'Livraison estimée',
      redirecting: 'Redirection vers la page d\'accueil dans',
      seconds: 'secondes',
      trackOrder: 'Suivre votre commande',
      continueShopping: 'Continuer les achats',
      orderDetails: 'Détails de la commande',
      items: 'articles',
      total: 'Total',
      loadingOrder: 'Chargement des détails de la commande...',
      orderNotFound: 'Commande introuvable',
      paymentConfirmed: 'Paiement confirmé',
      processing: 'En traitement'
    }
  }

  const t = messages[locale]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">{t.loadingOrder}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <p className="text-xl text-gray-600 mb-4">{t.subtitle}</p>
          <p className="text-gray-500">{t.description}</p>
        </div>

        {/* Order Information */}
        {order && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.orderDetails}</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">{t.orderNumber}</p>
                <p className="font-medium text-gray-900">#{order.id.slice(-8).toUpperCase()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">{t.orderStatus}</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {t.paymentConfirmed}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">{t.estimatedDelivery}</p>
                <p className="font-medium text-gray-900">
                  {order.estimated_delivery || '3-5 days'}
                </p>
              </div>
            </div>

            {/* Order Items */}
            <div className="border-t border-gray-200 pt-4">
              <div className="space-y-3">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{item.product_name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-gray-900">
                      €{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 mt-4 pt-4">
                <div className="flex justify-between items-center">
                  <p className="text-lg font-semibold text-gray-900">{t.total}</p>
                  <p className="text-lg font-bold text-gray-900">
                    €{order.total_amount?.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">{t.orderNotFound}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {order && (
            <button
              onClick={() => router.push(`/${locale}/orders/${order.id}`)}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {t.trackOrder}
            </button>
          )}
          <button
            onClick={() => router.push(`/${locale}`)}
            className="flex-1 bg-white text-gray-700 border border-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            {t.continueShopping}
          </button>
        </div>

        {/* Auto-redirect Notice */}
        <div className="text-center bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            {t.redirecting} <span className="font-semibold">{countdown}</span> {t.seconds}
          </p>
        </div>
      </div>
    </div>
  )
}