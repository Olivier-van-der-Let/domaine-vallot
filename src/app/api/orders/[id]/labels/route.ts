import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/server'
import { sendcloudClient } from '@/lib/sendcloud/client'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params
    const body = await request.json()
    const { shipping_method_id } = body

    const supabase = createRouteHandlerSupabaseClient()

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check if order has Sendcloud order ID
    if (!order.sendcloud_order_id) {
      return NextResponse.json(
        { error: 'Order not synced with Sendcloud yet' },
        { status: 400 }
      )
    }

    // Check if label already exists
    if (order.sendcloud_parcel_id && order.sendcloud_label_url) {
      return NextResponse.json({
        message: 'Label already exists',
        label_url: order.sendcloud_label_url,
        parcel_id: order.sendcloud_parcel_id,
        tracking_number: order.sendcloud_tracking_number,
        tracking_url: order.sendcloud_tracking_url
      })
    }

    // Create shipping label in Sendcloud
    const labelResponse = await sendcloudClient.createLabel(
      order.sendcloud_order_id,
      shipping_method_id
    )

    // If the response contains parcel information, update the order
    if (labelResponse.parcel) {
      const parcel = labelResponse.parcel

      await supabase
        .from('orders')
        .update({
          sendcloud_parcel_id: parcel.id,
          sendcloud_tracking_number: parcel.tracking_number,
          sendcloud_tracking_url: parcel.tracking_url,
          sendcloud_label_url: parcel.label?.normal_printer?.[0] || parcel.label?.label_printer,
          sendcloud_status: parcel.status?.message || parcel.status?.id,
          sendcloud_carrier: parcel.carrier?.code || parcel.carrier,
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      return NextResponse.json({
        message: 'Shipping label created successfully',
        parcel_id: parcel.id,
        tracking_number: parcel.tracking_number,
        tracking_url: parcel.tracking_url,
        label_url: parcel.label?.normal_printer?.[0] || parcel.label?.label_printer,
        carrier: parcel.carrier?.code || parcel.carrier,
        status: parcel.status?.message || parcel.status?.id
      })
    }

    // If no parcel info in response, return basic success
    return NextResponse.json({
      message: 'Label creation initiated',
      order_id: order.sendcloud_order_id,
      response: labelResponse
    })

  } catch (error) {
    console.error('Error creating shipping label:', error)

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Order or shipping method not found in Sendcloud' },
          { status: 404 }
        )
      }

      if (error.message.includes('insufficient')) {
        return NextResponse.json(
          { error: 'Insufficient shipping information' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to create shipping label' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve existing label information
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params
    const supabase = createRouteHandlerSupabaseClient()

    // Get order with Sendcloud data
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        sendcloud_order_id,
        sendcloud_parcel_id,
        sendcloud_tracking_number,
        sendcloud_tracking_url,
        sendcloud_label_url,
        sendcloud_status,
        sendcloud_carrier,
        shipped_at,
        delivered_at
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // If we have a parcel ID, get fresh tracking info from Sendcloud
    let trackingInfo = null
    if (order.sendcloud_parcel_id) {
      try {
        trackingInfo = await sendcloudClient.getTracking(order.sendcloud_parcel_id)
      } catch (trackingError) {
        console.error('Failed to get tracking info:', trackingError)
        // Continue with stored data if API fails
      }
    }

    return NextResponse.json({
      order_id: order.id,
      order_number: order.order_number,
      status: order.status,
      sendcloud: {
        order_id: order.sendcloud_order_id,
        parcel_id: order.sendcloud_parcel_id,
        tracking_number: trackingInfo?.tracking_number || order.sendcloud_tracking_number,
        tracking_url: trackingInfo?.tracking_url || order.sendcloud_tracking_url,
        label_url: order.sendcloud_label_url,
        status: trackingInfo?.status || order.sendcloud_status,
        status_message: trackingInfo?.status_message,
        carrier: order.sendcloud_carrier
      },
      shipping: {
        shipped_at: order.shipped_at,
        delivered_at: order.delivered_at
      }
    })

  } catch (error) {
    console.error('Error getting shipping label info:', error)
    return NextResponse.json(
      { error: 'Failed to get shipping information' },
      { status: 500 }
    )
  }
}