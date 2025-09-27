import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/server'
import { sendcloudClient } from '@/lib/sendcloud/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const data = JSON.parse(body)

    // Verify webhook signature (if available)
    const signature = request.headers.get('x-sendcloud-signature') || ''
    if (!sendcloudClient.verifyWebhookSignature(body, signature)) {
      console.error('Invalid Sendcloud webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Log webhook for debugging
    console.log('Sendcloud webhook received:', {
      action: data.action,
      timestamp: data.timestamp,
      parcel_id: data.parcel?.id
    })

    // Handle different webhook actions
    switch (data.action) {
      case 'parcel_status_changed':
        await handleParcelStatusChanged(data)
        break

      case 'parcel_shipped':
        await handleParcelShipped(data)
        break

      case 'parcel_delivered':
        await handleParcelDelivered(data)
        break

      case 'parcel_exception':
        await handleParcelException(data)
        break

      default:
        console.log(`Unhandled Sendcloud webhook action: ${data.action}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Sendcloud webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleParcelStatusChanged(data: any) {
  const supabase = createRouteHandlerSupabaseClient()
  const parcel = data.parcel

  if (!parcel?.id) {
    console.error('No parcel ID in webhook data')
    return
  }

  try {
    // Update order with new Sendcloud status
    const { error } = await supabase
      .from('orders')
      .update({
        sendcloud_status: parcel.status?.message || parcel.status?.id,
        sendcloud_tracking_number: parcel.tracking_number,
        sendcloud_tracking_url: parcel.tracking_url,
        sendcloud_carrier: parcel.carrier?.code || parcel.carrier,
        updated_at: new Date().toISOString()
      })
      .eq('sendcloud_parcel_id', parcel.id)

    if (error) {
      console.error('Failed to update order with Sendcloud status:', error)
    } else {
      console.log(`Updated order status for parcel ${parcel.id}:`, parcel.status?.message)
    }
  } catch (error) {
    console.error('Error updating order with Sendcloud status:', error)
  }
}

async function handleParcelShipped(data: any) {
  const supabase = createRouteHandlerSupabaseClient()
  const parcel = data.parcel

  if (!parcel?.id) {
    console.error('No parcel ID in shipped webhook data')
    return
  }

  try {
    // Update order status to shipped
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'shipped',
        sendcloud_status: 'shipped',
        sendcloud_tracking_number: parcel.tracking_number,
        sendcloud_tracking_url: parcel.tracking_url,
        sendcloud_carrier: parcel.carrier?.code || parcel.carrier,
        shipped_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('sendcloud_parcel_id', parcel.id)

    if (error) {
      console.error('Failed to update order to shipped status:', error)
    } else {
      console.log(`Marked order as shipped for parcel ${parcel.id}`)

      // TODO: Send customer notification email about shipment
      // await sendShipmentNotification(order.customer_email, parcel.tracking_url)
    }
  } catch (error) {
    console.error('Error handling parcel shipped:', error)
  }
}

async function handleParcelDelivered(data: any) {
  const supabase = createRouteHandlerSupabaseClient()
  const parcel = data.parcel

  if (!parcel?.id) {
    console.error('No parcel ID in delivered webhook data')
    return
  }

  try {
    // Update order status to delivered
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'delivered',
        sendcloud_status: 'delivered',
        delivered_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('sendcloud_parcel_id', parcel.id)

    if (error) {
      console.error('Failed to update order to delivered status:', error)
    } else {
      console.log(`Marked order as delivered for parcel ${parcel.id}`)

      // TODO: Send customer notification email about delivery
      // TODO: Request review/feedback from customer
    }
  } catch (error) {
    console.error('Error handling parcel delivered:', error)
  }
}

async function handleParcelException(data: any) {
  const supabase = createRouteHandlerSupabaseClient()
  const parcel = data.parcel

  if (!parcel?.id) {
    console.error('No parcel ID in exception webhook data')
    return
  }

  try {
    // Update order with exception status
    const { error } = await supabase
      .from('orders')
      .update({
        sendcloud_status: 'exception',
        fulfillment_notes: `Delivery exception: ${parcel.status?.message || 'Unknown issue'}`,
        updated_at: new Date().toISOString()
      })
      .eq('sendcloud_parcel_id', parcel.id)

    if (error) {
      console.error('Failed to update order with exception status:', error)
    } else {
      console.log(`Updated order with exception for parcel ${parcel.id}:`, parcel.status?.message)

      // TODO: Send admin notification about delivery exception
      // TODO: Send customer notification if appropriate
    }
  } catch (error) {
    console.error('Error handling parcel exception:', error)
  }
}

// GET endpoint for webhook verification (if Sendcloud requires it)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const challenge = searchParams.get('challenge')

  if (challenge) {
    return NextResponse.json({ challenge })
  }

  return NextResponse.json({
    status: 'Sendcloud webhook endpoint active',
    timestamp: new Date().toISOString()
  })
}