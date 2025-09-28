import { NextRequest, NextResponse } from 'next/server'
import { getServerUser, getOrderById } from '@/lib/supabase/server'
import { mollieClient } from '@/lib/mollie/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user
    const user = await getServerUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id: orderId } = params

    // Validate orderId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID format' },
        { status: 400 }
      )
    }

    // Get order from database (with user restriction)
    const order = await getOrderById(orderId, user.id)

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Get payment status from Mollie if payment ID exists
    let paymentStatus = null
    let paymentDetails = null

    if (order.payment_id) {
      try {
        const payment = await mollieClient.getPayment(order.payment_id)
        paymentStatus = payment.status
        paymentDetails = {
          id: payment.id,
          status: payment.status,
          method: payment.method,
          created_at: payment.createdAt,
          paid_at: payment.paidAt,
          amount: payment.amount,
          links: payment.links
        }
      } catch (paymentError) {
        console.error('Failed to get payment status:', paymentError)
        // Continue without payment details
      }
    }

    // Format order items with product details
    const formattedItems = order.order_items.map(item => ({
      id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      unit_price_display: (item.unit_price / 100).toFixed(2),
      total_price: item.total_price,
      total_price_display: (item.total_price / 100).toFixed(2),
      product: {
        id: item.wine_products.id,
        name: item.wine_products.name,
        sku: item.wine_products.sku,
        category: item.wine_products.category,
        vintage: item.wine_products.vintage,
        image_url: item.wine_products.image_url || '/images/default-wine.jpg',
        alcohol_content: item.wine_products.alcohol_content,
        volume: item.wine_products.volume || 750,
        producer: item.wine_products.producer,
        region: item.wine_products.region
      }
    }))

    // Calculate order summary
    const totalItems = formattedItems.reduce((sum, item) => sum + item.quantity, 0)
    const totalBottles = totalItems // Assuming each item is one bottle

    // Format order response
    const orderResponse = {
      id: order.id,
      order_number: order.id.substring(0, 8).toUpperCase(),
      status: order.status,
      created_at: order.created_at,
      updated_at: order.updated_at,

      customer: {
        email: order.customers?.email,
        first_name: order.customers?.first_name,
        last_name: order.customers?.last_name
      },

      addresses: {
        shipping: order.shipping_address,
        billing: order.billing_address
      },

      items: formattedItems,

      totals: {
        subtotal: order.subtotal,
        subtotal_display: (order.subtotal / 100).toFixed(2),
        vat_amount: order.vat_amount,
        vat_amount_display: (order.vat_amount / 100).toFixed(2),
        shipping_cost: order.shipping_cost,
        shipping_cost_display: (order.shipping_cost / 100).toFixed(2),
        total_amount: order.total_amount,
        total_amount_display: (order.total_amount / 100).toFixed(2),
        currency: 'EUR',
        item_count: totalItems,
        bottle_count: totalBottles
      },

      payment: {
        method: order.payment_method,
        status: paymentStatus || 'unknown',
        payment_id: order.payment_id,
        details: paymentDetails
      },

      shipping: {
        status: order.shipping_status || 'not_shipped',
        tracking_number: order.tracking_number,
        tracking_url: order.tracking_url,
        estimated_delivery: order.estimated_delivery_date,
        special_instructions: order.special_instructions
      },

      timeline: generateOrderTimeline(order, paymentDetails),

      actions: getAvailableActions(order.status, paymentStatus),

      notifications: generateOrderNotifications(order, paymentStatus),

      // Wine-specific information
      wine_info: {
        age_verification_required: true,
        signature_required: order.total_amount >= 5000, // €50+
        contains_alcohol: true,
        alcohol_content_range: getAlcoholContentRange(formattedItems)
      }
    }

    return NextResponse.json({
      order: orderResponse
    })

  } catch (error) {
    console.error('Error fetching order:', error)

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message === 'Resource not found') {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        )
      }

      if (error.message === 'Access denied') {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

// Helper functions
function generateOrderTimeline(order: any, paymentDetails: any) {
  const timeline = [
    {
      status: 'created',
      timestamp: order.created_at,
      title: 'Order Created',
      description: 'Your order has been received and is being processed',
      completed: true
    }
  ]

  if (paymentDetails?.paid_at) {
    timeline.push({
      status: 'paid',
      timestamp: paymentDetails.paid_at,
      title: 'Payment Confirmed',
      description: 'Your payment has been successfully processed',
      completed: true
    })
  }

  if (order.status === 'confirmed' || order.status === 'shipped' || order.status === 'delivered') {
    timeline.push({
      status: 'confirmed',
      timestamp: order.confirmed_at || order.updated_at,
      title: 'Order Confirmed',
      description: 'Your order has been confirmed and is being prepared',
      completed: true
    })
  }

  if (order.status === 'shipped' || order.status === 'delivered') {
    timeline.push({
      status: 'shipped',
      timestamp: order.shipped_at || order.updated_at,
      title: 'Order Shipped',
      description: 'Your order has been shipped and is on its way',
      completed: true
    })
  }

  if (order.status === 'delivered') {
    timeline.push({
      status: 'delivered',
      timestamp: order.delivered_at || order.updated_at,
      title: 'Order Delivered',
      description: 'Your order has been successfully delivered',
      completed: true
    })
  }

  return timeline
}

function getAvailableActions(orderStatus: string, paymentStatus: string | null) {
  const actions = []

  if (orderStatus === 'pending' && (!paymentStatus || paymentStatus === 'open')) {
    actions.push({
      action: 'complete_payment',
      title: 'Complete Payment',
      description: 'Finish your payment to process the order'
    })
  }

  if (orderStatus === 'pending' || orderStatus === 'confirmed') {
    actions.push({
      action: 'cancel_order',
      title: 'Cancel Order',
      description: 'Cancel this order if payment hasn\'t been processed'
    })
  }

  if (orderStatus === 'shipped' && paymentStatus === 'paid') {
    actions.push({
      action: 'track_shipment',
      title: 'Track Shipment',
      description: 'Track your order delivery status'
    })
  }

  if (orderStatus === 'delivered') {
    actions.push({
      action: 'leave_review',
      title: 'Leave Review',
      description: 'Share your experience with these wines'
    })
  }

  return actions
}

function generateOrderNotifications(order: any, paymentStatus: string | null) {
  const notifications = []

  if (order.status === 'pending' && (!paymentStatus || paymentStatus === 'open')) {
    notifications.push({
      type: 'warning',
      title: 'Payment Required',
      message: 'Complete your payment to process this order',
      action: 'complete_payment'
    })
  }

  if (paymentStatus === 'failed' || paymentStatus === 'canceled') {
    notifications.push({
      type: 'error',
      title: 'Payment Issue',
      message: 'There was an issue with your payment. Please try again or contact support.',
      action: 'retry_payment'
    })
  }

  if (order.status === 'shipped') {
    notifications.push({
      type: 'info',
      title: 'Age Verification Required',
      message: 'Please have valid ID ready for age verification upon delivery',
      action: null
    })
  }

  return notifications
}

function getAlcoholContentRange(items: any[]) {
  const alcoholContents = items
    .map(item => item.product.alcohol_content)
    .filter(Boolean)

  if (alcoholContents.length === 0) return null

  const min = Math.min(...alcoholContents)
  const max = Math.max(...alcoholContents)

  return {
    min,
    max,
    display: min === max ? `${min}%` : `${min}% - ${max}%`
  }
}