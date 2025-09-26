import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { POST, GET, PUT, DELETE } from '@/app/api/admin/products/route';
import { GET as GetById, PUT as UpdateById, DELETE as DeleteById } from '@/app/api/admin/products/[id]/route';

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createAdminClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: mockAdminUser,
            error: null
          }))
        }))
      }))
    }))
  })),
  getAdminProducts: jest.fn(),
  createAdminProduct: jest.fn(),
  updateAdminProduct: jest.fn(),
  deleteAdminProduct: jest.fn(),
}));

const mockAdminUser = {
  id: 'admin-123',
  email: 'admin@example.com',
  role: 'admin'
};

const mockProduct = {
  id: uuidv4(),
  sku: 'TEST-001',
  name: 'Test Wine',
  vintage: 2020,
  varietal: 'Chardonnay',
  region: 'Burgundy',
  alcohol_content: 13.5,
  volume_ml: 750,
  price_eur: 25.00,
  cost_eur: 15.00,
  stock_quantity: 100,
  reserved_quantity: 0,
  reorder_level: 10,
  weight_grams: 1200,
  description_en: 'A fine Chardonnay',
  description_fr: 'Un excellent Chardonnay',
  tasting_notes_en: 'Crisp and fresh',
  tasting_notes_fr: 'Frais et vif',
  food_pairing_en: 'Seafood',
  food_pairing_fr: 'Fruits de mer',
  production_notes_en: 'Oak aged',
  production_notes_fr: 'Élevé en fût',
  allergens: ['sulfites'],
  organic_certified: true,
  biodynamic_certified: false,
  vegan_friendly: true,
  google_product_category: 'Food, Beverages & Tobacco > Beverages > Alcoholic Beverages > Wine',
  meta_product_category: 'wine',
  is_active: true,
  featured: false,
  sort_order: 1,
  seo_title_en: 'Test Wine - Premium Chardonnay',
  seo_title_fr: 'Vin Test - Chardonnay Premium',
  seo_description_en: 'Premium Chardonnay wine from Burgundy',
  seo_description_fr: 'Vin Chardonnay premium de Bourgogne',
  slug_en: 'test-wine-chardonnay-2020',
  slug_fr: 'vin-test-chardonnay-2020',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('/api/admin/products', () => {
  let mockRequest: Partial<NextRequest>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      headers: new Headers({
        'authorization': 'Bearer mock-token',
        'content-type': 'application/json',
      }),
    };
  });

  describe('POST /api/admin/products', () => {
    it('should create a new product with valid data', async () => {
      const { createAdminProduct } = require('@/lib/supabase/server');
      createAdminProduct.mockResolvedValue({
        data: mockProduct,
        error: null
      });

      mockRequest.json = jest.fn().mockResolvedValue(mockProduct);

      const response = await POST(mockRequest as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(201);
      expect(result.success).toBe(true);
      expect(result.product).toEqual(mockProduct);
      expect(createAdminProduct).toHaveBeenCalledWith(mockProduct);
    });

    it('should return 400 for invalid product data', async () => {
      const invalidProduct = {
        ...mockProduct,
        name: '', // Invalid: empty name
        price_eur: -10, // Invalid: negative price
      };

      mockRequest.json = jest.fn().mockResolvedValue(invalidProduct);

      const response = await POST(mockRequest as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
      expect(result.details).toBeDefined();
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockRequest.headers = new Headers();

      const response = await POST(mockRequest as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('should handle database errors gracefully', async () => {
      const { createAdminProduct } = require('@/lib/supabase/server');
      createAdminProduct.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      });

      mockRequest.json = jest.fn().mockResolvedValue(mockProduct);

      const response = await POST(mockRequest as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
    });
  });

  describe('GET /api/admin/products', () => {
    it('should return paginated product list', async () => {
      const { getAdminProducts } = require('@/lib/supabase/server');
      const mockProducts = [mockProduct];

      getAdminProducts.mockResolvedValue({
        data: mockProducts,
        count: 1,
        error: null
      });

      mockRequest.url = 'http://localhost:3000/api/admin/products?page=1&limit=10';

      const response = await GET(mockRequest as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.products).toEqual(mockProducts);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });

    it('should handle search filters', async () => {
      const { getAdminProducts } = require('@/lib/supabase/server');

      mockRequest.url = 'http://localhost:3000/api/admin/products?search=chardonnay&varietal=chardonnay&is_active=true';

      const response = await GET(mockRequest as NextRequest);

      expect(getAdminProducts).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        search: 'chardonnay',
        varietal: 'chardonnay',
        is_active: true
      });
    });

    it('should handle low stock filter', async () => {
      const { getAdminProducts } = require('@/lib/supabase/server');

      mockRequest.url = 'http://localhost:3000/api/admin/products?filter=low_stock';

      const response = await GET(mockRequest as NextRequest);

      expect(getAdminProducts).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        filter: 'low_stock'
      });
    });
  });
});

