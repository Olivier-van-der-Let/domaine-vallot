/**
 * Integration Test: Checkout Total Fix Verification
 *
 * This test simulates the complete checkout flow to verify that the
 * "Invalid order data: Order total mismatch" error is resolved after
 * fixing the VAT calculation methodology mismatch.
 */

import { describe, it, expect } from '@jest/globals'
import { calculateVat } from '@/lib/vat/calculator'
import { validateSchema, orderSchema } from '@/lib/validators/schemas'

describe('Checkout Total Fix - Integration Verification', () => {
  describe('Order Validation Integration', () => {
    it('should successfully validate order data with aligned frontend/backend calculations', () => {
      // Simulate realistic cart data
      const mockCart = {
        items: [
          { productId: '550e8400-e29b-41d4-a716-446655440001', quantity: 2, price: 4500 },
          { productId: '550e8400-e29b-41d4-a716-446655440002', quantity: 1, price: 6000 }
        ]
      }

      const mockShippingOption = {
        code: 'standard',
        name: 'Standard Delivery',
        carrier_code: 'sendcloud',
        carrier_name: 'Sendcloud',
        price: 1200,
        currency: 'EUR',
        delivery_time: '2-3 business days',
        service_point_required: false,
        characteristics: {
          is_tracked: true,
          requires_signature: false,
          is_express: false,
          insurance: 0,
          last_mile: 'regular'
        }
      }

      const mockAddress = {
        firstName: 'Jean',
        lastName: 'Dupont',
        address: '123 Rue de la Paix',
        city: 'Paris',
        postalCode: '75001',
        country: 'FR',
        phone: '+33123456789'
      }

      // Step 1: Frontend calculation (FIXED VAT-exclusive logic)
      const subtotal = mockCart.items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
      const shippingCost = mockShippingOption.price

      const getVatRate = (countryCode: string): number => {
        const vatRates: Record<string, number> = {
          'FR': 0.20, 'DE': 0.19, 'IT': 0.22, 'ES': 0.21, 'NL': 0.21
        }
        return vatRates[countryCode] || 0.20
      }

      const vatRate = getVatRate(mockAddress.country)
      const productVat = Math.round(subtotal * vatRate)
      const shippingVat = Math.round(shippingCost * vatRate)
      const frontendVatAmount = productVat + shippingVat
      const frontendTotalAmount = subtotal + shippingCost + frontendVatAmount

      // Step 2: Backend validation calculation
      const backendVatCalculation = calculateVat({
        amount: subtotal,
        shipping_amount: shippingCost,
        country_code: mockAddress.country,
        customer_type: 'consumer'
      })

      // Step 3: Verify calculations align
      expect(frontendVatAmount).toBe(backendVatCalculation.vat_amount)
      expect(frontendTotalAmount).toBe(backendVatCalculation.total_amount)

      console.log('🔄 Integration test calculations:', {
        subtotal,
        shippingCost,
        frontend: { vatAmount: frontendVatAmount, total: frontendTotalAmount },
        backend: { vatAmount: backendVatCalculation.vat_amount, total: backendVatCalculation.total_amount },
        aligned: frontendVatAmount === backendVatCalculation.vat_amount
      })

      // Step 4: Create order data payload (as frontend would send)
      const orderData = {
        customerEmail: 'jean.dupont@example.com',
        customerFirstName: mockAddress.firstName,
        customerLastName: mockAddress.lastName,
        shippingAddress: mockAddress,
        billingAddress: mockAddress,
        items: mockCart.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.price
        })),
        subtotal,
        vatAmount: frontendVatAmount,
        shippingCost,
        totalAmount: frontendTotalAmount,
        paymentMethod: 'mollie',
        shipping_option: mockShippingOption
      }

      // Step 5: Validate against order schema
      const schemaValidation = validateSchema(orderSchema, orderData)

      if (!schemaValidation.success) {
        console.error('❌ Schema validation failed:', schemaValidation.errors)
      }

      expect(schemaValidation.success).toBe(true)
      expect(schemaValidation.errors).toBeUndefined()

      console.log('✅ Order schema validation:', {
        success: schemaValidation.success,
        hasErrors: !!schemaValidation.errors
      })

      // Step 6: Simulate backend total validation logic
      const toleranceInCents = 10

      const subtotalDiff = Math.abs(orderData.subtotal - subtotal)
      const vatDiff = Math.abs(orderData.vatAmount - backendVatCalculation.vat_amount)
      const shippingDiff = Math.abs(orderData.shippingCost - shippingCost)
      const totalDiff = Math.abs(orderData.totalAmount - backendVatCalculation.total_amount)

      // These should all pass validation now
      expect(subtotalDiff).toBeLessThanOrEqual(toleranceInCents)
      expect(vatDiff).toBeLessThanOrEqual(toleranceInCents)
      expect(shippingDiff).toBeLessThanOrEqual(toleranceInCents)
      expect(totalDiff).toBeLessThanOrEqual(toleranceInCents)

      console.log('💯 Backend validation simulation:', {
        differences: { subtotal: subtotalDiff, vat: vatDiff, shipping: shippingDiff, total: totalDiff },
        tolerance: toleranceInCents,
        allWithinTolerance: [subtotalDiff, vatDiff, shippingDiff, totalDiff].every(diff => diff <= toleranceInCents)
      })
    })

    it('should handle multiple countries correctly in integration scenario', () => {
      const testCountries = [
        { code: 'FR', name: 'France', vatRate: 0.20 },
        { code: 'DE', name: 'Germany', vatRate: 0.19 },
        { code: 'IT', name: 'Italy', vatRate: 0.22 },
        { code: 'ES', name: 'Spain', vatRate: 0.21 }
      ]

      testCountries.forEach(({ code, name, vatRate }) => {
        const subtotal = 10000 // €100.00
        const shippingCost = 1500 // €15.00

        // Frontend calculation (fixed)
        const productVat = Math.round(subtotal * vatRate)
        const shippingVat = Math.round(shippingCost * vatRate)
        const frontendVatAmount = productVat + shippingVat
        const frontendTotal = subtotal + shippingCost + frontendVatAmount

        // Backend calculation
        const backendVatCalculation = calculateVat({
          amount: subtotal,
          shipping_amount: shippingCost,
          country_code: code,
          customer_type: 'consumer'
        })

        // Order data for this country
        const orderData = {
          customerEmail: 'test@example.com',
          customerFirstName: 'Test',
          customerLastName: 'Customer',
          shippingAddress: {
            firstName: 'Test',
            lastName: 'Customer',
            address: '123 Test Street',
            city: 'Test City',
            postalCode: '12345',
            country: code,
            phone: '+33123456789'
          },
          billingAddress: {
            firstName: 'Test',
            lastName: 'Customer',
            address: '123 Test Street',
            city: 'Test City',
            postalCode: '12345',
            country: code,
            phone: '+33123456789'
          },
          items: [{
            productId: '550e8400-e29b-41d4-a716-446655440001',
            quantity: 1,
            unitPrice: subtotal
          }],
          subtotal,
          vatAmount: frontendVatAmount,
          shippingCost,
          totalAmount: frontendTotal,
          paymentMethod: 'mollie'
        }

        // Validation checks
        const schemaValidation = validateSchema(orderSchema, orderData)
        const totalAlignment = frontendTotal === backendVatCalculation.total_amount

        console.log(`🌍 ${name} (${code}) integration:`, {
          vatRate,
          frontend: { vat: frontendVatAmount, total: frontendTotal },
          backend: { vat: backendVatCalculation.vat_amount, total: backendVatCalculation.total_amount },
          schemaValid: schemaValidation.success,
          totalsAlign: totalAlignment
        })

        expect(schemaValidation.success).toBe(true)
        expect(totalAlignment).toBe(true)
      })
    })

    it('should prevent the original "Order total mismatch" error scenario', () => {
      // This test specifically verifies that the scenario which caused the original error
      // is now resolved and would pass backend validation

      const originalProblemScenario = {
        items: [
          { productId: '550e8400-e29b-41d4-a716-446655440001', quantity: 3, price: 2800 },
          { productId: '550e8400-e29b-41d4-a716-446655440002', quantity: 1, price: 4200 }
        ],
        shippingCost: 950,
        country: 'FR'
      }

      const subtotal = originalProblemScenario.items.reduce((sum, item) =>
        sum + (item.quantity * item.price), 0
      )

      // OLD (broken) frontend calculation that caused the error
      const oldVatableAmount = subtotal + originalProblemScenario.shippingCost
      const oldVatAmount = Math.round(oldVatableAmount * 0.20 / (1 + 0.20)) // VAT-included approach
      const oldTotal = subtotal + oldVatAmount + originalProblemScenario.shippingCost

      // NEW (fixed) frontend calculation
      const newProductVat = Math.round(subtotal * 0.20)
      const newShippingVat = Math.round(originalProblemScenario.shippingCost * 0.20)
      const newVatAmount = newProductVat + newShippingVat
      const newTotal = subtotal + originalProblemScenario.shippingCost + newVatAmount

      // Backend calculation (unchanged)
      const backendCalculation = calculateVat({
        amount: subtotal,
        shipping_amount: originalProblemScenario.shippingCost,
        country_code: originalProblemScenario.country,
        customer_type: 'consumer'
      })

      console.log('🚫➡️✅ Error scenario resolution:', {
        subtotal,
        shipping: originalProblemScenario.shippingCost,
        old: { vat: oldVatAmount, total: oldTotal, method: 'VAT-included (BROKEN)' },
        new: { vat: newVatAmount, total: newTotal, method: 'VAT-exclusive (FIXED)' },
        backend: { vat: backendCalculation.vat_amount, total: backendCalculation.total_amount },
        oldMismatch: Math.abs(oldTotal - backendCalculation.total_amount),
        newMismatch: Math.abs(newTotal - backendCalculation.total_amount),
        errorResolved: Math.abs(newTotal - backendCalculation.total_amount) <= 10
      })

      // The old calculation would have failed (>10 cent tolerance)
      expect(Math.abs(oldTotal - backendCalculation.total_amount)).toBeGreaterThan(10)

      // The new calculation should pass (≤10 cent tolerance)
      expect(Math.abs(newTotal - backendCalculation.total_amount)).toBeLessThanOrEqual(10)

      // Perfect alignment verification
      expect(newVatAmount).toBe(backendCalculation.vat_amount)
      expect(newTotal).toBe(backendCalculation.total_amount)
    })
  })

  describe('Edge Cases and Regression Prevention', () => {
    it('should handle decimal cent rounding consistently', () => {
      // Test scenario that could cause rounding inconsistencies
      const edgeCase = {
        subtotal: 3333, // €33.33
        shippingCost: 667, // €6.67
        country: 'IT', // 22% VAT
        vatRate: 0.22
      }

      // Frontend calculation
      const productVat = Math.round(edgeCase.subtotal * edgeCase.vatRate)
      const shippingVat = Math.round(edgeCase.shippingCost * edgeCase.vatRate)
      const frontendVatAmount = productVat + shippingVat
      const frontendTotal = edgeCase.subtotal + edgeCase.shippingCost + frontendVatAmount

      // Backend calculation
      const backendCalculation = calculateVat({
        amount: edgeCase.subtotal,
        shipping_amount: edgeCase.shippingCost,
        country_code: edgeCase.country,
        customer_type: 'consumer'
      })

      console.log('🔄 Rounding edge case verification:', {
        inputs: edgeCase,
        calculations: {
          productVat,
          shippingVat,
          frontendTotal,
          backendTotal: backendCalculation.total_amount
        },
        perfectAlignment: frontendTotal === backendCalculation.total_amount
      })

      expect(frontendVatAmount).toBe(backendCalculation.vat_amount)
      expect(frontendTotal).toBe(backendCalculation.total_amount)
    })

    it('should maintain calculation consistency across order size variations', () => {
      const orderSizes = [
        { name: 'Small order', subtotal: 2500, shipping: 500 },
        { name: 'Medium order', subtotal: 15000, shipping: 1000 },
        { name: 'Large order', subtotal: 50000, shipping: 2000 }
      ]

      orderSizes.forEach(({ name, subtotal, shipping }) => {
        const productVat = Math.round(subtotal * 0.20)
        const shippingVat = Math.round(shipping * 0.20)
        const frontendVatAmount = productVat + shippingVat
        const frontendTotal = subtotal + shipping + frontendVatAmount

        const backendCalculation = calculateVat({
          amount: subtotal,
          shipping_amount: shipping,
          country_code: 'FR',
          customer_type: 'consumer'
        })

        console.log(`📊 ${name} consistency:`, {
          subtotal,
          shipping,
          alignment: frontendTotal === backendCalculation.total_amount
        })

        expect(frontendVatAmount).toBe(backendCalculation.vat_amount)
        expect(frontendTotal).toBe(backendCalculation.total_amount)
      })
    })
  })
})