/**
 * Example usage of the Admin Products API endpoints
 *
 * This file demonstrates how to interact with the comprehensive
 * admin product API for the Domaine Vallot wine e-commerce platform.
 */

// Type definitions for the API responses
interface ApiResponse<T> {
  message?: string;
  error?: string;
  data?: T;
  details?: Record<string, string[]>;
}

interface WineProduct {
  id: string;
  sku: string;
  name: string;
  vintage: number;
  varietal: string;
  region?: string;
  alcohol_content: number;
  volume_ml: number;
  price_eur: number;
  cost_eur?: number;
  stock_quantity: number;
  description_en: string;
  description_fr: string;
  tasting_notes_en?: string;
  tasting_notes_fr?: string;
  organic_certified: boolean;
  biodynamic_certified: boolean;
  featured: boolean;
  slug_en: string;
  slug_fr: string;
  created_at: string;
  updated_at: string;
  product_images: ProductImage[];
}

interface ProductImage {
  id: string;
  url: string;
  alt_text_en?: string;
  alt_text_fr?: string;
  display_order: number;
  image_type: 'bottle' | 'label' | 'vineyard' | 'winemaker';
  is_primary: boolean;
}

interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  filters: Record<string, any>;
}

/**
 * Admin API Client Class
 */
class AdminProductsAPI {
  private baseUrl: string;
  private authToken: string;

