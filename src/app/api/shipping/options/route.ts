import { NextRequest, NextResponse } from 'next/server'
import { getSendcloudClient } from '@/lib/sendcloud/client'
import { shippingRateSchema, validateSchema } from '@/lib/validators/schemas'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = validateSchema(shippingRateSchema, body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid shipping options request', details: validation.errors },
        { status: 400 }
      )
    }

    const { destination, items, totalValue } = validation.data

    // Calculate total bottles and weight
    const totalBottles = items.reduce((sum, item) => sum + item.quantity, 0)
    const bottleWeight = 750 // grams per bottle
    const packagingWeight = Math.max(200, totalBottles * 50) // Base packaging + per bottle
    const totalWeight = (totalBottles * bottleWeight) + packagingWeight

    // Default origin (assuming French winery)
    const origin = {
      country: 'FR',
      postal_code: '21000' // Dijon, Burgundy
    }

    // Package dimensions based on bottle count
    const packageInfo = {
      weight: totalWeight,
      value: totalValue,
      length: totalBottles <= 6 ? 35 : 45, // cm
      width: totalBottles <= 6 ? 25 : 35,  // cm
      height: totalBottles <= 6 ? 30 : 35  // cm
    }

    const sendcloudClient = getSendcloudClient()
    const carriers = await sendcloudClient.getAvailableCarriers(
      origin,
      {
        country: destination.country,
        postal_code: destination.postalCode
      },
      packageInfo
    )

    // Format response with carrier options and pricing
    const formattedCarriers = carriers.map(carrier => ({
      code: carrier.code,
      name: carrier.name,
      shipping_options: carrier.shipping_options.map(option => ({
        code: option.code,
        name: option.product.name,
        carrier_code: option.carrier.code,
        carrier_name: option.carrier.name,
        // Extract price from quotes if available, otherwise use a default estimation method
        price: option.quotes && option.quotes.length > 0
          ? Math.round(option.quotes[0].price.value * 100) // Convert to cents
          : estimateShippingPrice(option, totalWeight, destination.country),
        currency: option.quotes && option.quotes.length > 0
          ? option.quotes[0].price.currency
          : 'EUR',
        price_display: option.quotes && option.quotes.length > 0
          ? option.quotes[0].price.value.toFixed(2)
          : (estimateShippingPrice(option, totalWeight, destination.country) / 100).toFixed(2),
        delivery_time: option.quotes && option.quotes.length > 0
          ? option.quotes[0].delivery_time
          : estimateDeliveryTime(option),
        service_point_required: option.functionalities.last_mile === 'service_point',
        characteristics: {
          is_tracked: option.functionalities.tracked,
          requires_signature: option.functionalities.signature,
          is_express: option.functionalities.delivery_deadline === 'express',
          insurance: option.functionalities.insurance,
          last_mile: option.functionalities.last_mile
        },
        weight_range: {
          min: parseFloat(option.weight.min.value),
          max: parseFloat(option.weight.max.value),
          unit: option.weight.min.unit
        }
      }))
    }))

    return NextResponse.json({
      carriers: formattedCarriers,
      destination,
      package_info: {
        total_bottles: totalBottles,
        estimated_weight: totalWeight,
        dimensions: packageInfo
      },
      origin
    })

  } catch (error) {
    console.error('Shipping options calculation error:', error)
    return NextResponse.json(
      { error: 'Shipping options calculation failed' },
      { status: 500 }
    )
  }
}

/**
 * Estimate shipping price when not provided by quotes
 */
function estimateShippingPrice(option: any, weight: number, destinationCountry: string): number {
  // Base price estimation in cents
  let basePrice = 500 // €5.00 base

  // Weight-based pricing (per kg over 1kg)
  const weightInKg = weight / 1000
  if (weightInKg > 1) {
    basePrice += Math.round((weightInKg - 1) * 200) // €2.00 per additional kg
  }

  // Country-based adjustments
  const euCountries = ['FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'LU']
  if (!euCountries.includes(destinationCountry.toUpperCase())) {
    basePrice += 1000 // €10.00 extra for non-EU
  }

  // Service type adjustments
  if (option.functionalities.signature) {
    basePrice += 300 // €3.00 for signature required
  }

  if (option.functionalities.delivery_deadline === 'express') {
    basePrice += 500 // €5.00 for express delivery
  }

  if (option.functionalities.last_mile === 'service_point') {
    basePrice -= 200 // €2.00 discount for service point delivery
  }

  return basePrice
}

/**
 * Estimate delivery time when not provided
 */
function estimateDeliveryTime(option: any): string {
  if (option.functionalities.delivery_deadline === 'express') {
    return '1-2 business days'
  }

  if (option.functionalities.service_area === 'domestic') {
    return '2-3 business days'
  }

  return '3-5 business days'
}