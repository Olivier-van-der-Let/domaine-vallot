/**
 * Test Suite: Checkout Total Mismatch Reproduction
 *
 * This test reproduces the "Invalid order data: Order total mismatch" error
 * by comparing frontend calculation logic vs backend calculation logic.
 *
 * Root Cause: Frontend uses VAT-included calculation while backend uses VAT-exclusive
 */

import { describe, it, expect } from '@jest/globals'
import { calculateVat } from '@/lib/vat/calculator'

describe('Checkout Total Mismatch - Root Cause Analysis', () => {
  const mockCartItems = [
    { productId: 'test-1', quantity: 2, price: 2500 }, // €25.00 each = €50.00 total
    { productId: 'test-2', quantity: 1, price: 3500 }  // €35.00 each = €35.00 total
  ]

  const mockShippingOption = {
    carrier_code: 'colissimo',
    carrier_name: 'Colissimo',
    option_code: 'standard',
    option_name: 'Standard Delivery',
    price: 895, // €8.95
    currency: 'EUR',
    delivery_time: '2-3 business days'
  }

  const mockAddress = {
    country: 'FR', // 20% VAT rate
    postalCode: '75001',
    city: 'Paris'
  }

  describe('Frontend Calculation Logic (CheckoutForm)', () => {
    it('should calculate totals using VAT-included methodology', () => {
      // Reproduce exact frontend calculation logic from CheckoutForm.tsx lines 396-415
      const subtotal = mockCartItems.reduce((sum, item) => {
        return sum + (item.quantity * item.price)
      }, 0)

      const shippingCost = mockShippingOption.price
      const vatRate = 0.20 // 20% VAT for France
      const vatableAmount = subtotal + shippingCost

      // 🔍 FRONTEND LOGIC: VAT-included calculation (assumes prices include VAT)
      const vatAmount = Math.round(vatableAmount * vatRate / (1 + vatRate))
      const totalAmount = subtotal + vatAmount + shippingCost

      console.log('🟦 Frontend calculations:', {
        subtotal,
        shippingCost,
        vatableAmount,
        vatAmount,
        totalAmount,
        vatCalculationMethod: 'VAT-included (prices include VAT)'
      })

      expect(subtotal).toBe(8500) // €85.00
      expect(shippingCost).toBe(895) // €8.95
      expect(vatableAmount).toBe(9395) // €93.95
      expect(vatAmount).toBe(1566) // Should be ~€15.66 with VAT-included calculation
      expect(totalAmount).toBe(10961) // €109.61
    })
  })

  describe('Backend Calculation Logic (VAT Calculator)', () => {
    it('should calculate totals using VAT-exclusive methodology', () => {
      // Reproduce exact backend calculation logic
      const subtotal = mockCartItems.reduce((sum, item) => {
        return sum + (item.quantity * item.price)
      }, 0)

      const shippingCost = mockShippingOption.price

      // 🔍 BACKEND LOGIC: VAT-exclusive calculation from calculator.ts
      const vatCalculation = calculateVat({
        amount: subtotal,
        shipping_amount: shippingCost,
        country_code: mockAddress.country,
        customer_type: 'consumer'
      })

      console.log('🟥 Backend calculations:', {
        subtotal,
        shippingCost,
        vatAmount: vatCalculation.vat_amount,
        totalAmount: vatCalculation.total_amount,
        vatCalculationMethod: 'VAT-exclusive (add VAT to base prices)',
        breakdown: vatCalculation.breakdown
      })

      expect(subtotal).toBe(8500) // €85.00
      expect(shippingCost).toBe(895) // €8.95
      expect(vatCalculation.vat_amount).toBe(1879) // Should be €18.79 with VAT-exclusive calculation
      expect(vatCalculation.total_amount).toBe(11274) // €112.74
    })
  })

  describe('Mismatch Verification', () => {
    it('should demonstrate the exact mismatch that causes checkout failure', () => {
      // Frontend calculation
      const subtotal = 8500
      const shippingCost = 895
      const vatRate = 0.20
      const vatableAmount = subtotal + shippingCost
      const frontendVatAmount = Math.round(vatableAmount * vatRate / (1 + vatRate))
      const frontendTotal = subtotal + frontendVatAmount + shippingCost

      // Backend calculation
      const backendVatCalculation = calculateVat({
        amount: subtotal,
        shipping_amount: shippingCost,
        country_code: 'FR',
        customer_type: 'consumer'
      })

      const toleranceInCents = 10 // Same tolerance as backend validation

      const vatDifference = Math.abs(frontendVatAmount - backendVatCalculation.vat_amount)
      const totalDifference = Math.abs(frontendTotal - backendVatCalculation.total_amount)

      console.log('💥 MISMATCH ANALYSIS:', {
        frontend: {
          vatAmount: frontendVatAmount,
          totalAmount: frontendTotal,
          calculationMethod: 'VAT-included'
        },
        backend: {
          vatAmount: backendVatCalculation.vat_amount,
          totalAmount: backendVatCalculation.total_amount,
          calculationMethod: 'VAT-exclusive'
        },
        differences: {
          vatDifference,
          totalDifference,
          exceededTolerance: vatDifference > toleranceInCents || totalDifference > toleranceInCents
        },
        tolerance: toleranceInCents
      })

      // This test should FAIL initially, demonstrating the mismatch
      expect(vatDifference).toBeGreaterThan(toleranceInCents)
      expect(totalDifference).toBeGreaterThan(toleranceInCents)

      // Show the exact error that would be returned
      expect({
        error: 'Order total mismatch',
        calculated: {
          vatAmount: backendVatCalculation.vat_amount,
          totalAmount: backendVatCalculation.total_amount
        },
        provided: {
          vatAmount: frontendVatAmount,
          totalAmount: frontendTotal
        }
      }).toMatchObject({
        error: 'Order total mismatch',
        calculated: expect.any(Object),
        provided: expect.any(Object)
      })
    })
  })

  describe('Edge Cases with Real Data Scenarios', () => {
    const testCases = [
      {
        name: 'Single expensive bottle with express shipping',
        items: [{ productId: 'test-1', quantity: 1, price: 12000 }], // €120.00
        shipping: 1500, // €15.00 express
        country: 'FR'
      },
      {
        name: 'Multiple bottles to Germany (19% VAT)',
        items: [
          { productId: 'test-1', quantity: 3, price: 4500 }, // €45.00 each
          { productId: 'test-2', quantity: 2, price: 6000 }  // €60.00 each
        ],
        shipping: 1200, // €12.00
        country: 'DE'
      },
      {
        name: 'Large order to Italy (22% VAT)',
        items: [
          { productId: 'test-1', quantity: 6, price: 3000 }, // €30.00 each
          { productId: 'test-2', quantity: 4, price: 7500 }  // €75.00 each
        ],
        shipping: 2500, // €25.00
        country: 'IT'
      }
    ]

    testCases.forEach(({ name, items, shipping, country }) => {
      it(`should fail validation for: ${name}`, () => {
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0)

        // Frontend calculation (VAT-included)
        const vatRates: Record<string, number> = { FR: 0.20, DE: 0.19, IT: 0.22 }
        const vatRate = vatRates[country]
        const vatableAmount = subtotal + shipping
        const frontendVatAmount = Math.round(vatableAmount * vatRate / (1 + vatRate))
        const frontendTotal = subtotal + frontendVatAmount + shipping

        // Backend calculation (VAT-exclusive)
        const backendVatCalculation = calculateVat({
          amount: subtotal,
          shipping_amount: shipping,
          country_code: country,
          customer_type: 'consumer'
        })

        const vatDifference = Math.abs(frontendVatAmount - backendVatCalculation.vat_amount)
        const totalDifference = Math.abs(frontendTotal - backendVatCalculation.total_amount)

        console.log(`🧪 Test case: ${name}`, {
          subtotal,
          shipping,
          country,
          vatRate,
          frontend: { vatAmount: frontendVatAmount, total: frontendTotal },
          backend: { vatAmount: backendVatCalculation.vat_amount, total: backendVatCalculation.total_amount },
          differences: { vat: vatDifference, total: totalDifference }
        })

        // All test cases should demonstrate mismatch > 10 cents tolerance
        expect(vatDifference).toBeGreaterThan(10)
        expect(totalDifference).toBeGreaterThan(10)
      })
    })
  })

  describe('Product Price Consistency Check', () => {
    it('should verify prices are in cents format', () => {
      // Verify the test data matches the expected format (prices in cents)
      mockCartItems.forEach(item => {
        expect(item.price).toBeGreaterThan(100) // Should be > €1.00 (in cents)
        expect(Number.isInteger(item.price)).toBe(true) // Should be whole number (cents)
      })

      expect(mockShippingOption.price).toBeGreaterThan(100)
      expect(Number.isInteger(mockShippingOption.price)).toBe(true)
    })
  })
})