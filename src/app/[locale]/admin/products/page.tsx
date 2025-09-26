'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
// ProductForm now handled by dedicated pages
import InventoryManager from '@/components/admin/InventoryManager';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Eye,
  Trash2,
  Package,
  BarChart3,
  Download,
  Upload,
  RefreshCw,
  ArrowUpDown,
  ExternalLink,
  Copy,
  Archive,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Star,
  AlertTriangle,
  CheckCircle,
  X,
  FileText,
  Calendar,
  DollarSign
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  vintage: number;
  producer: string;
  wine_type: string;
  price_euros: number;
  stock_quantity: number;
  low_stock_threshold?: number;
  is_active: boolean;
  featured: boolean;
  image_url?: string;
  slug_en: string;
  slug_fr: string;
  varietal: string;
  region: string;
  description_en?: string;
  description_fr?: string;
  created_at: string;
  updated_at: string;
  product_images?: ProductImage[];
}

interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text_en?: string;
  alt_text_fr?: string;
  display_order: number;
  is_primary: boolean;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface ApiResponse {
  products: Product[];
  pagination: PaginationInfo;
  filters: {
    search: string | null;
    status: string | null;
    featured: string | null;
    inStock: string | null;
    sortBy: string;
    sortOrder: string;
  };
}

type ViewMode = 'table' | 'cards' | 'inventory';
type SortField = 'name' | 'sku' | 'vintage' | 'price_euros' | 'stock_quantity' | 'created_at';
type SortDirection = 'asc' | 'desc';
type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
type StatusFilter = 'all' | 'active' | 'inactive';
type FeaturedFilter = 'all' | 'featured' | 'not_featured';

const WINE_TYPE_FILTERS = [
  { value: 'all', label: 'Tous les types', labelEn: 'All types' },
  { value: 'red', label: 'Rouge', labelEn: 'Red' },
  { value: 'white', label: 'Blanc', labelEn: 'White' },
  { value: 'rosé', label: 'Rosé', labelEn: 'Rosé' },
  { value: 'sparkling', label: 'Effervescent', labelEn: 'Sparkling' },
  { value: 'dessert', label: 'Dessert', labelEn: 'Dessert' },
  { value: 'fortified', label: 'Fortifié', labelEn: 'Fortified' },
];

const STATUS_FILTERS = [
  { value: 'all', label: 'Tous les statuts', labelEn: 'All status' },
  { value: 'active', label: 'Actifs', labelEn: 'Active' },
  { value: 'inactive', label: 'Inactifs', labelEn: 'Inactive' },
];

const STOCK_FILTERS = [
  { value: 'all', label: 'Tous les stocks', labelEn: 'All stock levels' },
  { value: 'in_stock', label: 'En stock', labelEn: 'In stock' },
  { value: 'low_stock', label: 'Stock faible', labelEn: 'Low stock' },
  { value: 'out_of_stock', label: 'Rupture de stock', labelEn: 'Out of stock' },
];

const FEATURED_FILTERS = [
  { value: 'all', label: 'Tous', labelEn: 'All' },
  { value: 'featured', label: 'Mis en avant', labelEn: 'Featured' },
  { value: 'not_featured', label: 'Non mis en avant', labelEn: 'Not featured' },
];

