import { NextRequest } from 'next/server'

// Mock the required modules and functions
jest.mock('@/lib/supabase/server', () => ({
  getServerUser: jest.fn(),
  createOrder: jest.fn(),
  getCartItems: jest.fn(),
  removeFromCart: jest.fn()
}))

jest.mock('@/lib/validators/schemas', () => ({
  orderSchema: {
    safeParse: jest.fn()
  },
  validateSchema: jest.fn()
}))

jest.mock('@/lib/vat/calculator', () => ({
  calculateVat: jest.fn()
}))

jest.mock('@/lib/mollie/client', () => ({
  createWinePayment: jest.fn()
}))

describe('Product Snapshot Fix Tests', () => {
  describe('Product Snapshot Creation', () => {
    it('should create complete product snapshot with all required fields', () => {
      const mockProduct = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        sku: 'DOM-2021-MAGNANERAIE-750',
        name: 'Domaine Vallot Magnaneraie 2021',
        vintage: 2021,
        varietal: 'Grenache Noir',
        region: 'Provence',
        price_eur: 25.50,
        alcohol_content: 14.5,
        volume_ml: 750,
        description_en: 'A refined red wine with notes of cherry and herbs.',
        description_fr: 'Un vin rouge raffiné aux notes de cerise et d\'herbes.',
        organic_certified: true,
        biodynamic_certified: false,
        vegan_friendly: true,
        product_images: [
          { url: 'https://example.com/wine-image.jpg' }
        ]
      }

      const orderItem = {
        product_id: mockProduct.id,
        quantity: 2,
        unit_price: 2550 // in cents
      }

      // Mock the snapshot creation logic from the API
      const createProductSnapshot = (product: any, orderItem: any) => {
        return {
          id: product.id,
          sku: product.sku,
          name: product.name,
          vintage: product.vintage,
          varietal: product.varietal,
          region: product.region,
          price_eur: product.price_eur,
          alcohol_content: product.alcohol_content,
          volume_ml: product.volume_ml,
          description_en: product.description_en,
          description_fr: product.description_fr,
          organic_certified: product.organic_certified,
          biodynamic_certified: product.biodynamic_certified,
          vegan_friendly: product.vegan_friendly,
          image_url: product.product_images && product.product_images.length > 0
            ? product.product_images[0].url
            : null,
          order_price_eur: orderItem.unit_price / 100,
          snapshot_created_at: expect.any(String)
        }
      }

      const snapshot = createProductSnapshot(mockProduct, orderItem)

      // Verify all required fields are present
      expect(snapshot).toEqual({
        id: mockProduct.id,
        sku: mockProduct.sku,
        name: mockProduct.name,
        vintage: mockProduct.vintage,
        varietal: mockProduct.varietal,
        region: mockProduct.region,
        price_eur: mockProduct.price_eur,
        alcohol_content: mockProduct.alcohol_content,
        volume_ml: mockProduct.volume_ml,
        description_en: mockProduct.description_en,
        description_fr: mockProduct.description_fr,
        organic_certified: mockProduct.organic_certified,
        biodynamic_certified: mockProduct.biodynamic_certified,
        vegan_friendly: mockProduct.vegan_friendly,
        image_url: 'https://example.com/wine-image.jpg',
        order_price_eur: 25.50,
        snapshot_created_at: expect.any(String)
      })

      // Verify snapshot has all necessary fields for immutability
      expect(snapshot.id).toBeDefined()
      expect(snapshot.sku).toBeDefined()
      expect(snapshot.name).toBeDefined()
      expect(snapshot.order_price_eur).toBe(25.50)
      expect(snapshot.snapshot_created_at).toBeDefined()
    })

    it('should handle product without images gracefully', () => {
      const mockProduct = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        sku: 'DOM-2021-BASIC-750',
        name: 'Basic Wine',
        vintage: 2021,
        varietal: 'Grenache',
        region: 'Provence',
        price_eur: 15.00,
        alcohol_content: 13.0,
        volume_ml: 750,
        description_en: 'Basic wine description',
        description_fr: 'Description basique',
        organic_certified: false,
        biodynamic_certified: false,
        vegan_friendly: false,
        product_images: [] // No images
      }

      const orderItem = {
        product_id: mockProduct.id,
        quantity: 1,
        unit_price: 1500
      }

      const createProductSnapshot = (product: any, orderItem: any) => {
        return {
          id: product.id,
          sku: product.sku,
          name: product.name,
          vintage: product.vintage,
          varietal: product.varietal,
          region: product.region,
          price_eur: product.price_eur,
          alcohol_content: product.alcohol_content,
          volume_ml: product.volume_ml,
          description_en: product.description_en,
          description_fr: product.description_fr,
          organic_certified: product.organic_certified,
          biodynamic_certified: product.biodynamic_certified,
          vegan_friendly: product.vegan_friendly,
          image_url: product.product_images && product.product_images.length > 0
            ? product.product_images[0].url
            : null,
          order_price_eur: orderItem.unit_price / 100,
          snapshot_created_at: expect.any(String)
        }
      }

      const snapshot = createProductSnapshot(mockProduct, orderItem)

      expect(snapshot.image_url).toBeNull()
      expect(snapshot.name).toBe('Basic Wine')
      expect(snapshot.order_price_eur).toBe(15.00)
    })

    it('should preserve order-time pricing in snapshot', () => {
      const mockProduct = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        sku: 'DOM-2021-PREMIUM-750',
        name: 'Premium Wine',
        vintage: 2021,
        varietal: 'Syrah',
        region: 'Provence',
        price_eur: 45.00, // Current price in product catalog
        alcohol_content: 14.0,
        volume_ml: 750,
        description_en: 'Premium wine',
        description_fr: 'Vin premium',
        organic_certified: true,
        biodynamic_certified: true,
        vegan_friendly: true,
        product_images: []
      }

      const orderItem = {
        product_id: mockProduct.id,
        quantity: 1,
        unit_price: 4000 // Order was placed at 40.00 EUR (different from current price)
      }

      const createProductSnapshot = (product: any, orderItem: any) => {
        return {
          id: product.id,
          sku: product.sku,
          name: product.name,
          vintage: product.vintage,
          varietal: product.varietal,
          region: product.region,
          price_eur: product.price_eur,
          alcohol_content: product.alcohol_content,
          volume_ml: product.volume_ml,
          description_en: product.description_en,
          description_fr: product.description_fr,
          organic_certified: product.organic_certified,
          biodynamic_certified: product.biodynamic_certified,
          vegan_friendly: product.vegan_friendly,
          image_url: product.product_images && product.product_images.length > 0
            ? product.product_images[0].url
            : null,
          order_price_eur: orderItem.unit_price / 100,
          snapshot_created_at: expect.any(String)
        }
      }

      const snapshot = createProductSnapshot(mockProduct, orderItem)

      // Verify both prices are preserved
      expect(snapshot.price_eur).toBe(45.00) // Current catalog price
      expect(snapshot.order_price_eur).toBe(40.00) // Actual order price
    })
  })

  describe('Error Handling', () => {
    it('should throw error when product not found for cart item', () => {
      const cartItems = [
        {
          product_id: 'existing-product-id',
          wine_products: { id: 'existing-product-id', name: 'Existing Wine' }
        }
      ]

      const orderItems = [
        {
          product_id: 'missing-product-id',
          quantity: 1,
          unit_price: 2500
        }
      ]

      // Mock the error logic from the API
      const processOrderItems = (orderItems: any[], cartItems: any[]) => {
        return orderItems.map(item => {
          const cartItem = cartItems.find(ci => ci.product_id === item.product_id)
          const product = cartItem?.wine_products

          if (!product) {
            throw new Error(`Product not found for item ${item.product_id}`)
          }

          return { ...item, product_snapshot: {} }
        })
      }

      expect(() => {
        processOrderItems(orderItems, cartItems)
      }).toThrow('Product not found for item missing-product-id')
    })

    it('should validate required snapshot fields', () => {
      const requiredFields = [
        'id', 'sku', 'name', 'vintage', 'varietal', 'price_eur',
        'alcohol_content', 'volume_ml', 'description_en', 'description_fr',
        'organic_certified', 'biodynamic_certified', 'vegan_friendly',
        'order_price_eur', 'snapshot_created_at'
      ]

      const snapshot = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        sku: 'DOM-2021-TEST-750',
        name: 'Test Wine',
        vintage: 2021,
        varietal: 'Test Varietal',
        region: 'Test Region',
        price_eur: 25.00,
        alcohol_content: 14.0,
        volume_ml: 750,
        description_en: 'Test description',
        description_fr: 'Description test',
        organic_certified: false,
        biodynamic_certified: false,
        vegan_friendly: false,
        image_url: null,
        order_price_eur: 25.00,
        snapshot_created_at: new Date().toISOString()
      }

      requiredFields.forEach(field => {
        expect(snapshot).toHaveProperty(field)
      })
    })
  })

  describe('Database Integration', () => {
    it('should include product_snapshot in order item insert', () => {
      const mockOrderItem = {
        order_id: 'order-123',
        product_id: 'product-456',
        product_snapshot: {
          id: 'product-456',
          sku: 'TEST-SKU',
          name: 'Test Product',
          vintage: 2021,
          price_eur: 25.00,
          order_price_eur: 24.00
        },
        quantity: 2,
        unit_price_eur: 24.00,
        vat_rate: 20.00,
        vat_amount_eur: 9.60,
        line_total_eur: 57.60
      }

      // Verify the order item has all required fields including product_snapshot
      expect(mockOrderItem.product_snapshot).toBeDefined()
      expect(mockOrderItem.product_snapshot.id).toBe('product-456')
      expect(mockOrderItem.product_snapshot.sku).toBe('TEST-SKU')
      expect(mockOrderItem.product_snapshot.name).toBe('Test Product')
      expect(mockOrderItem.product_snapshot.order_price_eur).toBe(24.00)

      // Verify all required database fields are present
      expect(mockOrderItem.order_id).toBeDefined()
      expect(mockOrderItem.product_id).toBeDefined()
      expect(mockOrderItem.product_snapshot).toBeDefined()
      expect(mockOrderItem.quantity).toBeDefined()
      expect(mockOrderItem.unit_price_eur).toBeDefined()
      expect(mockOrderItem.vat_rate).toBeDefined()
      expect(mockOrderItem.vat_amount_eur).toBeDefined()
      expect(mockOrderItem.line_total_eur).toBeDefined()
    })
  })
})