import { NextRequest, NextResponse } from 'next/server'
import { getSendcloudClient } from '@/lib/sendcloud/client'
import { shippingRateSchema, validateSchema } from '@/lib/validators/schemas'

export async function POST(request: NextRequest) {
  try {
    console.log('🚚 Shipping options API called')
    const body = await request.json()
    console.log('📦 Request body:', JSON.stringify(body, null, 2))

    const validation = validateSchema(shippingRateSchema, body)

    if (!validation.success) {
      console.error('❌ Validation failed:', validation.errors)
      return NextResponse.json(
        { error: 'Invalid shipping options request', details: validation.errors },
        { status: 400 }
      )
    }

    const { destination, items, totalValue } = validation.data
    console.log('✅ Validation passed:', { destination, itemCount: items.length, totalValue })

    // Additional validation for edge cases
    if (totalValue <= 0) {
      console.error('❌ Invalid total value:', totalValue)
      return NextResponse.json(
        { error: 'Invalid order total value' },
        { status: 400 }
      )
    }

    if (items.length === 0) {
      console.error('❌ No items in order')
      return NextResponse.json(
        { error: 'No items in order' },
        { status: 400 }
      )
    }

    // Validate destination country is supported
    const supportedCountries = ['NL', 'BE', 'DE', 'FR', 'IT', 'ES', 'AT', 'PT', 'LU', 'GB', 'US', 'CA']
    if (!supportedCountries.includes(destination.country.toUpperCase())) {
      console.warn('⚠️ Unsupported destination country:', destination.country)
      return NextResponse.json({
        carriers: [],
        destination,
        error: 'Shipping not available to this destination',
        message: 'We currently do not ship to this location. Please contact us for special arrangements.'
      })
    }

    // Calculate total bottles and weight
    const totalBottles = items.reduce((sum, item) => sum + item.quantity, 0)
    const bottleWeight = 750 // grams per bottle
    const packagingWeight = Math.max(200, totalBottles * 50) // Base packaging + per bottle
    const totalWeight = (totalBottles * bottleWeight) + packagingWeight

    // Default origin (assuming French winery)
    const origin = {
      country: 'FR',
      postal_code: '21000' // Dijon, Burgundy
    }

    // Package dimensions based on bottle count
    const packageInfo = {
      weight: totalWeight,
      value: totalValue,
      length: totalBottles <= 6 ? 35 : 45, // cm
      width: totalBottles <= 6 ? 25 : 35,  // cm
      height: totalBottles <= 6 ? 30 : 35  // cm
    }

    const sendcloudClient = getSendcloudClient()
    console.log('🔑 Sendcloud client credentials available:', sendcloudClient.hasValidCredentials())

    let carriers = []

    // Check if credentials are available
    if (!sendcloudClient.hasValidCredentials()) {
      console.warn('⚠️ Sendcloud credentials missing, using fallback shipping options')
      carriers = getFallbackCarriers(destination.country, totalWeight, totalValue)
    } else {
      try {
        console.log('🌐 Calling Sendcloud API with:', { origin, destination: { country: destination.country, postal_code: destination.postalCode }, packageInfo })
        carriers = await sendcloudClient.getAvailableCarriers(
          origin,
          {
            country: destination.country,
            postal_code: destination.postalCode
          },
          packageInfo
        )
        console.log('✅ Sendcloud API response received:', carriers.length, 'carriers')
      } catch (apiError) {
        console.error('❌ Sendcloud API error:', apiError)
        console.warn('🔄 Falling back to mock shipping options')
        carriers = getFallbackCarriers(destination.country, totalWeight, totalValue)
      }
    }

    // Format response with carrier options and pricing
    const formattedCarriers = carriers.map(carrier => {
      console.log('🔄 Formatting carrier:', carrier.code, 'with', carrier.shipping_options.length, 'options')

      return {
        code: carrier.code,
        name: carrier.name,
        shipping_options: carrier.shipping_options.map(option => {
          console.log('🔄 Formatting option:', option.code)

          // Handle both API response format and fallback format
          const price = option.quotes && option.quotes.length > 0
            ? Math.round(option.quotes[0].price.value * 100) // Convert to cents
            : estimateShippingPrice(option, totalWeight, destination.country)

          const currency = option.quotes && option.quotes.length > 0
            ? option.quotes[0].price.currency
            : 'EUR'

          const deliveryTime = option.quotes && option.quotes.length > 0
            ? option.quotes[0].delivery_time
            : estimateDeliveryTime(option)

          // Ensure all required characteristics are present with proper fallbacks
          const functionalities = option.functionalities || {}
          const carrierCode = option.carrier?.code || carrier.code
          const carrierName = option.carrier?.name || carrier.name

          // Enhanced characteristic mapping with carrier-specific defaults
          const characteristics = {
            id: option.id || option.code || `${carrierCode}-${option.code}`,
            name: option.product?.name || option.name || option.code,
            carrier: carrierName,
            service_code: option.code,
            delivery_type: functionalities.last_mile || 'home_delivery',
            is_tracked: getTrackedDefault(functionalities.tracked, carrierCode),
            requires_signature: getSignatureDefault(functionalities.signature, carrierCode),
            is_express: isExpressService(functionalities.delivery_deadline, option.product?.name, carrierCode),
            insurance: functionalities.insurance || 0,
            restrictions: getCarrierRestrictions(carrierCode)
          }

          return {
            code: option.code,
            name: characteristics.name,
            carrier_code: carrierCode,
            carrier_name: carrierName,
            price: price,
            currency: currency,
            price_display: (price / 100).toFixed(2),
            delivery_time: deliveryTime,
            service_point_required: functionalities.last_mile === 'service_point',
            characteristics: characteristics,
            weight_range: {
              min: parseFloat(option.weight?.min?.value || '0.1'),
              max: parseFloat(option.weight?.max?.value || '30'),
              unit: option.weight?.min?.unit || 'kg'
            }
          }
        })
      }
    })

    console.log('✅ Formatted response:', formattedCarriers.length, 'carriers with',
      formattedCarriers.reduce((sum, c) => sum + c.shipping_options.length, 0), 'total options')

    return NextResponse.json({
      carriers: formattedCarriers,
      destination,
      package_info: {
        total_bottles: totalBottles,
        estimated_weight: totalWeight,
        dimensions: packageInfo
      },
      origin
    })

  } catch (error) {
    console.error('💥 Shipping options calculation error:', error)
    return NextResponse.json(
      { error: 'Shipping options calculation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Generate fallback carriers when Sendcloud API is unavailable
 */
function getFallbackCarriers(country: string, totalWeight: number, totalValue: number) {
  const isEU = ['NL', 'BE', 'DE', 'FR', 'IT', 'ES', 'AT', 'PT', 'LU'].includes(country.toUpperCase())

  const baseCarriers = [
    {
      code: 'postnl',
      name: 'PostNL',
      shipping_options: [
        {
          code: 'postnl-standard',
          name: 'PostNL Standard',
          carrier: { code: 'postnl', name: 'PostNL' },
          product: { code: 'postnl-standard', name: 'PostNL Standard' },
          functionalities: {
            tracked: true,
            signature: false,
            insurance: totalValue > 5000 ? 500 : 0,
            last_mile: 'home_delivery',
            delivery_deadline: 'standard',
            service_area: isEU ? 'domestic' : 'international'
          },
          // Add complete characteristics for fallback
          characteristics: {
            id: 'postnl-standard',
            name: 'PostNL Standard',
            carrier: 'PostNL',
            service_code: 'postnl-standard',
            delivery_type: 'home_delivery',
            is_tracked: true,
            requires_signature: false,
            is_express: false,
            insurance: totalValue > 5000 ? 500 : 0,
            restrictions: ['age_verification_required']
          },
          weight: {
            min: { value: '0.1', unit: 'kg' },
            max: { value: '30', unit: 'kg' }
          },
          quotes: [{
            price: { value: isEU ? 8.95 : 15.95, currency: 'EUR' },
            delivery_time: isEU ? '2-3 business days' : '5-7 business days'
          }]
        }
      ]
    }
  ]

  if (isEU) {
    baseCarriers.push({
      code: 'dpd',
      name: 'DPD',
      shipping_options: [
        {
          code: 'dpd-classic',
          name: 'DPD Classic',
          carrier: { code: 'dpd', name: 'DPD' },
          product: { code: 'dpd-classic', name: 'DPD Classic' },
          functionalities: {
            tracked: true,
            signature: true,
            insurance: totalValue > 5000 ? 500 : 0,
            last_mile: 'home_delivery',
            delivery_deadline: 'standard',
            service_area: 'domestic'
          },
          // Add complete characteristics for fallback
          characteristics: {
            id: 'dpd-classic',
            name: 'DPD Classic',
            carrier: 'DPD',
            service_code: 'dpd-classic',
            delivery_type: 'home_delivery',
            is_tracked: true,
            requires_signature: true,
            is_express: false,
            insurance: totalValue > 5000 ? 500 : 0,
            restrictions: ['age_verification_required']
          },
          weight: {
            min: { value: '0.1', unit: 'kg' },
            max: { value: '31.5', unit: 'kg' }
          },
          quotes: [{
            price: { value: 12.50, currency: 'EUR' },
            delivery_time: '1-2 business days'
          }]
        }
      ]
    })
  }

  return baseCarriers
}

/**
 * Estimate shipping price when not provided by quotes
 */
function estimateShippingPrice(option: any, weight: number, destinationCountry: string): number {
  // Base price estimation in cents
  let basePrice = 500 // €5.00 base

  // Weight-based pricing (per kg over 1kg)
  const weightInKg = weight / 1000
  if (weightInKg > 1) {
    basePrice += Math.round((weightInKg - 1) * 200) // €2.00 per additional kg
  }

  // Country-based adjustments
  const euCountries = ['FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'LU']
  if (!euCountries.includes(destinationCountry.toUpperCase())) {
    basePrice += 1000 // €10.00 extra for non-EU
  }

  // Service type adjustments
  if (option.functionalities.signature) {
    basePrice += 300 // €3.00 for signature required
  }

  if (option.functionalities.delivery_deadline === 'express') {
    basePrice += 500 // €5.00 for express delivery
  }

  if (option.functionalities.last_mile === 'service_point') {
    basePrice -= 200 // €2.00 discount for service point delivery
  }

  return basePrice
}

/**
 * Estimate delivery time when not provided
 */
function estimateDeliveryTime(option: any): string {
  if (option.functionalities?.delivery_deadline === 'express') {
    return '1-2 business days'
  }

  if (option.functionalities?.service_area === 'domestic') {
    return '2-3 business days'
  }

  return '3-5 business days'
}

/**
 * Get tracking default based on carrier-specific knowledge
 */
function getTrackedDefault(tracked: boolean | undefined, carrierCode: string): boolean {
  // If explicitly set, use that value
  if (typeof tracked === 'boolean') {
    return tracked
  }

  // Carrier-specific defaults for major carriers
  const alwaysTrackedCarriers = ['ups', 'dhl', 'fedex', 'colissimo', 'chronopost']
  const usuallyTrackedCarriers = ['dpd', 'mondial_relay', 'postnl']

  const lowerCarrier = carrierCode.toLowerCase()

  if (alwaysTrackedCarriers.some(carrier => lowerCarrier.includes(carrier))) {
    return true
  }

  if (usuallyTrackedCarriers.some(carrier => lowerCarrier.includes(carrier))) {
    return true
  }

  // Conservative default for wine shipping - prefer tracked services
  return true
}

/**
 * Get signature requirement default based on carrier and service type
 */
function getSignatureDefault(signature: boolean | undefined, carrierCode: string): boolean {
  // If explicitly set, use that value
  if (typeof signature === 'boolean') {
    return signature
  }

  // Carrier-specific defaults
  const signatureRequiredCarriers = ['ups', 'dhl', 'chronopost']
  const lowerCarrier = carrierCode.toLowerCase()

  if (signatureRequiredCarriers.some(carrier => lowerCarrier.includes(carrier))) {
    return true
  }

  // Default to false for standard services
  return false
}

/**
 * Determine if service is express based on multiple indicators
 */
function isExpressService(deliveryDeadline: string | undefined, serviceName: string | undefined, carrierCode: string): boolean {
  // Check explicit deadline
  if (deliveryDeadline === 'express') {
    return true
  }

  // Check service name patterns
  const expressKeywords = ['express', 'priority', 'next day', '24h', 'urgent', 'speed']
  const serviceLower = (serviceName || '').toLowerCase()
  const carrierLower = carrierCode.toLowerCase()

  if (expressKeywords.some(keyword => serviceLower.includes(keyword) || carrierLower.includes(keyword))) {
    return true
  }

  return false
}

/**
 * Get carrier-specific restrictions for wine shipping
 */
function getCarrierRestrictions(carrierCode: string): string[] {
  const restrictions: string[] = []
  const lowerCarrier = carrierCode.toLowerCase()

  // Add common wine shipping restrictions
  restrictions.push('age_verification_required')

  // Carrier-specific restrictions
  if (lowerCarrier.includes('mondial_relay')) {
    restrictions.push('service_point_delivery_only')
  }

  if (lowerCarrier.includes('chronopost') || lowerCarrier.includes('colissimo')) {
    restrictions.push('signature_required')
  }

  if (lowerCarrier.includes('ups') || lowerCarrier.includes('dhl')) {
    restrictions.push('business_address_preferred')
  }

  return restrictions
}