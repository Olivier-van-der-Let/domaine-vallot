import {
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct
} from '@/lib/supabase/server';

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(() => mockQueryBuilder),
  auth: {
    getUser: jest.fn(() => Promise.resolve({
      data: { user: { id: 'admin-123', email: 'admin@example.com' } },
      error: null
    }))
  },
  storage: {
    from: jest.fn(() => mockStorageClient)
  }
};

const mockQueryBuilder = {
  select: jest.fn(() => mockQueryBuilder),
  insert: jest.fn(() => mockQueryBuilder),
  update: jest.fn(() => mockQueryBuilder),
  delete: jest.fn(() => mockQueryBuilder),
  eq: jest.fn(() => mockQueryBuilder),
  neq: jest.fn(() => mockQueryBuilder),
  gte: jest.fn(() => mockQueryBuilder),
  lte: jest.fn(() => mockQueryBuilder),
  lt: jest.fn(() => mockQueryBuilder),
  gt: jest.fn(() => mockQueryBuilder),
  ilike: jest.fn(() => mockQueryBuilder),
  in: jest.fn(() => mockQueryBuilder),
  order: jest.fn(() => mockQueryBuilder),
  range: jest.fn(() => mockQueryBuilder),
  single: jest.fn(() => mockQueryBuilder),
  limit: jest.fn(() => mockQueryBuilder),
  count: jest.fn(() => mockQueryBuilder),
  then: jest.fn(),
  catch: jest.fn()
};

const mockStorageClient = {
  remove: jest.fn(() => Promise.resolve({ data: null, error: null }))
};

// Mock the createAdminClient function
jest.mock('@/lib/supabase/server', () => {
  const actual = jest.requireActual('@/lib/supabase/server');
  return {
    ...actual,
    createAdminClient: jest.fn(() => mockSupabaseClient),
    getAdminProducts: jest.fn(),
    createAdminProduct: jest.fn(),
    updateAdminProduct: jest.fn(),
    deleteAdminProduct: jest.fn(),
  };
});

