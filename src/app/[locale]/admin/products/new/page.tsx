'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProductForm, { ProductFormData } from '@/components/admin/ProductForm';
import { ArrowLeft, Save, AlertCircle, CheckCircle } from 'lucide-react';

export default function NewProductPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async (productData: ProductFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
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

        throw new Error(errorData.error || 'Failed to create product');
      }

      const result = await response.json();

      setSuccess(true);

      // Show success message briefly, then redirect
      setTimeout(() => {
        router.push(`/${locale}/admin/products`);
      }, 2000);

    } catch (error) {
      console.error('Failed to create product:', error);
      setError(error instanceof Error ? error.message : 'Failed to create product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/${locale}/admin/products`);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Created!</h2>
          <p className="text-gray-600 mb-4">
            Your new wine product has been successfully created and is now available in your product catalog.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to products list...
          </p>
        </div>
      </div>
    );
  }

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
            <span className="text-gray-900 font-medium">New Product</span>
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Add New Wine Product</h1>
              <p className="text-gray-600 mt-1">
                Create a new wine product for your catalog with detailed information and images.
              </p>
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
              <h3 className="text-sm font-medium text-red-800">Error Creating Product</h3>
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

      {/* Quick Tips */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">💡 Quick Tips for Adding Products</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Required fields:</strong> Product name, varietal, price, stock quantity, volume, weight, and URL slugs</li>
            <li>• <strong>SEO-friendly:</strong> Fill in SEO titles and descriptions for better search visibility</li>
            <li>• <strong>Images:</strong> Upload high-quality product images (first image becomes the main display)</li>
            <li>• <strong>Multilingual:</strong> Add descriptions in both English and French for international customers</li>
            <li>• <strong>Auto-save:</strong> Your progress is automatically saved as you work</li>
          </ul>
        </div>
      </div>

      {/* Form */}
      <ProductForm
        mode="create"
        onSave={handleSave}
        onCancel={handleCancel}
        isLoading={isLoading}
      />

      {/* Footer Actions */}
      <div className="bg-white border-t border-gray-200 sticky bottom-0">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Remember to set appropriate stock levels and pricing before activating the product.
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
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Create Product
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