import { NextRequest, NextResponse } from 'next/server'
import { calculateWineShipping } from '@/lib/sendcloud/client'
import { shippingRateSchema, validateSchema } from '@/lib/validators/schemas'
import { createHash } from 'crypto'

// Rate limiting storage (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const requestDedupeMap = new Map<string, { timestamp: number; response: any }>()

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100 // 100 requests per minute
const DEDUPE_WINDOW = 5 * 1000 // 5 seconds

function getRateLimitKey(ip: string): string {
  return `shipping_rates:${ip}`
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

    console.log(`🔍 [${requestId}] Shipping rates request from IP: ${clientIP}`)

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
          error: 'Invalid shipping rate request',
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

    // Calculate total bottles
    const totalBottles = items.reduce((sum, item) => sum + item.quantity, 0)

    console.log(`🚚 [${requestId}] Calculating shipping rates for ${totalBottles} bottles to ${destination.country}`)

    const shippingRates = await calculateWineShipping(
      {
        name: 'Customer',
        address: destination.city,
        city: destination.city,
        postal_code: destination.postalCode,
        country: destination.country
      },
      totalBottles,
      totalValue
    )

    console.log(`✅ [${requestId}] Received ${shippingRates.length} shipping rates`)

    const formattedRates = shippingRates.map(rate => {
      // Ensure complete characteristics structure for shipping rates
      const characteristics = rate.shipping_method.characteristics || {}
      const carrierCode = rate.shipping_method.carrier || 'unknown'

      return {
        id: rate.shipping_method.id,
        name: rate.shipping_method.name,
        carrier: carrierCode,
        price: rate.price,
        price_display: (rate.price / 100).toFixed(2),
        currency: rate.currency,
        delivery_time: rate.delivery_time,
        service_point_required: rate.service_point_required,
        characteristics: {
          id: rate.shipping_method.id || `${carrierCode}-${rate.shipping_method.name}`,
          name: rate.shipping_method.name,
          carrier: carrierCode,
          service_code: rate.shipping_method.id?.toString() || carrierCode,
          delivery_type: rate.service_point_required ? 'service_point' : 'home_delivery',
          is_tracked: characteristics.is_tracked ?? true, // Default to true for wine shipping
          requires_signature: characteristics.requires_signature ?? false,
          is_express: characteristics.is_express ?? false,
          insurance: 0,
          restrictions: ['age_verification_required']
        }
      }
    })

    // Performance metrics
    const processingTime = Date.now() - startTime
    console.log(`🕰️ [${requestId}] Request processed in ${processingTime}ms`)

    const response = {
      rates: formattedRates,
      destination,
      package_info: {
        total_bottles: totalBottles,
        estimated_weight: totalBottles * 750 + 200
      },
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
    console.error(`💥 [${requestId}] Shipping calculation error after ${processingTime}ms:`, error)

    // Determine appropriate error response based on error type
    let statusCode = 500
    let errorMessage = 'Shipping calculation failed'
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
      service: 'shipping-rates-api',
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
        service: 'shipping-rates-api',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    )
  }
}