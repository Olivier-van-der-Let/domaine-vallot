import { calculateVat, VatCalculator } from '@/lib/vat/calculator'

describe('VAT Edge Cases and Regression Tests', () => {
  describe('Rounding scenarios', () => {
    test('should handle prices that result in fractional VAT amounts', () => {
      // Test case: €33.33 * 21% = €6.9993 → should round to €7.00
      const input = {
        amount: 3333, // €33.33 in cents
        shipping_amount: 0,
        country_code: 'NL',
        customer_type: 'consumer' as const
      }

      const result = calculateVat(input)

      expect(result.base_amount).toBe(3333)
      expect(result.vat_rate).toBe(0.21)
      expect(result.vat_amount).toBe(700) // Math.round(3333 * 0.21) = 700 cents = €7.00
      expect(result.total_amount).toBe(4033) // 3333 + 700 = 4033 cents
    })

    test('should handle very small amounts', () => {
      // Test case: €0.01 * 21% = €0.0021 → should round to €0.00
      const input = {
        amount: 1, // €0.01 in cents
        shipping_amount: 0,
        country_code: 'NL',
        customer_type: 'consumer' as const
      }

      const result = calculateVat(input)

      expect(result.vat_amount).toBe(0) // Math.round(1 * 0.21) = 0 cents
      expect(result.total_amount).toBe(1) // 1 + 0 = 1 cent
    })

    test('should handle large amounts', () => {
      // Test case: €999.99 * 21% = €209.9979 → should round to €210.00
      const input = {
        amount: 99999, // €999.99 in cents
        shipping_amount: 0,
        country_code: 'NL',
        customer_type: 'consumer' as const
      }

      const result = calculateVat(input)

      expect(result.vat_amount).toBe(21000) // Math.round(99999 * 0.21) = 21000 cents = €210.00
      expect(result.total_amount).toBe(120999) // 99999 + 21000 = 120999 cents
    })
  })

  describe('Different VAT rates', () => {
    test('should calculate 19% VAT for Germany', () => {
      const input = {
        amount: 5000, // €50.00
        shipping_amount: 0,
        country_code: 'DE',
        customer_type: 'consumer' as const
      }

      const result = calculateVat(input)

      expect(result.vat_rate).toBe(0.19)
      expect(result.vat_amount).toBe(950) // Math.round(5000 * 0.19) = 950 cents
      expect(result.country_code).toBe('DE')
    })

    test('should calculate 25% VAT for Denmark', () => {
      const input = {
        amount: 4000, // €40.00
        shipping_amount: 0,
        country_code: 'DK',
        customer_type: 'consumer' as const
      }

      const result = calculateVat(input)

      expect(result.vat_rate).toBe(0.25)
      expect(result.vat_amount).toBe(1000) // Math.round(4000 * 0.25) = 1000 cents
      expect(result.country_code).toBe('DK')
    })

    test('should calculate 17% VAT for Luxembourg', () => {
      const input = {
        amount: 6000, // €60.00
        shipping_amount: 0,
        country_code: 'LU',
        customer_type: 'consumer' as const
      }

      const result = calculateVat(input)

      expect(result.vat_rate).toBe(0.17)
      expect(result.vat_amount).toBe(1020) // Math.round(6000 * 0.17) = 1020 cents
      expect(result.country_code).toBe('LU')
    })
  })

  describe('Shipping VAT scenarios', () => {
    test('should apply VAT to both product and shipping for EU consumer', () => {
      const input = {
        amount: 5000, // €50.00 product
        shipping_amount: 1000, // €10.00 shipping
        country_code: 'NL',
        customer_type: 'consumer' as const
      }

      const result = calculateVat(input)

      const expectedProductVat = Math.round(5000 * 0.21) // 1050 cents
      const expectedShippingVat = Math.round(1000 * 0.21) // 210 cents
      const expectedTotalVat = expectedProductVat + expectedShippingVat // 1260 cents

      expect(result.breakdown.product_vat).toBe(expectedProductVat)
      expect(result.breakdown.shipping_vat).toBe(expectedShippingVat)
      expect(result.vat_amount).toBe(expectedTotalVat)
      expect(result.total_amount).toBe(5000 + 1000 + expectedTotalVat) // 7260 cents
    })

    test('should handle zero shipping cost', () => {
      const input = {
        amount: 3000, // €30.00
        shipping_amount: 0,
        country_code: 'FR',
        customer_type: 'consumer' as const
      }

      const result = calculateVat(input)

      expect(result.shipping_amount).toBe(0)
      expect(result.breakdown.shipping_vat).toBe(0)
      expect(result.breakdown.product_vat).toBe(Math.round(3000 * 0.20)) // France 20% VAT
    })
  })

  describe('Business VAT scenarios', () => {
    test('should apply reverse charge for valid EU B2B transaction', () => {
      const input = {
        amount: 10000, // €100.00
        shipping_amount: 500, // €5.00
        country_code: 'DE', // Different from seller (FR)
        customer_type: 'business' as const,
        business_vat_number: 'DE123456789'
      }

      const result = calculateVat(input)

      expect(result.is_reverse_charge).toBe(true)
      expect(result.vat_amount).toBe(0)
      expect(result.total_amount).toBe(10500) // Only base amount + shipping
      expect(result.exemption_reason).toBe('Reverse charge - B2B transaction')
    })

    test('should charge VAT for domestic B2B transaction (same country as seller)', () => {
      const input = {
        amount: 8000, // €80.00
        shipping_amount: 0,
        country_code: 'FR', // Same as seller
        customer_type: 'business' as const,
        business_vat_number: 'FR987654321'
      }

      const result = calculateVat(input)

      expect(result.is_reverse_charge).toBe(false)
      expect(result.vat_amount).toBe(Math.round(8000 * 0.20)) // France 20% VAT
      expect(result.country_code).toBe('FR')
    })

    test('should charge VAT for B2B without valid VAT number', () => {
      const input = {
        amount: 5000, // €50.00
        shipping_amount: 0,
        country_code: 'DE',
        customer_type: 'business' as const,
        business_vat_number: 'X' // Clearly invalid VAT number (too short)
      }

      const result = calculateVat(input)

      expect(result.is_reverse_charge).toBe(false)
      expect(result.vat_amount).toBe(Math.round(5000 * 0.19)) // Germany 19% VAT
    })
  })

  describe('Non-EU scenarios', () => {
    test('should not charge VAT for non-EU countries', () => {
      const countries = ['US', 'CA', 'JP', 'AU', 'CH'] // Non-EU countries

      countries.forEach(countryCode => {
        const input = {
          amount: 5000,
          shipping_amount: 1000,
          country_code: countryCode,
          customer_type: 'consumer' as const
        }

        const result = calculateVat(input)

        expect(result.vat_amount).toBe(0)
        expect(result.total_amount).toBe(6000) // Only base + shipping
        expect(result.is_reverse_charge).toBe(false)
        expect(result.country_code).toBe(countryCode)
      })
    })
  })

  describe('Custom VAT calculator with overrides', () => {
    test('should use custom VAT rates when provided', () => {
      const customRates = {
        'TEST': {
          country_code: 'TEST',
          country_name: 'Test Country',
          rate: 0.15, // 15% VAT
          is_eu_member: true,
          is_active: true
        }
      }

      const customCalculator = new VatCalculator(customRates)

      const input = {
        amount: 10000, // €100.00
        shipping_amount: 0,
        country_code: 'TEST',
        customer_type: 'consumer' as const
      }

      const result = customCalculator.calculateVat(input)

      expect(result.vat_rate).toBe(0.15)
      expect(result.vat_amount).toBe(1500) // 10000 * 0.15 = 1500 cents
      expect(result.country).toBe('Test Country')
    })
  })

  describe('Validation and error handling', () => {
    test('should handle unknown country codes gracefully', () => {
      const input = {
        amount: 5000,
        shipping_amount: 0,
        country_code: 'XX', // Unknown country
        customer_type: 'consumer' as const
      }

      const result = calculateVat(input)

      expect(result.vat_amount).toBe(0)
      expect(result.country).toBe('Unknown')
      expect(result.country_code).toBe('XX')
    })

    test('should handle case-insensitive country codes', () => {
      const input = {
        amount: 5000,
        shipping_amount: 0,
        country_code: 'nl', // Lowercase
        customer_type: 'consumer' as const
      }

      const result = calculateVat(input)

      expect(result.vat_rate).toBe(0.21)
      expect(result.country_code).toBe('NL') // Should be normalized to uppercase
    })
  })

  describe('Display formatting', () => {
    test('should format VAT amounts correctly', () => {
      const calculator = new VatCalculator()

      const formatted1607 = calculator.formatVatAmount(1607)
      const formatted0 = calculator.formatVatAmount(0)
      const formatted123456 = calculator.formatVatAmount(123456)

      // Check that the amounts are properly formatted with French locale
      expect(formatted1607).toContain('16,07')
      expect(formatted1607).toContain('€')

      expect(formatted0).toContain('0,00')
      expect(formatted0).toContain('€')

      expect(formatted123456).toMatch(/1.234,56/) // Allow for different space characters
      expect(formatted123456).toContain('€')
    })

    test('should format VAT rates correctly', () => {
      const calculator = new VatCalculator()

      expect(calculator.formatVatRate(0.21)).toBe('21%')
      expect(calculator.formatVatRate(0.19)).toBe('19%')
      expect(calculator.formatVatRate(0.25)).toBe('25%')
      expect(calculator.formatVatRate(0)).toBe('0%')
    })
  })
})