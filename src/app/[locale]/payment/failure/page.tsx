'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface PaymentFailurePageProps {
  params: { locale: string }
}

export default function PaymentFailurePage({ params }: PaymentFailurePageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')
  const reason = searchParams.get('reason')
  const [countdown, setCountdown] = useState(15)

  const locale = params.locale as 'en' | 'fr'

  // Redirect countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      router.push(`/${locale}/checkout`)
    }
  }, [countdown, router, locale])

  const messages = {
    en: {
      title: 'Payment Failed',
      subtitle: 'We couldn\'t process your payment',
      description: 'Don\'t worry, your order hasn\'t been charged. Please try again or contact our support team.',
      commonReasons: 'Common reasons for payment failure:',
      reasons: [
        'Insufficient funds in your account',
        'Incorrect card details',
        'Card expired or blocked',
        'Security verification failed',
        'Network connection issues'
      ],
      whatNext: 'What can you do next?',
      actions: [
        'Check your card details and try again',
        'Try a different payment method',
        'Contact your bank if the issue persists',
        'Contact our support team for assistance'
      ],
      orderNumber: 'Order Reference',
      failureReason: 'Failure Reason',
      redirecting: 'Redirecting to checkout in',
      seconds: 'seconds',
      tryAgain: 'Try Payment Again',
      contactSupport: 'Contact Support',
      returnToCart: 'Return to Cart',
      supportInfo: 'Need help? Contact us at support@domaine-vallot.com or +33 1 23 45 67 89'
    },
    fr: {
      title: 'Échec du paiement',
      subtitle: 'Nous n\'avons pas pu traiter votre paiement',
      description: 'Ne vous inquiétez pas, votre commande n\'a pas été facturée. Veuillez réessayer ou contacter notre équipe de support.',
      commonReasons: 'Raisons courantes d\'échec de paiement :',
      reasons: [
        'Fonds insuffisants sur votre compte',
        'Détails de carte incorrects',
        'Carte expirée ou bloquée',
        'Échec de la vérification de sécurité',
        'Problèmes de connexion réseau'
      ],
      whatNext: 'Que pouvez-vous faire ensuite ?',
      actions: [
        'Vérifiez vos détails de carte et réessayez',
        'Essayez un autre moyen de paiement',
        'Contactez votre banque si le problème persiste',
        'Contactez notre équipe de support pour assistance'
      ],
      orderNumber: 'Référence de commande',
      failureReason: 'Raison de l\'échec',
      redirecting: 'Redirection vers le checkout dans',
      seconds: 'secondes',
      tryAgain: 'Réessayer le paiement',
      contactSupport: 'Contacter le support',
      returnToCart: 'Retourner au panier',
      supportInfo: 'Besoin d\'aide ? Contactez-nous à support@domaine-vallot.com ou +33 1 23 45 67 89'
    }
  }

  const t = messages[locale]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Failure Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <p className="text-xl text-gray-600 mb-4">{t.subtitle}</p>
          <p className="text-gray-500">{t.description}</p>
        </div>

        {/* Failure Details */}
        {(orderId || reason) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Failure Details</h2>

            {orderId && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">{t.orderNumber}</p>
                <p className="font-medium text-gray-900">#{orderId.slice(-8).toUpperCase()}</p>
              </div>
            )}

            {reason && (
              <div>
                <p className="text-sm text-gray-500 mb-1">{t.failureReason}</p>
                <p className="font-medium text-red-600">{reason}</p>
              </div>
            )}
          </div>
        )}

        {/* Help Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Common Reasons */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.commonReasons}</h3>
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

          {/* Next Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.whatNext}</h3>
            <ul className="space-y-2">
              {t.actions.map((action, index) => (
                <li key={index} className="flex items-start">
                  <svg className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-600">{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <button
            onClick={() => router.push(`/${locale}/checkout`)}
            className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            {t.tryAgain}
          </button>
          <button
            onClick={() => router.push(`/${locale}/cart`)}
            className="flex-1 bg-white text-gray-700 border border-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            {t.returnToCart}
          </button>
          <button
            onClick={() => window.location.href = 'mailto:support@domaine-vallot.com'}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            {t.contactSupport}
          </button>
        </div>

        {/* Support Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-blue-700">{t.supportInfo}</p>
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