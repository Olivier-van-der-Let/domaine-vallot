// VAT calculation service for EU wine sales compliance

export interface VatRate {
  country_code: string
  country_name: string
  rate: number
  is_eu_member: boolean
  wine_specific_rate?: number // Some countries have different rates for alcohol
  is_active: boolean
}

export interface VatCalculationInput {
  amount: number // Amount in cents (e.g., 2500 = €25.00)
  shipping_amount?: number // Shipping amount in cents
  country_code: string
  product_type?: 'wine' | 'other'
  customer_type?: 'business' | 'consumer'
  business_vat_number?: string
}

export interface VatCalculationResult {
  base_amount: number
  shipping_amount: number
  vat_rate: number
  vat_amount: number
  total_amount: number
  country: string
  country_code: string
  is_reverse_charge: boolean
  breakdown: {
    product_vat: number
    shipping_vat: number
  }
  exemption_reason?: string
}

// EU VAT rates for wine (as of 2024)
const EU_VAT_RATES: Record<string, VatRate> = {
  'AT': { country_code: 'AT', country_name: 'Austria', rate: 0.20, is_eu_member: true, is_active: true },
  'BE': { country_code: 'BE', country_name: 'Belgium', rate: 0.21, is_eu_member: true, is_active: true },
  'BG': { country_code: 'BG', country_name: 'Bulgaria', rate: 0.20, is_eu_member: true, is_active: true },
  'HR': { country_code: 'HR', country_name: 'Croatia', rate: 0.25, is_eu_member: true, is_active: true },
  'CY': { country_code: 'CY', country_name: 'Cyprus', rate: 0.19, is_eu_member: true, is_active: true },
  'CZ': { country_code: 'CZ', country_name: 'Czech Republic', rate: 0.21, is_eu_member: true, is_active: true },
  'DK': { country_code: 'DK', country_name: 'Denmark', rate: 0.25, is_eu_member: true, is_active: true },
  'EE': { country_code: 'EE', country_name: 'Estonia', rate: 0.20, is_eu_member: true, is_active: true },
  'FI': { country_code: 'FI', country_name: 'Finland', rate: 0.24, is_eu_member: true, is_active: true },
  'FR': { country_code: 'FR', country_name: 'France', rate: 0.20, is_eu_member: true, is_active: true },
  'DE': { country_code: 'DE', country_name: 'Germany', rate: 0.19, is_eu_member: true, is_active: true },
  'GR': { country_code: 'GR', country_name: 'Greece', rate: 0.24, is_eu_member: true, is_active: true },
  'HU': { country_code: 'HU', country_name: 'Hungary', rate: 0.27, is_eu_member: true, is_active: true },
  'IE': { country_code: 'IE', country_name: 'Ireland', rate: 0.23, is_eu_member: true, is_active: true },
  'IT': { country_code: 'IT', country_name: 'Italy', rate: 0.22, is_eu_member: true, is_active: true },
  'LV': { country_code: 'LV', country_name: 'Latvia', rate: 0.21, is_eu_member: true, is_active: true },
  'LT': { country_code: 'LT', country_name: 'Lithuania', rate: 0.21, is_eu_member: true, is_active: true },
  'LU': { country_code: 'LU', country_name: 'Luxembourg', rate: 0.17, is_eu_member: true, is_active: true },
  'MT': { country_code: 'MT', country_name: 'Malta', rate: 0.18, is_eu_member: true, is_active: true },
  'NL': { country_code: 'NL', country_name: 'Netherlands', rate: 0.21, is_eu_member: true, is_active: true },
  'PL': { country_code: 'PL', country_name: 'Poland', rate: 0.23, is_eu_member: true, is_active: true },
  'PT': { country_code: 'PT', country_name: 'Portugal', rate: 0.23, is_eu_member: true, is_active: true },
  'RO': { country_code: 'RO', country_name: 'Romania', rate: 0.19, is_eu_member: true, is_active: true },
  'SK': { country_code: 'SK', country_name: 'Slovakia', rate: 0.20, is_eu_member: true, is_active: true },
  'SI': { country_code: 'SI', country_name: 'Slovenia', rate: 0.22, is_eu_member: true, is_active: true },
  'ES': { country_code: 'ES', country_name: 'Spain', rate: 0.21, is_eu_member: true, is_active: true },
  'SE': { country_code: 'SE', country_name: 'Sweden', rate: 0.25, is_eu_member: true, is_active: true },
}

// Seller location (assumed to be France for Domaine Vallot)
const SELLER_COUNTRY = 'FR'

export class VatCalculator {
  private vatRates: Record<string, VatRate>

  constructor(customRates?: Record<string, VatRate>) {
    this.vatRates = customRates || EU_VAT_RATES
  }

