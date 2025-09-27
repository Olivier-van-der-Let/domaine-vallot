'use client'

import React, { useState, useEffect } from 'react'
import { CarrierOption, ShippingOptionDetails, SelectedShippingOption } from '@/types'

interface CarrierSelectorProps {
  carriers: CarrierOption[]
  selectedOption: SelectedShippingOption | null
  onOptionSelect: (option: SelectedShippingOption) => void
  loading?: boolean
  locale: string
}

export default function CarrierSelector({
  carriers,
  selectedOption,
  onOptionSelect,
  loading = false,
  locale
}: CarrierSelectorProps) {
  const [expandedCarrier, setExpandedCarrier] = useState<string | null>(null)

  // Auto-expand the first carrier or the carrier with the selected option
  useEffect(() => {
    if (carriers.length > 0 && !expandedCarrier) {
      if (selectedOption) {
        // Expand the carrier that contains the selected option
        const selectedCarrier = carriers.find(carrier =>
          carrier.shipping_options.some(option => option.code === selectedOption.option_code)
        )
        if (selectedCarrier) {
          setExpandedCarrier(selectedCarrier.code)
        }
      } else {
        // Expand the first carrier by default
        setExpandedCarrier(carriers[0].code)
      }
    }
  }, [carriers, selectedOption, expandedCarrier])

  const handleOptionSelect = (carrier: CarrierOption, option: ShippingOptionDetails) => {
    const selectedShippingOption: SelectedShippingOption = {
      carrier_code: carrier.code,
      carrier_name: carrier.name,
      option_code: option.code,
      option_name: option.name,
      price: option.price,
      currency: option.currency,
      delivery_time: option.delivery_time,
      service_point_required: option.service_point_required
    }
    onOptionSelect(selectedShippingOption)
  }

  const isOptionSelected = (option: ShippingOptionDetails): boolean => {
    return selectedOption?.option_code === option.code
  }

  const toggleCarrier = (carrierCode: string) => {
    setExpandedCarrier(expandedCarrier === carrierCode ? null : carrierCode)
  }

  const getCarrierIcon = (carrierCode: string): string => {
    // Simple emoji icons for different carriers
    const icons: Record<string, string> = {
      'postnl': '📦',
      'dpd': '🚚',
      'dhl': '✈️',
      'ups': '📋',
      'fedex': '⚡',
      'gls': '🎯',
      'colissimo': '🇫🇷',
      'chronopost': '⏰',
      'tnt': '🏃',
    }
    return icons[carrierCode.toLowerCase()] || '📬'
  }

  const formatDeliveryTime = (deliveryTime?: string): string => {
    if (!deliveryTime) return locale === 'fr' ? 'Délai standard' : 'Standard delivery'
    return deliveryTime
  }

  const formatPrice = (price: number, currency: string): string => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      style: 'currency',
      currency: currency,
    }).format(price / 100)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 mb-3">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (carriers.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-2">
          {locale === 'fr' ? '📦 Aucune option de livraison disponible' : '📦 No shipping options available'}
        </div>
        <p className="text-sm text-gray-400">
          {locale === 'fr'
            ? 'Veuillez vérifier votre adresse de livraison'
            : 'Please check your shipping address'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {locale === 'fr' ? 'Choisissez votre transporteur' : 'Choose your carrier'}
      </h3>

      {carriers.map((carrier) => (
        <div key={carrier.code} className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Carrier Header */}
          <button
            type="button"
            onClick={() => toggleCarrier(carrier.code)}
            className="w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getCarrierIcon(carrier.code)}</span>
              <div className="text-left">
                <h4 className="font-medium text-gray-900">{carrier.name}</h4>
                <p className="text-sm text-gray-500">
                  {carrier.shipping_options.length} {
                    locale === 'fr'
                      ? carrier.shipping_options.length === 1 ? 'option' : 'options'
                      : carrier.shipping_options.length === 1 ? 'option' : 'options'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Show selected option price if this carrier is selected */}
              {selectedOption && selectedOption.carrier_code === carrier.code && (
                <span className="text-sm font-medium text-green-600">
                  {formatPrice(selectedOption.price, selectedOption.currency)}
                </span>
              )}
              <svg
                className={`w-5 h-5 transform transition-transform ${
                  expandedCarrier === carrier.code ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {/* Shipping Options */}
          {expandedCarrier === carrier.code && (
            <div className="p-4 space-y-3 bg-white">
              {carrier.shipping_options.map((option) => (
                <label
                  key={option.code}
                  className={`block p-3 border rounded-lg cursor-pointer transition-all ${
                    isOptionSelected(option)
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="radio"
                      name="shipping-option"
                      value={option.code}
                      checked={isOptionSelected(option)}
                      onChange={() => handleOptionSelect(carrier, option)}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{option.name}</h5>
                          <div className="mt-1 space-y-1">
                            <p className="text-sm text-gray-600">
                              🕒 {formatDeliveryTime(option.delivery_time)}
                            </p>

                            {/* Features */}
                            <div className="flex flex-wrap gap-1">
                              {option.characteristics.is_tracked && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                                  📍 {locale === 'fr' ? 'Suivi' : 'Tracked'}
                                </span>
                              )}
                              {option.characteristics.requires_signature && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                                  ✍️ {locale === 'fr' ? 'Signature' : 'Signature'}
                                </span>
                              )}
                              {option.characteristics.is_express && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">
                                  ⚡ {locale === 'fr' ? 'Express' : 'Express'}
                                </span>
                              )}
                              {option.service_point_required && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
                                  📍 {locale === 'fr' ? 'Point relais' : 'Service Point'}
                                </span>
                              )}
                            </div>

                            {/* Insurance info */}
                            {option.characteristics.insurance > 0 && (
                              <p className="text-xs text-gray-500">
                                🛡️ {locale === 'fr' ? 'Assuré jusqu\'à' : 'Insured up to'} {formatPrice(option.characteristics.insurance * 100, option.currency)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="ml-3 text-right">
                          <div className="font-semibold text-gray-900">
                            {formatPrice(option.price, option.currency)}
                          </div>
                          {option.price === 0 && (
                            <div className="text-xs text-green-600 font-medium">
                              {locale === 'fr' ? 'Gratuit' : 'Free'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Selected option summary */}
      {selectedOption && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">
                {locale === 'fr' ? 'Option sélectionnée:' : 'Selected option:'}
              </p>
              <p className="text-sm text-green-700">
                {selectedOption.carrier_name} - {selectedOption.option_name}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-green-800">
                {formatPrice(selectedOption.price, selectedOption.currency)}
              </p>
              {selectedOption.delivery_time && (
                <p className="text-xs text-green-600">
                  {formatDeliveryTime(selectedOption.delivery_time)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}