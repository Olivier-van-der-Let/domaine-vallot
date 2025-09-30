import { NextRequest, NextResponse } from 'next/server'
import { getServerUser, createOrder, updateOrder, getCartItems, removeFromCart } from '@/lib/supabase/server'
import { orderSchema, validateSchema } from '@/lib/validators/schemas'
import { calculateVat } from '@/lib/vat/calculator'
import { createWinePayment } from '@/lib/mollie/client'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getServerUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()

    // 🔍 DEBUG: Log incoming order data
    console.log('📦 Orders API - Received payload:', {
      subtotal: body.subtotal,
      vatAmount: body.vatAmount,
      shippingCost: body.shippingCost,
      totalAmount: body.totalAmount,
      items: body.items?.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      })),
      customerEmail: body.customerEmail
    })

    const validation = validateSchema(orderSchema, body)

    if (!validation.success) {
      console.error('❌ Schema validation failed:', validation.errors)
      return NextResponse.json(
        { error: 'Invalid order data', details: validation.errors },
        { status: 400 }
      )
    }

    const orderData = validation.data

    // Get current cart items
    const cartItems = await getCartItems(user.id)

    if (cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      )
    }

    // Validate stock availability
    const stockIssues = cartItems.filter(item =>
      item.wine_products.stock_quantity < item.quantity ||
      !item.wine_products.is_active
    )

    if (stockIssues.length > 0) {
      return NextResponse.json({
        error: 'Stock issues found',
        issues: stockIssues.map(item => ({
          product_id: item.product_id,
          product_name: item.wine_products.name,
          requested: item.quantity,
          available: item.wine_products.stock_quantity,
          is_active: item.wine_products.is_active
        }))
      }, { status: 409 })
    }

    // Calculate order totals
    console.log('🛒 Backend cart items for calculation:', cartItems.map(item => ({
      product_id: item.product_id,
      product_name: item.wine_products?.name,
      quantity: item.quantity,
      price_eur_from_db: item.wine_products?.price_eur,
      price_from_db: item.wine_products?.price,
      price_eur_type: typeof item.wine_products?.price_eur,
      using_price_eur: true // Now using price_eur field like cart API
    })))

    const orderItems = cartItems.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.wine_products.price_eur // Use same field as cart API
    }))

    console.log('💰 Backend order items for calculation:', orderItems)

    // Calculate subtotal in cents to match frontend calculation
    const subtotal = orderItems.reduce(
      (sum, item) => sum + (item.quantity * Math.round(item.unit_price * 100)),
      0
    )

    console.log('🧮 Backend calculated subtotal (in cents):', subtotal)
    console.log('🔧 VAT calculation fix applied - backend now calculates in cents')

    // Calculate shipping cost based on selected shipping option
    let shippingCost = 0

    // Use the selected shipping option price if provided
    if (orderData.shipping_option && orderData.shipping_option.price) {
      shippingCost = orderData.shipping_option.price
      console.log('📦 Using selected shipping option:', {
        carrier: orderData.shipping_option.carrier_name,
        option: orderData.shipping_option.option_name,
        price: shippingCost
      })
    } else {
      // Fallback to calculating shipping rates
      console.log('⚠️ No shipping option provided, calculating shipping rates')
      const totalBottles = orderItems.reduce((sum, item) => sum + item.quantity, 0)
      const shippingRates = await calculateWineShipping(
        orderData.shippingAddress,
        totalBottles,
        subtotal / 100 // Convert cents back to euros for shipping calculation
      )
      shippingCost = shippingRates.length > 0 ? shippingRates[0].price : 0
    }

    // Calculate VAT
    const vatCalculation = calculateVat({
      amount: subtotal,
      shipping_amount: shippingCost,
      country_code: orderData.shippingAddress.country,
      customer_type: 'consumer'
    })

    const totalAmount = vatCalculation.total_amount

    console.log('💰 Order total calculation:', {
      subtotal,
      shippingCost,
      vatAmount: vatCalculation.vat_amount,
      totalAmount,
      providedTotal: orderData.totalAmount
    })

    // Validate calculated totals match provided totals (prevent tampering)
    const toleranceInCents = 10 // Allow 10 cent tolerance for rounding

    // 🔍 DEBUG: Detailed comparison logging
    const subtotalDiff = Math.abs(orderData.subtotal - subtotal)
    const vatDiff = Math.abs(orderData.vatAmount - vatCalculation.vat_amount)
    const shippingDiff = Math.abs(orderData.shippingCost - shippingCost)
    const totalDiff = Math.abs(orderData.totalAmount - totalAmount)

    console.log('🧮 Validation comparison (all amounts in cents):', {
      subtotal: { provided: orderData.subtotal, calculated: subtotal, diff: subtotalDiff, exceeds: subtotalDiff > toleranceInCents },
      vat: { provided: orderData.vatAmount, calculated: vatCalculation.vat_amount, diff: vatDiff, exceeds: vatDiff > toleranceInCents },
      shipping: { provided: orderData.shippingCost, calculated: shippingCost, diff: shippingDiff, exceeds: shippingDiff > toleranceInCents },
      total: { provided: orderData.totalAmount, calculated: totalAmount, diff: totalDiff, exceeds: totalDiff > toleranceInCents },
      tolerance: toleranceInCents
    })

    if (
      subtotalDiff > toleranceInCents ||
      vatDiff > toleranceInCents ||
      shippingDiff > toleranceInCents ||
      totalDiff > toleranceInCents
    ) {
      return NextResponse.json({
        error: 'Order total mismatch',
        calculated: {
          subtotal,
          vatAmount: vatCalculation.vat_amount,
          shippingCost,
          totalAmount
        },
        provided: {
          subtotal: orderData.subtotal,
          vatAmount: orderData.vatAmount,
          shippingCost: orderData.shippingCost,
          totalAmount: orderData.totalAmount
        },
        debug: {
          differences: {
            subtotal: subtotalDiff,
            vat: vatDiff,
            shipping: shippingDiff,
            total: totalDiff
          },
          tolerance: toleranceInCents,
          note: 'All amounts compared in cents before euro conversion'
        }
      }, { status: 400 })
    }

    // Convert amounts from cents to euros for database storage
    // The frontend calculates in cents, but the database expects euros
    console.log('💰 Converting amounts from cents to euros for database storage:', {
      subtotal_cents: subtotal,
      subtotal_euros: subtotal / 100,
      vat_amount_cents: vatCalculation.vat_amount,
      vat_amount_euros: vatCalculation.vat_amount / 100,
      shipping_cost_cents: shippingCost,
      shipping_cost_euros: shippingCost / 100,
      total_amount_cents: totalAmount,
      total_amount_euros: totalAmount / 100,
      vat_rate_decimal: vatCalculation.vat_rate,
      vat_rate_percentage: vatCalculation.vat_rate * 100
    })


    // Generate shipping_method from shipping_option for database requirement
    let shippingMethod = 'Standard shipping' // Default fallback

    // More robust shipping method generation with proper validation
    if (orderData.shipping_option) {
      const option = orderData.shipping_option
      if (option.carrier_name && typeof option.carrier_name === 'string' && option.carrier_name.trim()) {
        const carrier = option.carrier_name.trim()
        const service = (option.option_name || option.service || 'standard').toString().trim()
        shippingMethod = `${carrier} - ${service}`
      } else if (option.name && typeof option.name === 'string' && option.name.trim()) {
        // Fallback to option name if carrier name is not available
        shippingMethod = option.name.trim()
      }
    }

    // Ensure shipping_method is never empty or null
    if (!shippingMethod || shippingMethod.trim() === '') {
      shippingMethod = 'Standard shipping'
    }

    console.log('🚚 Shipping method generated:', {
      shipping_option: orderData.shipping_option,
      shipping_method: shippingMethod,
      is_fallback: shippingMethod === 'Standard shipping'
    })

    // Create order in database with product snapshots
    const order = await createOrder({
      customer_id: user.id,
      shipping_address: orderData.shippingAddress,
      billing_address: orderData.billingAddress,
      shipping_option: orderData.shipping_option, // Pass validated shipping option
      items: orderItems.map(item => {
        // Find the corresponding cart item to get product details for snapshot
        const cartItem = cartItems.find(ci => ci.product_id === item.product_id)
        const product = cartItem?.wine_products

        if (!product) {
          console.error(`❌ Product snapshot error: Product not found for item ${item.product_id}`)
          throw new Error(`Product not found for item ${item.product_id}`)
        }

        console.log(`📸 Creating product snapshot for ${product.name} (${product.sku})`, {
          product_id: item.product_id,
          price_eur: product.price_eur,
          order_price: item.unit_price / 100
        })

        // Create immutable product snapshot at time of order
        const productSnapshot = {
          id: product.id,
          sku: product.sku,
          name: product.name,
          vintage: product.vintage,
          varietal: product.varietal,
          region: product.region,
          price_eur: product.price_eur,
          alcohol_content: product.alcohol_content,
          volume_ml: product.volume_ml,
          description_en: product.description_en,
          description_fr: product.description_fr,
          organic_certified: product.organic_certified,
          biodynamic_certified: product.biodynamic_certified,
          vegan_friendly: product.vegan_friendly,
          // Add image URL from product_images if available
          image_url: product.product_images && product.product_images.length > 0
            ? product.product_images[0].url
            : null,
          // Store the exact price used for this order
          order_price_eur: item.unit_price / 100,
          snapshot_created_at: new Date().toISOString()
        }

        return {
          ...item,
          unit_price: item.unit_price / 100, // Convert unit prices from cents to euros
          product_snapshot: productSnapshot
        }
      }),
      subtotal: subtotal / 100, // Convert from cents to euros
      vat_amount: vatCalculation.vat_amount / 100, // Convert from cents to euros
      vat_rate: vatCalculation.vat_rate, // Keep as decimal (0.21) - will be converted to percentage in createOrder
      shipping_cost: shippingCost / 100, // Convert from cents to euros
      total_amount: totalAmount / 100, // Convert from cents to euros
      payment_method: orderData.paymentMethod,
      shipping_method: shippingMethod, // Add required shipping_method field
      status: 'pending'
    })

    // Create payment with Mollie
    let paymentUrl = null
    try {
      const payment = await createWinePayment({
        orderId: order.id,
        amount: totalAmount,
        customerEmail: orderData.customerEmail,
        customerName: `${orderData.customerFirstName} ${orderData.customerLastName}`,
        description: `Wine order ${order.id.substring(0, 8)}`,
        locale: request.headers.get('accept-language')?.includes('fr') ? 'fr_FR' : 'en_US'
      })

      paymentUrl = payment.links.checkout
    } catch (paymentError) {
      console.error('Payment creation failed:', paymentError)

      // Return order info but indicate payment issue
      return NextResponse.json({
        order: {
          id: order.id,
          status: 'payment_failed',
          total_amount: totalAmount,
          currency: 'EUR'
        },
        error: 'Payment processing failed',
        details: 'Please try again or contact support'
      }, { status: 402 })
    }

    console.log(`✅ [${order.id}] Order created successfully, payment initiated`)

    // Clear cart after successful order creation
    try {
      for (const item of cartItems) {
        await removeFromCart(user.id, item.id)
      }
    } catch (cartError) {
      console.error('Failed to clear cart:', cartError)
      // Don't fail the order for cart clearing issues
    }

    // Format order response
    const orderResponse = {
      id: order.id,
      order_number: order.id.substring(0, 8).toUpperCase(),
      status: order.status,
      created_at: order.created_at,

      customer: {
        email: orderData.customerEmail,
        first_name: orderData.customerFirstName,
        last_name: orderData.customerLastName
      },

      addresses: {
        shipping: order.shipping_address,
        billing: order.billing_address
      },

      items: orderItems.map(item => {
        const product = cartItems.find(ci => ci.product_id === item.product_id)?.wine_products
        return {
          product_id: item.product_id,
          product_name: product?.name,
          product_sku: product?.sku,
          quantity: item.quantity,
          unit_price: item.unit_price,
          unit_price_display: (item.unit_price / 100).toFixed(2),
          total_price: item.quantity * item.unit_price,
          total_price_display: ((item.quantity * item.unit_price) / 100).toFixed(2)
        }
      }),

      totals: {
        subtotal,
        subtotal_display: (subtotal / 100).toFixed(2),
        vat_amount: vatCalculation.vat_amount,
        vat_amount_display: (vatCalculation.vat_amount / 100).toFixed(2),
        vat_rate: vatCalculation.vat_rate,
        vat_rate_display: `${(vatCalculation.vat_rate * 100).toFixed(0)}%`,
        shipping_cost: shippingCost,
        shipping_cost_display: (shippingCost / 100).toFixed(2),
        total_amount: totalAmount,
        total_amount_display: (totalAmount / 100).toFixed(2),
        currency: 'EUR'
      },

      vat_details: {
        country: vatCalculation.country,
        country_code: vatCalculation.country_code,
        is_reverse_charge: vatCalculation.is_reverse_charge,
        breakdown: vatCalculation.breakdown
      },

      payment: {
        method: orderData.paymentMethod,
        status: 'pending',
        payment_url: paymentUrl,
        instructions: paymentUrl
          ? 'Complete your payment using the provided link'
          : 'Payment processing failed - please contact support'
      },

      shipping: {
        method: shippingMethod,
        carrier: orderData.shipping_option?.carrier_name || null,
        service: orderData.shipping_option?.option_name || null,
        status: 'pending_manual_processing',
        note: 'Shipping labels must be generated manually'
      },

      next_steps: [
        'Complete payment using the provided link',
        'You will receive an email confirmation',
        'Track your order status in your account',
        'Prepare valid ID for age verification upon delivery'
      ]
    }

    return NextResponse.json({
      message: 'Order created successfully',
      order: orderResponse
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating order:', error)

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('stock')) {
        return NextResponse.json(
          { error: 'Insufficient stock for one or more items' },
          { status: 409 }
        )
      }

      if (error.message.includes('payment')) {
        return NextResponse.json(
          { error: 'Payment processing failed' },
          { status: 402 }
        )
      }

      if (error.message.includes('shipping')) {
        return NextResponse.json(
          { error: 'Shipping calculation failed' },
          { status: 400 }
        )
      }

      if (error.message.includes('vat')) {
        return NextResponse.json(
          { error: 'VAT calculation failed' },
          { status: 400 }
        )
      }

      if (error.message.includes('Product not found')) {
        return NextResponse.json(
          { error: 'Invalid product in cart', details: error.message },
          { status: 400 }
        )
      }

      if (error.message.includes('product_snapshot')) {
        return NextResponse.json(
          { error: 'Product snapshot creation failed', details: error.message },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}