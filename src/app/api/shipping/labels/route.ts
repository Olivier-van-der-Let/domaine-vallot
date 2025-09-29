import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase/server'
import { createHash } from 'crypto'

/**
 * Generate shipping label for an order - DISABLED
 * POST /api/shipping/labels
 *
 * Note: This endpoint has been disabled as Sendcloud integration was removed.
 * Labels must be generated manually through carrier websites.
 */
export async function POST(request: NextRequest) {
  const requestId = createHash('sha256').update(`${Date.now()}-${Math.random()}`).digest('hex').substring(0, 8)

  try {
    // Get authenticated user
    const user = await getServerUser()
    if (!user) {
      console.error(`❌ [${requestId}] Authentication required`)
      return NextResponse.json(
        { error: 'Authentication required', requestId },
        { status: 401 }
      )
    }

    console.log(`🚫 [${requestId}] Label generation requested but service unavailable`)

    return NextResponse.json(
      {
        error: 'Label generation unavailable',
        message: 'Automated label generation is currently unavailable. Please generate labels manually through your carrier\'s website or contact support for assistance.',
        details: 'Sendcloud integration has been removed. Labels must be created manually.',
        requestId,
        support_info: {
          message: 'For manual label generation, please:',
          steps: [
            '1. Log into your carrier account (Colissimo, DPD, etc.)',
            '2. Create a shipment using the order address details',
            '3. Download and print the shipping label',
            '4. Update the order status manually in the admin panel'
          ]
        }
      },
      { status: 503 }
    )

  } catch (error) {
    console.error(`💥 [${requestId}] Label generation error:`, error)

    return NextResponse.json(
      {
        error: 'Label generation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        requestId
      },
      { status: 500 }
    )
  }
}

/**
 * Get shipping label for an order - DISABLED
 * GET /api/shipping/labels?orderId=xxx
 *
 * Note: This endpoint has been disabled as Sendcloud integration was removed.
 */
export async function GET(request: NextRequest) {
  const requestId = createHash('sha256').update(`${Date.now()}-${Math.random()}`).digest('hex').substring(0, 8)

  try {
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

    console.log(`📋 [${requestId}] Label info requested for order: ${orderId}`)

    const response = {
      orderId,
      shipping_status: {
        service_available: false,
        integration_status: 'removed',
        message: 'Sendcloud integration has been removed'
      },
      has_label: false,
      can_generate_label: false,
      manual_process_required: true,
      instructions: {
        title: 'Manual Label Generation Required',
        description: 'Labels must be generated manually through carrier websites',
        steps: [
          'Access your carrier account (Colissimo, DPD, etc.)',
          'Create shipment using order address details',
          'Download and print the shipping label',
          'Update tracking information in admin panel'
        ]
      },
      requestId
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error(`💥 [${requestId}] Get label info error:`, error)

    return NextResponse.json(
      {
        error: 'Failed to retrieve label information',
        details: error instanceof Error ? error.message : 'Unknown error',
        requestId
      },
      { status: 500 }
    )
  }
}