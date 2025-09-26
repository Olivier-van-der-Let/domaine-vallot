/**
 * TypeScript type definitions for Admin Products API
 */

// Re-export database types for convenience
export type { Database } from './database.types'

// Wine Product types based on database schema
export interface WineProduct {
  id: string
  sku: string
  name: string
  vintage: number
  varietal: string
  region: string | null
  alcohol_content: number
  volume_ml: number
  price_eur: number
  cost_eur: number | null
  stock_quantity: number
  reserved_quantity: number
  reorder_level: number | null
  weight_grams: number
  description_en: string
  description_fr: string
  tasting_notes_en: string | null
  tasting_notes_fr: string | null
  food_pairing_en: string | null
  food_pairing_fr: string | null
  production_notes_en: string | null
  production_notes_fr: string | null
  allergens: string[] | null
  organic_certified: boolean
  biodynamic_certified: boolean
  vegan_friendly: boolean
  google_product_category: string | null
  meta_product_category: string | null
  is_active: boolean
  featured: boolean
  sort_order: number
  seo_title_en: string | null
  seo_title_fr: string | null
  seo_description_en: string | null
  seo_description_fr: string | null
  slug_en: string
  slug_fr: string
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

// Product Image types
export interface ProductImage {
  id: string
  product_id: string
  url: string
  alt_text_en: string | null
  alt_text_fr: string | null
  display_order: number
  image_type: 'bottle' | 'label' | 'vineyard' | 'winemaker'
  width: number | null
  height: number | null
  file_size: number | null
  is_primary: boolean
  created_at: string
}

// Extended product with images
export interface WineProductWithImages extends WineProduct {
  product_images: ProductImage[]
}

// Create product request payload
export interface CreateWineProductRequest {
  sku?: string
  name: string
  vintage: number
  varietal: string
  region?: string | null
  alcohol_content: number
  volume_ml?: number
  price_eur: number
  cost_eur?: number | null
  stock_quantity?: number
  reserved_quantity?: number
  reorder_level?: number | null
  weight_grams?: number
  description_en: string
  description_fr: string
  tasting_notes_en?: string | null
  tasting_notes_fr?: string | null
  food_pairing_en?: string | null
  food_pairing_fr?: string | null
  production_notes_en?: string | null
  production_notes_fr?: string | null
  allergens?: string[] | null
  organic_certified?: boolean
  biodynamic_certified?: boolean
  vegan_friendly?: boolean
  google_product_category?: string | null
  meta_product_category?: string | null
  is_active?: boolean
  featured?: boolean
  sort_order?: number
  seo_title_en?: string | null
  seo_title_fr?: string | null
  seo_description_en?: string | null
  seo_description_fr?: string | null
  slug_en?: string
  slug_fr?: string
  images?: CreateProductImageRequest[]
}

// Update product request payload (all fields optional)
export interface UpdateWineProductRequest extends Partial<CreateWineProductRequest> {
  id?: never // Ensure ID is not included in update payload
}

// Image creation request
export interface CreateProductImageRequest {
  url: string
  alt_text_en?: string | null
  alt_text_fr?: string | null
  display_order?: number
  image_type?: 'bottle' | 'label' | 'vineyard' | 'winemaker'
  width?: number | null
  height?: number | null
  file_size?: number | null
  is_primary?: boolean
}

// API Response types
export interface ApiResponse<T = any> {
  message?: string
  error?: string
  data?: T
  details?: Record<string, string[]>
}

export interface CreateProductResponse extends ApiResponse {
  product: WineProductWithImages
}

export interface UpdateProductResponse extends ApiResponse {
  product: WineProductWithImages
}

export interface GetProductResponse extends ApiResponse {
  product: WineProductWithImages
}

export interface DeleteProductResponse extends ApiResponse {
  product: {
    id: string
    name: string
    sku: string
  }
}

// Pagination types
export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

export interface ListProductsResponse extends ApiResponse {
  products: WineProductWithImages[]
  pagination: PaginationInfo
  filters: ProductFilters
}

// Filter types
export interface ProductFilters {
  search?: string
  status?: 'active' | 'inactive'
  featured?: string | boolean
  inStock?: string | boolean
  sortBy?: 'name' | 'sku' | 'vintage' | 'price_eur' | 'stock_quantity' | 'created_at' | 'updated_at'
  sortOrder?: 'asc' | 'desc'
}

export interface ListProductsParams extends ProductFilters {
  page?: number
  limit?: number
}

// Image upload types
export interface UploadedImage {
  fileName: string
  originalName: string
  url: string
  size: number
  type: string
  path: string
}

export interface ImageUploadResponse extends ApiResponse {
  images: UploadedImage[]
  errors?: string[]
}

export interface ImageDeleteRequest {
  imageIds?: string[]
  imagePaths?: string[]
}

export interface DeletedImage {
  id?: string
  path: string
}

export interface ImageDeleteResponse extends ApiResponse {
  deletedImages: DeletedImage[]
  errors?: string[]
}

// Admin user types
export interface AdminUser {
  id: string
  email: string
  role: 'admin' | 'manager' | 'staff'
  first_name?: string
  last_name?: string
}

// Permission types
export type Permission =
  | 'products.read'
  | 'products.create'
  | 'products.update'
  | 'products.delete'
  | 'orders.read'
  | 'orders.update'
  | 'inquiries.read'
  | 'inquiries.update'
  | 'customers.read'

// Error types
export interface ValidationError {
  field: string
  message: string
}

export interface BusinessRuleError {
  rule: string
  message: string
}

export interface ApiError extends Error {
  status?: number
  details?: Record<string, string[]>
  validationErrors?: ValidationError[]
  businessErrors?: BusinessRuleError[]
}

// Utility types for form handling
export type ProductFormData = Omit<CreateWineProductRequest, 'images'> & {
  images?: File[] | CreateProductImageRequest[]
}

export type ProductUpdateFormData = Partial<ProductFormData>

// Search and filter utility types
export interface ProductSearchFilters {
  query?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  vintage?: number
  region?: string
  inStock?: boolean
  isOrganic?: boolean
  isBiodynamic?: boolean
  featured?: boolean
}

export interface ProductSortOptions {
  field: 'name' | 'price_eur' | 'vintage' | 'created_at' | 'stock_quantity'
  direction: 'asc' | 'desc'
}

// Bulk operation types
export interface BulkUpdateRequest {
  productIds: string[]
  updates: Partial<UpdateWineProductRequest>
}

export interface BulkUpdateResponse extends ApiResponse {
  successful: number
  failed: number
  results: Array<{
    id: string
    success: boolean
    error?: string
  }>
}

// Stock management types
export interface StockAdjustment {
  productId: string
  quantity: number
  reason: 'received' | 'sold' | 'damaged' | 'expired' | 'returned' | 'correction' | 'other'
  notes?: string
  reference?: string
}

export interface StockAdjustmentResponse extends ApiResponse {
  adjustment: StockAdjustment & {
    id: string
    created_at: string
    created_by: string
  }
  newStockLevel: number
}

// Analytics types
export interface ProductAnalytics {
  totalProducts: number
  activeProducts: number
  featuredProducts: number
  lowStockProducts: number
  outOfStockProducts: number
  totalValue: number
  averagePrice: number
  topSellingProducts: Array<{
    id: string
    name: string
    salesCount: number
    revenue: number
  }>
  recentlyAdded: WineProduct[]
}

export interface ProductAnalyticsResponse extends ApiResponse {
  analytics: ProductAnalytics
}

// Export utility functions type signatures
export type SlugGenerator = (name: string, vintage?: number) => string
export type SKUGenerator = (name: string, vintage: number, varietal: string) => string
export type ImageProcessor = (url: string) => string | null
export type CategoryDetector = (varietal: string) => 'red_wine' | 'white_wine' | 'rose_wine' | 'sparkling_wine'
export type ProductValidator = (product: any) => string[]
export type DataSanitizer = (product: any) => any

// Re-export schema types for convenience
export type {
  WineProductData,
  UpdateWineProductData,
  ProductImageData
} from '@/lib/validators/schemas'