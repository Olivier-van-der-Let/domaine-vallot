import { NextRequest, NextResponse } from 'next/server'
import { handlePaymentWebhook } from '@/lib/mollie/client'
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/server'

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
        console.info(`Sendcloud integration disabled: skipping fulfillment sync for order ${data.order_number}`)
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
