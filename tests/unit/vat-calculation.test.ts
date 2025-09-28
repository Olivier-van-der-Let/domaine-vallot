import { calculateVat } from '@/lib/vat/calculator'

describe('VAT Calculation Tests', () => {
  describe('Basic VAT calculation', () => {
    test('should calculate 21% VAT for Netherlands correctly', () => {
      // Test case matching the error: subtotal €76.50, 21% VAT
      const input = {
        amount: 7650, // €76.50 in cents
        shipping_amount: 0,
        country_code: 'NL',
        customer_type: 'consumer' as const
      }

      const result = calculateVat(input)

      expect(result.base_amount).toBe(7650)
      expect(result.vat_rate).toBe(0.21)
      expect(result.vat_amount).toBe(1607) // Math.round(7650 * 0.21) = 1607 cents
      expect(result.total_amount).toBe(9257) // 7650 + 1607 = 9257 cents
      expect(result.country_code).toBe('NL')
    })

    test('should handle Belgium VAT rate', () => {
      const input = {
        amount: 7650, // €76.50 in cents
        shipping_amount: 0,
        country_code: 'BE',
        customer_type: 'consumer' as const
      }

      const result = calculateVat(input)

      expect(result.vat_rate).toBe(0.21) // Belgium also uses 21%
      expect(result.vat_amount).toBe(1607) // Math.round(7650 * 0.21) = 1607 cents
    })

    test('should calculate VAT with shipping', () => {
      const input = {
        amount: 7650, // €76.50 in cents
        shipping_amount: 950, // €9.50 in cents
        country_code: 'NL',
        customer_type: 'consumer' as const
      }

      const result = calculateVat(input)

      expect(result.base_amount).toBe(7650)
      expect(result.shipping_amount).toBe(950)
      expect(result.vat_rate).toBe(0.21)

      // VAT should be calculated on both product and shipping
      const expectedProductVat = Math.round(7650 * 0.21) // 1607 cents
      const expectedShippingVat = Math.round(950 * 0.21) // 200 cents
      const expectedTotalVat = expectedProductVat + expectedShippingVat // 1807 cents

      expect(result.breakdown.product_vat).toBe(expectedProductVat)
      expect(result.breakdown.shipping_vat).toBe(expectedShippingVat)
      expect(result.vat_amount).toBe(expectedTotalVat)
      expect(result.total_amount).toBe(7650 + 950 + expectedTotalVat) // 10407 cents
    })
  })

  describe('Edge cases', () => {
    test('should handle zero amounts', () => {
      const input = {
        amount: 0,
        shipping_amount: 0,
        country_code: 'NL',
        customer_type: 'consumer' as const
      }

      const result = calculateVat(input)

      expect(result.vat_amount).toBe(0)
      expect(result.total_amount).toBe(0)
    })

    test('should handle reverse charge for B2B EU transactions', () => {
      const input = {
        amount: 7650,
        shipping_amount: 0,
        country_code: 'DE', // Different EU country
        customer_type: 'business' as const,
        business_vat_number: 'DE123456789'
      }

      const result = calculateVat(input)

      expect(result.is_reverse_charge).toBe(true)
      expect(result.vat_amount).toBe(0) // No VAT charged due to reverse charge
      expect(result.total_amount).toBe(7650) // Only base amount
    })

    test('should charge VAT for same-country B2B transactions', () => {
      const input = {
        amount: 7650,
        shipping_amount: 0,
        country_code: 'FR', // Same as seller country
        customer_type: 'business' as const,
        business_vat_number: 'FR123456789'
      }

      const result = calculateVat(input)

      expect(result.is_reverse_charge).toBe(false)
      expect(result.vat_amount).toBe(Math.round(7650 * 0.20)) // France 20% VAT
      expect(result.country_code).toBe('FR')
    })

    test('should handle non-EU countries', () => {
      const input = {
        amount: 7650,
        shipping_amount: 0,
        country_code: 'US',
        customer_type: 'consumer' as const
      }

      const result = calculateVat(input)

      expect(result.vat_amount).toBe(0) // No VAT for non-EU
      expect(result.total_amount).toBe(7650)
      expect(result.is_reverse_charge).toBe(false)
    })
  })

  describe('Specific error reproduction', () => {
    test('should reproduce the exact error case: VAT 314.00 vs expected 16.065', () => {
      // This test reproduces the exact error from the logs
      const input = {
        amount: 7650, // €76.50 in cents (frontend calculation)
        shipping_amount: 0,
        country_code: 'NL', // Netherlands 21% VAT
        customer_type: 'consumer' as const
      }

      const result = calculateVat(input)

      // Frontend calculation (correct in cents)
      expect(result.vat_amount).toBe(1607) // Math.round(7650 * 0.21) = 1607 cents = €16.07

      // Database validation expects euros but receives cents stored as euros
      // The issue: 1607 cents stored as 1607.00 euros, then validated against:
      // 76.50 * 21.00 / 100 = 16.065 euros

      // The fix should convert cents to euros before storage:
      const vatAmountInEuros = result.vat_amount / 100 // 1607 / 100 = 16.07 euros
      const subtotalInEuros = result.base_amount / 100 // 7650 / 100 = 76.50 euros
      const expectedVatInEuros = subtotalInEuros * 0.21 // 76.50 * 0.21 = 16.065 euros

      expect(Math.abs(vatAmountInEuros - expectedVatInEuros)).toBeLessThan(0.01)
    })
  })
})