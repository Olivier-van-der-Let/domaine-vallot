'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface PaymentCancelPageProps {
  params: { locale: string }
}

export default function PaymentCancelPage({ params }: PaymentCancelPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')
  const [countdown, setCountdown] = useState(10)

  const locale = params.locale as 'en' | 'fr'

  // Redirect countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      router.push(`/${locale}/cart`)
    }
  }, [countdown, router, locale])

  const messages = {
    en: {
      title: 'Payment Cancelled',
      subtitle: 'Your payment was cancelled',
      description: 'No charges have been made to your account. Your items are still in your cart if you want to complete your order.',
      whyCancel: 'Why did you cancel?',
      reasons: [
        'Changed your mind about the purchase',
        'Wanted to add more items to your order',
        'Preferred a different payment method',
        'Noticed an error in your order',
        'Needed to check with someone first'
      ],
      whatNext: 'What would you like to do next?',
      orderNumber: 'Order Reference',
      redirecting: 'Redirecting to your cart in',
      seconds: 'seconds',
      returnToCart: 'Return to Cart',
      continueShopping: 'Continue Shopping',
      completeOrder: 'Complete Your Order',
      needHelp: 'Need help? Our customer service team is here to assist you.',
      contactUs: 'Contact Us',
      cartPreserved: 'Your cart has been preserved',
      cartDescription: 'All the items you selected are still in your cart. You can review your order and complete the purchase when you\'re ready.'
    },
    fr: {
      title: 'Paiement annulé',
      subtitle: 'Votre paiement a été annulé',
      description: 'Aucun frais n\'a été débité de votre compte. Vos articles sont toujours dans votre panier si vous souhaitez finaliser votre commande.',
      whyCancel: 'Pourquoi avez-vous annulé ?',
      reasons: [
        'Vous avez changé d\'avis sur l\'achat',
        'Vous vouliez ajouter plus d\'articles à votre commande',
        'Vous préfériez un autre moyen de paiement',
        'Vous avez remarqué une erreur dans votre commande',
        'Vous deviez vérifier avec quelqu\'un d\'abord'
      ],
      whatNext: 'Que souhaitez-vous faire ensuite ?',
      orderNumber: 'Référence de commande',
      redirecting: 'Redirection vers votre panier dans',
      seconds: 'secondes',
      returnToCart: 'Retourner au panier',
      continueShopping: 'Continuer les achats',
      completeOrder: 'Finaliser votre commande',
      needHelp: 'Besoin d\'aide ? Notre équipe de service client est là pour vous aider.',
      contactUs: 'Nous contacter',
      cartPreserved: 'Votre panier a été conservé',
      cartDescription: 'Tous les articles que vous avez sélectionnés sont toujours dans votre panier. Vous pouvez revoir votre commande et finaliser l\'achat quand vous êtes prêt.'
    }
  }

  const t = messages[locale]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cancel Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <p className="text-xl text-gray-600 mb-4">{t.subtitle}</p>
          <p className="text-gray-500">{t.description}</p>
        </div>

        {/* Order Reference */}
        {orderId && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">{t.orderNumber}</p>
              <p className="font-medium text-gray-900">#{orderId.slice(-8).toUpperCase()}</p>
            </div>
          </div>
        )}

        {/* Cart Preserved Notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-green-800 mb-2">{t.cartPreserved}</h3>
              <p className="text-green-700">{t.cartDescription}</p>
            </div>
          </div>
        </div>

        {/* Information Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Why Cancel */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.whyCancel}</h3>
            <ul className="space-y-2">
              {t.reasons.map((reason, index) => (
                <li key={index} className="flex items-start">
                  <svg className="w-4 h-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-600">{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* What Next */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.whatNext}</h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push(`/${locale}/cart`)}
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
              >
                <span className="text-sm font-medium text-gray-900">{t.returnToCart}</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => router.push(`/${locale}`)}
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
              >
                <span className="text-sm font-medium text-gray-900">{t.continueShopping}</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => router.push(`/${locale}/checkout`)}
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors text-left"
              >
                <span className="text-sm font-medium text-gray-900">{t.completeOrder}</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <button
            onClick={() => router.push(`/${locale}/cart`)}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            {t.returnToCart}
          </button>
          <button
            onClick={() => router.push(`/${locale}`)}
            className="flex-1 bg-white text-gray-700 border border-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            {t.continueShopping}
          </button>
        </div>

        {/* Support Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm text-blue-700 mb-2">{t.needHelp}</p>
              <button
                onClick={() => window.location.href = 'mailto:support@domaine-vallot.com'}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 underline"
              >
                {t.contactUs}
              </button>
            </div>
          </div>
        </div>

        {/* Auto-redirect Notice */}
        <div className="text-center bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-700">
            {t.redirecting} <span className="font-semibold">{countdown}</span> {t.seconds}
          </p>
        </div>
      </div>
    </div>
  )
}