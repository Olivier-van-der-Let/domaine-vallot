import { NextRequest, NextResponse } from 'next/server'
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

    // Calculate total bottles and weight
    const totalBottles = items.reduce((sum, item) => sum + item.quantity, 0)
    const bottleWeight = 750 // grams per bottle
    const packagingWeight = Math.max(200, totalBottles * 50) // Base packaging + per bottle
    const totalWeight = (totalBottles * bottleWeight) + packagingWeight

    console.log(`🚚 [${requestId}] Generating fallback shipping options for ${totalBottles} bottles to ${destination.country}`)

    // Generate fallback shipping options
    const carriers = getFallbackCarriers(destination.country, totalWeight, totalValue)

    console.log(`✅ [${requestId}] Generated ${carriers.length} fallback carriers`)

    // Performance metrics
    const processingTime = Date.now() - startTime
    console.log(`🕰️ [${requestId}] Request processed in ${processingTime}ms`)

    const response = {
      carriers,
      destination,
      package_info: {
        total_bottles: totalBottles,
        estimated_weight: totalWeight,
        dimensions: {
          length: totalBottles <= 6 ? 35 : 45, // cm
          width: totalBottles <= 6 ? 25 : 35,  // cm
          height: totalBottles <= 6 ? 30 : 35  // cm
        }
      },
      origin: {
        country: 'FR',
        postal_code: '21000' // Dijon, Burgundy
      },
      mode: 'fallback_only',
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

    return NextResponse.json(
      {
        error: 'Shipping options calculation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        processing_time_ms: processingTime
      },
      {
        status: 500,
        headers: {
          'X-Request-ID': requestId
        }
      }
    )
  }
}

/**
 * Generate fallback carriers when external shipping APIs are unavailable
 */
function getFallbackCarriers(country: string, totalWeight: number, totalValue: number) {
  const isEU = ['FR', 'DE', 'IT', 'ES', 'BE', 'NL', 'LU', 'AT', 'PT', 'IE', 'FI', 'SE', 'DK', 'PL', 'CZ', 'SK', 'HU', 'SI', 'EE', 'LV', 'LT', 'CY', 'MT', 'BG', 'RO', 'HR', 'GR'].includes(country.toUpperCase())
  const isFrance = country.toUpperCase() === 'FR'

  const carriers = []

  if (isFrance) {
    // Domestic France shipping
    carriers.push({
      code: 'colissimo',
      name: 'Colissimo',
      shipping_options: [
        {
          code: 'colissimo-standard',
          name: 'Colissimo Standard',
          carrier_code: 'colissimo',
          carrier_name: 'Colissimo',
          price: 690, // €6.90 in cents
          currency: 'EUR',
          price_display: '6.90',
          delivery_time: '2-3 business days',
          service_point_required: false,
          characteristics: {
            is_tracked: true,
            requires_signature: false,
            is_express: false,
            insurance: 0,
            last_mile: 'home'
          },
          weight_range: {
            min: 0.1,
            max: 30,
            unit: 'kg'
          }
        }
      ]
    })

    if (totalValue > 5000) { // For orders over €50
      carriers[0].shipping_options.push({
        code: 'colissimo-signed',
        name: 'Colissimo Recommandé',
        carrier_code: 'colissimo',
        carrier_name: 'Colissimo',
        price: 890, // €8.90 in cents
        currency: 'EUR',
        price_display: '8.90',
        delivery_time: '2-3 business days',
        service_point_required: false,
        characteristics: {
          is_tracked: true,
          requires_signature: true,
          is_express: false,
          insurance: 500, // €5 insurance
          last_mile: 'home'
        },
        weight_range: {
          min: 0.1,
          max: 30,
          unit: 'kg'
        }
      })
    }
  } else if (isEU) {
    // EU shipping
    const baseRate = totalWeight > 2000 ? 1490 : 1190 // €14.90 or €11.90

    carriers.push({
      code: 'colissimo',
      name: 'Colissimo',
      shipping_options: [
        {
          code: 'colissimo-europe',
          name: 'Colissimo Europe',
          carrier_code: 'colissimo',
          carrier_name: 'Colissimo',
          price: baseRate,
          currency: 'EUR',
          price_display: (baseRate / 100).toFixed(2),
          delivery_time: '5-7 business days',
          service_point_required: false,
          characteristics: {
            is_tracked: true,
            requires_signature: false,
            is_express: false,
            insurance: 0,
            last_mile: 'home'
          },
          weight_range: {
            min: 0.1,
            max: 30,
            unit: 'kg'
          }
        }
      ]
    })
  } else {
    // International shipping
    const baseRate = 2490 // €24.90

    carriers.push({
      code: 'colissimo',
      name: 'Colissimo',
      shipping_options: [
        {
          code: 'colissimo-international',
          name: 'Colissimo International',
          carrier_code: 'colissimo',
          carrier_name: 'Colissimo',
          price: baseRate,
          currency: 'EUR',
          price_display: (baseRate / 100).toFixed(2),
          delivery_time: '7-14 business days',
          service_point_required: false,
          characteristics: {
            is_tracked: true,
            requires_signature: true,
            is_express: false,
            insurance: 0,
            last_mile: 'home'
          },
          weight_range: {
            min: 0.1,
            max: 30,
            unit: 'kg'
          }
        }
      ]
    })
  }

  return carriers
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
      service: 'shipping-options-api-fallback',
      mode: 'fallback_shipping_only',
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
        service: 'shipping-options-api-fallback',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    )
  }
}