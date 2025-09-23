import { NextRequest, NextResponse } from 'next/server'
import { calculateVat } from '@/lib/vat/calculator'
import { vatCalculationSchema, validateSchema } from '@/lib/validators/schemas'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = validateSchema(vatCalculationSchema, body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid VAT calculation data', details: validation.errors },
        { status: 400 }
      )
    }

    const { amount, shippingAmount, country, customerType, vatNumber } = validation.data

    const vatCalculation = calculateVat({
      amount,
      shipping_amount: shippingAmount,
      country_code: country,
      customer_type: customerType,
      business_vat_number: vatNumber
    })

    return NextResponse.json({
      calculation: {
        ...vatCalculation,
        formatted: {
          base_amount: (vatCalculation.base_amount / 100).toFixed(2),
          vat_amount: (vatCalculation.vat_amount / 100).toFixed(2),
          total_amount: (vatCalculation.total_amount / 100).toFixed(2),
          vat_rate: `${(vatCalculation.vat_rate * 100).toFixed(0)}%`
        }
      }
    })

  } catch (error) {
    console.error('VAT calculation error:', error)
    return NextResponse.json(
      { error: 'VAT calculation failed' },
      { status: 500 }
    )
  }
}