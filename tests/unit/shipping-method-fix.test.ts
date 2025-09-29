import { orderSchema, validateSchema } from '@/lib/validators/schemas'

describe('Shipping Method Fix Tests', () => {
  const baseOrderData = {
    customerEmail: 'test@example.com',
    customerFirstName: 'John',
    customerLastName: 'Doe',
    shippingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      address: '123 Main St',
      city: 'Paris',
      postalCode: '75001',
      country: 'FR'
    },
    billingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      address: '123 Main St',
      city: 'Paris',
      postalCode: '75001',
      country: 'FR'
    },
    items: [{
      productId: '550e8400-e29b-41d4-a716-446655440000',
      quantity: 1,
      unitPrice: 2500
    }],
    subtotal: 2500,
    vatAmount: 500,
    shippingCost: 750,
    totalAmount: 3750,
    paymentMethod: 'mollie'
  }

  describe('Order Schema Validation', () => {
    it('should accept order with valid shipping_option', () => {
      const orderData = {
        ...baseOrderData,
        shipping_option: {
          code: 'standard',
          name: 'Standard Delivery',
          carrier_code: 'postnl',
          carrier_name: 'PostNL',
          price: 750,
          currency: 'EUR',
          characteristics: {
            is_tracked: true,
            requires_signature: false,
            is_express: false,
            insurance: 0,
            last_mile: 'standard'
          }
        }
      }

      const result = validateSchema(orderSchema, orderData)
      expect(result.success).toBe(true)
    })

    it('should accept order without shipping_option (fallback case)', () => {
      const orderData = {
        ...baseOrderData,
        shipping_option: undefined
      }

      const result = validateSchema(orderSchema, orderData)
      expect(result.success).toBe(true)
    })

    it('should reject order with shipping_option missing required fields', () => {
      const orderData = {
        ...baseOrderData,
        shipping_option: {
          code: 'standard',
          price: 750,
          currency: 'EUR',
          characteristics: {
            is_tracked: true,
            requires_signature: false,
            is_express: false,
            insurance: 0,
            last_mile: 'standard'
          }
          // Missing required carrier_name and name fields
        }
      }

      const result = validateSchema(orderSchema, orderData)
      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
    })

    it('should accept order with complete shipping_option', () => {
      const orderData = {
        ...baseOrderData,
        shipping_option: {
          code: 'standard',
          name: 'Standard Delivery',
          carrier_code: 'postnl',
          carrier_name: 'PostNL',
          price: 750,
          currency: 'EUR',
          characteristics: {
            is_tracked: true,
            requires_signature: false,
            is_express: false,
            insurance: 0,
            last_mile: 'standard'
          }
        }
      }

      const result = validateSchema(orderSchema, orderData)
      expect(result.success).toBe(true)
    })
  })

  describe('Shipping Method Generation Logic', () => {
    // Mock the shipping method generation logic from the API
    const generateShippingMethod = (shipping_option: any): string => {
      let shippingMethod = 'Standard shipping' // Default fallback

      // More robust shipping method generation with proper validation
      if (shipping_option) {
        const option = shipping_option
        if (option.carrier_name && typeof option.carrier_name === 'string' && option.carrier_name.trim()) {
          const carrier = option.carrier_name.trim()
          const service = (option.option_name || option.service || 'standard').toString().trim()
          shippingMethod = `${carrier} - ${service}`
        } else if (option.name && typeof option.name === 'string' && option.name.trim()) {
          // Fallback to option name if carrier name is not available
          shippingMethod = option.name.trim()
        }
      }

      // Ensure shipping_method is never empty or null
      if (!shippingMethod || shippingMethod.trim() === '') {
        shippingMethod = 'Standard shipping'
      }

      return shippingMethod
    }

    it('should generate shipping method from carrier and service', () => {
      const shipping_option = {
        carrier_name: 'PostNL',
        option_name: 'Express Delivery'
      }

      const result = generateShippingMethod(shipping_option)
      expect(result).toBe('PostNL - Express Delivery')
    })

    it('should generate shipping method from name when carrier missing', () => {
      const shipping_option = {
        name: 'Standard Delivery'
      }

      const result = generateShippingMethod(shipping_option)
      expect(result).toBe('Standard Delivery')
    })

    it('should use fallback when shipping_option is undefined', () => {
      const result = generateShippingMethod(undefined)
      expect(result).toBe('Standard shipping')
    })

    it('should use fallback when shipping_option is empty object', () => {
      const result = generateShippingMethod({})
      expect(result).toBe('Standard shipping')
    })

    it('should handle whitespace-only values', () => {
      const shipping_option = {
        carrier_name: '   ',
        name: '   '
      }

      const result = generateShippingMethod(shipping_option)
      expect(result).toBe('Standard shipping')
    })

    it('should handle null/undefined carrier name with valid service', () => {
      const shipping_option = {
        carrier_name: null,
        option_name: 'Express',
        name: 'Express Delivery'
      }

      const result = generateShippingMethod(shipping_option)
      expect(result).toBe('Express Delivery')
    })

    it('should never return empty string or null', () => {
      const testCases = [
        undefined,
        null,
        {},
        { carrier_name: '', name: '' },
        { carrier_name: null, name: null },
        { carrier_name: '   ', name: '   ' }
      ]

      testCases.forEach(shipping_option => {
        const result = generateShippingMethod(shipping_option)
        expect(result).toBeTruthy()
        expect(result.trim()).not.toBe('')
        expect(result).toBe('Standard shipping')
      })
    })
  })
})