const mockProduct = {
  id: 'test-product-1',
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
  is_active: true,
  featured: false,
  sort_order: 1,
  slug_en: 'test-wine-chardonnay-2020',
  slug_fr: 'vin-test-chardonnay-2020',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('Admin Products Supabase Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAdminProducts', () => {
    it('should fetch products with default pagination', async () => {
      const mockData = [mockProduct];

      // Mock the chain of query builder calls
      mockQueryBuilder.then.mockResolvedValueOnce({
        data: mockData,
        count: 1,
        error: null
      });

      const { getAdminProducts: actualGetAdminProducts } = jest.requireActual('@/lib/supabase/server');

      const result = await actualGetAdminProducts({
        page: 1,
        limit: 20
      });

      expect(result.data).toEqual(mockData);
      expect(result.count).toBe(1);
      expect(result.error).toBeNull();
    });

    it('should apply search filter', async () => {
      const mockData = [mockProduct];

      mockQueryBuilder.then.mockResolvedValueOnce({
        data: mockData,
        count: 1,
        error: null
      });

      const { getAdminProducts: actualGetAdminProducts } = jest.requireActual('@/lib/supabase/server');

      await actualGetAdminProducts({
        page: 1,
        limit: 20,
        search: 'Chardonnay'
      });

      // Verify that search filters were applied
      expect(mockQueryBuilder.ilike).toHaveBeenCalled();
    });

    it('should apply varietal filter', async () => {
      const mockData = [mockProduct];

      mockQueryBuilder.then.mockResolvedValueOnce({
        data: mockData,
        count: 1,
        error: null
      });

      const { getAdminProducts: actualGetAdminProducts } = jest.requireActual('@/lib/supabase/server');

      await actualGetAdminProducts({
        page: 1,
        limit: 20,
        varietal: 'chardonnay'
      });

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('varietal', 'chardonnay');
    });

    it('should apply low stock filter', async () => {
      const mockData = [mockProduct];

      mockQueryBuilder.then.mockResolvedValueOnce({
        data: mockData,
        count: 1,
        error: null
      });

      const { getAdminProducts: actualGetAdminProducts } = jest.requireActual('@/lib/supabase/server');

      await actualGetAdminProducts({
        page: 1,
        limit: 20,
        filter: 'low_stock'
      });

      expect(mockQueryBuilder.lte).toHaveBeenCalledWith('stock_quantity', 5);
      expect(mockQueryBuilder.gt).toHaveBeenCalledWith('stock_quantity', 0);
    });

    it('should apply out of stock filter', async () => {
      const mockData = [];

      mockQueryBuilder.then.mockResolvedValueOnce({
        data: mockData,
        count: 0,
        error: null
      });

      const { getAdminProducts: actualGetAdminProducts } = jest.requireActual('@/lib/supabase/server');

      await actualGetAdminProducts({
        page: 1,
        limit: 20,
        filter: 'out_of_stock'
      });

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('stock_quantity', 0);
    });

    it('should handle pagination correctly', async () => {
      const mockData = [mockProduct];

      mockQueryBuilder.then.mockResolvedValueOnce({
        data: mockData,
        count: 50,
        error: null
      });

      const { getAdminProducts: actualGetAdminProducts } = jest.requireActual('@/lib/supabase/server');

      await actualGetAdminProducts({
        page: 3,
        limit: 10
      });

      // Should skip first 20 items (page 3, limit 10 = skip 20)
      expect(mockQueryBuilder.range).toHaveBeenCalledWith(20, 29);
    });

    it('should handle database errors', async () => {
      const error = { message: 'Database connection failed' };

      mockQueryBuilder.then.mockResolvedValueOnce({
        data: null,
        count: null,
        error
      });

      const { getAdminProducts: actualGetAdminProducts } = jest.requireActual('@/lib/supabase/server');

      const result = await actualGetAdminProducts({
        page: 1,
        limit: 20
      });

      expect(result.data).toBeNull();
      expect(result.error).toEqual(error);
    });
  });

  describe('createAdminProduct', () => {
    it('should create product successfully', async () => {
      const newProduct = { ...mockProduct };
      delete newProduct.id; // Remove ID for create operation

      mockQueryBuilder.then.mockResolvedValueOnce({
        data: [mockProduct],
        error: null
      });

      const { createAdminProduct: actualCreateAdminProduct } = jest.requireActual('@/lib/supabase/server');

      const result = await actualCreateAdminProduct(newProduct);

      expect(result.data).toEqual([mockProduct]);
      expect(result.error).toBeNull();
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith([newProduct]);
      expect(mockQueryBuilder.select).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const invalidProduct = { name: '' }; // Invalid product
      const error = { message: 'Validation failed', code: '23514' };

      mockQueryBuilder.then.mockResolvedValueOnce({
        data: null,
        error
      });

      const { createAdminProduct: actualCreateAdminProduct } = jest.requireActual('@/lib/supabase/server');

      const result = await actualCreateAdminProduct(invalidProduct);

      expect(result.data).toBeNull();
      expect(result.error).toEqual(error);
    });

    it('should handle duplicate SKU errors', async () => {
      const duplicateProduct = { ...mockProduct, sku: 'EXISTING-SKU' };
      const error = { message: 'SKU already exists', code: '23505' };

      mockQueryBuilder.then.mockResolvedValueOnce({
        data: null,
        error
      });

      const { createAdminProduct: actualCreateAdminProduct } = jest.requireActual('@/lib/supabase/server');

      const result = await actualCreateAdminProduct(duplicateProduct);

      expect(result.data).toBeNull();
      expect(result.error).toEqual(error);
    });
  });

  describe('updateAdminProduct', () => {
    it('should update product successfully', async () => {
      const updateData = { name: 'Updated Wine Name', price_eur: 30.00 };
      const updatedProduct = { ...mockProduct, ...updateData };

      mockQueryBuilder.then.mockResolvedValueOnce({
        data: [updatedProduct],
        error: null
      });

      const { updateAdminProduct: actualUpdateAdminProduct } = jest.requireActual('@/lib/supabase/server');

      const result = await actualUpdateAdminProduct('test-product-1', updateData);

      expect(result.data).toEqual([updatedProduct]);
      expect(result.error).toBeNull();
      expect(mockQueryBuilder.update).toHaveBeenCalledWith({
        ...updateData,
        updated_at: expect.any(String)
      });
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'test-product-1');
    });

    it('should handle non-existent product updates', async () => {
      const updateData = { name: 'Updated Wine Name' };

      mockQueryBuilder.then.mockResolvedValueOnce({
        data: [],
        error: null
      });

      const { updateAdminProduct: actualUpdateAdminProduct } = jest.requireActual('@/lib/supabase/server');

      const result = await actualUpdateAdminProduct('non-existent-id', updateData);

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });

    it('should validate update data', async () => {
      const invalidUpdate = { price_eur: -10 }; // Invalid price
      const error = { message: 'Price must be positive', code: '23514' };

      mockQueryBuilder.then.mockResolvedValueOnce({
        data: null,
        error
      });

      const { updateAdminProduct: actualUpdateAdminProduct } = jest.requireActual('@/lib/supabase/server');

      const result = await actualUpdateAdminProduct('test-product-1', invalidUpdate);

      expect(result.data).toBeNull();
      expect(result.error).toEqual(error);
    });
  });

  describe('deleteAdminProduct', () => {
    it('should delete product successfully', async () => {
      // Mock product with images
      const productWithImages = {
        ...mockProduct,
        product_images: [
          { id: 'img1', url: 'bucket/image1.jpg' },
          { id: 'img2', url: 'bucket/image2.jpg' }
        ]
      };

      // Mock get product call
      mockQueryBuilder.then
        .mockResolvedValueOnce({
          data: productWithImages,
          error: null
        })
        .mockResolvedValueOnce({
          data: [{ id: 'test-product-1' }],
          error: null
        });

      const { deleteAdminProduct: actualDeleteAdminProduct } = jest.requireActual('@/lib/supabase/server');

      const result = await actualDeleteAdminProduct('test-product-1');

      expect(result.data).toEqual([{ id: 'test-product-1' }]);
      expect(result.error).toBeNull();

      // Should delete associated images from storage
      expect(mockStorageClient.remove).toHaveBeenCalledWith([
        'image1.jpg',
        'image2.jpg'
      ]);

      // Should delete product from database
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'test-product-1');
    });

    it('should handle non-existent product deletion', async () => {
      mockQueryBuilder.then.mockResolvedValueOnce({
        data: null,
        error: { message: 'Product not found', code: 'PGRST116' }
      });

      const { deleteAdminProduct: actualDeleteAdminProduct } = jest.requireActual('@/lib/supabase/server');

      const result = await actualDeleteAdminProduct('non-existent-id');

      expect(result.data).toBeNull();
      expect(result.error.message).toBe('Product not found');
    });

    it('should handle products with orders (referential integrity)', async () => {
      const error = {
        message: 'Cannot delete product with existing orders',
        code: '23503' // Foreign key constraint violation
      };

      mockQueryBuilder.then
        .mockResolvedValueOnce({
          data: mockProduct,
          error: null
        })
        .mockResolvedValueOnce({
          data: null,
          error
        });

      const { deleteAdminProduct: actualDeleteAdminProduct } = jest.requireActual('@/lib/supabase/server');

      const result = await actualDeleteAdminProduct('test-product-1');

      expect(result.data).toBeNull();
      expect(result.error).toEqual(error);
    });

    it('should handle storage deletion errors gracefully', async () => {
      const productWithImages = {
        ...mockProduct,
        product_images: [{ id: 'img1', url: 'bucket/image1.jpg' }]
      };

      // Mock storage error
      mockStorageClient.remove.mockRejectedValueOnce(new Error('Storage error'));

      mockQueryBuilder.then
        .mockResolvedValueOnce({
          data: productWithImages,
          error: null
        })
        .mockResolvedValueOnce({
          data: [{ id: 'test-product-1' }],
          error: null
        });

      const { deleteAdminProduct: actualDeleteAdminProduct } = jest.requireActual('@/lib/supabase/server');

      // Should still delete the product even if storage deletion fails
      const result = await actualDeleteAdminProduct('test-product-1');

      expect(result.data).toEqual([{ id: 'test-product-1' }]);
      expect(result.error).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts', async () => {
      const timeoutError = { message: 'Network timeout', code: 'NETWORK_ERROR' };

      mockQueryBuilder.then.mockRejectedValueOnce(timeoutError);

      const { getAdminProducts: actualGetAdminProducts } = jest.requireActual('@/lib/supabase/server');

      await expect(actualGetAdminProducts({ page: 1, limit: 20 }))
        .rejects.toEqual(timeoutError);
    });

    it('should handle authentication errors', async () => {
      const authError = { message: 'Invalid JWT token', code: 'PGRST301' };

      mockQueryBuilder.then.mockResolvedValueOnce({
        data: null,
        error: authError
      });

      const { getAdminProducts: actualGetAdminProducts } = jest.requireActual('@/lib/supabase/server');

      const result = await actualGetAdminProducts({ page: 1, limit: 20 });

      expect(result.data).toBeNull();
      expect(result.error).toEqual(authError);
    });

    it('should handle rate limiting', async () => {
      const rateLimitError = { message: 'Too many requests', code: '429' };

      mockQueryBuilder.then.mockResolvedValueOnce({
        data: null,
        error: rateLimitError
      });

      const { getAdminProducts: actualGetAdminProducts } = jest.requireActual('@/lib/supabase/server');

      const result = await actualGetAdminProducts({ page: 1, limit: 20 });

      expect(result.data).toBeNull();
      expect(result.error).toEqual(rateLimitError);
    });
  });
});