'use client'

import React, { useState, useEffect } from 'react'
import CarrierSelector from './CarrierSelector'
import AddressAutocomplete, { AddressData } from '@/components/ui/AddressAutocomplete'
import { CarrierOption, SelectedShippingOption, CarrierSelectionResponse } from '@/types'

interface CheckoutFormProps {
  cart: any
  user: any
  onSubmit: (orderData: any) => Promise<void>
  isProcessing: boolean
  locale: string
  updateShippingCost?: (cost: number) => void
  onShippingOptionChange?: (option: SelectedShippingOption | null) => void
}

interface FormErrors {
  [key: string]: string
}

export default function CheckoutForm({
  cart,
  user,
  onSubmit,
  isProcessing,
  locale,
  updateShippingCost,
  onShippingOptionChange
}: CheckoutFormProps) {
  const [formData, setFormData] = useState({
    customer: {
      email: user?.email || '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || ''
    },
    shipping: {
      address: '',
      city: '',
      postalCode: '',
      country: 'FR'
    },
    billing: {
      sameAsShipping: true,
      address: '',
      city: '',
      postalCode: '',
      country: 'FR'
    },
    payment: {
      method: 'mollie'
    }
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<{[key: string]: boolean}>({})
  const [shippingRates, setShippingRates] = useState<any[]>([])
  const [selectedShipping, setSelectedShipping] = useState<string>('')
  const [loadingShipping, setLoadingShipping] = useState(false)
  // New carrier selection state
  const [carriers, setCarriers] = useState<CarrierOption[]>([])
  const [selectedShippingOption, setSelectedShippingOption] = useState<SelectedShippingOption | null>(null)
  const [loadingCarriers, setLoadingCarriers] = useState(false)
  // Address autocomplete state
  const [useAutocomplete, setUseAutocomplete] = useState(true)

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  }

  const validateField = (name: string, value: string) => {
    let error = ''

    switch (name) {
      case 'customer.email':
        if (!value) error = 'Email is required'
        else if (!validateEmail(value)) error = 'Invalid email format'
        break
      case 'customer.firstName':
      case 'customer.lastName':
        if (!value) error = 'This field is required'
        else if (value.length < 2) error = 'Must be at least 2 characters'
        break
      case 'shipping.address':
      case 'shipping.city':
        if (!value) error = 'This field is required'
        break
      case 'shipping.postalCode':
        if (!value) error = 'Postal code is required'
        else if (formData.shipping.country === 'FR' && !/^\d{5}$/.test(value)) {
          error = 'Invalid French postal code'
        }
        break
    }

    setErrors(prev => ({ ...prev, [name]: error }))
    return !error
  }

  const handleFieldChange = (section: string, field: string, value: string) => {
    const fieldName = `${section}.${field}`

    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section as keyof typeof prev], [field]: value }
    }))

    if (touched[fieldName]) {
      validateField(fieldName, value)
    }
  }

  const handleFieldBlur = (section: string, field: string) => {
    const fieldName = `${section}.${field}`
    setTouched(prev => ({ ...prev, [fieldName]: true }))
    validateField(fieldName, (formData as any)[section][field])
  }

  // Calculate shipping options when address changes
  useEffect(() => {
    if (formData.shipping.country && formData.shipping.postalCode?.length >= 4) {
      calculateShippingOptions()
    }
  }, [formData.shipping.country, formData.shipping.postalCode, formData.shipping.city])

  // Pre-populate user data when user changes
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        customer: {
          email: user.email || prev.customer.email,
          firstName: user.firstName || prev.customer.firstName,
          lastName: user.lastName || prev.customer.lastName,
          phone: user.phone || prev.customer.phone
        }
      }))
    }
  }, [user])

  const calculateShippingRates = async () => {
    if (!cart?.total || cart.items.length === 0) return

    setLoadingShipping(true)
    try {
      const response = await fetch('/api/shipping/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: {
            country: formData.shipping.country,
            postalCode: formData.shipping.postalCode,
            city: formData.shipping.city
          },
          items: cart.items.map((item: any) => ({
            quantity: item.quantity,
            weight: item.weight || 750 // Default 750g per bottle
          })),
          totalValue: cart.total
        })
      })

      if (response.ok) {
        const result = await response.json()
        setShippingRates(result.rates || [])
        if (result.rates?.length > 0 && !selectedShipping) {
          setSelectedShipping(result.rates[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to calculate shipping:', error)
    } finally {
      setLoadingShipping(false)
    }
  }

  const calculateShippingOptions = async () => {
    if (!cart?.total || cart.items.length === 0) return

    setLoadingCarriers(true)
    try {
      const response = await fetch('/api/shipping/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: {
            country: formData.shipping.country,
            postalCode: formData.shipping.postalCode,
            city: formData.shipping.city
          },
          items: cart.items.map((item: any) => ({
            productId: item.productId || item.id,
            quantity: item.quantity,
            weight: item.weight || 750 // Default 750g per bottle
          })),
          totalValue: cart.total
        })
      })

      if (response.ok) {
        const result: CarrierSelectionResponse = await response.json()
        setCarriers(result.carriers || [])

        // Auto-select the first available option if none selected
        if (result.carriers?.length > 0 && !selectedShippingOption) {
          const firstCarrier = result.carriers[0]
          if (firstCarrier.shipping_options.length > 0) {
            const firstOption = firstCarrier.shipping_options[0]
            handleShippingOptionSelect({
              carrier_code: firstCarrier.code,
              carrier_name: firstCarrier.name,
              option_code: firstOption.code,
              option_name: firstOption.name,
              price: firstOption.price,
              currency: firstOption.currency,
              delivery_time: firstOption.delivery_time,
              service_point_required: firstOption.service_point_required
            })
          }
        }
      }
    } catch (error) {
      console.error('Failed to calculate shipping options:', error)
    } finally {
      setLoadingCarriers(false)
    }
  }

  const handleShippingOptionSelect = (option: SelectedShippingOption) => {
    setSelectedShippingOption(option)
    // Update legacy selectedShipping for backward compatibility
    setSelectedShipping(option.option_code)

    // Update cart shipping cost through the passed function
    if (updateShippingCost) {
      updateShippingCost(option.price)
    }

    // Notify parent component about the shipping option change
    if (onShippingOptionChange) {
      onShippingOptionChange(option)
    }
  }

  const handleAddressSelect = (addressData: AddressData) => {
    // Update form data with selected address
    setFormData(prev => ({
      ...prev,
      shipping: {
        ...prev.shipping,
        address: addressData.houseNumber
          ? `${addressData.houseNumber} ${addressData.street}`
          : addressData.street,
        city: addressData.city,
        postalCode: addressData.postalCode,
        country: addressData.countryCode || addressData.country
      }
    }))

    // Clear any previous address-related errors
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors['shipping.address']
      delete newErrors['shipping.city']
      delete newErrors['shipping.postalCode']
      return newErrors
    })

    // Mark address fields as touched since they were auto-filled
    setTouched(prev => ({
      ...prev,
      'shipping.address': true,
      'shipping.city': true,
      'shipping.postalCode': true
    }))
  }

  const validateForm = (): boolean => {
    const requiredFields = [
      'customer.email', 'customer.firstName', 'customer.lastName',
      'shipping.address', 'shipping.city', 'shipping.postalCode'
    ]

    let isValid = true
    const newErrors: FormErrors = {}

    requiredFields.forEach(fieldName => {
      const [section, field] = fieldName.split('.')
      const value = (formData as any)[section][field]
      if (!validateField(fieldName, value)) {
        isValid = false
      }
    })

    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      // Mark all fields as touched to show validation errors
      const allFields = [
        'customer.email', 'customer.firstName', 'customer.lastName',
        'shipping.address', 'shipping.city', 'shipping.postalCode'
      ]
      const newTouched = allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {})
      setTouched(newTouched)

      // Show error message
      setErrors(prev => ({
        ...prev,
        _general: locale === 'fr'
          ? 'Veuillez corriger les erreurs ci-dessus avant de continuer'
          : 'Please fix the errors above before continuing'
      }))
      return
    }

    // Validate shipping option selection
    if (!selectedShippingOption) {
      setErrors(prev => ({
        ...prev,
        _shipping: locale === 'fr'
          ? 'Veuillez sélectionner une méthode de livraison'
          : 'Please select a shipping method'
      }))
      return
    }

    // Clear previous errors
    setErrors({})

    const submissionData = {
      cart,
      customer: formData.customer,
      shipping_address: formData.shipping,
      billing_address: formData.billing.sameAsShipping ? formData.shipping : formData.billing,
      shipping_method_id: selectedShipping, // Keep for backward compatibility
      shipping_option: selectedShippingOption, // New detailed shipping option
      payment_method: formData.payment.method,
      locale
    }

    try {
      await onSubmit(submissionData)
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        _general: error instanceof Error
          ? error.message
          : (locale === 'fr' ? 'Une erreur est survenue' : 'An error occurred')
      }))
    }
  }

  return (
    <div className="space-y-8" data-testid="checkout-form">
      {/* Progress Indicator */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <span className="ml-2 text-sm font-medium text-blue-600">Information</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <span className="ml-2 text-sm font-medium text-gray-600">Payment</span>
            </div>
          </div>
        </div>
      </div>

      {/* General Error Message */}
      {errors._general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-red-700 text-sm font-medium">{errors._general}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Contact Information */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900">
                {locale === 'fr' ? 'Informations de contact' : 'Contact Information'}
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {locale === 'fr' ? 'Adresse email' : 'Email Address'} *
                </label>
                <input
                  type="email"
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors['customer.email'] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  data-testid="customer-email"
                  value={formData.customer.email}
                  onChange={(e) => handleFieldChange('customer', 'email', e.target.value)}
                  onBlur={() => handleFieldBlur('customer', 'email')}
                  placeholder={locale === 'fr' ? 'votre@email.com' : 'your@email.com'}
                />
                {errors['customer.email'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['customer.email']}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {locale === 'fr' ? 'Prénom' : 'First Name'} *
                </label>
                <input
                  type="text"
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors['customer.firstName'] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  data-testid="customer-firstname"
                  value={formData.customer.firstName}
                  onChange={(e) => handleFieldChange('customer', 'firstName', e.target.value)}
                  onBlur={() => handleFieldBlur('customer', 'firstName')}
                />
                {errors['customer.firstName'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['customer.firstName']}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {locale === 'fr' ? 'Nom' : 'Last Name'} *
                </label>
                <input
                  type="text"
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors['customer.lastName'] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  data-testid="customer-lastname"
                  value={formData.customer.lastName}
                  onChange={(e) => handleFieldChange('customer', 'lastName', e.target.value)}
                  onBlur={() => handleFieldBlur('customer', 'lastName')}
                />
                {errors['customer.lastName'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['customer.lastName']}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {locale === 'fr' ? 'Téléphone' : 'Phone'}
                </label>
                <input
                  type="tel"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={formData.customer.phone}
                  onChange={(e) => handleFieldChange('customer', 'phone', e.target.value)}
                  placeholder={locale === 'fr' ? '+33 1 23 45 67 89' : '+33 1 23 45 67 89'}
                />
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900">
                {locale === 'fr' ? 'Adresse de livraison' : 'Shipping Address'}
              </h3>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {locale === 'fr' ? 'Adresse' : 'Street Address'} *
                </label>
                {useAutocomplete ? (
                  <AddressAutocomplete
                    onAddressSelect={handleAddressSelect}
                    placeholder={locale === 'fr' ? '123 Rue de la Paix' : '123 Main Street'}
                    locale={locale}
                    initialValue={formData.shipping.address}
                    required
                    error={errors['shipping.address']}
                    countries={['FR', 'DE', 'IT', 'ES', 'BE', 'NL', 'AT', 'PT', 'LU', 'GB']}
                  />
                ) : (
                  <>
                    <input
                      type="text"
                      required
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors['shipping.address'] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      data-testid="shipping-address"
                      value={formData.shipping.address}
                      onChange={(e) => handleFieldChange('shipping', 'address', e.target.value)}
                      onBlur={() => handleFieldBlur('shipping', 'address')}
                      placeholder={locale === 'fr' ? '123 Rue de la Paix' : '123 Main Street'}
                    />
                    {errors['shipping.address'] && (
                      <p className="mt-1 text-sm text-red-600">{errors['shipping.address']}</p>
                    )}
                    <button
                      type="button"
                      onClick={() => setUseAutocomplete(true)}
                      className="text-sm text-blue-600 hover:text-blue-700 underline mt-1"
                    >
                      {locale === 'fr' ? 'Utiliser l\'autocomplétion' : 'Use autocomplete'}
                    </button>
                  </>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {locale === 'fr' ? 'Ville' : 'City'} *
                  </label>
                  <input
                    type="text"
                    required
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors['shipping.city'] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    data-testid="shipping-city"
                    value={formData.shipping.city}
                    onChange={(e) => handleFieldChange('shipping', 'city', e.target.value)}
                    onBlur={() => handleFieldBlur('shipping', 'city')}
                  />
                  {errors['shipping.city'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['shipping.city']}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {locale === 'fr' ? 'Code postal' : 'Postal Code'} *
                  </label>
                  <input
                    type="text"
                    required
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors['shipping.postalCode'] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    data-testid="shipping-postal-code"
                    value={formData.shipping.postalCode}
                    onChange={(e) => handleFieldChange('shipping', 'postalCode', e.target.value)}
                    onBlur={() => handleFieldBlur('shipping', 'postalCode')}
                    placeholder={locale === 'fr' ? '75001' : '75001'}
                  />
                  {errors['shipping.postalCode'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['shipping.postalCode']}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {locale === 'fr' ? 'Pays' : 'Country'} *
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    data-testid="shipping-country"
                    value={formData.shipping.country}
                    onChange={(e) => handleFieldChange('shipping', 'country', e.target.value)}
                  >
                    <option value="FR">France</option>
                    <option value="DE">Germany</option>
                    <option value="IT">Italy</option>
                    <option value="ES">Spain</option>
                    <option value="BE">Belgium</option>
                    <option value="NL">Netherlands</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Options */}
          <div>
            <CarrierSelector
              carriers={carriers}
              selectedOption={selectedShippingOption}
              onOptionSelect={handleShippingOptionSelect}
              loading={loadingCarriers}
              locale={locale}
            />

            {/* Shipping Error */}
            {errors._shipping && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{errors._shipping}</p>
              </div>
            )}
          </div>

          {/* Payment */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900">
                {locale === 'fr' ? 'Paiement' : 'Payment'}
              </h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <label className="flex items-center p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                <input
                  type="radio"
                  name="payment"
                  value="mollie"
                  checked={formData.payment.method === 'mollie'}
                  onChange={(e) => handleFieldChange('payment', 'method', e.target.value)}
                  className="mr-4 text-blue-600"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">
                      {locale === 'fr' ? 'Paiement sécurisé' : 'Secure Payment'}
                    </span>
                    <div className="flex items-center space-x-2">
                      <img src="/images/payment-icons/visa.svg" alt="Visa" className="h-6 w-auto" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                      <img src="/images/payment-icons/mastercard.svg" alt="Mastercard" className="h-6 w-auto" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                      <img src="/images/payment-icons/paypal.svg" alt="PayPal" className="h-6 w-auto" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {locale === 'fr' ? 'Carte bancaire, PayPal, virement bancaire et autres moyens de paiement' : 'Credit card, PayPal, bank transfer and other payment methods'}
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Terms */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                required
                className="mt-1 mr-3 text-blue-600 focus:ring-blue-500"
                data-testid="terms-checkbox"
              />
              <div className="text-sm">
                <p className="text-gray-700">
                  {locale === 'fr' ? (
                    <span>
                      J'accepte les <a href="/terms" target="_blank" className="text-blue-600 hover:text-blue-700 underline">conditions générales</a> et la <a href="/privacy" target="_blank" className="text-blue-600 hover:text-blue-700 underline">politique de confidentialité</a>
                    </span>
                  ) : (
                    <span>
                      I agree to the <a href="/terms" target="_blank" className="text-blue-600 hover:text-blue-700 underline">terms and conditions</a> and <a href="/privacy" target="_blank" className="text-blue-600 hover:text-blue-700 underline">privacy policy</a>
                    </span>
                  )}
                </p>
                <p className="text-gray-500 mt-1">
                  {locale === 'fr' ? 'Vous devez avoir 18 ans ou plus pour commander du vin.' : 'You must be 18 or older to order wine.'}
                </p>
              </div>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="flex-1 bg-white text-gray-700 border border-gray-300 px-6 py-4 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {locale === 'fr' ? 'Retour au panier' : 'Back to Cart'}
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-2 bg-gray-900 text-white px-8 py-4 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              data-testid="proceed-to-payment-button"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>{locale === 'fr' ? 'Traitement...' : 'Processing...'}</span>
                </>
              ) : (
                <>
                  <span>{locale === 'fr' ? 'Finaliser la commande' : 'Complete Order'}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}