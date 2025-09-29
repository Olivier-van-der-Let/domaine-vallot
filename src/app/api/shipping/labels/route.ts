import { NextRequest, NextResponse } from 'next/server'
import { getServerUser, getOrderById, updateOrder } from '@/lib/supabase/server'
import { getSendcloudClient } from '@/lib/sendcloud/client'
import { createHash } from 'crypto'

// Rate limiting storage (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20 // 20 requests per minute (more restrictive for label generation)

function getRateLimitKey(ip: string): string {
  return `shipping_labels:${ip}`
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

/**
 * Generate shipping label for an order
 * POST /api/shipping/labels
 */
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

    console.log(`🔍 [${requestId}] Shipping label generation request from IP: ${clientIP}`)

    // Apply rate limiting
    const rateLimit = checkRateLimit(clientIP)
    if (!rateLimit.allowed) {
      console.warn(`🚫 [${requestId}] Rate limit exceeded for IP: ${clientIP}`)
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many label generation requests. Please try again later.',
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

    // Get authenticated user
    const user = await getServerUser()
    if (!user) {
      console.error(`❌ [${requestId}] Authentication required`)
      return NextResponse.json(
        { error: 'Authentication required', requestId },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { orderId, shippingMethodId } = body

    if (!orderId) {
      console.error(`❌ [${requestId}] Order ID is required`)
      return NextResponse.json(
        { error: 'Order ID is required', requestId },
        { status: 400 }
      )
    }

    console.log(`📦 [${requestId}] Generating label for order: ${orderId}`)

    // Get order details (admin users can access any order, customers can only access their own)
    const { data: order, error: orderError } = await getOrderById(orderId, user.role === 'admin' ? undefined : user.id)

    if (orderError || !order) {
      console.error(`❌ [${requestId}] Order not found:`, orderError)
      return NextResponse.json(
        { error: 'Order not found', requestId },
        { status: 404 }
      )
    }

    // Check if order has payment confirmation
    if (order.status !== 'confirmed' && order.status !== 'processing') {
      console.error(`❌ [${requestId}] Order ${orderId} not ready for shipping (status: ${order.status})`)
      return NextResponse.json(
        {
          error: 'Order not ready for shipping',
          details: `Order status is '${order.status}'. Only confirmed and processing orders can generate shipping labels.`,
          requestId
        },
        { status: 400 }
      )
    }

    // Check if order already has a Sendcloud order ID
    if (!order.sendcloud_order_id) {
      console.error(`❌ [${requestId}] Order ${orderId} has no Sendcloud order ID`)
      return NextResponse.json(
        {
          error: 'Sendcloud order not found',
          details: 'This order was not properly created in Sendcloud. Please contact support.',
          requestId
        },
        { status: 400 }
      )
    }

    // Initialize Sendcloud client
    const sendcloudClient = getSendcloudClient()

    if (!sendcloudClient.hasValidCredentials()) {
      console.error(`❌ [${requestId}] Sendcloud credentials not available`)
      return NextResponse.json(
        {
          error: 'Shipping service unavailable',
          details: 'Unable to connect to shipping service.',
          requestId
        },
        { status: 502 }
      )
    }

    // Generate shipping label
    console.log(`🏷️ [${requestId}] Creating label for Sendcloud order: ${order.sendcloud_order_id}`)

    const labelResponse = await sendcloudClient.createLabel(
      order.sendcloud_order_id,
      shippingMethodId
    )

    console.log(`✅ [${requestId}] Label created successfully:`, {
      parcel_id: labelResponse.parcel?.id,
      tracking_number: labelResponse.parcel?.tracking_number,
      carrier: labelResponse.parcel?.carrier
    })

    // Update order with shipping information
    const updateData: any = {
      sendcloud_status: 'shipped'
    }

    if (labelResponse.parcel) {
      updateData.sendcloud_parcel_id = labelResponse.parcel.id
      updateData.sendcloud_tracking_number = labelResponse.parcel.tracking_number
      updateData.sendcloud_tracking_url = labelResponse.parcel.tracking_url
      updateData.sendcloud_carrier = labelResponse.parcel.carrier?.name || 'Unknown'
      updateData.sendcloud_label_url = labelResponse.label?.label_printer || null
    }

    try {
      await updateOrder(orderId, updateData)
      console.log(`💾 [${requestId}] Order updated with shipping information`)
    } catch (updateError) {
      console.error(`⚠️ [${requestId}] Failed to update order with shipping info:`, updateError)
      // Don't fail the label generation for this
    }

    // Performance metrics
    const processingTime = Date.now() - startTime
    console.log(`🕐 [${requestId}] Label generated in ${processingTime}ms`)

    const response = {
      success: true,
      message: 'Shipping label generated successfully',
      orderId,
      parcel: {
        id: labelResponse.parcel?.id,
        tracking_number: labelResponse.parcel?.tracking_number,
        tracking_url: labelResponse.parcel?.tracking_url,
        carrier: {
          name: labelResponse.parcel?.carrier?.name,
          code: labelResponse.parcel?.carrier?.code
        },
        status: labelResponse.parcel?.status?.message,
        weight: labelResponse.parcel?.weight,
        shipment_uuid: labelResponse.parcel?.shipment_uuid
      },
      label: {
        format: 'pdf',
        url: labelResponse.label?.label_printer,
        download_url: labelResponse.label?.normal_printer?.[0] || labelResponse.label?.label_printer
      },
      requestId,
      processing_time_ms: processingTime
    }

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
    console.error(`💥 [${requestId}] Label generation error after ${processingTime}ms:`, error)

    // Determine appropriate error response based on error type
    let statusCode = 500
    let errorMessage = 'Label generation failed'
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
      } else if (error.message.includes('not found')) {
        statusCode = 404
        errorMessage = 'Order or shipping method not found'
        details = 'The specified order or shipping method could not be found in the shipping system.'
      } else if (error.message.includes('already shipped')) {
        statusCode = 409
        errorMessage = 'Order already shipped'
        details = 'A shipping label has already been generated for this order.'
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

/**
 * Get shipping label for an order
 * GET /api/shipping/labels?orderId=xxx
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  let requestId = ''

  try {
    // Generate request ID for tracing
    requestId = createHash('sha256').update(`${Date.now()}-${Math.random()}`).digest('hex').substring(0, 8)

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      console.error(`❌ [${requestId}] Order ID parameter is required`)
      return NextResponse.json(
        { error: 'Order ID parameter is required', requestId },
        { status: 400 }
      )
    }

    // Get authenticated user
    const user = await getServerUser()
    if (!user) {
      console.error(`❌ [${requestId}] Authentication required`)
      return NextResponse.json(
        { error: 'Authentication required', requestId },
        { status: 401 }
      )
    }

    console.log(`📋 [${requestId}] Getting label info for order: ${orderId}`)

    // Get order details
    const { data: order, error: orderError } = await getOrderById(orderId, user.role === 'admin' ? undefined : user.id)

    if (orderError || !order) {
      console.error(`❌ [${requestId}] Order not found:`, orderError)
      return NextResponse.json(
        { error: 'Order not found', requestId },
        { status: 404 }
      )
    }

    // Performance metrics
    const processingTime = Date.now() - startTime

    const response = {
      orderId,
      shipping_status: {
        sendcloud_order_id: order.sendcloud_order_id,
        sendcloud_parcel_id: order.sendcloud_parcel_id,
        sendcloud_status: order.sendcloud_status,
        tracking_number: order.sendcloud_tracking_number,
        tracking_url: order.sendcloud_tracking_url,
        carrier: order.sendcloud_carrier,
        label_url: order.sendcloud_label_url
      },
      has_label: !!(order.sendcloud_label_url),
      can_generate_label: !!(order.sendcloud_order_id && (order.status === 'confirmed' || order.status === 'processing')),
      requestId,
      processing_time_ms: processingTime
    }

    return NextResponse.json(response, {
      headers: {
        'X-Request-ID': requestId
      }
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error(`💥 [${requestId}] Get label info error after ${processingTime}ms:`, error)

    return NextResponse.json(
      {
        error: 'Failed to retrieve label information',
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