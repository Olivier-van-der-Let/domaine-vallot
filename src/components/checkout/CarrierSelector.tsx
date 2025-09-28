'use client'

import React, { useState, useEffect } from 'react'
import { CarrierOption, ShippingOptionDetails, SelectedShippingOption } from '@/types'

interface CarrierSelectorProps {
  carriers: CarrierOption[]
  selectedOption: SelectedShippingOption | null
  onOptionSelect: (option: SelectedShippingOption, details?: ShippingOptionDetails) => void
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
    onOptionSelect(selectedShippingOption, option)
  }

  const isOptionSelected = (option: ShippingOptionDetails): boolean => {
    return selectedOption?.option_code === option.code
  }

  const toggleCarrier = (carrierCode: string) => {
    setExpandedCarrier(expandedCarrier === carrierCode ? null : carrierCode)
  }

  const getCarrierIcon = (carrierCode: string): string => {
    // Enhanced icons for different carriers with more variety
    const icons: Record<string, string> = {
      'postnl': '📦',
      'dpd': '🚚',
      'dhl': '✈️',
      'ups': '📋',
      'fedex': '⚡',
      'gls': '🎯',
      'colissimo': '🇫🇷',
      'mondial_relay': '🌍',
      'chronopost': '⏰',
      'tnt': '🏃‍♂️',
      'db_schenker': '🚛',
      'bpost': '🇧🇪'
    }
    return icons[carrierCode.toLowerCase()] || '📬'
  }

  const getCarrierLogo = (carrierCode: string): string | null => {
    // Return carrier logo paths if available
    const logos: Record<string, string> = {
      'colissimo': '/images/carriers/colissimo.svg',
      'mondial_relay': '/images/carriers/mondial-relay.svg',
      'ups': '/images/carriers/ups.svg',
      'dhl': '/images/carriers/dhl.svg',
      'dpd': '/images/carriers/dpd.svg'
    }
    return logos[carrierCode.toLowerCase()] || null
  }

  const getLowestPrice = (carrier: CarrierOption): number => {
    return Math.min(...carrier.shipping_options.map(option => option.price))
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

      {carriers.map((carrier) => {
        const lowestPrice = getLowestPrice(carrier)
        const carrierLogo = getCarrierLogo(carrier.code)
        const isSelected = selectedOption && selectedOption.carrier_code === carrier.code

        return (
          <div key={carrier.code} className={`border rounded-xl overflow-hidden transition-all duration-200 ${
            isSelected
              ? 'border-blue-500 shadow-md ring-1 ring-blue-100'
              : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
          }`}>
            {/* Enhanced Carrier Header */}
            <button
              type="button"
              onClick={() => toggleCarrier(carrier.code)}
              className={`w-full p-5 transition-colors flex items-center justify-between ${
                isSelected
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100'
                  : 'bg-white hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-4">
                {/* Carrier logo or icon */}
                <div className="flex-shrink-0">
                  {carrierLogo ? (
                    <img
                      src={carrierLogo}
                      alt={carrier.name}
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        if (target.nextElementSibling) {
                          (target.nextElementSibling as HTMLElement).style.display = 'inline'
                        }
                      }}
                    />
                  ) : null}
                  <span className={`text-2xl ${carrierLogo ? 'hidden' : 'inline'}`}>
                    {getCarrierIcon(carrier.code)}
                  </span>
                </div>

                <div className="text-left">
                  <h4 className={`font-semibold ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                    {carrier.name}
                  </h4>
                  <div className="flex items-center space-x-3 mt-1">
                    <p className="text-sm text-gray-500">
                      {carrier.shipping_options.length} {
                        locale === 'fr'
                          ? carrier.shipping_options.length === 1 ? 'option' : 'options'
                          : carrier.shipping_options.length === 1 ? 'option' : 'options'
                      }
                    </p>
                    <span className="text-sm text-gray-400">•</span>
                    <p className="text-sm font-medium text-gray-700">
                      {locale === 'fr' ? 'À partir de' : 'From'} {formatPrice(lowestPrice, 'EUR')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* Show selected option price if this carrier is selected */}
                {isSelected && selectedOption && (
                  <div className="text-right">
                    <span className="text-lg font-semibold text-blue-600">
                      {formatPrice(selectedOption.price, selectedOption.currency)}
                    </span>
                    <p className="text-xs text-blue-500 mt-1">
                      {locale === 'fr' ? 'Sélectionné' : 'Selected'}
                    </p>
                  </div>
                )}

                <svg
                  className={`w-5 h-5 transform transition-transform duration-200 ${
                    expandedCarrier === carrier.code ? 'rotate-180' : ''
                  } ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Enhanced Shipping Options */}
            {expandedCarrier === carrier.code && (
              <div className="p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white">
                {carrier.shipping_options.map((option) => (
                  <label
                    key={option.code}
                    className={`block p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                      isOptionSelected(option)
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200 shadow-sm'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-white hover:shadow-sm'
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
        )
      })}

      {/* Enhanced Selected option summary */}
      {selectedOption && (
        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">
                  {locale === 'fr' ? 'Option sélectionnée' : 'Selected shipping option'}
                </p>
                <p className="text-sm text-green-700 font-medium">
                  {selectedOption.carrier_name} - {selectedOption.option_name}
                </p>
                {selectedOption.delivery_time && (
                  <p className="text-xs text-green-600 mt-1">
                    🕒 {formatDeliveryTime(selectedOption.delivery_time)}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-green-800">
                {formatPrice(selectedOption.price, selectedOption.currency)}
              </p>
              <p className="text-xs text-green-600">
                {locale === 'fr' ? 'Frais de livraison' : 'Shipping cost'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}