import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/server'

const buildRequestId = () =>
  createHash('sha256').update(`${Date.now()}-${Math.random()}`).digest('hex').substring(0, 8)

const disabledResponse = (requestId: string) => NextResponse.json({
  error: 'Sendcloud integration disabled',
  message: 'Automatic label handling is unavailable. Please process shipping labels manually.',
  requestId,
  instructions: [
    'Download the packing slip for the order',
    'Create the shipment in your carrier portal (Colissimo, DPD, etc.)',
    'Upload tracking details in the admin once the label is generated'
  ]
}, { status: 503 })

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = buildRequestId()

  try {
    const supabase = createRouteHandlerSupabaseClient()
    const { id } = await params
    const { data: order } = await supabase
      .from('orders')
      .select('id, order_number')
      .eq('id', id)
      .maybeSingle()

    if (!order) {
      return NextResponse.json({ error: 'Order not found', requestId }, { status: 404 })
    }

    console.info(`Sendcloud label request ignored for order ${order.order_number} (${requestId})`)
    return disabledResponse(requestId)
  } catch (error) {
    console.error(`Order label fallback failed (${requestId}):`, error)
    return disabledResponse(requestId)
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = buildRequestId()

  try {
    const supabase = createRouteHandlerSupabaseClient()
    const { id } = await params
    const { data: order } = await supabase
      .from('orders')
      .select('id, order_number, sendcloud_tracking_number, sendcloud_tracking_url')
      .eq('id', id)
      .maybeSingle()

    if (!order) {
      return NextResponse.json({ error: 'Order not found', requestId }, { status: 404 })
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.order_number,
      trackingNumber: order.sendcloud_tracking_number,
      trackingUrl: order.sendcloud_tracking_url,
      sendcloud: {
        integrationStatus: 'removed',
        serviceAvailable: false
      },
      manualProcessRequired: true,
      requestId
    })
  } catch (error) {
    console.error(`Order label info fallback failed (${requestId}):`, error)
    return disabledResponse(requestId)
  }
}