describe('/api/admin/products/[id]', () => {
  let mockRequest: Partial<NextRequest>;
  const productId = uuidv4();

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      headers: new Headers({
        'authorization': 'Bearer mock-token',
        'content-type': 'application/json',
      }),
    };
  });

  describe('GET /api/admin/products/[id]', () => {
    it('should return product by ID', async () => {
      const { getAdminProducts } = require('@/lib/supabase/server');
      getAdminProducts.mockResolvedValue({
        data: [mockProduct],
        error: null
      });

      const context = { params: { id: productId } };
      const response = await GetById(mockRequest as NextRequest, context);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.product).toEqual(mockProduct);
    });

    it('should return 404 for non-existent product', async () => {
      const { getAdminProducts } = require('@/lib/supabase/server');
      getAdminProducts.mockResolvedValue({
        data: [],
        error: null
      });

      const context = { params: { id: productId } };
      const response = await GetById(mockRequest as NextRequest, context);
      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Product not found');
    });
  });

  describe('PUT /api/admin/products/[id]', () => {
    it('should update product successfully', async () => {
      const { updateAdminProduct } = require('@/lib/supabase/server');
      const updatedProduct = { ...mockProduct, name: 'Updated Wine Name' };

      updateAdminProduct.mockResolvedValue({
        data: updatedProduct,
        error: null
      });

      mockRequest.json = jest.fn().mockResolvedValue(updatedProduct);

      const context = { params: { id: productId } };
      const response = await UpdateById(mockRequest as NextRequest, context);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.product.name).toBe('Updated Wine Name');
      expect(updateAdminProduct).toHaveBeenCalledWith(productId, updatedProduct);
    });

    it('should return 400 for invalid update data', async () => {
      const invalidUpdate = {
        price_eur: 'not-a-number',
        stock_quantity: -5
      };

      mockRequest.json = jest.fn().mockResolvedValue(invalidUpdate);

      const context = { params: { id: productId } };
      const response = await UpdateById(mockRequest as NextRequest, context);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
    });
  });

  describe('DELETE /api/admin/products/[id]', () => {
    it('should delete product successfully', async () => {
      const { deleteAdminProduct } = require('@/lib/supabase/server');
      deleteAdminProduct.mockResolvedValue({
        data: { id: productId },
        error: null
      });

      const context = { params: { id: productId } };
      const response = await DeleteById(mockRequest as NextRequest, context);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Product deleted successfully');
      expect(deleteAdminProduct).toHaveBeenCalledWith(productId);
    });

    it('should return 404 for non-existent product', async () => {
      const { deleteAdminProduct } = require('@/lib/supabase/server');
      deleteAdminProduct.mockResolvedValue({
        data: null,
        error: { message: 'Product not found', code: 'PGRST116' }
      });

      const context = { params: { id: productId } };
      const response = await DeleteById(mockRequest as NextRequest, context);
      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Product not found');
    });
  });
});