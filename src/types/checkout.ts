import { SelectedShippingOption } from './index'

export type CheckoutStepKey = 'address' | 'shipping' | 'payment'

export interface CheckoutContactDetails {
  email: string
  firstName: string
  lastName: string
  phone?: string
}

export interface CheckoutAddress {
  company?: string
  addressLine1: string
  addressLine2?: string
  postalCode: string
  city: string
  country: string
  notes?: string
}

export interface CheckoutShippingCharacteristics {
  is_tracked: boolean
  requires_signature: boolean
  is_express: boolean
  insurance: number
  last_mile: string
}

export interface CheckoutShippingOption {
  id: string
  type: 'pickup' | 'delivery'
  label: string
  description: string
  helpText?: string
  badge?: string
  estimatedDelivery?: string
  priceCents: number
  option: SelectedShippingOption
  characteristics: CheckoutShippingCharacteristics
}

export interface CheckoutState {
  contact: CheckoutContactDetails
  shippingAddress: CheckoutAddress
  billingSameAsShipping: boolean
  shippingSelection: CheckoutShippingOption | null
  confirmedOfAge: boolean
  acceptedTerms: boolean
}