  /**
   * Calculate VAT for a transaction based on EU rules
   */
  calculateVat(input: VatCalculationInput): VatCalculationResult {
    const {
      amount,
      shipping_amount = 0,
      country_code,
      product_type = 'wine',
      customer_type = 'consumer',
      business_vat_number
    } = input

    const countryCode = country_code.toUpperCase()
    const vatRate = this.getVatRate(countryCode)

    // Determine if reverse charge applies (B2B within EU, excluding seller country)
    const isReverseCharge = this.shouldApplyReverseCharge(
      countryCode,
      customer_type,
      business_vat_number
    )

    // Calculate VAT amounts
    const effectiveVatRate = isReverseCharge ? 0 : (vatRate?.rate || 0)

    const productVat = Math.round(amount * effectiveVatRate)
    const shippingVat = Math.round(shipping_amount * effectiveVatRate)
    const totalVat = productVat + shippingVat
    const totalAmount = amount + shipping_amount + totalVat

    return {
      base_amount: amount,
      shipping_amount,
      vat_rate: effectiveVatRate,
      vat_amount: totalVat,
      total_amount: totalAmount,
      country: vatRate?.country_name || 'Unknown',
      country_code: countryCode,
      is_reverse_charge: isReverseCharge,
      breakdown: {
        product_vat: productVat,
        shipping_vat: shippingVat,
      },
      exemption_reason: isReverseCharge ? 'Reverse charge - B2B transaction' :
                       !vatRate?.is_eu_member ? 'Non-EU country' : undefined
    }
  }

  /**
   * Get VAT rate for a country
   */
  private getVatRate(countryCode: string): VatRate | null {
    return this.vatRates[countryCode] || null
  }

  /**
   * Determine if reverse charge should apply
   * Reverse charge applies for:
   * - B2B transactions within EU (excluding seller's country)
   * - Valid VAT number provided
   */
  private shouldApplyReverseCharge(
    countryCode: string,
    customerType: string,
    businessVatNumber?: string
  ): boolean {
    // Only applies to business customers
    if (customerType !== 'business') return false

    // Must have valid VAT number
    if (!businessVatNumber || !this.isValidVatNumber(businessVatNumber)) return false

    // Must be EU country
    const vatRate = this.getVatRate(countryCode)
    if (!vatRate?.is_eu_member) return false

    // Must not be seller's country
    if (countryCode === SELLER_COUNTRY) return false

    return true
  }

  /**
   * Basic VAT number validation
   * In production, this should use a proper VAT validation service
   */
  private isValidVatNumber(vatNumber: string): boolean {
    // Remove spaces and convert to uppercase
    const cleanVat = vatNumber.replace(/\s/g, '').toUpperCase()

    // Basic format check - should start with country code + digits/letters
    const vatPattern = /^[A-Z]{2}[A-Z0-9]{2,12}$/
    return vatPattern.test(cleanVat)
  }

  /**
   * Calculate VAT for multiple items
   */
  calculateVatForItems(items: Array<{
    amount: number
    product_type?: string
  }>, commonData: Omit<VatCalculationInput, 'amount'>): VatCalculationResult {
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)

    return this.calculateVat({
      ...commonData,
      amount: totalAmount
    })
  }

  /**
   * Get all available VAT rates
   */
  getAllVatRates(): VatRate[] {
    return Object.values(this.vatRates).filter(rate => rate.is_active)
  }

  /**
   * Get EU member countries
   */
  getEuCountries(): VatRate[] {
    return this.getAllVatRates().filter(rate => rate.is_eu_member)
  }

  /**
   * Check if country is in EU
   */
  isEuCountry(countryCode: string): boolean {
    const rate = this.getVatRate(countryCode.toUpperCase())
    return rate?.is_eu_member || false
  }

  /**
   * Format VAT amount for display
   */
  formatVatAmount(amount: number, currency = 'EUR'): string {
    const displayAmount = amount / 100 // Convert from cents
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
    }).format(displayAmount)
  }

  /**
   * Format VAT rate for display
   */
  formatVatRate(rate: number): string {
    return `${(rate * 100).toFixed(0)}%`
  }
}

// Export singleton instance
export const vatCalculator = new VatCalculator()

// Export helper functions
export const calculateVat = (input: VatCalculationInput) =>
  vatCalculator.calculateVat(input)

export const isEuCountry = (countryCode: string) =>
  vatCalculator.isEuCountry(countryCode)

export const formatVatAmount = (amount: number, currency = 'EUR') =>
  vatCalculator.formatVatAmount(amount, currency)

export const formatVatRate = (rate: number) =>
  vatCalculator.formatVatRate(rate)

// Validation helpers
export const validateVatCalculationInput = (input: VatCalculationInput): string[] => {
  const errors: string[] = []

  if (input.amount < 0) {
    errors.push('Amount must be positive')
  }

  if (input.shipping_amount && input.shipping_amount < 0) {
    errors.push('Shipping amount must be positive')
  }

  if (!input.country_code || input.country_code.length !== 2) {
    errors.push('Valid country code is required')
  }

  if (input.customer_type && !['business', 'consumer'].includes(input.customer_type)) {
    errors.push('Customer type must be business or consumer')
  }

  return errors
}