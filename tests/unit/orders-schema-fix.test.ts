import { createOrder } from '@/lib/supabase/server'
import { beforeEach, describe, expect, jest, test } from '@jest/globals'

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(),
  select: jest.fn(),
  insert: jest.fn(),
  eq: jest.fn(),
  single: jest.fn()
}

// Mock the server.ts file safeQuery function
jest.mock('@/lib/supabase/server', () => ({
  ...jest.requireActual('@/lib/supabase/server'),
  safeQuery: jest.fn()
}))

describe('Orders Schema Fix - Database Function', () => {
  const mockSafeQuery = require('@/lib/supabase/server').safeQuery

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createOrder function parameter mapping', () => {
    test('should use customer_id instead of user_id', async () => {
      // Arrange
      const mockOrderData = {
        customer_id: 'test-customer-uuid',
        shipping_address: {
          first_name: 'John',
          last_name: 'Doe',
          address_line1: '123 Test St',
          city: 'Test City',
          postal_code: '12345',
          country_code: 'FR'
        },
        billing_address: {
          first_name: 'John',
          last_name: 'Doe',
          address_line1: '123 Test St',
          city: 'Test City',
          postal_code: '12345',
          country_code: 'FR'
        },
        items: [
          {
            product_id: 'product-1',
            quantity: 2,
            unit_price: 1500
          }
        ],
        subtotal: 3000,
        vat_amount: 600,
        shipping_cost: 500,
        total_amount: 4100,
        payment_method: 'mollie',
        status: 'pending'
      }

      const mockOrderResult = {
        id: 'order-uuid',
        customer_id: 'test-customer-uuid',
        status: 'pending',
        created_at: new Date().toISOString()
      }

      const mockOrderItems = [
        {
          order_id: 'order-uuid',
          product_id: 'product-1',
          quantity: 2,
          unit_price_eur: 1500,
          vat_rate: 0.2,
          vat_amount_eur: 600,
          line_total_eur: 3000
        }
      ]

      // Mock the safeQuery implementation
      mockSafeQuery.mockImplementation(async (queryFn: any) => {
        // Simulate the first call to insert order
        const insertCall = {
          data: mockOrderResult,
          error: null
        }

        // Mock the insert chain
        const mockInsert = {
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue(insertCall)
          })
        }

        const mockFrom = {
          insert: jest.fn().mockReturnValue(mockInsert)
        }

        const mockClient = {
          from: jest.fn().mockReturnValue(mockFrom)
        }

        return queryFn(mockClient)
      })

      // Act
      const result = await createOrder(mockOrderData)

      // Assert
      expect(mockSafeQuery).toHaveBeenCalled()
      expect(result).toEqual({ data: mockOrderResult, error: null })
    })

    test('should not include customer_email field in insert', async () => {
      // Arrange
      let capturedInsertData: any = null

      const mockOrderData = {
        customer_id: 'test-customer-uuid',
        shipping_address: { country_code: 'FR' },
        billing_address: { country_code: 'FR' },
        items: [{ product_id: 'product-1', quantity: 1, unit_price: 1000 }],
        subtotal: 1000,
        vat_amount: 200,
        shipping_cost: 500,
        total_amount: 1700
      }

      mockSafeQuery.mockImplementation(async (queryFn: any) => {
        const mockInsert = {
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 'test' }, error: null })
          })
        }

        const mockFrom = {
          insert: jest.fn().mockImplementation((data) => {
            capturedInsertData = data
            return mockInsert
          })
        }

        const mockClient = {
          from: jest.fn().mockReturnValue(mockFrom)
        }

        return queryFn(mockClient)
      })

      // Act
      await createOrder(mockOrderData)

      // Assert - Verify the insert data does not contain customer_email
      expect(capturedInsertData).toBeDefined()
      expect(capturedInsertData).not.toHaveProperty('customer_email')
      expect(capturedInsertData).not.toHaveProperty('customer_first_name')
      expect(capturedInsertData).not.toHaveProperty('customer_last_name')
      expect(capturedInsertData).not.toHaveProperty('user_id')

      // Verify it contains the correct fields
      expect(capturedInsertData).toHaveProperty('customer_id')
      expect(capturedInsertData).toHaveProperty('subtotal_eur')
      expect(capturedInsertData).toHaveProperty('vat_amount_eur')
      expect(capturedInsertData).toHaveProperty('shipping_cost_eur')
      expect(capturedInsertData).toHaveProperty('total_eur')
      expect(capturedInsertData).toHaveProperty('vat_rate')
    })

    test('should use correct column names for monetary fields', async () => {
      // Arrange
      let capturedInsertData: any = null

      const mockOrderData = {
        customer_id: 'test-customer-uuid',
        shipping_address: { country_code: 'FR' },
        items: [{ product_id: 'product-1', quantity: 2, unit_price: 1500 }],
        subtotal: 3000,
        vat_amount: 600,
        shipping_cost: 500,
        total_amount: 4100
      }

      mockSafeQuery.mockImplementation(async (queryFn: any) => {
        const mockInsert = {
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 'test' }, error: null })
          })
        }

        const mockFrom = {
          insert: jest.fn().mockImplementation((data) => {
            capturedInsertData = data
            return mockInsert
          })
        }

        const mockClient = {
          from: jest.fn().mockReturnValue(mockFrom)
        }

        return queryFn(mockClient)
      })

      // Act
      await createOrder(mockOrderData)

      // Assert - Verify correct column names are used
      expect(capturedInsertData.subtotal_eur).toBe(3000)
      expect(capturedInsertData.vat_amount_eur).toBe(600)
      expect(capturedInsertData.shipping_cost_eur).toBe(500)
      expect(capturedInsertData.total_eur).toBe(4100)
      expect(capturedInsertData.vat_rate).toBe(0.2) // 600 / 3000
      expect(capturedInsertData.customer_id).toBe('test-customer-uuid')
    })
  })
})