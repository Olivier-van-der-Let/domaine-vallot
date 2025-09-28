import { NextRequest, NextResponse } from 'next/server'
import { calculateWineShipping } from '@/lib/sendcloud/client'
import { shippingRateSchema, validateSchema } from '@/lib/validators/schemas'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = validateSchema(shippingRateSchema, body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid shipping rate request', details: validation.errors },
        { status: 400 }
      )
    }

    const { destination, items, totalValue } = validation.data

    // Calculate total bottles
    const totalBottles = items.reduce((sum, item) => sum + item.quantity, 0)

    const shippingRates = await calculateWineShipping(
      {
        name: 'Customer',
        address: destination.city,
        city: destination.city,
        postal_code: destination.postalCode,
        country: destination.country
      },
      totalBottles,
      totalValue
    )

    const formattedRates = shippingRates.map(rate => {
      // Ensure complete characteristics structure for shipping rates
      const characteristics = rate.shipping_method.characteristics || {}
      const carrierCode = rate.shipping_method.carrier || 'unknown'

      return {
        id: rate.shipping_method.id,
        name: rate.shipping_method.name,
        carrier: carrierCode,
        price: rate.price,
        price_display: (rate.price / 100).toFixed(2),
        currency: rate.currency,
        delivery_time: rate.delivery_time,
        service_point_required: rate.service_point_required,
        characteristics: {
          id: rate.shipping_method.id || `${carrierCode}-${rate.shipping_method.name}`,
          name: rate.shipping_method.name,
          carrier: carrierCode,
          service_code: rate.shipping_method.id?.toString() || carrierCode,
          delivery_type: rate.service_point_required ? 'service_point' : 'home_delivery',
          is_tracked: characteristics.is_tracked ?? true, // Default to true for wine shipping
          requires_signature: characteristics.requires_signature ?? false,
          is_express: characteristics.is_express ?? false,
          insurance: 0,
          restrictions: ['age_verification_required']
        }
      }
    })

    return NextResponse.json({
      rates: formattedRates,
      destination,
      package_info: {
        total_bottles: totalBottles,
        estimated_weight: totalBottles * 750 + 200
      }
    })

  } catch (error) {
    console.error('Shipping calculation error:', error)
    return NextResponse.json(
      { error: 'Shipping calculation failed' },
      { status: 500 }
    )
  }
}