'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { CheckoutStepKey, CheckoutShippingOption } from '@/types/checkout'
import { SelectedShippingOption } from '@/types'

interface CheckoutFormProps {
  cart: any
  user: any
  onSubmit: (orderData: any) => Promise<void>
  isProcessing: boolean
  locale: string
  updateShippingCost?: (cost: number) => void
  onShippingOptionChange?: (option: SelectedShippingOption | null) => void
}

interface FieldErrors {
  [key: string]: string
}

const STEP_SEQUENCE: CheckoutStepKey[] = ['address', 'shipping', 'payment']

const classNames = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ')

const getVatRate = (countryCode: string): number => {
  const rates: Record<string, number> = {
    AT: 0.20,
    BE: 0.21,
    BG: 0.20,
    HR: 0.25,
    CY: 0.19,
    CZ: 0.21,
    DK: 0.25,
    EE: 0.20,
    FI: 0.24,
    FR: 0.20,
    DE: 0.19,
    GR: 0.24,
    HU: 0.27,
    IE: 0.23,
    IT: 0.22,
    LV: 0.21,
    LT: 0.21,
    LU: 0.17,
    MT: 0.18,
    NL: 0.21,
    PL: 0.23,
    PT: 0.23,
    RO: 0.19,
    SK: 0.20,
    SI: 0.22,
    ES: 0.21,
    SE: 0.25
  }
  if (!countryCode) {
    return 0.20
  }
  return rates[countryCode.toUpperCase()] ?? 0.20
}

const normalizeItemPrice = (item: any): number => {
  if (typeof item?.price === 'number') {
    return item.price
  }
  if (typeof item?.unitPrice === 'number') {
    return item.unitPrice
  }
  if (typeof item?.unit_price === 'number') {
    const value = item.unit_price
    return value > 1000 ? value / 100 : value
  }
  if (typeof item?.price_eur === 'number') {
    return item.price_eur
  }
  if (typeof item?.priceEuro === 'number') {
    return item.priceEuro
  }
  return 0
}

const calculateTotals = (cart: any, shippingPriceCents: number, country: string) => {
  const items = Array.isArray(cart?.items) ? cart.items : []
  const subtotal = items.reduce((sum: number, item: any) => {
    const priceEuros = normalizeItemPrice(item)
    const priceCents = Math.round((priceEuros || 0) * 100)
    const quantity = typeof item?.quantity === 'number' ? item.quantity : 0
    return sum + quantity * priceCents
  }, 0)

  const vatRate = getVatRate(country)
  const vatAmount = Math.round(subtotal * vatRate) + Math.round(shippingPriceCents * vatRate)
  const totalAmount = subtotal + shippingPriceCents + vatAmount

  return { subtotal, vatAmount, totalAmount }
}

