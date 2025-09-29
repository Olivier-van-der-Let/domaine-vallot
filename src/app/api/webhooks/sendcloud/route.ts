import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/server'
import { getSendcloudClient } from '@/lib/sendcloud/client'
import {
  sendShipmentNotification,
  sendDeliveryNotification,
  sendExceptionNotification,
  sendAdminExceptionNotification
} from '@/lib/email/client'
import { createHash } from 'crypto'

export async function POST(request: NextRequest) {
  let requestId = ''

  try {
    // Generate request ID for tracing
    requestId = createHash('sha256').update(`${Date.now()}-${Math.random()}`).digest('hex').substring(0, 8)

    const body = await request.text()
    const data = JSON.parse(body)

    // Verify webhook signature (if available)
    const signature = request.headers.get('x-sendcloud-signature') || ''
    if (!getSendcloudClient().verifyWebhookSignature(body, signature)) {
      console.error('Invalid Sendcloud webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Log webhook for debugging
    console.log(`🔔 [${requestId}] Sendcloud webhook received:`, {
      action: data.action,
      timestamp: data.timestamp,
      parcel_id: data.parcel?.id
    })

    // Handle different webhook actions
    switch (data.action) {
      case 'parcel_status_changed':
        await handleParcelStatusChanged(data, requestId)
        break

      case 'parcel_shipped':
        await handleParcelShipped(data, requestId)
        break

      case 'parcel_delivered':
        await handleParcelDelivered(data, requestId)
        break

      case 'parcel_exception':
        await handleParcelException(data, requestId)
        break

      default:
        console.log(`⚠️ [${requestId}] Unhandled Sendcloud webhook action: ${data.action}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error(`💥 [${requestId}] Sendcloud webhook error:`, error)
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        requestId,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function handleParcelStatusChanged(data: any, requestId: string) {
  const supabase = createRouteHandlerSupabaseClient()
  const parcel = data.parcel

  if (!parcel?.id) {
    console.error(`❌ [${requestId}] No parcel ID in webhook data`)
    return
  }

  try {
    // Update order with new Sendcloud status
    const { data: updatedOrders, error } = await supabase
      .from('orders')
      .update({
        sendcloud_status: parcel.status?.message || parcel.status?.id,
        sendcloud_tracking_number: parcel.tracking_number,
        sendcloud_tracking_url: parcel.tracking_url,
        sendcloud_carrier: parcel.carrier?.code || parcel.carrier,
        updated_at: new Date().toISOString()
      })
      .eq('sendcloud_parcel_id', parcel.id)
      .select('id, shipping_address, customers(email, first_name, last_name)')

    if (error) {
      console.error(`❌ [${requestId}] Failed to update order with Sendcloud status:`, error)
    } else {
      console.log(`✅ [${requestId}] Updated order status for parcel ${parcel.id}:`, parcel.status?.message)

      // Log status change for tracking
      if (updatedOrders && updatedOrders.length > 0) {
        const order = updatedOrders[0]
        console.log(`📊 [${requestId}] Status change tracked for order ${order.id}:`, {
          old_status: 'previous_status',
          new_status: parcel.status?.message,
          tracking_number: parcel.tracking_number
        })
      }
    }
  } catch (error) {
    console.error(`💥 [${requestId}] Error updating order with Sendcloud status:`, error)
  }
}

async function handleParcelShipped(data: any, requestId: string) {
  const supabase = createRouteHandlerSupabaseClient()
  const parcel = data.parcel

  if (!parcel?.id) {
    console.error(`❌ [${requestId}] No parcel ID in shipped webhook data`)
    return
  }

  try {
    // Update order status to shipped and get customer info
    const { data: updatedOrders, error } = await supabase
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
      .select('id, shipping_address, customers(email, first_name, last_name)')

    if (error) {
      console.error(`❌ [${requestId}] Failed to update order to shipped status:`, error)
    } else {
      console.log(`✅ [${requestId}] Marked order as shipped for parcel ${parcel.id}`)

      // Send customer notification email about shipment
      if (updatedOrders && updatedOrders.length > 0) {
        const order = updatedOrders[0]
        const customer = order.customers

        if (customer?.email) {
          console.log(`📧 [${requestId}] Sending shipment notification to ${customer.email}`)

          try {
            const emailResult = await sendShipmentNotification(customer.email, {
              customerName: `${customer.first_name} ${customer.last_name}`.trim(),
              orderNumber: order.id.substring(0, 8).toUpperCase(),
              trackingNumber: parcel.tracking_number,
              trackingUrl: parcel.tracking_url,
              carrier: parcel.carrier?.name || parcel.carrier?.code,
              estimatedDelivery: parcel.estimated_delivery
            })

            if (emailResult.success) {
              console.log(`✅ [${requestId}] Shipment notification sent successfully (${emailResult.messageId})`)
            } else {
              console.error(`❌ [${requestId}] Failed to send shipment notification:`, emailResult.error)
            }
          } catch (emailError) {
            console.error(`💥 [${requestId}] Error sending shipment notification:`, emailError)
          }
        } else {
          console.warn(`⚠️ [${requestId}] No customer email found for order ${order.id}`)
        }
      }
    }
  } catch (error) {
    console.error(`💥 [${requestId}] Error handling parcel shipped:`, error)
  }
}

async function handleParcelDelivered(data: any, requestId: string) {
  const supabase = createRouteHandlerSupabaseClient()
  const parcel = data.parcel

  if (!parcel?.id) {
    console.error(`❌ [${requestId}] No parcel ID in delivered webhook data`)
    return
  }

  try {
    const deliveredAt = new Date().toISOString()

    // Update order status to delivered and get customer info
    const { data: updatedOrders, error } = await supabase
      .from('orders')
      .update({
        status: 'delivered',
        sendcloud_status: 'delivered',
        delivered_at: deliveredAt,
        updated_at: deliveredAt
      })
      .eq('sendcloud_parcel_id', parcel.id)
      .select('id, shipping_address, customers(email, first_name, last_name)')

    if (error) {
      console.error(`❌ [${requestId}] Failed to update order to delivered status:`, error)
    } else {
      console.log(`✅ [${requestId}] Marked order as delivered for parcel ${parcel.id}`)

      // Send customer notification email about delivery
      if (updatedOrders && updatedOrders.length > 0) {
        const order = updatedOrders[0]
        const customer = order.customers

        if (customer?.email) {
          console.log(`📧 [${requestId}] Sending delivery notification to ${customer.email}`)

          try {
            const emailResult = await sendDeliveryNotification(customer.email, {
              customerName: `${customer.first_name} ${customer.last_name}`.trim(),
              orderNumber: order.id.substring(0, 8).toUpperCase(),
              deliveredAt: new Date(deliveredAt).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }),
              customerEmail: customer.email
            })

            if (emailResult.success) {
              console.log(`✅ [${requestId}] Delivery notification sent successfully (${emailResult.messageId})`)
            } else {
              console.error(`❌ [${requestId}] Failed to send delivery notification:`, emailResult.error)
            }
          } catch (emailError) {
            console.error(`💥 [${requestId}] Error sending delivery notification:`, emailError)
          }
        } else {
          console.warn(`⚠️ [${requestId}] No customer email found for order ${order.id}`)
        }
      }
    }
  } catch (error) {
    console.error(`💥 [${requestId}] Error handling parcel delivered:`, error)
  }
}

async function handleParcelException(data: any, requestId: string) {
  const supabase = createRouteHandlerSupabaseClient()
  const parcel = data.parcel

  if (!parcel?.id) {
    console.error(`❌ [${requestId}] No parcel ID in exception webhook data`)
    return
  }

  try {
    const exceptionMessage = parcel.status?.message || 'Unknown delivery issue'

    // Update order with exception status and get customer info
    const { data: updatedOrders, error } = await supabase
      .from('orders')
      .update({
        sendcloud_status: 'exception',
        fulfillment_notes: `Delivery exception: ${exceptionMessage}`,
        updated_at: new Date().toISOString()
      })
      .eq('sendcloud_parcel_id', parcel.id)
      .select('id, shipping_address, customers(email, first_name, last_name)')

    if (error) {
      console.error(`❌ [${requestId}] Failed to update order with exception status:`, error)
    } else {
      console.log(`⚠️ [${requestId}] Updated order with exception for parcel ${parcel.id}:`, parcel.status?.message)

      if (updatedOrders && updatedOrders.length > 0) {
        const order = updatedOrders[0]
        const customer = order.customers
        const supportEmail = process.env.SUPPORT_EMAIL || 'support@domainevallot.com'
        const adminEmail = process.env.ADMIN_EMAIL || supportEmail

        // Send customer notification about exception
        if (customer?.email) {
          console.log(`📧 [${requestId}] Sending exception notification to customer ${customer.email}`)

          try {
            const customerEmailResult = await sendExceptionNotification(customer.email, {
              customerName: `${customer.first_name} ${customer.last_name}`.trim(),
              orderNumber: order.id.substring(0, 8).toUpperCase(),
              exceptionMessage,
              trackingUrl: parcel.tracking_url,
              supportEmail
            })

            if (customerEmailResult.success) {
              console.log(`✅ [${requestId}] Customer exception notification sent (${customerEmailResult.messageId})`)
            } else {
              console.error(`❌ [${requestId}] Failed to send customer exception notification:`, customerEmailResult.error)
            }
          } catch (emailError) {
            console.error(`💥 [${requestId}] Error sending customer exception notification:`, emailError)
          }
        }

        // Send admin notification about delivery exception
        if (adminEmail && customer?.email) {
          console.log(`📧 [${requestId}] Sending admin exception notification to ${adminEmail}`)

          try {
            const adminEmailResult = await sendAdminExceptionNotification(adminEmail, {
              customerName: `${customer.first_name} ${customer.last_name}`.trim(),
              customerEmail: customer.email,
              orderNumber: order.id.substring(0, 8).toUpperCase(),
              exceptionMessage,
              trackingUrl: parcel.tracking_url,
              supportEmail
            })

            if (adminEmailResult.success) {
              console.log(`✅ [${requestId}] Admin exception notification sent (${adminEmailResult.messageId})`)
            } else {
              console.error(`❌ [${requestId}] Failed to send admin exception notification:`, adminEmailResult.error)
            }
          } catch (emailError) {
            console.error(`💥 [${requestId}] Error sending admin exception notification:`, emailError)
          }
        }
      }
    }
  } catch (error) {
    console.error(`💥 [${requestId}] Error handling parcel exception:`, error)
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