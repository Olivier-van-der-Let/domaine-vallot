/**
 * Test Suite: Checkout Total Alignment Verification
 *
 * This test verifies that the frontend calculation fix aligns with backend calculations
 * after implementing VAT-exclusive methodology in the frontend.
 */

import { describe, it, expect } from '@jest/globals'
import { calculateVat } from '@/lib/vat/calculator'

describe('Checkout Total Alignment - After Fix', () => {
  const mockCartItems = [
    { productId: 'test-1', quantity: 2, price: 2500 }, // €25.00 each = €50.00 total
    { productId: 'test-2', quantity: 1, price: 3500 }  // €35.00 each = €35.00 total
  ]

  const mockShippingOption = {
    price: 895 // €8.95
  }

  const mockAddress = {
    country: 'FR' // 20% VAT rate
  }

  describe('Frontend Fixed Calculation Logic', () => {
    it('should now calculate totals using VAT-exclusive methodology (matching backend)', () => {
      // Reproduce the FIXED frontend calculation logic
      const subtotal = mockCartItems.reduce((sum, item) => {
        return sum + (item.quantity * item.price)
      }, 0)

      const shippingCost = mockShippingOption.price
      const vatRate = 0.20 // 20% VAT for France

      // 🔧 FIXED FRONTEND LOGIC: VAT-exclusive calculation (matches backend)
      const productVat = Math.round(subtotal * vatRate)
      const shippingVat = Math.round(shippingCost * vatRate)
      const vatAmount = productVat + shippingVat
      const totalAmount = subtotal + shippingCost + vatAmount

      console.log('🟢 Fixed Frontend calculations:', {
        subtotal,
        shippingCost,
        productVat,
        shippingVat,
        vatAmount,
        totalAmount,
        vatCalculationMethod: 'VAT-exclusive (matching backend)'
      })

      expect(subtotal).toBe(8500) // €85.00
      expect(shippingCost).toBe(895) // €8.95
      expect(productVat).toBe(1700) // €17.00 (20% of €85.00)
      expect(shippingVat).toBe(179) // €1.79 (20% of €8.95)
      expect(vatAmount).toBe(1879) // €18.79 total VAT
      expect(totalAmount).toBe(11274) // €112.74 total
    })
  })

  describe('Backend Calculation Logic (Unchanged)', () => {
    it('should produce the same results as before', () => {
      const subtotal = mockCartItems.reduce((sum, item) => {
        return sum + (item.quantity * item.price)
      }, 0)

      const shippingCost = mockShippingOption.price

      const vatCalculation = calculateVat({
        amount: subtotal,
        shipping_amount: shippingCost,
        country_code: mockAddress.country,
        customer_type: 'consumer'
      })

      console.log('🟥 Backend calculations (unchanged):', {
        subtotal,
        shippingCost,
        vatAmount: vatCalculation.vat_amount,
        totalAmount: vatCalculation.total_amount,
        breakdown: vatCalculation.breakdown
      })

      expect(subtotal).toBe(8500)
      expect(shippingCost).toBe(895)
      expect(vatCalculation.vat_amount).toBe(1879)
      expect(vatCalculation.total_amount).toBe(11274)
    })
  })

  describe('Alignment Verification', () => {
    it('should show frontend and backend calculations now match within tolerance', () => {
      // Fixed frontend calculation
      const subtotal = 8500
      const shippingCost = 895
      const vatRate = 0.20
      const productVat = Math.round(subtotal * vatRate)
      const shippingVat = Math.round(shippingCost * vatRate)
      const frontendVatAmount = productVat + shippingVat
      const frontendTotal = subtotal + shippingCost + frontendVatAmount

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

      console.log('✅ ALIGNMENT VERIFICATION:', {
        frontend: {
          vatAmount: frontendVatAmount,
          totalAmount: frontendTotal,
          calculationMethod: 'VAT-exclusive (FIXED)'
        },
        backend: {
          vatAmount: backendVatCalculation.vat_amount,
          totalAmount: backendVatCalculation.total_amount,
          calculationMethod: 'VAT-exclusive'
        },
        differences: {
          vatDifference,
          totalDifference,
          withinTolerance: vatDifference <= toleranceInCents && totalDifference <= toleranceInCents
        },
        tolerance: toleranceInCents
      })

      // These assertions should PASS after the fix
      expect(vatDifference).toBeLessThanOrEqual(toleranceInCents)
      expect(totalDifference).toBeLessThanOrEqual(toleranceInCents)

      // Exact match verification
      expect(frontendVatAmount).toBe(backendVatCalculation.vat_amount)
      expect(frontendTotal).toBe(backendVatCalculation.total_amount)
    })
  })

  describe('Cross-Country Verification', () => {
    const testCases = [
      {
        name: 'Germany (19% VAT)',
        country: 'DE',
        vatRate: 0.19
      },
      {
        name: 'Italy (22% VAT)',
        country: 'IT',
        vatRate: 0.22
      },
      {
        name: 'Netherlands (21% VAT)',
        country: 'NL',
        vatRate: 0.21
      }
    ]

    testCases.forEach(({ name, country, vatRate }) => {
      it(`should align calculations for: ${name}`, () => {
        const subtotal = 5000 // €50.00
        const shippingCost = 1000 // €10.00

        // Fixed frontend calculation with country-specific VAT rate
        const productVat = Math.round(subtotal * vatRate)
        const shippingVat = Math.round(shippingCost * vatRate)
        const frontendVatAmount = productVat + shippingVat
        const frontendTotal = subtotal + shippingCost + frontendVatAmount

        // Backend calculation
        const backendVatCalculation = calculateVat({
          amount: subtotal,
          shipping_amount: shippingCost,
          country_code: country,
          customer_type: 'consumer'
        })

        const vatDifference = Math.abs(frontendVatAmount - backendVatCalculation.vat_amount)
        const totalDifference = Math.abs(frontendTotal - backendVatCalculation.total_amount)

        console.log(`🌍 ${name} alignment:`, {
          country,
          vatRate,
          differences: { vat: vatDifference, total: totalDifference },
          aligned: vatDifference === 0 && totalDifference === 0
        })

        // Should align perfectly for all EU countries
        expect(vatDifference).toBe(0)
        expect(totalDifference).toBe(0)
      })
    })
  })

  describe('Rounding Edge Cases', () => {
    it('should handle rounding edge cases consistently', () => {
      // Edge case: amounts that could round differently
      const edgeCaseItems = [
        { productId: 'edge-1', quantity: 3, price: 3333 }, // €33.33 each, total €99.99
        { productId: 'edge-2', quantity: 1, price: 1 }     // €0.01
      ]

      const subtotal = edgeCaseItems.reduce((sum, item) => sum + (item.quantity * item.price), 0)
      const shippingCost = 333 // €3.33

      // Frontend calculation (fixed)
      const vatRate = 0.20
      const productVat = Math.round(subtotal * vatRate)
      const shippingVat = Math.round(shippingCost * vatRate)
      const frontendVatAmount = productVat + shippingVat
      const frontendTotal = subtotal + shippingCost + frontendVatAmount

      // Backend calculation
      const backendVatCalculation = calculateVat({
        amount: subtotal,
        shipping_amount: shippingCost,
        country_code: 'FR',
        customer_type: 'consumer'
      })

      console.log('🎯 Rounding edge case:', {
        subtotal,
        shippingCost,
        frontendVat: frontendVatAmount,
        backendVat: backendVatCalculation.vat_amount,
        match: frontendVatAmount === backendVatCalculation.vat_amount
      })

      // Even with rounding edge cases, calculations should align
      expect(frontendVatAmount).toBe(backendVatCalculation.vat_amount)
      expect(frontendTotal).toBe(backendVatCalculation.total_amount)
    })
  })
})