const createShippingOptions = (locale: string): CheckoutShippingOption[] => {
  const isFrench = locale === 'fr'
  return [
    {
      id: 'pickup',
      type: 'pickup',
      label: isFrench ? 'Retrait au domaine' : 'Estate pick-up',
      description: isFrench
        ? 'Recuperez votre commande directement au caveau du Domaine Vallot.'
        : 'Collect your wines directly from the Domaine Vallot tasting room.',
      helpText: isFrench
        ? 'Notre equipe prend contact pour convenir d\'un creneau de retrait.'
        : 'Our team will reach out to confirm a convenient collection slot.',
      badge: isFrench ? 'Gratuit' : 'Free',
      estimatedDelivery: isFrench ? 'Disponible sous 2 jours ouvres' : 'Ready within 2 business days',
      priceCents: 0,
      option: {
        carrier_code: 'pickup',
        carrier_name: isFrench ? 'Retrait sur place' : 'On-site pick-up',
        option_code: 'pickup_estate',
        option_name: isFrench ? 'Retrait au caveau' : 'Collect at the estate',
        price: 0,
        currency: 'EUR',
        delivery_time: isFrench ? 'Retrait sur rendez-vous' : 'Collection by appointment',
        service_point_required: false
      },
      characteristics: {
        is_tracked: false,
        requires_signature: false,
        is_express: false,
        insurance: 0,
        last_mile: 'store_pickup'
      }
    },
    {
      id: 'delivery',
      type: 'delivery',
      label: isFrench ? 'Livraison a domicile' : 'Home delivery',
      description: isFrench
        ? 'Expedition securisee avec suivi partout en France metropolitaine.'
        : 'Tracked delivery to your doorstep across metropolitan France.',
      helpText: isFrench
        ? 'Colis proteges, prise de rendez-vous possible avec le transporteur.'
        : 'Protective packaging and optional delivery scheduling with our carrier.',
      badge: isFrench ? 'Populaire' : 'Popular choice',
      estimatedDelivery: isFrench ? '2 a 5 jours ouvres' : '2-5 business days',
      priceCents: 1500,
      option: {
        carrier_code: 'standard_delivery',
        carrier_name: isFrench ? 'Transporteur partenaire' : 'Logistics partner',
        option_code: 'standard_home',
        option_name: isFrench ? 'Livraison standard' : 'Standard delivery',
        price: 1500,
        currency: 'EUR',
        delivery_time: isFrench ? '2 a 5 jours ouvres' : '2-5 business days',
        service_point_required: false
      },
      characteristics: {
        is_tracked: true,
        requires_signature: true,
        is_express: false,
        insurance: 0,
        last_mile: 'home_delivery'
      }
    }
  ]
}

const formatCents = (value: number, locale: string) =>
  new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
    style: 'currency',
    currency: 'EUR'
  }).format(value / 100)
