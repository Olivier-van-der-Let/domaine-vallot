/**
 * Test to reproduce and verify fix for PostgreSQL error 42702
 * "column reference 'order_number' is ambiguous"
 *
 * This error occurs in the generate_order_number() function where
 * both the variable and column have the same name.
 */

import { createOrder } from '@/lib/supabase/server'

describe('Order Creation - Ambiguous Column Reference Fix', () => {
  const validOrderData = {
    customer_id: '00000000-0000-0000-0000-000000000001', // Mock UUID
    shipping_address: {
      first_name: 'Jean',
      last_name: 'Dupont',
      address_line1: '123 Rue de la Paix',
      city: 'Lyon',
      postal_code: '69000',
      country_code: 'FR',
      phone: '+33123456789'
    },
    billing_address: {
      first_name: 'Jean',
      last_name: 'Dupont',
      address_line1: '123 Rue de la Paix',
      city: 'Lyon',
      postal_code: '69000',
      country_code: 'FR',
      phone: '+33123456789'
    },
    items: [
      {
        product_id: '00000000-0000-0000-0000-000000000001',
        quantity: 2,
        unit_price: 1200 // €12.00 in cents
      }
    ],
    subtotal: 2400, // €24.00 in cents
    vat_amount: 480, // €4.80 in cents (20% VAT)
    shipping_cost: 500, // €5.00 in cents
    total_amount: 3380, // €33.80 in cents
    payment_method: 'mollie',
    status: 'pending'
  }

  test('should create order without ambiguous column reference error', async () => {
    // This test will reproduce the PostgreSQL error 42702 before the fix
    // and should pass after the fix is applied

    try {
      const order = await createOrder(validOrderData)

      // If we reach here, the order was created successfully
      expect(order).toBeDefined()
      expect(order.id).toBeDefined()
      expect(order.status).toBe('pending')

      // The order should have an auto-generated order_number
      // in the format DV-YYYYMMDD-XXXX
      expect(order.order_number).toMatch(/^DV-\d{8}-\d{4}$/)

      console.log('✅ Order created successfully:', {
        id: order.id,
        order_number: order.order_number,
        status: order.status
      })

    } catch (error: any) {
      // Before the fix, this should throw the ambiguous column error
      console.error('❌ Order creation failed:', error)

      if (error.code === '42702') {
        expect(error.message).toContain('column reference "order_number" is ambiguous')
        console.log('🔍 Confirmed: PostgreSQL error 42702 - ambiguous column reference')
      }

      // Re-throw to fail the test until fixed
      throw error
    }
  })

  test('should handle multiple concurrent order creation without conflicts', async () => {
    // Test that the fixed SQL can handle concurrent requests
    // without ambiguity issues

    const orderPromises = []

    // Create 5 orders concurrently to test the random number generation
    for (let i = 0; i < 5; i++) {
      const orderData = {
        ...validOrderData,
        customer_id: `00000000-0000-0000-0000-00000000000${i}`,
        items: [{
          ...validOrderData.items[0],
          product_id: `00000000-0000-0000-0000-00000000000${i}`
        }]
      }

      orderPromises.push(createOrder(orderData))
    }

    try {
      const orders = await Promise.all(orderPromises)

      // All orders should be created successfully
      expect(orders).toHaveLength(5)

      // Each order should have a unique order_number
      const orderNumbers = orders.map(order => order.order_number)
      const uniqueOrderNumbers = new Set(orderNumbers)
      expect(uniqueOrderNumbers.size).toBe(5)

      // All order numbers should follow the correct pattern
      orders.forEach(order => {
        expect(order.order_number).toMatch(/^DV-\d{8}-\d{4}$/)
      })

      console.log('✅ All concurrent orders created with unique order numbers:', orderNumbers)

    } catch (error: any) {
      console.error('❌ Concurrent order creation failed:', error)

      if (error.code === '42702') {
        console.log('🔍 Ambiguous column reference still present in concurrent scenario')
      }

      throw error
    }
  })

  test('should generate unique order numbers when similar numbers exist', async () => {
    // Test the retry logic in generate_order_number function
    // This ensures the WHERE clause comparison works correctly

    try {
      // Create first order
      const order1 = await createOrder(validOrderData)

      // Create second order (should get different order number)
      const order2Data = {
        ...validOrderData,
        customer_id: '00000000-0000-0000-0000-000000000002',
        items: [{
          ...validOrderData.items[0],
          product_id: '00000000-0000-0000-0000-000000000002'
        }]
      }

      const order2 = await createOrder(order2Data)

      // Both orders should have valid, unique order numbers
      expect(order1.order_number).toMatch(/^DV-\d{8}-\d{4}$/)
      expect(order2.order_number).toMatch(/^DV-\d{8}-\d{4}$/)
      expect(order1.order_number).not.toBe(order2.order_number)

      console.log('✅ Unique order numbers generated:', {
        order1: order1.order_number,
        order2: order2.order_number
      })

    } catch (error: any) {
      console.error('❌ Order number uniqueness test failed:', error)

      if (error.code === '42702') {
        console.log('🔍 Ambiguous column reference in uniqueness check')
      }

      throw error
    }
  })
})