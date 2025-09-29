'use client'

import React from 'react'
import Image from 'next/image'
import {
  useOrderTracking,
  getOrderStatusColor,
  getOrderStatusLabel,
  getPaymentStatusColor,
  getPaymentStatusLabel,
  getOrderProgress
} from '@/hooks/useOrderTracking'

interface OrderTrackingCardProps {
  orderId: string
  locale?: 'en' | 'fr'
  className?: string
  showDetails?: boolean
}

export default function OrderTrackingCard({
  orderId,
  locale = 'en',
  className = '',
  showDetails = true
}: OrderTrackingCardProps) {
  const { order, updates, loading, error, refreshOrder } = useOrderTracking(orderId)

  if (loading) {
    return <OrderTrackingSkeleton className={className} />
  }

  if (error || !order) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-red-200 p-6 ${className}`}>
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {locale === 'fr' ? 'Commande introuvable' : 'Order not found'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <button
            onClick={refreshOrder}
            className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
          >
            {locale === 'fr' ? 'Réessayer' : 'Retry'}
          </button>
        </div>
      </div>
    )
  }

  const statusColor = getOrderStatusColor(order.status)
  const statusLabel = getOrderStatusLabel(order.status, locale)
  const paymentColor = getPaymentStatusColor(order.payment_status)
  const paymentLabel = getPaymentStatusLabel(order.payment_status, locale)
  const progress = getOrderProgress(order.status)

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {locale === 'fr' ? 'Commande' : 'Order'} #{order.id.slice(-8)}
            </h3>
            <p className="text-sm text-gray-500">
              {new Date(order.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <button
            onClick={refreshOrder}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            title={locale === 'fr' ? 'Actualiser' : 'Refresh'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Status Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${statusColor}-100 text-${statusColor}-800`}>
                {statusLabel}
              </span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${paymentColor}-100 text-${paymentColor}-800`}>
                {paymentLabel}
              </span>
            </div>
            <span className="text-lg font-semibold text-gray-900">
              €{order.total_amount.toFixed(2)}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`bg-${statusColor}-500 h-2 rounded-full transition-all duration-500 ease-out`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>{locale === 'fr' ? 'Commande reçue' : 'Order received'}</span>
            <span>{locale === 'fr' ? 'Livrée' : 'Delivered'}</span>
          </div>
        </div>

        {/* Package Tracking Information */}
        {order.tracking_number && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <span className="text-sm font-medium text-blue-900">
                {locale === 'fr' ? 'Suivi du colis' : 'Package Tracking'}
              </span>
            </div>
            <p className="text-sm text-blue-800">
              <strong>{locale === 'fr' ? 'Numéro de suivi:' : 'Tracking Number:'}</strong> {order.tracking_number}
            </p>
            {order.estimated_delivery && (
              <p className="text-sm text-blue-700 mt-1">
                <strong>{locale === 'fr' ? 'Livraison estimée:' : 'Estimated Delivery:'}</strong> {new Date(order.estimated_delivery).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}
              </p>
            )}
          </div>
        )}

        {/* Shipping Timeline */}
        {order.shipping && (order.shipping.shipped_at || order.shipping.delivered_at) && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              {locale === 'fr' ? 'Chronologie de livraison' : 'Shipping Timeline'}
            </h4>
            <div className="relative pl-6">
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-200"></div>

              {/* Order Placed */}
              <div className="relative mb-4">
                <div className="absolute left-0 w-2 h-2 bg-green-500 rounded-full transform -translate-x-3/4"></div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">
                    {locale === 'fr' ? 'Commande passée' : 'Order Placed'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {/* Shipped */}
              {order.shipping.shipped_at && (
                <div className="relative mb-4">
                  <div className="absolute left-0 w-2 h-2 bg-blue-500 rounded-full transform -translate-x-3/4"></div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">
                      {locale === 'fr' ? 'Expédié' : 'Shipped'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.shipping.shipped_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              )}

              {/* Delivered */}
              {order.shipping.delivered_at && (
                <div className="relative">
                  <div className="absolute left-0 w-2 h-2 bg-green-500 rounded-full transform -translate-x-3/4"></div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">
                      {locale === 'fr' ? 'Livré' : 'Delivered'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.shipping.delivered_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {showDetails && (
          <>
            {/* Order Items */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                {locale === 'fr' ? 'Articles commandés' : 'Order Items'}
              </h4>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    {item.image_url && (
                      <div className="flex-shrink-0 w-12 h-12 bg-white rounded-lg overflow-hidden">
                        <Image
                          src={item.image_url}
                          alt={item.product_name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.product_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {locale === 'fr' ? 'Quantité:' : 'Qty:'} {item.quantity} × €{item.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      €{(item.quantity * item.price).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Updates */}
            {updates.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  {locale === 'fr' ? 'Mises à jour récentes' : 'Recent Updates'}
                </h4>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {updates.slice(0, 5).map((update) => (
                    <div key={update.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{update.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(update.timestamp).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shipping Address */}
            {order.shipping_address && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  {locale === 'fr' ? 'Adresse de livraison' : 'Shipping Address'}
                </h4>
                <div className="text-sm text-gray-600">
                  <p>{order.shipping_address.name}</p>
                  <p>{order.shipping_address.address}</p>
                  <p>{order.shipping_address.city}, {order.shipping_address.postal_code}</p>
                  <p>{order.shipping_address.country}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function OrderTrackingSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-48 mt-2 animate-pulse"></div>
          </div>
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-3">
              <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mt-1 animate-pulse"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}