import { NextRequest, NextResponse } from 'next/server'
import { getSendcloudClient } from '@/lib/sendcloud/client'
import { shippingRateSchema, validateSchema } from '@/lib/validators/schemas'
import { createHash } from 'crypto'

// Rate limiting storage (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const requestDedupeMap = new Map<string, { timestamp: number; response: any }>()

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100 // 100 requests per minute
const DEDUPE_WINDOW = 5 * 1000 // 5 seconds

function getRateLimitKey(ip: string): string {
  return `shipping_options:${ip}`
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
  const key = getRateLimitKey(ip)
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW

  // Clean up old entries
  for (const [k, v] of rateLimitMap.entries()) {
    if (v.resetTime < now) {
      rateLimitMap.delete(k)
    }
  }

  const current = rateLimitMap.get(key) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW }

  if (current.resetTime < now) {
    // Reset window
    current.count = 0
    current.resetTime = now + RATE_LIMIT_WINDOW
  }

  const allowed = current.count < RATE_LIMIT_MAX_REQUESTS

  if (allowed) {
    current.count++
    rateLimitMap.set(key, current)
  }

  return {
    allowed,
    remaining: Math.max(0, RATE_LIMIT_MAX_REQUESTS - current.count),
    resetTime: current.resetTime
  }
}

function createRequestKey(body: any): string {
  const normalizedBody = JSON.stringify(body, Object.keys(body).sort())
  return createHash('sha256').update(normalizedBody).digest('hex')
}