export default function CheckoutForm({
  cart,
  user,
  onSubmit,
  isProcessing,
  locale,
  updateShippingCost,
  onShippingOptionChange
}: CheckoutFormProps) {
  const shippingOptions = useMemo(() => createShippingOptions(locale), [locale])

  const [stepIndex, setStepIndex] = useState(0)
  const [contact, setContact] = useState({
    email: user?.email ?? '',
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: user?.phone ?? ''
  })
  const [shippingAddress, setShippingAddress] = useState({
    company: '',
    addressLine1: '',
    addressLine2: '',
    postalCode: '',
    city: '',
    country: 'FR',
    notes: ''
  })
  const [billingSameAsShipping] = useState(true)
  const [selectedShippingId, setSelectedShippingId] = useState<string | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [confirmedOfAge, setConfirmedOfAge] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  const currentStep = STEP_SEQUENCE[stepIndex]
  const stepLabels = useMemo(() => ({
    address: locale === 'fr' ? 'Vos coordonnees' : 'Your details',
    shipping: locale === 'fr' ? 'Options de livraison' : 'Shipping options',
    payment: locale === 'fr' ? 'Paiement' : 'Payment'
  }), [locale])

  const selectedShipping = useMemo(() => {
    if (!selectedShippingId) return null
    return shippingOptions.find(option => option.id === selectedShippingId) ?? null
  }, [selectedShippingId, shippingOptions])

  useEffect(() => {
    if (selectedShipping) {
      updateShippingCost?.(selectedShipping.option.price)
      onShippingOptionChange?.(selectedShipping.option)
    }
  }, [selectedShipping, updateShippingCost, onShippingOptionChange])

  const clearFieldError = (field: string) => {
    if (!errors[field]) return
    setErrors(prev => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handleContactChange = (field: keyof typeof contact, value: string) => {
    setContact(prev => ({ ...prev, [field]: value }))
    clearFieldError(`contact.${field}`)
  }

  const handleAddressChange = (field: keyof typeof shippingAddress, value: string) => {
    setShippingAddress(prev => ({ ...prev, [field]: value }))
    clearFieldError(`shipping.${field}`)
  }

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  }

  const validateAddressStep = () => {
    const nextErrors: FieldErrors = {}
    if (!contact.email) {
      nextErrors['contact.email'] = locale === 'fr' ? 'Email requis' : 'Email is required'
    } else if (!validateEmail(contact.email)) {
      nextErrors['contact.email'] = locale === 'fr' ? 'Format d\'email invalide' : 'Invalid email format'
    }

    if (!contact.firstName) {
      nextErrors['contact.firstName'] = locale === 'fr' ? 'Prenom requis' : 'First name is required'
    }

    if (!contact.lastName) {
      nextErrors['contact.lastName'] = locale === 'fr' ? 'Nom requis' : 'Last name is required'
    }

    if (!shippingAddress.addressLine1) {
      nextErrors['shipping.addressLine1'] = locale === 'fr' ? 'Adresse requise' : 'Address is required'
    }

    if (!shippingAddress.postalCode) {
      nextErrors['shipping.postalCode'] = locale === 'fr' ? 'Code postal requis' : 'Postal code is required'
    }

    if (!shippingAddress.city) {
      nextErrors['shipping.city'] = locale === 'fr' ? 'Ville requise' : 'City is required'
    }

    if (!shippingAddress.country) {
      nextErrors['shipping.country'] = locale === 'fr' ? 'Pays requis' : 'Country is required'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const goToNextStep = () => {
    setGeneralError(null)
    if (currentStep === 'address') {
      if (validateAddressStep()) {
        setStepIndex(1)
      }
      return
    }

    if (currentStep === 'shipping') {
      if (!selectedShipping) {
        setGeneralError(locale === 'fr' ? 'Veuillez selectionner un mode de livraison.' : 'Please choose a shipping option.')
        setErrors(prev => ({ ...prev, shipping: locale === 'fr' ? 'Selection requise' : 'Selection required' }))
        return
      }
      setErrors({})
      setStepIndex(2)
      return
    }
  }

  const goToPreviousStep = () => {
    setGeneralError(null)
    setStepIndex(Math.max(0, stepIndex - 1))
  }
  const handlePlaceOrder = async () => {
    if (!selectedShipping) {
      setGeneralError(locale === 'fr' ? 'Selectionnez une option de livraison.' : 'Select a shipping option to continue.')
      return
    }

    if (!acceptedTerms) {
      setErrors(prev => ({ ...prev, terms: locale === 'fr' ? 'Vous devez accepter les conditions' : 'Please accept the terms and conditions' }))
      setGeneralError(locale === 'fr' ? 'Veuillez accepter les conditions generales pour continuer.' : 'Accept the terms and conditions to continue.')
      return
    }

    if (!confirmedOfAge) {
      setErrors(prev => ({ ...prev, age: locale === 'fr' ? 'Vous devez confirmer avoir 18 ans ou plus' : 'You must confirm you are at least 18 years old' }))
      setGeneralError(locale === 'fr' ? 'Confirmez etre majeur pour continuer.' : 'Please confirm you are of legal drinking age.')
      return
    }

    if (!cart?.items || cart.items.length === 0) {
      setGeneralError(locale === 'fr' ? 'Votre panier est vide.' : 'Your cart is empty.')
      return
    }

    const totals = calculateTotals(cart, selectedShipping.option.price, shippingAddress.country)

    const payload = {
      customerEmail: contact.email,
      customerFirstName: contact.firstName,
      customerLastName: contact.lastName,
      shippingAddress: {
        firstName: contact.firstName,
        lastName: contact.lastName,
        address: shippingAddress.addressLine1,
        addressLine2: shippingAddress.addressLine2,
        city: shippingAddress.city,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country,
        company: shippingAddress.company,
        notes: shippingAddress.notes,
        phone: contact.phone
      },
      billingAddress: billingSameAsShipping ? {
        firstName: contact.firstName,
        lastName: contact.lastName,
        address: shippingAddress.addressLine1,
        addressLine2: shippingAddress.addressLine2,
        city: shippingAddress.city,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country,
        company: shippingAddress.company,
        notes: shippingAddress.notes,
        phone: contact.phone
      } : undefined,
      items: cart.items.map((item: any) => ({
        productId: item.productId ?? item.product_id,
        quantity: item.quantity,
        unitPrice: normalizeItemPrice(item)
      })),
      subtotal: totals.subtotal,
      vatAmount: totals.vatAmount,
      shippingCost: selectedShipping.option.price,
      totalAmount: totals.totalAmount,
      paymentMethod: 'mollie',
      shipping_option: {
        code: selectedShipping.option.option_code,
        name: selectedShipping.option.option_name,
        carrier_code: selectedShipping.option.carrier_code,
        carrier_name: selectedShipping.option.carrier_name,
        price: selectedShipping.option.price,
        currency: selectedShipping.option.currency,
        delivery_time: selectedShipping.option.delivery_time,
        service_point_required: selectedShipping.option.service_point_required
      },
      specialInstructions: shippingAddress.notes || undefined,
      locale
    }

    setGeneralError(null)
    await onSubmit(payload)
  }

  const totalsPreview = useMemo(() => {
    if (!selectedShipping || !cart?.items?.length) {
      return null
    }
    return calculateTotals(cart, selectedShipping.option.price, shippingAddress.country)
  }, [cart, selectedShipping, shippingAddress.country])
  const renderAddressStep = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          {locale === 'fr' ? 'Coordonnees' : 'Contact'}
        </h3>
        <p className="text-sm text-gray-500">
          {locale === 'fr'
            ? 'Nous utilisons ces informations pour confirmer votre commande et organiser la livraison.'
            : 'We use these details to confirm your order and coordinate delivery.'}
        </p>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700" htmlFor="checkout-email">
              {locale === 'fr' ? 'Adresse email' : 'Email'}
            </label>
            <input
              id="checkout-email"
              data-testid="customer-email"
              type="email"
              autoComplete="email"
              value={contact.email}
              onChange={event => handleContactChange('email', event.target.value)}
              className={classNames(
                'mt-1 block w-full rounded-md border px-4 py-3 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900',
                errors['contact.email'] ? 'border-red-500' : 'border-gray-300'
              )}
            />
            {errors['contact.email'] && <p className="mt-2 text-sm text-red-600">{errors['contact.email']}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="checkout-firstname">
              {locale === 'fr' ? 'Prenom' : 'First name'}
            </label>
            <input
              id="checkout-firstname"
              data-testid="customer-firstname"
              type="text"
              autoComplete="given-name"
              value={contact.firstName}
              onChange={event => handleContactChange('firstName', event.target.value)}
              className={classNames(
                'mt-1 block w-full rounded-md border px-4 py-3 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900',
                errors['contact.firstName'] ? 'border-red-500' : 'border-gray-300'
              )}
            />
            {errors['contact.firstName'] && <p className="mt-2 text-sm text-red-600">{errors['contact.firstName']}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="checkout-lastname">
              {locale === 'fr' ? 'Nom' : 'Last name'}
            </label>
            <input
              id="checkout-lastname"
              data-testid="customer-lastname"
              type="text"
              autoComplete="family-name"
              value={contact.lastName}
              onChange={event => handleContactChange('lastName', event.target.value)}
              className={classNames(
                'mt-1 block w-full rounded-md border px-4 py-3 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900',
                errors['contact.lastName'] ? 'border-red-500' : 'border-gray-300'
              )}
            />
            {errors['contact.lastName'] && <p className="mt-2 text-sm text-red-600">{errors['contact.lastName']}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700" htmlFor="checkout-phone">
              {locale === 'fr' ? 'Numero de telephone (optionnel)' : 'Phone number (optional)'}
            </label>
            <input
              id="checkout-phone"
              type="tel"
              autoComplete="tel"
              value={contact.phone}
              onChange={event => handleContactChange('phone', event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-3 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          {locale === 'fr' ? 'Adresse de livraison' : 'Shipping address'}
        </h3>
        <div className="mt-6 grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="checkout-company">
              {locale === 'fr' ? 'Societe (optionnel)' : 'Company (optional)'}
            </label>
            <input
              id="checkout-company"
              type="text"
              value={shippingAddress.company}
              onChange={event => handleAddressChange('company', event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-3 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="checkout-address1">
              {locale === 'fr' ? 'Adresse' : 'Address'}
            </label>
            <input
              id="checkout-address1"
              data-testid="shipping-address-line1"
              type="text"
              autoComplete="address-line1"
              value={shippingAddress.addressLine1}
              onChange={event => handleAddressChange('addressLine1', event.target.value)}
              className={classNames(
                'mt-1 block w-full rounded-md border px-4 py-3 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900',
                errors['shipping.addressLine1'] ? 'border-red-500' : 'border-gray-300'
              )}
            />
            {errors['shipping.addressLine1'] && <p className="mt-2 text-sm text-red-600">{errors['shipping.addressLine1']}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="checkout-address2">
              {locale === 'fr' ? 'Complement d\'adresse (optionnel)' : 'Address line 2 (optional)'}
            </label>
            <input
              id="checkout-address2"
              type="text"
              autoComplete="address-line2"
              value={shippingAddress.addressLine2}
              onChange={event => handleAddressChange('addressLine2', event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-3 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="checkout-postal">
                {locale === 'fr' ? 'Code postal' : 'Postal code'}
              </label>
              <input
                id="checkout-postal"
                data-testid="shipping-postal-code"
                type="text"
                autoComplete="postal-code"
                value={shippingAddress.postalCode}
                onChange={event => handleAddressChange('postalCode', event.target.value)}
                className={classNames(
                  'mt-1 block w-full rounded-md border px-4 py-3 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900',
                  errors['shipping.postalCode'] ? 'border-red-500' : 'border-gray-300'
                )}
              />
              {errors['shipping.postalCode'] && <p className="mt-2 text-sm text-red-600">{errors['shipping.postalCode']}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="checkout-city">
                {locale === 'fr' ? 'Ville' : 'City'}
              </label>
              <input
                id="checkout-city"
                data-testid="shipping-city"
                type="text"
                autoComplete="address-level2"
                value={shippingAddress.city}
                onChange={event => handleAddressChange('city', event.target.value)}
                className={classNames(
                  'mt-1 block w-full rounded-md border px-4 py-3 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900',
                  errors['shipping.city'] ? 'border-red-500' : 'border-gray-300'
                )}
              />
              {errors['shipping.city'] && <p className="mt-2 text-sm text-red-600">{errors['shipping.city']}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="checkout-country">
                {locale === 'fr' ? 'Pays' : 'Country'}
              </label>
              <select
                id="checkout-country"
                data-testid="shipping-country"
                value={shippingAddress.country}
                onChange={event => handleAddressChange('country', event.target.value)}
                className={classNames(
                  'mt-1 block w-full rounded-md border px-4 py-3 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900',
                  errors['shipping.country'] ? 'border-red-500' : 'border-gray-300'
                )}
              >
                <option value="FR">France</option>
                <option value="BE">Belgique</option>
                <option value="NL">Pays-Bas</option>
                <option value="DE">Allemagne</option>
                <option value="ES">Espagne</option>
                <option value="IT">Italie</option>
                <option value="LU">Luxembourg</option>
                <option value="CH">Suisse</option>
              </select>
              {errors['shipping.country'] && <p className="mt-2 text-sm text-red-600">{errors['shipping.country']}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="checkout-notes">
              {locale === 'fr' ? 'Instructions particuliere (optionnel)' : 'Delivery notes (optional)'}
            </label>
            <textarea
              id="checkout-notes"
              value={shippingAddress.notes}
              onChange={event => handleAddressChange('notes', event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-3 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              rows={3}
            />
            <p className="mt-2 text-xs text-gray-500">
              {locale === 'fr'
                ? 'Indiquez une consigne de livraison ou un code d\'acces si necessaire.'
                : 'Include delivery notes or gate codes if the carrier needs them.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
  const renderShippingStep = () => (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        {locale === 'fr'
          ? 'Choisissez la solution qui vous convient : retrait gratuit ou livraison securisee.'
          : 'Choose between complimentary pick-up or insured home delivery.'}
      </p>
      <div className="space-y-4">
        {shippingOptions.map(option => {
          const isSelected = selectedShipping?.id === option.id
          return (
            <button
              key={option.id}
              type="button"
              data-testid={`shipping-option-${option.id}`}
              onClick={() => {
                setSelectedShippingId(option.id)
                clearFieldError('shipping')
                setGeneralError(null)
              }}
              className={classNames(
                'w-full rounded-xl border p-6 text-left transition-all duration-200',
                isSelected
                  ? 'border-gray-900 bg-gray-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-semibold text-gray-900">{option.label}</h4>
                    {option.badge && (
                      <span className="inline-flex items-center rounded-full bg-gray-900 px-3 py-1 text-xs font-medium text-white">
                        {option.badge}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{option.description}</p>
                  {option.helpText && (
                    <p className="mt-2 text-xs text-gray-500">{option.helpText}</p>
                  )}
                  {option.estimatedDelivery && (
                    <p className="mt-3 inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                      {option.estimatedDelivery}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCents(option.option.price, locale)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {locale === 'fr' ? 'TTC, TVA incluse' : 'VAT included'}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
      {errors['shipping'] && <p className="text-sm text-red-600">{errors['shipping']}</p>}
    </div>
  )
  const renderPaymentStep = () => (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">
          {locale === 'fr' ? 'Resume de la commande' : 'Order summary'}
        </h3>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-gray-600">{locale === 'fr' ? 'Contact' : 'Contact'}</dt>
            <dd className="text-gray-900">{contact.firstName} {contact.lastName}</dd>
          </div>
          <div className="flex justify-between text-gray-600">
            <dt>{locale === 'fr' ? 'Adresse' : 'Address'}</dt>
            <dd className="max-w-xs text-right text-gray-900">
              {shippingAddress.addressLine1}
              {shippingAddress.addressLine2 ? `, ${shippingAddress.addressLine2}` : ''}
              <br />
              {shippingAddress.postalCode} {shippingAddress.city}
              <br />
              {shippingAddress.country}
            </dd>
          </div>
          {selectedShipping && (
            <div className="flex justify-between text-gray-600">
              <dt>{locale === 'fr' ? 'Livraison' : 'Shipping'}</dt>
              <dd className="max-w-xs text-right text-gray-900">
                {selectedShipping.label}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {totalsPreview && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h4 className="text-sm font-semibold text-gray-900">
            {locale === 'fr' ? 'Totaux estimes' : 'Estimated totals'}
          </h4>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">{locale === 'fr' ? 'Sous-total' : 'Subtotal'}</dt>
              <dd className="text-gray-900">{formatCents(totalsPreview.subtotal, locale)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">{locale === 'fr' ? 'Livraison' : 'Shipping'}</dt>
              <dd className="text-gray-900">{formatCents(selectedShipping!.option.price, locale)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">{locale === 'fr' ? 'TVA estimee' : 'Estimated VAT'}</dt>
              <dd className="text-gray-900">{formatCents(totalsPreview.vatAmount, locale)}</dd>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-3 text-base font-semibold text-gray-900">
              <dt>{locale === 'fr' ? 'Total' : 'Total'}</dt>
              <dd>{formatCents(totalsPreview.totalAmount, locale)}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="space-y-4">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            data-testid="terms-checkbox"
            checked={acceptedTerms}
            onChange={event => {
              setAcceptedTerms(event.target.checked)
              clearFieldError('terms')
            }}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
          />
          <span className="text-gray-700">
            {locale === 'fr'
              ? <>J'accepte les <a href="/terms" className="text-gray-900 underline" target="_blank" rel="noreferrer">conditions generales</a> et la <a href="/privacy" className="text-gray-900 underline" target="_blank" rel="noreferrer">politique de confidentialite</a>.</>
              : <>I agree to the <a href="/terms" className="text-gray-900 underline" target="_blank" rel="noreferrer">terms and conditions</a> and the <a href="/privacy" className="text-gray-900 underline" target="_blank" rel="noreferrer">privacy policy</a>.</>}
          </span>
        </label>
        {errors['terms'] && <p className="text-sm text-red-600">{errors['terms']}</p>}

        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={confirmedOfAge}
            onChange={event => {
              setConfirmedOfAge(event.target.checked)
              clearFieldError('age')
            }}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
          />
          <span className="text-gray-700">
            {locale === 'fr'
              ? 'Je confirme avoir 18 ans ou plus et etre autorise a acheter des boissons alcoolisees.'
              : 'I confirm I am at least 18 years old and allowed to purchase alcoholic beverages.'}
          </span>
        </label>
        {errors['age'] && <p className="text-sm text-red-600">{errors['age']}</p>}
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-xs text-blue-800">
        <p className="font-medium">
          {locale === 'fr' ? 'Paiement securise avec Mollie' : 'Secure payment powered by Mollie'}
        </p>
        <p className="mt-1">
          {locale === 'fr'
            ? 'Vous serez redirige vers l\'interface Mollie pour finaliser le reglement via carte bancaire, virement ou portefeuille electronique.'
            : 'You will be redirected to the Mollie checkout to complete payment with your preferred method.'}
        </p>
      </div>
    </div>
  )
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {STEP_SEQUENCE.map((step, index) => {
            const isActive = index === stepIndex
            const isCompleted = index < stepIndex
            return (
              <React.Fragment key={step}>
                <div className="flex items-center gap-2">
                  <span
                    className={classNames(
                      'flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold',
                      isCompleted ? 'border-gray-900 bg-gray-900 text-white' : isActive ? 'border-gray-900 text-gray-900' : 'border-gray-300 text-gray-400'
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className={classNames('font-medium', isActive ? 'text-gray-900' : 'text-gray-500')}>
                    {stepLabels[step]}
                  </span>
                </div>
                {index < STEP_SEQUENCE.length - 1 && <span className="text-gray-300">/</span>}
              </React.Fragment>
            )
          })}
        </div>
        <h2 className="text-2xl font-semibold text-gray-900">{stepLabels[currentStep]}</h2>
      </div>

      {generalError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {generalError}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {currentStep === 'address' && renderAddressStep()}
        {currentStep === 'shipping' && renderShippingStep()}
        {currentStep === 'payment' && renderPaymentStep()}
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-between">
        {stepIndex > 0 && (
          <button
            type="button"
            onClick={goToPreviousStep}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {locale === 'fr' ? 'Retour' : 'Back'}
          </button>
        )}

        {currentStep !== 'payment' && (
          <button
            type="button"
            onClick={goToNextStep}
            className="inline-flex items-center justify-center rounded-md bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800"
          >
            {currentStep === 'address'
              ? (locale === 'fr' ? 'Continuer vers la livraison' : 'Continue to shipping')
              : (locale === 'fr' ? 'Continuer vers le paiement' : 'Continue to payment')}
          </button>
        )}

        {currentStep === 'payment' && (
          <button
            type="button"
            data-testid="proceed-to-payment-button"
            onClick={handlePlaceOrder}
            disabled={isProcessing}
            className={classNames(
              'inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-medium text-white',
              isProcessing ? 'bg-gray-400' : 'bg-gray-900 hover:bg-gray-800'
            )}
          >
            {isProcessing
              ? (locale === 'fr' ? 'Traitement en cours...' : 'Processing...')
              : (locale === 'fr' ? 'Proceder au paiement securise' : 'Proceed to secure payment')}
          </button>
        )}
      </div>
    </div>
  )
}

