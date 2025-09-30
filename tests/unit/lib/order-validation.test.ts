import { orderSchema, validateSchema } from '@/lib/validators/schemas'

describe('Order Schema Validation - Shipping Option', () => {
  const validOrderData = {
    customerEmail: 'test@example.com',
    customerFirstName: 'John',
    customerLastName: 'Doe',
    shippingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      address: '123 Main St',
      city: 'Paris',
      postalCode: '75001',
      country: 'FR',
      phone: '+33123456789'
    },
    billingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      address: '123 Main St',
      city: 'Paris',
      postalCode: '75001',
      country: 'FR',
      phone: '+33123456789'
    },
    items: [
      {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 2,
        unitPrice: 2500
      }
    ],
    subtotal: 5000,
    vatAmount: 1000,
    shippingCost: 500,
    totalAmount: 6500,
    paymentMethod: 'mollie'
  }

  describe('shipping_option field validation', () => {
    it('should FAIL when shipping_option is missing', () => {
      const orderWithoutShipping = { ...validOrderData }

      const result = validateSchema(orderSchema, orderWithoutShipping)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors).toHaveProperty('shipping_option')
      expect(result.errors?.['shipping_option']).toContain('Required')
    })

    it('should FAIL when shipping_option.code is missing', () => {
      const orderWithInvalidShipping = {
        ...validOrderData,
        shipping_option: {
          name: 'Standard Shipping'
        }
      }

      const result = validateSchema(orderSchema, orderWithInvalidShipping)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors?.['shipping_option.code']).toContain('Required')
    })

    it('should FAIL when shipping_option.name is missing', () => {
      const orderWithInvalidShipping = {
        ...validOrderData,
        shipping_option: {
          code: 'standard'
        }
      }

      const result = validateSchema(orderSchema, orderWithInvalidShipping)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors?.['shipping_option.name']).toContain('Required')
    })

    it('should FAIL when shipping_option.code is empty string', () => {
      const orderWithEmptyCode = {
        ...validOrderData,
        shipping_option: {
          code: '',
          name: 'Standard Shipping'
        }
      }

      const result = validateSchema(orderSchema, orderWithEmptyCode)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors?.['shipping_option.code']).toContain('Shipping option code is required')
    })

    it('should FAIL when shipping_option.name is empty string', () => {
      const orderWithEmptyName = {
        ...validOrderData,
        shipping_option: {
          code: 'standard',
          name: ''
        }
      }

      const result = validateSchema(orderSchema, orderWithEmptyName)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors?.['shipping_option.name']).toContain('Shipping option name is required')
    })

    it('should PASS with minimal valid shipping_option {code, name}', () => {
      const orderWithMinimalShipping = {
        ...validOrderData,
        shipping_option: {
          code: 'standard',
          name: 'Standard Shipping'
        }
      }

      const result = validateSchema(orderSchema, orderWithMinimalShipping)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.shipping_option).toEqual({
        code: 'standard',
        name: 'Standard Shipping'
      })
    })

    it('should PASS with full shipping_option including optional fields', () => {
      const orderWithFullShipping = {
        ...validOrderData,
        shipping_option: {
          code: 'express',
          name: 'Express Delivery',
          carrier_code: 'dhl',
          carrier_name: 'DHL',
          price: 1500,
          currency: 'EUR',
          delivery_time: '1-2 business days',
          service_point_required: false
        }
      }

      const result = validateSchema(orderSchema, orderWithFullShipping)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.shipping_option.code).toBe('express')
      expect(result.data?.shipping_option.name).toBe('Express Delivery')
      expect(result.data?.shipping_option.carrier_code).toBe('dhl')
    })
  })

  describe('Backward compatibility', () => {
    it('should still validate all other required fields', () => {
      const orderMissingEmail = {
        ...validOrderData,
        shipping_option: {
          code: 'standard',
          name: 'Standard Shipping'
        }
      }
      delete orderMissingEmail.customerEmail

      const result = validateSchema(orderSchema, orderMissingEmail)

      expect(result.success).toBe(false)
      expect(result.errors).toHaveProperty('customerEmail')
      expect(result.errors?.['customerEmail']).toContain('Required')
    })

    it('should still validate items array', () => {
      const orderWithoutItems = {
        ...validOrderData,
        shipping_option: {
          code: 'standard',
          name: 'Standard Shipping'
        },
        items: []
      }

      const result = validateSchema(orderSchema, orderWithoutItems)

      expect(result.success).toBe(false)
      expect(result.errors).toHaveProperty('items')
      expect(result.errors?.['items']).toContain('Order must contain at least one item')
    })
  })
})