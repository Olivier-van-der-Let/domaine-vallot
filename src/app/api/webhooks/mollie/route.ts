import { NextRequest, NextResponse } from 'next/server'
import { handlePaymentWebhook } from '@/lib/mollie/client'
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/server'
import { getSendcloudClient } from '@/lib/sendcloud/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id: paymentId } = body

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      )
    }

    // Verify webhook and get payment details
    const { payment, isSuccessful, isFailed } = await handlePaymentWebhook(paymentId)

    if (!payment) {
      return NextResponse.json(
        { error: 'Invalid payment webhook' },
        { status: 400 }
      )
    }

    // Update order status in database
    const supabase = createRouteHandlerSupabaseClient()
    const orderId = payment.metadata?.orderId

    if (orderId) {
      let newStatus = 'pending'
      if (isSuccessful) newStatus = 'confirmed'
      if (isFailed) newStatus = 'payment_failed'

      const { error, data } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          payment_id: paymentId,
          payment_status: payment.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select('*')
        .single()

      if (error) {
        console.error('Failed to update order status:', error)
      } else if (isSuccessful && data) {
        // Create order in Sendcloud when payment is successful
        try {
          await createSendcloudOrder(data)
        } catch (sendcloudError) {
          console.error('Failed to create Sendcloud order:', sendcloudError)
          // Don't fail the payment webhook for Sendcloud issues
        }
      }
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Mollie webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function createSendcloudOrder(order: any) {
  const supabase = createRouteHandlerSupabaseClient()

  try {
    // Get order items for Sendcloud
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*, wine_products(name, sku)')
      .eq('order_id', order.id)

    if (itemsError || !orderItems?.length) {
      throw new Error('Failed to fetch order items for Sendcloud')
    }

    // Create order in Sendcloud
    const sendcloudOrder = await getSendcloudClient().createOrder({
      order_id: order.id,
      order_number: order.order_number,
      customer_email: order.billing_address?.email || order.shipping_address?.email,
      customer_name: `${order.billing_address?.name || order.shipping_address?.name}`,
      shipping_address: {
        name: order.shipping_address.name,
        address: order.shipping_address.address_line_1,
        house_number: order.shipping_address.house_number,
        city: order.shipping_address.city,
        postal_code: order.shipping_address.postal_code,
        country: order.shipping_address.country_code,
        telephone: order.shipping_address.phone_number,
        email: order.shipping_address.email
      },
      billing_address: {
        name: order.billing_address.name,
        address: order.billing_address.address_line_1,
        house_number: order.billing_address.house_number,
        city: order.billing_address.city,
        postal_code: order.billing_address.postal_code,
        country: order.billing_address.country_code,
        telephone: order.billing_address.phone_number,
        email: order.billing_address.email
      },
      items: orderItems.map(item => ({
        name: item.wine_products?.name || 'Wine',
        quantity: item.quantity,
        unit_price: item.unit_price_eur * 100 // Convert to cents
      })),
      total_amount: order.total_eur * 100, // Convert to cents
      currency: 'EUR'
    })

    // Update order with Sendcloud IDs
    await supabase
      .from('orders')
      .update({
        sendcloud_order_id: sendcloudOrder.id,
        sendcloud_integration_id: sendcloudOrder.order_details.integration.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id)

    console.log(`Created Sendcloud order ${sendcloudOrder.id} for order ${order.id}`)

  } catch (error) {
    console.error('Error creating Sendcloud order:', error)
    throw error
  }
}