  constructor(baseUrl: string = '/api/admin', authToken: string) {
    this.baseUrl = baseUrl;
    this.authToken = authToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.authToken}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Create a new wine product
   */
  async createProduct(productData: {
    sku?: string;
    name: string;
    vintage: number;
    varietal: string;
    region?: string;
    alcohol_content: number;
    volume_ml?: number;
    price_eur: number;
    cost_eur?: number;
    stock_quantity?: number;
    description_en: string;
    description_fr: string;
    tasting_notes_en?: string;
    tasting_notes_fr?: string;
    food_pairing_en?: string;
    food_pairing_fr?: string;
    organic_certified?: boolean;
    biodynamic_certified?: boolean;
    featured?: boolean;
    slug_en?: string;
    slug_fr?: string;
    images?: Array<{
      url: string;
      alt_text_en?: string;
      alt_text_fr?: string;
      image_type?: 'bottle' | 'label' | 'vineyard' | 'winemaker';
      is_primary?: boolean;
    }>;
  }): Promise<{ product: WineProduct }> {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  /**
   * Update an existing wine product
   */
  async updateProduct(
    productId: string,
    updates: Partial<Parameters<AdminProductsAPI['createProduct']>[0]>
  ): Promise<{ product: WineProduct }> {
    return this.request(`/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Get a single product by ID
   */
  async getProduct(productId: string): Promise<{ product: WineProduct }> {
    return this.request(`/products/${productId}`);
  }

  /**
   * List products with filtering and pagination
   */
  async listProducts(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'active' | 'inactive';
    featured?: boolean;
    inStock?: boolean;
    sortBy?: 'name' | 'sku' | 'vintage' | 'price_eur' | 'stock_quantity' | 'created_at';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<PaginatedResponse<WineProduct>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });

    return this.request(`/products?${searchParams.toString()}`);
  }

  /**
   * Delete a product (soft delete)
   */
  async deleteProduct(productId: string): Promise<{ product: { id: string; name: string; sku: string } }> {
    return this.request(`/products/${productId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Upload product images
   */
  async uploadImages(
    files: File[],
    productId?: string
  ): Promise<{
    images: Array<{
      fileName: string;
      url: string;
      size: number;
      type: string;
    }>;
  }> {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    if (productId) {
      formData.append('productId', productId);
    }

    return this.request('/products/images', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.authToken}`,
        // Don't set Content-Type for FormData
      },
      body: formData,
    });
  }

  /**
   * Delete images
   */
  async deleteImages(
    imageIds?: string[],
    imagePaths?: string[]
  ): Promise<{ deletedImages: Array<{ id?: string; path: string }> }> {
    return this.request('/products/images', {
      method: 'DELETE',
      body: JSON.stringify({ imageIds, imagePaths }),
    });
  }
}

/**
 * Usage Examples
 */

// Initialize the API client
const adminAPI = new AdminProductsAPI('/api/admin', 'your-auth-token');

// Example 1: Create a complete wine product
async function createCompleteProduct() {
  try {
    const newProduct = await adminAPI.createProduct({
      name: 'Vinsobres Rouge Excellence',
      vintage: 2022,
      varietal: 'Syrah, Grenache',
      region: 'Vinsobres AOC',
      alcohol_content: 14.5,
      volume_ml: 750,
      price_eur: 32.50,
      cost_eur: 15.00,
      stock_quantity: 100,
      description_en: 'A premium Vinsobres wine showcasing the perfect blend of Syrah and Grenache. Aged in oak barrels for 12 months, this wine offers complex aromas and a rich, full-bodied taste.',
      description_fr: 'Un vin de Vinsobres premium mettant en valeur le parfait assemblage de Syrah et Grenache. Élevé en fûts de chêne pendant 12 mois, ce vin offre des arômes complexes et un goût riche et corsé.',
      tasting_notes_en: 'Deep ruby color with aromas of blackberry, pepper, herbs, and vanilla. Full-bodied with firm tannins and a long finish.',
      tasting_notes_fr: 'Couleur rubis profond avec des arômes de mûre, poivre, herbes et vanille. Corsé avec des tanins fermes et une longue finale.',
      food_pairing_en: 'Perfect with grilled red meats, game, aged cheeses, and chocolate desserts.',
      food_pairing_fr: 'Parfait avec les viandes rouges grillées, le gibier, les fromages affinés et les desserts au chocolat.',
      organic_certified: true,
      biodynamic_certified: true,
      featured: true,
      images: [
        {
          url: 'https://example.com/bottle-front.jpg',
          alt_text_en: 'Vinsobres Rouge Excellence bottle front view',
          alt_text_fr: 'Bouteille Vinsobres Rouge Excellence vue de face',
          image_type: 'bottle',
          is_primary: true
        },
        {
          url: 'https://example.com/bottle-back.jpg',
          alt_text_en: 'Vinsobres Rouge Excellence bottle back label',
          alt_text_fr: 'Étiquette arrière bouteille Vinsobres Rouge Excellence',
          image_type: 'label',
          is_primary: false
        }
      ]
    });

    console.log('Product created:', newProduct.product);
    return newProduct.product;
  } catch (error) {
    console.error('Failed to create product:', error);
    throw error;
  }
}

// Example 2: Update product stock and price
async function updateProductInventory(productId: string, newStock: number, newPrice?: number) {
  try {
    const updates: any = { stock_quantity: newStock };
    if (newPrice) {
      updates.price_eur = newPrice;
    }

    const updatedProduct = await adminAPI.updateProduct(productId, updates);
    console.log('Product updated:', updatedProduct.product);
    return updatedProduct.product;
  } catch (error) {
    console.error('Failed to update product:', error);
    throw error;
  }
}

// Example 3: Search and filter products
async function searchProducts() {
  try {
    // Search for Syrah wines that are featured and in stock
    const results = await adminAPI.listProducts({
      search: 'syrah',
      featured: true,
      inStock: true,
      sortBy: 'price_eur',
      sortOrder: 'desc',
      limit: 20
    });

    console.log(`Found ${results.pagination.total} products`);
    results.items.forEach(product => {
      console.log(`- ${product.name} (${product.vintage}) - €${product.price_eur}`);
    });

    return results;
  } catch (error) {
    console.error('Failed to search products:', error);
    throw error;
  }
}

// Example 4: Upload images for an existing product
async function uploadProductImages(productId: string, imageFiles: File[]) {
  try {
    const uploadResult = await adminAPI.uploadImages(imageFiles, productId);
    console.log(`Uploaded ${uploadResult.images.length} images`);
    uploadResult.images.forEach(image => {
      console.log(`- ${image.fileName}: ${image.url}`);
    });
    return uploadResult.images;
  } catch (error) {
    console.error('Failed to upload images:', error);
    throw error;
  }
}

// Example 5: Bulk operations - Update multiple products
async function bulkUpdatePrices(priceIncrease: number) {
  try {
    // Get all active products
    const products = await adminAPI.listProducts({
      status: 'active',
      limit: 100
    });

    const updatePromises = products.items.map(product => {
      const newPrice = Math.round((product.price_eur * (1 + priceIncrease)) * 100) / 100;
      return adminAPI.updateProduct(product.id, { price_eur: newPrice });
    });

    const results = await Promise.allSettled(updatePromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Bulk price update completed: ${successful} successful, ${failed} failed`);
    return { successful, failed };
  } catch (error) {
    console.error('Failed bulk update:', error);
    throw error;
  }
}

// Example 6: Complete product lifecycle
async function productLifecycleExample() {
  try {
    // 1. Create product
    console.log('1. Creating product...');
    const product = await createCompleteProduct();

    // 2. Update product details
    console.log('2. Updating product...');
    await updateProductInventory(product.id, 75, 35.00);

    // 3. Search for the product
    console.log('3. Searching products...');
    await searchProducts();

    // 4. Soft delete product (for demo - uncomment if needed)
    // console.log('4. Deleting product...');
    // await adminAPI.deleteProduct(product.id);

    console.log('Product lifecycle completed successfully!');
  } catch (error) {
    console.error('Product lifecycle failed:', error);
  }
}

// Example error handling with validation
async function handleValidationErrors() {
  try {
    // This will fail validation
    await adminAPI.createProduct({
      name: 'A', // Too short
      vintage: 1700, // Too old
      varietal: '', // Empty
      alcohol_content: -5, // Negative
      price_eur: -10, // Negative
      description_en: 'short', // Too short
      description_fr: 'court' // Too short
    });
  } catch (error) {
    console.error('Expected validation error:', error.message);
    // Handle validation errors appropriately in your UI
  }
}

// Export for use in other modules
export {
  AdminProductsAPI,
  createCompleteProduct,
  updateProductInventory,
  searchProducts,
  uploadProductImages,
  bulkUpdatePrices,
  productLifecycleExample,
  handleValidationErrors
};

// Example usage in a React component or Node.js script
/*
import { AdminProductsAPI } from './admin-api-usage';

const adminAPI = new AdminProductsAPI('/api/admin', localStorage.getItem('authToken'));

// In a React component
useEffect(() => {
  productLifecycleExample();
}, []);
*/