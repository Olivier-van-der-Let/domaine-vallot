import React from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { OrderWithDetails } from '@/types'

interface OrderConfirmationPageProps {
  params: {
    locale: string
    id: string
  }
}

async function getOrder(orderId: string): Promise<OrderWithDetails | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/orders/${orderId}`, {
      cache: 'no-store' // Always fetch fresh order data
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error('Failed to fetch order')
    }

    const result = await response.json()
    return result.data || null
  } catch (error) {
    console.error('Error fetching order:', error)
    return null
  }
}

export async function generateMetadata({
  params: { locale, id }
}: OrderConfirmationPageProps): Promise<Metadata> {
  const order = await getOrder(id)

  if (!order) {
    return {
      title: 'Order Not Found',
      description: 'The requested order could not be found.'
    }
  }

  return {
    title: `Order ${order.orderNumber} | Domaine Vallot`,
    description: `Order confirmation for ${order.orderNumber} - Thank you for your purchase from Domaine Vallot`,
    robots: 'noindex, nofollow' // Order pages should not be indexed
  }
}

export default async function OrderConfirmationPage({
  params: { locale, id }
}: OrderConfirmationPageProps) {
  const order = await getOrder(id)

  if (!order) {
    notFound()
  }

  const isOrderConfirmed = order.status === 'confirmed' || order.paymentStatus === 'paid'
  const isPending = order.status === 'pending' || order.paymentStatus === 'pending'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          {isOrderConfirmed ? (
            <>
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 font-playfair mb-4">
                {locale === 'fr' ? 'Commande confirmée !' : 'Order Confirmed!'}
              </h1>
              <p className="text-lg text-gray-600">
                {locale === 'fr'
                  ? 'Merci pour votre commande. Vous recevrez un email de confirmation sous peu.'
                  : 'Thank you for your order. You will receive a confirmation email shortly.'
                }
              </p>
            </>
          ) : isPending ? (
            <>
              <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 font-playfair mb-4">
                {locale === 'fr' ? 'Commande en attente' : 'Order Pending'}
              </h1>
              <p className="text-lg text-gray-600">
                {locale === 'fr'
                  ? 'Votre commande est en cours de traitement. Nous vous tiendrons informé de son statut.'
                  : 'Your order is being processed. We will keep you updated on its status.'
                }
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 font-playfair mb-4">
                {locale === 'fr' ? 'Problème avec la commande' : 'Order Issue'}
              </h1>
              <p className="text-lg text-gray-600">
                {locale === 'fr'
                  ? 'Il y a eu un problème avec votre commande. Veuillez nous contacter.'
                  : 'There was an issue with your order. Please contact us.'
                }
              </p>
            </>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {locale === 'fr' ? 'Informations de commande' : 'Order Information'}
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    {locale === 'fr' ? 'Numéro de commande' : 'Order Number'}
                  </dt>
                  <dd className="text-sm text-gray-900">{order.orderNumber}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    {locale === 'fr' ? 'Date de commande' : 'Order Date'}
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(order.createdAt).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    {locale === 'fr' ? 'Statut' : 'Status'}
                  </dt>
                  <dd className="text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      isOrderConfirmed
                        ? 'bg-green-100 text-green-800'
                        : isPending
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {locale === 'fr' ? (
                        order.status === 'confirmed' ? 'Confirmée' :
                        order.status === 'pending' ? 'En attente' :
                        order.status === 'processing' ? 'En cours' :
                        order.status === 'shipped' ? 'Expédiée' :
                        order.status === 'delivered' ? 'Livrée' :
                        order.status === 'cancelled' ? 'Annulée' : order.status
                      ) : (
                        order.status.charAt(0).toUpperCase() + order.status.slice(1)
                      )}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    {locale === 'fr' ? 'Statut de paiement' : 'Payment Status'}
                  </dt>
                  <dd className="text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      order.paymentStatus === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : order.paymentStatus === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {locale === 'fr' ? (
                        order.paymentStatus === 'paid' ? 'Payé' :
                        order.paymentStatus === 'pending' ? 'En attente' :
                        order.paymentStatus === 'failed' ? 'Échec' :
                        order.paymentStatus === 'refunded' ? 'Remboursé' : order.paymentStatus
                      ) : (
                        order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)
                      )}
                    </span>
                  </dd>
                </div>
                {order.trackingNumber && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">
                      {locale === 'fr' ? 'Numéro de suivi' : 'Tracking Number'}
                    </dt>
                    <dd className="text-sm text-gray-900 font-mono">{order.trackingNumber}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {locale === 'fr' ? 'Articles commandés' : 'Order Items'}
              </h2>
              <div className="space-y-4">
                {order.itemsWithProducts.map((item) => (
                  <div key={item.id} className="flex space-x-4 py-4 border-b last:border-b-0">
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
                      <h3 className="text-sm font-medium text-gray-900">
                        {item.product.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {item.product.vintage && `${item.product.vintage} • `}
                        {item.product.varietal} • {item.product.volumeMl}ml
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-600">
                          {locale === 'fr' ? 'Qté' : 'Qty'}: {item.quantity}
                        </span>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">
                            €{item.unitPriceEur.toFixed(2)} {locale === 'fr' ? 'chacun' : 'each'}
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            €{item.lineTotalEur.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {locale === 'fr' ? 'Adresse de livraison' : 'Shipping Address'}
              </h2>
              <div className="text-sm text-gray-900">
                <p className="font-medium">
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                </p>
                {order.shippingAddress.company && (
                  <p>{order.shippingAddress.company}</p>
                )}
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && (
                  <p>{order.shippingAddress.addressLine2}</p>
                )}
                <p>
                  {order.shippingAddress.postalCode} {order.shippingAddress.city}
                </p>
                {order.shippingAddress.stateProvince && (
                  <p>{order.shippingAddress.stateProvince}</p>
                )}
                <p>{order.shippingAddress.countryCode}</p>
                {order.shippingAddress.phone && (
                  <p className="mt-2">{order.shippingAddress.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6 h-fit">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {locale === 'fr' ? 'Résumé de la commande' : 'Order Summary'}
            </h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>{locale === 'fr' ? 'Sous-total' : 'Subtotal'}</span>
                <span>€{order.subtotalEur.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>{locale === 'fr' ? 'Livraison' : 'Shipping'}</span>
                <span>€{order.shippingCostEur.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>TVA ({(order.vatRate * 100).toFixed(1)}%)</span>
                <span>€{order.vatAmountEur.toFixed(2)}</span>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between font-semibold text-gray-900 text-lg">
                  <span>{locale === 'fr' ? 'Total' : 'Total'}</span>
                  <span>€{order.totalEur.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                href={`/${locale}/products`}
                className="w-full bg-purple-600 text-white py-3 px-4 rounded-md font-medium hover:bg-purple-700 transition-colors text-center block"
              >
                {locale === 'fr' ? 'Continuer les achats' : 'Continue Shopping'}
              </Link>

              <Link
                href={`/${locale}`}
                className="w-full bg-gray-100 text-gray-900 py-3 px-4 rounded-md font-medium hover:bg-gray-200 transition-colors text-center block"
              >
                {locale === 'fr' ? 'Retour à l\'accueil' : 'Back to Home'}
              </Link>
            </div>

            {/* Customer Service */}
            <div className="mt-6 pt-6 border-t text-sm text-gray-600">
              <h3 className="font-medium text-gray-900 mb-2">
                {locale === 'fr' ? 'Besoin d\'aide ?' : 'Need Help?'}
              </h3>
              <p className="mb-2">
                {locale === 'fr'
                  ? 'Contactez notre service client pour toute question concernant votre commande.'
                  : 'Contact our customer service for any questions about your order.'
                }
              </p>
              <Link
                href={`/${locale}/contact`}
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                {locale === 'fr' ? 'Nous contacter' : 'Contact Us'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}