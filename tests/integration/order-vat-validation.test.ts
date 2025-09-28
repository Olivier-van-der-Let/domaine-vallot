import { createOrder } from '@/lib/supabase/server'
import { calculateVat } from '@/lib/vat/calculator'

describe('Order VAT Validation Integration Tests', () => {
  // Mock user ID for testing
  const mockUserId = '550e8400-e29b-41d4-a716-446655440000'

  describe('Database VAT validation', () => {
    test('should reproduce VAT mismatch error when storing cents as euros', async () => {
      // Reproduce the exact scenario from the error logs
      const subtotalInCents = 7650 // €76.50
      const shippingInCents = 0

      // Frontend VAT calculation (correct)
      const vatCalculation = calculateVat({
        amount: subtotalInCents,
        shipping_amount: shippingInCents,
        country_code: 'NL',
        customer_type: 'consumer'
      })

      // This is the INCORRECT data that causes the error
      // (storing cents as euros without conversion)
      const incorrectOrderData = {
        customer_id: mockUserId,
        shipping_address: {
          street: '123 Test Street',
          city: 'Amsterdam',
          postal_code: '1000 AA',
          country: 'NL'
        },
        items: [
          {
            product_id: '550e8400-e29b-41d4-a716-446655440001',
            quantity: 1,
            unit_price: subtotalInCents // This should be converted to euros
          }
        ],
        subtotal: subtotalInCents, // ❌ 7650 stored as 7650.00 EUR instead of 76.50 EUR
        vat_amount: vatCalculation.vat_amount, // ❌ 1607 stored as 1607.00 EUR instead of 16.07 EUR
        vat_rate: vatCalculation.vat_rate, // ✅ 0.21 correctly converted to 21.00%
        shipping_cost: shippingInCents, // ❌ Should be converted to euros
        total_amount: vatCalculation.total_amount, // ❌ Should be converted to euros
        payment_method: 'mollie',
        status: 'pending'
      }

      // This should throw a VAT validation error from the database trigger
      await expect(createOrder(incorrectOrderData)).rejects.toThrow(/VAT amount mismatch/)
    })

    test('should pass validation when amounts are correctly converted to euros', async () => {
      // Reproduce the scenario with CORRECT data conversion
      const subtotalInCents = 7650 // €76.50
      const shippingInCents = 0

      // Frontend VAT calculation
      const vatCalculation = calculateVat({
        amount: subtotalInCents,
        shipping_amount: shippingInCents,
        country_code: 'NL',
        customer_type: 'consumer'
      })

      // This is the CORRECT data that should pass validation
      // (converting cents to euros before storage)
      const correctOrderData = {
        customer_id: mockUserId,
        shipping_address: {
          street: '123 Test Street',
          city: 'Amsterdam',
          postal_code: '1000 AA',
          country: 'NL'
        },
        items: [
          {
            product_id: '550e8400-e29b-41d4-a716-446655440001',
            quantity: 1,
            unit_price: subtotalInCents / 100 // ✅ Convert cents to euros: 7650 → 76.50
          }
        ],
        subtotal: subtotalInCents / 100, // ✅ Convert: 7650 → 76.50 EUR
        vat_amount: vatCalculation.vat_amount / 100, // ✅ Convert: 1607 → 16.07 EUR
        vat_rate: vatCalculation.vat_rate, // ✅ 0.21 correctly converted to 21.00%
        shipping_cost: shippingInCents / 100, // ✅ Convert: 0 → 0.00 EUR
        total_amount: vatCalculation.total_amount / 100, // ✅ Convert: 9257 → 92.57 EUR
        payment_method: 'mollie',
        status: 'pending'
      }

      // This should NOT throw an error and should successfully create the order
      const result = await createOrder(correctOrderData)
      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
    })

    test('should handle multiple items with correct VAT calculation', async () => {
      const items = [
        { product_id: '550e8400-e29b-41d4-a716-446655440001', quantity: 2, unit_price: 1250 }, // 2x €12.50
        { product_id: '550e8400-e29b-41d4-a716-446655440002', quantity: 1, unit_price: 1800 }, // 1x €18.00
      ]

      const subtotalInCents = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) // 4300 cents = €43.00
      const shippingInCents = 950 // €9.50

      const vatCalculation = calculateVat({
        amount: subtotalInCents,
        shipping_amount: shippingInCents,
        country_code: 'FR', // France 20% VAT
        customer_type: 'consumer'
      })

      const orderData = {
        customer_id: mockUserId,
        shipping_address: {
          street: '123 Rue de Test',
          city: 'Paris',
          postal_code: '75001',
          country: 'FR'
        },
        items: items.map(item => ({
          ...item,
          unit_price: item.unit_price / 100 // Convert to euros
        })),
        subtotal: subtotalInCents / 100, // 43.00 EUR
        vat_amount: vatCalculation.vat_amount / 100, // Convert cents to euros
        vat_rate: vatCalculation.vat_rate, // 0.20 → 20.00%
        shipping_cost: shippingInCents / 100, // 9.50 EUR
        total_amount: vatCalculation.total_amount / 100, // Convert cents to euros
        payment_method: 'mollie',
        status: 'pending'
      }

      const result = await createOrder(orderData)
      expect(result).toBeDefined()
      expect(result.id).toBeDefined()

      // Verify the stored amounts match expected values
      expect(result.subtotal_eur).toBe(43.00)
      expect(result.vat_rate).toBe(20.00) // France VAT rate
      expect(result.shipping_cost_eur).toBe(9.50)
    })
  })

  describe('Edge cases', () => {
    test('should handle rounding differences within tolerance', async () => {
      // Test with amounts that might have rounding differences
      const subtotalInCents = 3333 // €33.33
      const shippingInCents = 0

      const vatCalculation = calculateVat({
        amount: subtotalInCents,
        shipping_amount: shippingInCents,
        country_code: 'NL', // 21% VAT
        customer_type: 'consumer'
      })

      const orderData = {
        customer_id: mockUserId,
        shipping_address: {
          street: '123 Test Street',
          city: 'Amsterdam',
          postal_code: '1000 AA',
          country: 'NL'
        },
        items: [
          {
            product_id: '550e8400-e29b-41d4-a716-446655440001',
            quantity: 1,
            unit_price: subtotalInCents / 100
          }
        ],
        subtotal: subtotalInCents / 100, // 33.33 EUR
        vat_amount: vatCalculation.vat_amount / 100, // Convert to euros
        vat_rate: vatCalculation.vat_rate,
        shipping_cost: shippingInCents / 100,
        total_amount: vatCalculation.total_amount / 100,
        payment_method: 'mollie',
        status: 'pending'
      }

      // Should handle small rounding differences
      const result = await createOrder(orderData)
      expect(result).toBeDefined()
    })
  })
})