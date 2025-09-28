'use client'

import React, { useState, useEffect } from 'react'
import { GeoapifyGeocoderAutocomplete, GeoapifyContext } from '@geoapify/react-geocoder-autocomplete'
import '@geoapify/geocoder-autocomplete/styles/minimal.css'

export interface AddressData {
  street: string
  houseNumber?: string
  city: string
  postalCode: string
  country: string
  countryCode: string
  fullAddress: string
}

interface AddressAutocompleteProps {
  onAddressSelect: (address: AddressData) => void
  placeholder?: string
  className?: string
  locale?: string
  countries?: string[]
  initialValue?: string
  disabled?: boolean
  required?: boolean
  error?: string
}

export default function AddressAutocomplete({
  onAddressSelect,
  placeholder,
  className = '',
  locale = 'en',
  countries = ['FR', 'DE', 'IT', 'ES', 'BE', 'NL', 'AT', 'PT', 'LU'],
  initialValue = '',
  disabled = false,
  required = false,
  error
}: AddressAutocompleteProps) {
  const [apiKey, setApiKey] = useState<string>('')
  const [isManualEntry, setIsManualEntry] = useState(false)
  const [manualAddress, setManualAddress] = useState(initialValue)

  useEffect(() => {
    // Get API key from environment or use a placeholder for development
    const key = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY || 'demo_key'
    setApiKey(key)
  }, [])

  const extractHouseNumber = (addressString: string): { street: string; houseNumber?: string } => {
    // Common patterns for extracting house numbers
    const patterns = [
      /^(\d+[\w\-\/]*)\s+(.+)$/, // "123A Main Street" -> "123A", "Main Street"
      /^(.+)\s+(\d+[\w\-\/]*)$/, // "Main Street 123A" -> "Main Street", "123A"
    ]

    for (const pattern of patterns) {
      const match = addressString.match(pattern)
      if (match) {
        // Check if first capture group is likely a house number
        if (/^\d/.test(match[1])) {
          return {
            street: match[2].trim(),
            houseNumber: match[1].trim()
          }
        } else if (/^\d/.test(match[2])) {
          return {
            street: match[1].trim(),
            houseNumber: match[2].trim()
          }
        }
      }
    }

    // If no house number found, return as is
    return { street: addressString.trim() }
  }

  const handlePlaceSelect = (value: any) => {
    if (!value || !value.properties) return

    const props = value.properties

    // Extract house number from address line 1 if available
    const addressLine1 = props.address_line1 || props.formatted || ''
    const { street, houseNumber } = extractHouseNumber(addressLine1)

    const addressData: AddressData = {
      street: street || props.street || props.address_line1 || '',
      houseNumber: houseNumber || props.housenumber || '',
      city: props.city || props.locality || '',
      postalCode: props.postcode || '',
      country: props.country || '',
      countryCode: props.country_code?.toUpperCase() || '',
      fullAddress: props.formatted || ''
    }

    onAddressSelect(addressData)
  }

  const handleManualSubmit = () => {
    if (manualAddress.trim()) {
      // For manual entry, we provide a basic structure
      // User will need to fill other fields manually
      const addressData: AddressData = {
        street: manualAddress.trim(),
        houseNumber: '',
        city: '',
        postalCode: '',
        country: '',
        countryCode: '',
        fullAddress: manualAddress.trim()
      }
      onAddressSelect(addressData)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isManualEntry) {
      e.preventDefault()
      handleManualSubmit()
    }
  }

  if (!apiKey || apiKey === 'demo_key') {
    // Fallback to manual input when API key is not available
    return (
      <div className="space-y-2">
        <input
          type="text"
          value={manualAddress}
          onChange={(e) => setManualAddress(e.target.value)}
          onKeyPress={handleKeyPress}
          onBlur={handleManualSubmit}
          placeholder={placeholder || (locale === 'fr' ? 'Entrez votre adresse' : 'Enter your address')}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
            error ? 'border-red-500 bg-red-50' : 'border-gray-300'
          } ${className}`}
          disabled={disabled}
          required={required}
        />
        {apiKey === 'demo_key' && (
          <p className="text-sm text-amber-600">
            {locale === 'fr' ?
              'Autocomplétion indisponible - saisie manuelle requise' :
              'Autocomplete unavailable - manual entry required'
            }
          </p>
        )}
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <GeoapifyContext apiKey={apiKey}>
        <div className="relative">
          {!isManualEntry ? (
            <div className="space-y-2">
              <GeoapifyGeocoderAutocomplete
                placeholder={placeholder || (locale === 'fr' ? 'Commencez à taper votre adresse...' : 'Start typing your address...')}
                type="geocode"
                lang={locale}
                countries={countries}
                debounceDelay={300}
                skipIcons={true}
                skipDetails={false}
                value={initialValue}
                placeSelect={handlePlaceSelect}
                className={`geoapify-autocomplete-input w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  error ? 'border-red-500 bg-red-50' : 'border-gray-300'
                } ${className}`}
                disabled={disabled}
                required={required}
              />
              <button
                type="button"
                onClick={() => setIsManualEntry(true)}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                {locale === 'fr' ? 'Saisir manuellement l\'adresse' : 'Enter address manually'}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                onKeyPress={handleKeyPress}
                onBlur={handleManualSubmit}
                placeholder={placeholder || (locale === 'fr' ? 'Entrez votre adresse' : 'Enter your address')}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  error ? 'border-red-500 bg-red-50' : 'border-gray-300'
                } ${className}`}
                disabled={disabled}
                required={required}
              />
              <button
                type="button"
                onClick={() => setIsManualEntry(false)}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                {locale === 'fr' ? 'Utiliser l\'autocomplétion' : 'Use autocomplete'}
              </button>
            </div>
          )}
        </div>
      </GeoapifyContext>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <style jsx global>{`
        .geoapify-autocomplete-input {
          font-family: inherit !important;
          font-size: inherit !important;
        }

        .geoapify-autocomplete {
          position: relative;
        }

        .geoapify-autocomplete-items {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          z-index: 50;
          background: white;
          border: 1px solid #d1d5db;
          border-top: none;
          border-radius: 0 0 0.5rem 0.5rem;
          max-height: 200px;
          overflow-y: auto;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .geoapify-autocomplete-item {
          padding: 0.75rem 1rem;
          cursor: pointer;
          border-bottom: 1px solid #f3f4f6;
          transition: background-color 0.15s ease;
        }

        .geoapify-autocomplete-item:hover,
        .geoapify-autocomplete-item.selected {
          background-color: #f3f4f6;
        }

        .geoapify-autocomplete-item:last-child {
          border-bottom: none;
        }

        .geoapify-autocomplete-item-main-text {
          font-weight: 500;
          color: #111827;
        }

        .geoapify-autocomplete-item-secondary-text {
          font-size: 0.875rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }
      `}</style>
    </div>
  )
}