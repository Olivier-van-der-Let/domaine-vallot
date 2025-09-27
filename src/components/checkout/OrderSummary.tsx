'use client'

import React from 'react'

interface OrderSummaryProps {
  cart: any
  locale?: string
  selectedShippingOption?: {
    carrier_name: string
    option_name: string
    price: number
    currency: string
    delivery_time?: string
  } | null
}

export default function OrderSummary({ cart, locale = 'en', selectedShippingOption }: OrderSummaryProps) {
  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {locale === 'fr' ? 'Récapitulatif de commande' : 'Order Summary'}
        </h3>
        <p className="text-gray-500">
          {locale === 'fr' ? 'Votre panier est vide' : 'Your cart is empty'}
        </p>
      </div>
    )
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        {locale === 'fr' ? 'Récapitulatif de commande' : 'Order Summary'}
      </h3>

      {/* Cart Items */}
      <div className="space-y-4 mb-6">
        {cart.items.map((item: any) => (
          <div key={item.id} className="flex items-center space-x-4">
            {item.image_url && (
              <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/images/wine-placeholder.jpg'
                  }}
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {item.name}
              </h4>
              <p className="text-sm text-gray-500">
                {locale === 'fr' ? 'Quantité:' : 'Quantity:'} {item.quantity}
              </p>
              {item.vintage && (
                <p className="text-xs text-gray-400">
                  {item.vintage}
                </p>
              )}
            </div>
            <div className="text-sm font-medium text-gray-900">
              {formatPrice(item.price * item.quantity)}
            </div>
          </div>
        ))}
      </div>

      {/* Order Totals */}
      <div className="border-t border-gray-200 pt-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            {locale === 'fr' ? 'Sous-total' : 'Subtotal'}
          </span>
          <span className="text-gray-900">
            {formatPrice(cart.subtotal || 0)}
          </span>
        </div>

        {(cart.shipping_cost > 0 || selectedShippingOption) && (
          <div className="flex justify-between text-sm">
            <div className="flex flex-col">
              <span className="text-gray-600">
                {locale === 'fr' ? 'Livraison' : 'Shipping'}
              </span>
              {selectedShippingOption && (
                <div className="text-xs text-gray-500 mt-1">
                  <div>{selectedShippingOption.carrier_name} - {selectedShippingOption.option_name}</div>
                  {selectedShippingOption.delivery_time && (
                    <div className="text-gray-400">🕒 {selectedShippingOption.delivery_time}</div>
                  )}
                </div>
              )}
            </div>
            <span className="text-gray-900">
              {cart.shipping_cost > 0 ? formatPrice(cart.shipping_cost) : (
                selectedShippingOption ? formatPrice(selectedShippingOption.price / 100) : formatPrice(0)
              )}
            </span>
          </div>
        )}

        {cart.shipping_cost === 0 && !selectedShippingOption && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              {locale === 'fr' ? 'Livraison' : 'Shipping'}
            </span>
            <span className="text-gray-500 italic">
              {locale === 'fr' ? 'À calculer' : 'To be calculated'}
            </span>
          </div>
        )}

        {cart.vat_amount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              {locale === 'fr' ? 'TVA' : 'VAT'} ({cart.vat_rate}%)
            </span>
            <span className="text-gray-900">
              {formatPrice(cart.vat_amount)}
            </span>
          </div>
        )}

        {cart.discount_amount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>
              {locale === 'fr' ? 'Remise' : 'Discount'}
            </span>
            <span>
              -{formatPrice(cart.discount_amount)}
            </span>
          </div>
        )}

        <div className="border-t border-gray-200 pt-3">
          <div className="flex justify-between">
            <span className="text-base font-semibold text-gray-900">
              {locale === 'fr' ? 'Total' : 'Total'}
            </span>
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(cart.total || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div className="text-xs text-gray-500">
            <p className="font-medium mb-1">
              {locale === 'fr' ? 'Paiement sécurisé' : 'Secure Payment'}
            </p>
            <p>
              {locale === 'fr'
                ? 'Vos informations de paiement sont protégées avec un chiffrement SSL 256-bit.'
                : 'Your payment information is protected with 256-bit SSL encryption.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Item Count */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-400">
          {cart.items.length} {locale === 'fr'
            ? (cart.items.length === 1 ? 'article' : 'articles')
            : (cart.items.length === 1 ? 'item' : 'items')
          } {locale === 'fr' ? 'dans votre commande' : 'in your order'}
        </p>
      </div>
    </div>
  )
}