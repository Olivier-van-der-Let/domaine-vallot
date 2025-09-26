'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProductForm, { ProductFormData } from '@/components/admin/ProductForm';
import { ArrowLeft, Save, AlertCircle, CheckCircle, Loader2, Package } from 'lucide-react';

interface ProductWithImages {
  id: string;
  sku: string;
  name: string;
  vintage?: number;
  varietal: string;
  region?: string;
  alcohol_content?: number;
  volume_ml: number;
  price_eur: number;
  cost_eur?: number;
  stock_quantity: number;
  reserved_quantity: number;
  reorder_level?: number;
  weight_grams: number;
  description_en?: string;
  description_fr?: string;
  tasting_notes_en?: string;
  tasting_notes_fr?: string;
  food_pairing_en?: string;
  food_pairing_fr?: string;
  production_notes_en?: string;
  production_notes_fr?: string;
  allergens?: string[];
  organic_certified: boolean;
  biodynamic_certified: boolean;
  vegan_friendly: boolean;
  google_product_category?: string;
  meta_product_category?: string;
  is_active: boolean;
  featured: boolean;
  sort_order: number;
  seo_title_en?: string;
  seo_title_fr?: string;
  seo_description_en?: string;
  seo_description_fr?: string;
  slug_en: string;
  slug_fr: string;
  created_at: string;
  updated_at: string;
  product_images?: {
    id: string;
    url: string;
    alt_text_en?: string;
    alt_text_fr?: string;
    display_order: number;
    image_type: 'bottle' | 'label' | 'vineyard' | 'winemaker';
    is_primary: boolean;
  }[];
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const productId = params.id as string;

  const [product, setProduct] = useState<ProductWithImages | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load product data
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/admin/products/${productId}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Product not found');
          }
          throw new Error('Failed to load product');
        }

        const data = await response.json();
        setProduct(data.product);

      } catch (error) {
        console.error('Failed to load product:', error);
        setError(error instanceof Error ? error.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const transformProductForForm = (product: ProductWithImages): ProductFormData => {
    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      vintage: product.vintage,
      varietal: product.varietal,
      region: product.region,
      alcohol_content: product.alcohol_content,
      volume_ml: product.volume_ml,
      price_eur: product.price_eur,
      cost_eur: product.cost_eur,
      stock_quantity: product.stock_quantity,
      reserved_quantity: product.reserved_quantity,
      reorder_level: product.reorder_level,
      weight_grams: product.weight_grams,
      description_en: product.description_en,
      description_fr: product.description_fr,
      tasting_notes_en: product.tasting_notes_en,
      tasting_notes_fr: product.tasting_notes_fr,
      food_pairing_en: product.food_pairing_en,
      food_pairing_fr: product.food_pairing_fr,
      production_notes_en: product.production_notes_en,
      production_notes_fr: product.production_notes_fr,
      allergens: product.allergens || [],
      organic_certified: product.organic_certified,
      biodynamic_certified: product.biodynamic_certified,
      vegan_friendly: product.vegan_friendly,
      google_product_category: product.google_product_category,
      meta_product_category: product.meta_product_category,
      is_active: product.is_active,
      featured: product.featured,
      sort_order: product.sort_order,
      seo_title_en: product.seo_title_en,
      seo_title_fr: product.seo_title_fr,
      seo_description_en: product.seo_description_en,
      seo_description_fr: product.seo_description_fr,
      slug_en: product.slug_en,
      slug_fr: product.slug_fr,
      images: product.product_images?.map(img => ({
        url: img.url,
        alt_text_en: img.alt_text_en,
        alt_text_fr: img.alt_text_fr,
        display_order: img.display_order,
        image_type: img.image_type,
        is_primary: img.is_primary,
      })) || [],
    };
  };

  const handleSave = async (productData: ProductFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle validation errors
        if (response.status === 400 && errorData.details) {
          const errorMessages = Object.entries(errorData.details)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n');
          throw new Error(`Validation errors:\n${errorMessages}`);
        }

        throw new Error(errorData.error || 'Failed to update product');
      }

      const result = await response.json();

      setSuccess(true);

      // Show success message briefly, then redirect
      setTimeout(() => {
        router.push(`/${locale}/admin/products`);
      }, 2000);

    } catch (error) {
      console.error('Failed to update product:', error);
      setError(error instanceof Error ? error.message : 'Failed to update product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/${locale}/admin/products`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-wine-600 animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Loading Product</h2>
          <p className="text-gray-600">Please wait while we fetch the product details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-6">
            {error === 'Product not found'
              ? 'The product you are looking for does not exist or has been removed.'
              : 'There was an error loading the product. Please try again.'
            }
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push(`/${locale}/admin/products`)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back to Products
            </button>
            {error !== 'Product not found' && (
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-wine-600 text-white rounded-lg hover:bg-wine-700"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Updated!</h2>
          <p className="text-gray-600 mb-4">
            Your wine product has been successfully updated with the latest information.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to products list...
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const formData = transformProductForForm(product);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <nav className="flex items-center text-sm text-gray-500">
            <button
              onClick={() => router.push(`/${locale}/admin`)}
              className="hover:text-gray-700"
            >
              Admin
            </button>
            <span className="mx-2">/</span>
            <button
              onClick={() => router.push(`/${locale}/admin/products`)}
              className="hover:text-gray-700"
            >
              Products
            </button>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium truncate max-w-xs" title={product.name}>
              {product.name}
            </span>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Edit</span>
          </nav>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleCancel}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to products"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 truncate">
                Edit: {product.name}
              </h1>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                <span>SKU: {product.sku}</span>
                <span>•</span>
                <span>
                  {product.vintage ? `${product.varietal} ${product.vintage}` : product.varietal}
                </span>
                <span>•</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  product.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {product.is_active ? 'Active' : 'Inactive'}
                </span>
                {product.featured && (
                  <>
                    <span>•</span>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                      Featured
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error Updating Product</h3>
              <div className="text-sm text-red-700 mt-1 whitespace-pre-line">
                {error}
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Product Info */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">📝 Editing Product</h3>
          <div className="text-sm text-blue-700 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="font-medium">Stock:</span> {product.stock_quantity} available
              {product.reserved_quantity > 0 && (
                <span className="text-blue-600"> ({product.reserved_quantity} reserved)</span>
              )}
            </div>
            <div>
              <span className="font-medium">Price:</span> €{product.price_eur.toFixed(2)}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span>{' '}
              {new Date(product.updated_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <ProductForm
        product={formData}
        mode="edit"
        onSave={handleSave}
        onCancel={handleCancel}
        isLoading={isLoading}
      />

      {/* Footer Actions */}
      <div className="bg-white border-t border-gray-200 sticky bottom-0">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Last saved: {new Date(product.updated_at).toLocaleString()}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="product-form"
                disabled={isLoading}
                className="px-6 py-2 bg-wine-600 text-white rounded-lg hover:bg-wine-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Update Product
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}