function checkRequestDedupe(key: string): { isDuplicate: boolean; cachedResponse?: any } {
  const now = Date.now()

  // Clean up old entries
  for (const [k, v] of requestDedupeMap.entries()) {
    if (now - v.timestamp > DEDUPE_WINDOW) {
      requestDedupeMap.delete(k)
    }
  }

  const cached = requestDedupeMap.get(key)
  if (cached && now - cached.timestamp < DEDUPE_WINDOW) {
    return { isDuplicate: true, cachedResponse: cached.response }
  }

  return { isDuplicate: false }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let requestId = ''

  try {
    // Generate request ID for tracing
    requestId = createHash('sha256').update(`${Date.now()}-${Math.random()}`).digest('hex').substring(0, 8)

    // Get client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                    request.headers.get('x-real-ip') ||
                    '127.0.0.1'

    console.log(`🔍 [${requestId}] Shipping options request from IP: ${clientIP}`)

    // Apply rate limiting
    const rateLimit = checkRateLimit(clientIP)
    if (!rateLimit.allowed) {
      console.warn(`🚫 [${requestId}] Rate limit exceeded for IP: ${clientIP}`)
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          requestId
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(rateLimit.resetTime / 1000).toString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }

    console.log(`🚚 [${requestId}] Shipping options API called`)
    const body = await request.json()
    console.log(`📦 [${requestId}] Request body:`, JSON.stringify(body, null, 2))

    // Check for duplicate requests
    const requestKey = createRequestKey(body)
    const dedupeCheck = checkRequestDedupe(requestKey)

    if (dedupeCheck.isDuplicate && dedupeCheck.cachedResponse) {
      console.log(`🔄 [${requestId}] Returning cached response for duplicate request`)
      return NextResponse.json({
        ...dedupeCheck.cachedResponse,
        cached: true,
        requestId
      })
    }

    const validation = validateSchema(shippingRateSchema, body)

    if (!validation.success) {
      console.error(`❌ [${requestId}] Validation failed:`, validation.errors)
      return NextResponse.json(
        {
          error: 'Invalid shipping options request',
          details: validation.errors,
          requestId
        },
        { status: 400 }
      )
    }

    const { destination, items, totalValue } = validation.data
    console.log(`✅ [${requestId}] Validation passed:`, { destination, itemCount: items.length, totalValue })

    // Additional validation for edge cases
    if (totalValue <= 0) {
      console.error(`❌ [${requestId}] Invalid total value:`, totalValue)
      return NextResponse.json(
        { error: 'Invalid order total value', requestId },
        { status: 400 }
      )
    }

    if (items.length === 0) {
      console.error(`❌ [${requestId}] No items in order`)
      return NextResponse.json(
        { error: 'No items in order', requestId },
        { status: 400 }
      )
    }

    // Validate destination country is supported
    const supportedCountries = ['NL', 'BE', 'DE', 'FR', 'IT', 'ES', 'AT', 'PT', 'LU', 'GB', 'US', 'CA']
    if (!supportedCountries.includes(destination.country.toUpperCase())) {
      console.warn(`⚠️ [${requestId}] Unsupported destination country:`, destination.country)
      return NextResponse.json({
        carriers: [],
        destination,
        error: 'Shipping not available to this destination',
        message: 'We currently do not ship to this location. Please contact us for special arrangements.',
        requestId
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
    console.log(`🔑 [${requestId}] Sendcloud client credentials available:`, sendcloudClient.hasValidCredentials())

    let carriers = []

    // Check if credentials are available
    if (!sendcloudClient.hasValidCredentials()) {
      console.warn(`⚠️ [${requestId}] Sendcloud credentials missing, using fallback shipping options`)
      carriers = getFallbackCarriers(destination.country, totalWeight, totalValue)
    } else {
      try {
        console.log(`🌐 [${requestId}] Calling Sendcloud API with:`, { origin, destination: { country: destination.country, postal_code: destination.postalCode }, packageInfo })
        carriers = await sendcloudClient.getAvailableCarriers(
          origin,
          {
            country: destination.country,
            postal_code: destination.postalCode
          },
          packageInfo
        )
        console.log(`✅ [${requestId}] Sendcloud API response received:`, carriers.length, 'carriers')
      } catch (apiError) {
        console.error(`❌ [${requestId}] Sendcloud API error:`, apiError)
        console.warn(`🔄 [${requestId}] Falling back to mock shipping options`)
        carriers = getFallbackCarriers(destination.country, totalWeight, totalValue)
      }
    }

    // Format response with carrier options and pricing
    const formattedCarriers = carriers.map(carrier => {
      console.log(`🔄 [${requestId}] Formatting carrier:`, carrier.code, 'with', carrier.shipping_options.length, 'options')

      return {
        code: carrier.code,
        name: carrier.name,
        shipping_options: carrier.shipping_options.map(option => {
          console.log(`🔄 [${requestId}] Formatting option:`, option.code)

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
          // Map to schema-compliant format for order validation
          const characteristics = {
            is_tracked: getTrackedDefault(functionalities.tracked, carrierCode),
            requires_signature: getSignatureDefault(functionalities.signature, carrierCode),
            is_express: isExpressService(functionalities.delivery_deadline, option.product?.name, carrierCode),
            insurance: functionalities.insurance || 0,
            last_mile: mapLastMileValue(functionalities.last_mile, carrierCode)
          }

          return {
            code: option.code,
            name: option.product?.name || option.name || option.code,
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

    // Performance metrics
    const processingTime = Date.now() - startTime
    console.log(`🕰️ [${requestId}] Request processed in ${processingTime}ms`)
    console.log(`✅ [${requestId}] Formatted response:`, formattedCarriers.length, 'carriers with',
      formattedCarriers.reduce((sum, c) => sum + c.shipping_options.length, 0), 'total options')

    const response = {
      carriers: formattedCarriers,
      destination,
      package_info: {
        total_bottles: totalBottles,
        estimated_weight: totalWeight,
        dimensions: packageInfo
      },
      origin,
      requestId,
      processing_time_ms: processingTime
    }

    // Cache the response for deduplication
    requestDedupeMap.set(requestKey, {
      timestamp: Date.now(),
      response: response
    })

    return NextResponse.json(response, {
      headers: {
        'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(rateLimit.resetTime / 1000).toString(),
        'X-Request-ID': requestId
      }
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error(`💥 [${requestId}] Shipping options calculation error after ${processingTime}ms:`, error)

    // Determine appropriate error response based on error type
    let statusCode = 500
    let errorMessage = 'Shipping options calculation failed'
    let details = error instanceof Error ? error.message : 'Unknown error'

    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('timeout')) {
        statusCode = 504
        errorMessage = 'Shipping service timeout'
        details = 'The shipping service is currently unavailable. Please try again.'
      } else if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
        statusCode = 502
        errorMessage = 'Shipping service configuration error'
        details = 'Unable to connect to shipping service. Please contact support.'
      } else if (error.message.includes('rate limit')) {
        statusCode = 503
        errorMessage = 'Shipping service temporarily unavailable'
        details = 'The shipping service is experiencing high demand. Please try again in a few moments.'
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details,
        requestId,
        processing_time_ms: processingTime
      },
      {
        status: statusCode,
        headers: {
          'X-Request-ID': requestId
        }
      }
    )
  }
}

// Health check endpoint
export async function GET() {
  try {
    const startTime = Date.now()

    // Basic health check - verify we can create a hash (crypto available)
    const testHash = createHash('sha256').update('health-check').digest('hex')

    const responseTime = Date.now() - startTime

    return NextResponse.json({
      status: 'healthy',
      service: 'shipping-options-api',
      timestamp: new Date().toISOString(),
      response_time_ms: responseTime,
      rate_limit_config: {
        max_requests: RATE_LIMIT_MAX_REQUESTS,
        window_ms: RATE_LIMIT_WINDOW
      },
      active_rate_limits: rateLimitMap.size,
      active_dedupe_cache: requestDedupeMap.size
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        service: 'shipping-options-api',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
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
          // Schema-compliant characteristics for fallback
          characteristics: {
            is_tracked: true,
            requires_signature: false,
            is_express: false,
            insurance: totalValue > 5000 ? 500 : 0,
            last_mile: 'home'
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
          // Schema-compliant characteristics for fallback
          characteristics: {
            is_tracked: true,
            requires_signature: true,
            is_express: false,
            insurance: totalValue > 5000 ? 500 : 0,
            last_mile: 'home'
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
 * Map Sendcloud last_mile functionality to schema-compliant values
 */
function mapLastMileValue(lastMile: string | undefined, carrierCode: string): string {
  // Handle explicit last mile values from Sendcloud API
  if (lastMile) {
    switch (lastMile.toLowerCase()) {
      case 'home_delivery':
      case 'home':
        return 'home'
      case 'service_point':
      case 'pickup_point':
      case 'parcel_shop':
        return 'pickup_point'
      case 'locker':
      case 'parcel_locker':
        return 'locker'
      default:
        return lastMile
    }
  }

  // Carrier-specific defaults when last_mile is not specified
  const lowerCarrier = carrierCode.toLowerCase()

  // Service point only carriers
  if (lowerCarrier.includes('mondial_relay')) {
    return 'pickup_point'
  }

  // Locker services
  if (lowerCarrier.includes('dhl') && lowerCarrier.includes('locker')) {
    return 'locker'
  }

  // Default to home delivery for most carriers
  return 'home'
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