const ITEMS_PER_PAGE = 20;

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [featuredFilter, setFeaturedFilter] = useState<FeaturedFilter>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  // Removed showProductForm and editingProduct state - handled by dedicated pages
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<{ show: boolean; productIds: string[]; productNames: string[] }>({ show: false, productIds: [], productNames: [] });

  const supabase = createClient();

  useEffect(() => {
    loadProducts();
  }, [pagination.page, searchTerm, statusFilter, stockFilter, featuredFilter, sortField, sortDirection]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const searchParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        sortBy: sortField,
        sortOrder: sortDirection,
      });

      if (searchTerm.trim()) {
        searchParams.append('search', searchTerm.trim());
      }

      if (statusFilter !== 'all') {
        searchParams.append('status', statusFilter);
      }

      if (featuredFilter !== 'all') {
        searchParams.append('featured', featuredFilter === 'featured' ? 'true' : 'false');
      }

      if (stockFilter !== 'all') {
        if (stockFilter === 'in_stock') {
          searchParams.append('inStock', 'true');
        } else if (stockFilter === 'out_of_stock') {
          searchParams.append('inStock', 'false');
        }
      }

      const response = await fetch(`/api/admin/products?${searchParams.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data: ApiResponse = await response.json();
      setProducts(data.products || []);
      setPagination(data.pagination);

    } catch (error) {
      console.error('Failed to load products:', error);
      setToast({ message: 'Failed to load products', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, searchTerm, statusFilter, stockFilter, featuredFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setStockFilter('all');
    setFeaturedFilter('all');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleCreateProduct = () => {
    router.push(`/${useParams().locale}/admin/products/new`);
  };

  const handleEditProduct = (productId: string) => {
    router.push(`/${useParams().locale}/admin/products/${productId}/edit`);
  };

  const handleViewProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      window.open(`/products/${product.slug_en}`, '_blank');
    }
  };

  // handleSaveProduct removed - handled by dedicated pages

  const handleDeleteProduct = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setShowDeleteModal({
      show: true,
      productIds: [productId],
      productNames: [product.name]
    });
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`/api/admin/products`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: showDeleteModal.productIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete products');
      }

      setToast({
        message: `Successfully deleted ${showDeleteModal.productIds.length} product(s)`,
        type: 'success'
      });

      setShowDeleteModal({ show: false, productIds: [], productNames: [] });
      setSelectedProducts([]);
      await loadProducts();
    } catch (error) {
      console.error('Failed to delete products:', error);
      setToast({ message: 'Failed to delete products', type: 'error' });
    }
  };

  const handleToggleStatus = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !product.is_active }),
      });

      if (!response.ok) {
        throw new Error('Failed to update product status');
      }

      setToast({
        message: `Product ${product.is_active ? 'deactivated' : 'activated'} successfully`,
        type: 'success'
      });

      await loadProducts();
    } catch (error) {
      console.error('Failed to toggle product status:', error);
      setToast({ message: 'Failed to update product status', type: 'error' });
    }
  };

  const handleToggleFeatured = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !product.featured }),
      });

      if (!response.ok) {
        throw new Error('Failed to update featured status');
      }

      setToast({
        message: `Product ${product.featured ? 'unfeatured' : 'featured'} successfully`,
        type: 'success'
      });

      await loadProducts();
    } catch (error) {
      console.error('Failed to toggle featured status:', error);
      setToast({ message: 'Failed to update featured status', type: 'error' });
    }
  };

  const handleDuplicateProduct = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    try {
      const duplicateData = {
        ...product,
        id: undefined,
        name: `${product.name} (Copy)`,
        sku: `${product.sku}-COPY`,
        slug_en: `${product.slug_en}-copy`,
        slug_fr: `${product.slug_fr}-copy`,
        is_active: false,
        featured: false,
      };

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicateData),
      });

      if (!response.ok) {
        throw new Error('Failed to duplicate product');
      }

      setToast({ message: 'Product duplicated successfully', type: 'success' });
      await loadProducts();
    } catch (error) {
      console.error('Failed to duplicate product:', error);
      setToast({ message: 'Failed to duplicate product', type: 'error' });
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'feature' | 'unfeature' | 'delete') => {
    if (selectedProducts.length === 0) return;

    if (action === 'delete') {
      const selectedProductNames = products
        .filter(p => selectedProducts.includes(p.id))
        .map(p => p.name);

      setShowDeleteModal({
        show: true,
        productIds: selectedProducts,
        productNames: selectedProductNames
      });
      return;
    }

    try {
      let updateData: any = {};

      switch (action) {
        case 'activate':
          updateData = { is_active: true };
          break;
        case 'deactivate':
          updateData = { is_active: false };
          break;
        case 'feature':
          updateData = { featured: true };
          break;
        case 'unfeature':
          updateData = { featured: false };
          break;
      }

      const response = await fetch('/api/admin/products/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: selectedProducts, updateData }),
      });

      if (!response.ok) {
        throw new Error('Failed to perform bulk action');
      }

      setToast({
        message: `Successfully updated ${selectedProducts.length} product(s)`,
        type: 'success'
      });

      setSelectedProducts([]);
      setShowBulkActions(false);
      await loadProducts();
    } catch (error) {
      console.error('Failed to perform bulk action:', error);
      setToast({ message: 'Failed to perform bulk action', type: 'error' });
    }
  };

  const exportProducts = () => {
    const csvContent = [
      [
        'ID', 'Name', 'SKU', 'Vintage', 'Producer', 'Varietal', 'Region',
        'Wine Type', 'Price (EUR)', 'Stock', 'Low Stock Threshold',
        'Status', 'Featured', 'Created', 'Updated'
      ].join(','),
      ...displayProducts.map(product => [
        product.id,
        `"${product.name.replace(/"/g, '""')}"`,
        `"${product.sku}"`,
        product.vintage,
        `"${product.producer.replace(/"/g, '""')}"`,
        `"${product.varietal.replace(/"/g, '""')}"`,
        `"${product.region.replace(/"/g, '""')}"`,
        `"${product.wine_type}"`,
        product.price_euros.toFixed(2),
        product.stock_quantity,
        product.low_stock_threshold || 5,
        product.is_active ? 'Active' : 'Inactive',
        product.featured ? 'Featured' : 'Not Featured',
        formatDate(product.created_at),
        formatDate(product.updated_at),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `domaine-vallot-products-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToast({ message: 'Products exported successfully', type: 'success' });
  };

  // Products are already filtered and sorted by the API
  const displayProducts = products;

  const getStockStatus = (quantity: number, lowThreshold: number = 5) => {
    if (quantity === 0) {
      return {
        label: 'Rupture',
        labelEn: 'Out of stock',
        color: 'bg-red-100 text-red-800',
        icon: <AlertTriangle className="w-3 h-3" />
      };
    }
    if (quantity <= lowThreshold) {
      return {
        label: 'Stock faible',
        labelEn: 'Low stock',
        color: 'bg-orange-100 text-orange-800',
        icon: <AlertTriangle className="w-3 h-3" />
      };
    }
    return {
      label: 'En stock',
      labelEn: 'In stock',
      color: 'bg-green-100 text-green-800',
      icon: <CheckCircle className="w-3 h-3" />
    };
  };

  const getProductImage = (product: Product) => {
    if (product.product_images && product.product_images.length > 0) {
      const primaryImage = product.product_images.find(img => img.is_primary);
      return primaryImage?.url || product.product_images[0]?.url;
    }
    return product.image_url;
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  const getPaginationRange = () => {
    const start = (pagination.page - 1) * pagination.limit + 1;
    const end = Math.min(pagination.page * pagination.limit, pagination.total);
    return { start, end };
  };

  // Removed showProductForm logic - now handled by dedicated pages

  if (viewMode === 'inventory') {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion de l'inventaire</h1>
            <p className="text-gray-600">Gérez le stock et les mouvements de vos produits</p>
          </div>
          <button
            onClick={() => setViewMode('table')}
            className="px-4 py-2 bg-wine-600 text-white rounded-lg hover:bg-wine-700"
          >
            Retour aux produits
          </button>
        </div>

        <InventoryManager
          onProductEdit={handleEditProduct}
          onProductView={handleViewProduct}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Toast Notifications */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete the following product{showDeleteModal.productIds.length > 1 ? 's' : ''}?
            </p>
            <ul className="list-disc list-inside text-sm text-gray-700 mb-6 max-h-32 overflow-y-auto">
              {showDeleteModal.productNames.map((name, index) => (
                <li key={index}>{name}</li>
              ))}
            </ul>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal({ show: false, productIds: [], productNames: [] })}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete {showDeleteModal.productIds.length} Product{showDeleteModal.productIds.length > 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products Management</h1>
          <p className="text-gray-600">
            {pagination.total} product{pagination.total !== 1 ? 's' : ''} total
            {products.length > 0 && (
              <span> • Showing {getPaginationRange().start}-{getPaginationRange().end}</span>
            )}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setViewMode('inventory')}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            Inventory
          </button>
          <button
            onClick={exportProducts}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => alert('Import functionality coming soon!')}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button
            onClick={handleCreateProduct}
            className="px-4 py-2 bg-wine-600 text-white rounded-lg hover:bg-wine-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow border mb-6">
        <div className="flex flex-col gap-4">
          {/* Primary Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search products, SKU, description, varietal..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500 w-full md:w-80"
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 ${
                  (statusFilter !== 'all' || stockFilter !== 'all' || featuredFilter !== 'all')
                    ? 'bg-wine-50 border-wine-300 text-wine-700'
                    : ''
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
                {(statusFilter !== 'all' || stockFilter !== 'all' || featuredFilter !== 'all') && (
                  <span className="bg-wine-600 text-white text-xs rounded-full px-2 py-1">
                    {[statusFilter, stockFilter, featuredFilter].filter(f => f !== 'all').length}
                  </span>
                )}
              </button>

              {(searchTerm || statusFilter !== 'all' || stockFilter !== 'all' || featuredFilter !== 'all') && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 text-gray-600 hover:text-gray-800 text-sm"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {selectedProducts.length > 0 && (
                <div className="flex items-center gap-2 relative">
                  <span className="text-sm text-gray-600">
                    {selectedProducts.length} selected
                  </span>
                  <button
                    onClick={() => setShowBulkActions(!showBulkActions)}
                    className="px-3 py-1 text-sm bg-wine-100 text-wine-700 rounded hover:bg-wine-200"
                  >
                    Bulk Actions
                  </button>
                  {showBulkActions && (
                    <div className="absolute right-0 top-8 w-48 bg-white rounded-md shadow-lg border z-20">
                      <button
                        onClick={() => handleBulkAction('activate')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Activate
                      </button>
                      <button
                        onClick={() => handleBulkAction('deactivate')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Deactivate
                      </button>
                      <button
                        onClick={() => handleBulkAction('feature')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Feature
                      </button>
                      <button
                        onClick={() => handleBulkAction('unfeature')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Unfeature
                      </button>
                      <button
                        onClick={() => handleBulkAction('delete')}
                        className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2 text-sm ${viewMode === 'table' ? 'bg-wine-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  Table
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-2 text-sm ${viewMode === 'cards' ? 'bg-wine-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  Cards
                </button>
              </div>

              <button
                onClick={loadProducts}
                className={`p-2 text-gray-600 hover:text-gray-800 ${loading ? 'animate-spin' : ''}`}
                title="Refresh"
                disabled={loading}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg border-t">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); handleFilterChange(); }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
                >
                  {STATUS_FILTERS.map(filter => (
                    <option key={filter.value} value={filter.value}>
                      {filter.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Stock Level</label>
                <select
                  value={stockFilter}
                  onChange={(e) => { setStockFilter(e.target.value as StockFilter); handleFilterChange(); }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
                >
                  {STOCK_FILTERS.map(filter => (
                    <option key={filter.value} value={filter.value}>
                      {filter.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Featured</label>
                <select
                  value={featuredFilter}
                  onChange={(e) => { setFeaturedFilter(e.target.value as FeaturedFilter); handleFilterChange(); }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
                >
                  {FEATURED_FILTERS.map(filter => (
                    <option key={filter.value} value={filter.value}>
                      {filter.labelEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow border overflow-hidden">
          <div className="animate-pulse">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex space-x-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-6 py-4 border-b border-gray-200 last:border-b-0">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table View */}
      {!loading && viewMode === 'table' && (
        <div className="bg-white rounded-lg shadow border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === displayProducts.length && displayProducts.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts(displayProducts.map(p => p.id));
                        } else {
                          setSelectedProducts([]);
                        }
                      }}
                      className="w-4 h-4 text-wine-600 bg-gray-100 border-gray-300 rounded focus:ring-wine-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      Name
                      <ArrowUpDown className={`w-3 h-3 ${sortField === 'name' ? 'text-wine-600' : ''}`} />
                      {sortField === 'name' && (
                        <span className="text-wine-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('sku')}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      SKU
                      <ArrowUpDown className={`w-3 h-3 ${sortField === 'sku' ? 'text-wine-600' : ''}`} />
                      {sortField === 'sku' && (
                        <span className="text-wine-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('price_euros')}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      Price
                      <ArrowUpDown className={`w-3 h-3 ${sortField === 'price_euros' ? 'text-wine-600' : ''}`} />
                      {sortField === 'price_euros' && (
                        <span className="text-wine-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('stock_quantity')}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      Stock
                      <ArrowUpDown className={`w-3 h-3 ${sortField === 'stock_quantity' ? 'text-wine-600' : ''}`} />
                      {sortField === 'stock_quantity' && (
                        <span className="text-wine-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Featured
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('vintage')}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      Vintage
                      <ArrowUpDown className={`w-3 h-3 ${sortField === 'vintage' ? 'text-wine-600' : ''}`} />
                      {sortField === 'vintage' && (
                        <span className="text-wine-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('created_at')}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      Created
                      <ArrowUpDown className={`w-3 h-3 ${sortField === 'created_at' ? 'text-wine-600' : ''}`} />
                      {sortField === 'created_at' && (
                        <span className="text-wine-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayProducts.map((product) => {
                  const stockStatus = getStockStatus(product.stock_quantity, product.low_stock_threshold);
                  const imageUrl = getProductImage(product);
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProducts(prev => [...prev, product.id]);
                            } else {
                              setSelectedProducts(prev => prev.filter(id => id !== product.id));
                            }
                          }}
                          className="w-4 h-4 text-wine-600 bg-gray-100 border-gray-300 rounded focus:ring-wine-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {imageUrl && (
                            <img
                              src={imageUrl}
                              alt={product.name}
                              className="w-10 h-10 rounded object-cover mr-3"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {product.producer} • {product.varietal}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 font-mono">{product.sku}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-900">
                            €{product.price_euros.toFixed(2)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {stockStatus.icon}
                          <span className={`ml-1 inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                            {product.stock_quantity}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(product.id)}
                          className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full cursor-pointer hover:opacity-80 ${
                            product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {product.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleFeatured(product.id)}
                          className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full cursor-pointer hover:opacity-80 ${
                            product.featured ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <Star className={`w-3 h-3 mr-1 ${product.featured ? 'fill-current' : ''}`} />
                          {product.featured ? 'Featured' : 'Not Featured'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.vintage}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(product.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => handleViewProduct(product.id)}
                            className="p-1 text-gray-600 hover:text-gray-900 rounded"
                            title="View on website"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditProduct(product.id)}
                            className="p-1 text-blue-600 hover:text-blue-900 rounded"
                            title="Edit product"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicateProduct(product.id)}
                            className="p-1 text-purple-600 hover:text-purple-900 rounded"
                            title="Duplicate product"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-1 text-red-600 hover:text-red-900 rounded"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {displayProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' || stockFilter !== 'all' || featuredFilter !== 'all'
                  ? 'No products match your current filters. Try adjusting your search criteria.'
                  : 'No products have been created yet. Click "Add Product" to get started.'}
              </p>
              {(searchTerm || statusFilter !== 'all' || stockFilter !== 'all' || featuredFilter !== 'all') && (
                <button
                  onClick={clearFilters}
                  className="mt-3 px-4 py-2 text-sm text-wine-600 hover:text-wine-700"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && displayProducts.length > 0 && pagination.totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow border mt-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrevious}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                pagination.hasPrevious
                  ? 'text-gray-700 bg-white hover:bg-gray-50'
                  : 'text-gray-400 bg-gray-50 cursor-not-allowed'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                pagination.hasNext
                  ? 'text-gray-700 bg-white hover:bg-gray-50'
                  : 'text-gray-400 bg-gray-50 cursor-not-allowed'
              }`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">{getPaginationRange().start}</span>
                {' '}to{' '}
                <span className="font-medium">{getPaginationRange().end}</span>
                {' '}of{' '}
                <span className="font-medium">{pagination.total}</span>
                {' '}results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={pagination.page === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                    pagination.page === 1
                      ? 'text-gray-400 bg-gray-50 cursor-not-allowed'
                      : 'text-gray-500 bg-white hover:bg-gray-50'
                  }`}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrevious}
                  className={`relative inline-flex items-center px-2 py-2 border border-gray-300 text-sm font-medium ${
                    !pagination.hasPrevious
                      ? 'text-gray-400 bg-gray-50 cursor-not-allowed'
                      : 'text-gray-500 bg-white hover:bg-gray-50'
                  }`}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Page Numbers */}
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else {
                    const start = Math.max(1, pagination.page - 2);
                    const end = Math.min(pagination.totalPages, start + 4);
                    const actualStart = Math.max(1, end - 4);
                    pageNum = actualStart + i;
                  }

                  if (pageNum <= pagination.totalPages) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNum === pagination.page
                            ? 'z-10 bg-wine-50 border-wine-500 text-wine-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  return null;
                })}

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className={`relative inline-flex items-center px-2 py-2 border border-gray-300 text-sm font-medium ${
                    !pagination.hasNext
                      ? 'text-gray-400 bg-gray-50 cursor-not-allowed'
                      : 'text-gray-500 bg-white hover:bg-gray-50'
                  }`}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handlePageChange(pagination.totalPages)}
                  disabled={pagination.page === pagination.totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                    pagination.page === pagination.totalPages
                      ? 'text-gray-400 bg-gray-50 cursor-not-allowed'
                      : 'text-gray-500 bg-white hover:bg-gray-50'
                  }`}
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Cards View */}
      {!loading && viewMode === 'cards' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayProducts.map((product) => {
              const stockStatus = getStockStatus(product.stock_quantity, product.low_stock_threshold);
              const imageUrl = getProductImage(product);
              return (
                <div key={product.id} className="bg-white rounded-lg shadow border overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/images/wine-placeholder.svg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                        <Package className="w-16 h-16 text-gray-400" />
                      </div>
                    )}

                    {/* Featured Badge */}
                    {product.featured && (
                      <div className="absolute top-2 left-2">
                        <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          Featured
                        </span>
                      </div>
                    )}

                    {/* Selection Checkbox */}
                    <div className="absolute top-2 right-2">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProducts(prev => [...prev, product.id]);
                          } else {
                            setSelectedProducts(prev => prev.filter(id => id !== product.id));
                          }
                        }}
                        className="w-4 h-4 text-wine-600 bg-gray-100 border-gray-300 rounded focus:ring-wine-500"
                      />
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="mb-3">
                      <h3 className="text-lg font-medium text-gray-900 line-clamp-2 min-h-[3rem]">
                        {product.name} {product.vintage}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">{product.producer}</p>
                      <p className="text-xs text-gray-500 font-mono">{product.sku}</p>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-lg font-semibold text-wine-600">
                          €{product.price_euros.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          {product.varietal}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        {stockStatus.icon}
                        <span className={`ml-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                          {product.stock_quantity} in stock
                        </span>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {formatDate(product.created_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleViewProduct(product.id)}
                            className="p-1 text-gray-600 hover:text-gray-900 rounded"
                            title="View on website"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditProduct(product.id)}
                            className="p-1 text-blue-600 hover:text-blue-900 rounded"
                            title="Edit product"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicateProduct(product.id)}
                            className="p-1 text-purple-600 hover:text-purple-900 rounded"
                            title="Duplicate product"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-1 text-red-600 hover:text-red-900 rounded"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State for Cards */}
          {displayProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No products found</h3>
              <p className="mt-2 text-gray-500">
                {searchTerm || statusFilter !== 'all' || stockFilter !== 'all' || featuredFilter !== 'all'
                  ? 'No products match your current filters. Try adjusting your search criteria.'
                  : 'No products have been created yet. Click "Add Product" to get started.'}
              </p>
              {(searchTerm || statusFilter !== 'all' || stockFilter !== 'all' || featuredFilter !== 'all') && (
                <button
                  onClick={clearFilters}
                  className="mt-4 px-4 py-2 text-sm text-wine-600 hover:text-wine-700 border border-wine-300 rounded-lg"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}