'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import ProductForm, { ProductFormData } from '@/components/admin/ProductForm';
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
  Archive
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  vintage: number;
  producer: string;
  wine_type: string;
  price_euros: number;
  stock_quantity: number;
  is_active: boolean;
  image_url?: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

type ViewMode = 'table' | 'cards' | 'inventory';
type SortField = 'name' | 'vintage' | 'price_euros' | 'stock_quantity' | 'created_at';
type SortDirection = 'asc' | 'desc';

const WINE_TYPE_FILTERS = [
  { value: 'all', label: 'Tous les types' },
  { value: 'red', label: 'Rouge' },
  { value: 'white', label: 'Blanc' },
  { value: 'rosé', label: 'Rosé' },
  { value: 'sparkling', label: 'Effervescent' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'fortified', label: 'Fortifié' },
];

const STATUS_FILTERS = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'active', label: 'Actifs' },
  { value: 'inactive', label: 'Inactifs' },
  { value: 'low_stock', label: 'Stock faible' },
  { value: 'out_of_stock', label: 'Rupture de stock' },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [wineTypeFilter, setWineTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wine_products')
        .select(`
          id,
          name,
          vintage,
          producer,
          wine_type,
          price_euros,
          stock_quantity,
          is_active,
          image_url,
          slug,
          created_at,
          updated_at
        `)
        .order(sortField, { ascending: sortDirection === 'asc' });

      if (error) throw error;

      setProducts(data || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };

  const handleEditProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setEditingProduct(product);
      setShowProductForm(true);
    }
  };

  const handleViewProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      window.open(`/products/${product.slug}`, '_blank');
    }
  };

  const handleSaveProduct = async (productData: ProductFormData) => {
    try {
      if (editingProduct) {
        // Update existing product
        const { error } = await supabase
          .from('wine_products')
          .update({
            ...productData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingProduct.id);

        if (error) throw error;
      } else {
        // Create new product
        const { error } = await supabase
          .from('wine_products')
          .insert({
            ...productData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      setShowProductForm(false);
      setEditingProduct(null);
      await loadProducts();
    } catch (error) {
      console.error('Failed to save product:', error);
      throw error;
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
        const { error } = await supabase
          .from('wine_products')
          .delete()
          .eq('id', productId);

        if (error) throw error;

        await loadProducts();
      } catch (error) {
        console.error('Failed to delete product:', error);
      }
    }
  };

  const handleToggleStatus = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    try {
      const { error } = await supabase
        .from('wine_products')
        .update({
          is_active: !product.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId);

      if (error) throw error;

      await loadProducts();
    } catch (error) {
      console.error('Failed to toggle product status:', error);
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedProducts.length === 0) return;

    const confirmed = confirm(
      `Êtes-vous sûr de vouloir ${action === 'delete' ? 'supprimer' :
        action === 'activate' ? 'activer' : 'désactiver'} ${selectedProducts.length} produit(s) ?`
    );

    if (!confirmed) return;

    try {
      if (action === 'delete') {
        const { error } = await supabase
          .from('wine_products')
          .delete()
          .in('id', selectedProducts);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('wine_products')
          .update({
            is_active: action === 'activate',
            updated_at: new Date().toISOString(),
          })
          .in('id', selectedProducts);

        if (error) throw error;
      }

      setSelectedProducts([]);
      setShowBulkActions(false);
      await loadProducts();
    } catch (error) {
      console.error('Failed to perform bulk action:', error);
    }
  };

  const exportProducts = () => {
    const csvContent = [
      ['ID', 'Nom', 'Millésime', 'Producteur', 'Type', 'Prix', 'Stock', 'Statut', 'Créé le'].join(','),
      ...filteredProducts.map(product => [
        product.id,
        `"${product.name}"`,
        product.vintage,
        `"${product.producer}"`,
        `"${product.wine_type}"`,
        product.price_euros.toFixed(2),
        product.stock_quantity,
        product.is_active ? 'Actif' : 'Inactif',
        new Date(product.created_at).toLocaleDateString('fr-FR'),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `produits-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.producer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.vintage.toString().includes(searchTerm);

    const matchesWineType = wineTypeFilter === 'all' || product.wine_type === wineTypeFilter;

    const matchesStatus = (() => {
      switch (statusFilter) {
        case 'active': return product.is_active;
        case 'inactive': return !product.is_active;
        case 'low_stock': return product.stock_quantity <= 5 && product.stock_quantity > 0;
        case 'out_of_stock': return product.stock_quantity === 0;
        default: return true;
      }
    })();

    return matchesSearch && matchesWineType && matchesStatus;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) {
      return { label: 'Rupture', color: 'bg-red-100 text-red-800' };
    }
    if (quantity <= 5) {
      return { label: 'Stock faible', color: 'bg-orange-100 text-orange-800' };
    }
    return { label: 'En stock', color: 'bg-green-100 text-green-800' };
  };

  if (showProductForm) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <ProductForm
          product={editingProduct || undefined}
          onSave={handleSaveProduct}
          onCancel={() => {
            setShowProductForm(false);
            setEditingProduct(null);
          }}
          mode={editingProduct ? 'edit' : 'create'}
        />
      </div>
    );
  }

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
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des produits</h1>
          <p className="text-gray-600">
            {products.length} produit{products.length > 1 ? 's' : ''} au total
            {filteredProducts.length !== products.length && ` • ${filteredProducts.length} affiché${filteredProducts.length > 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setViewMode('inventory')}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            Inventaire
          </button>
          <button
            onClick={exportProducts}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exporter
          </button>
          <button
            onClick={handleCreateProduct}
            className="px-4 py-2 bg-wine-600 text-white rounded-lg hover:bg-wine-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouveau produit
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow border mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500 w-64"
              />
            </div>

            <select
              value={wineTypeFilter}
              onChange={(e) => setWineTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
            >
              {WINE_TYPE_FILTERS.map(filter => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
            >
              {STATUS_FILTERS.map(filter => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {selectedProducts.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selectedProducts.length} sélectionné{selectedProducts.length > 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Actions
                </button>
                {showBulkActions && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-10">
                    <button
                      onClick={() => handleBulkAction('activate')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Activer
                    </button>
                    <button
                      onClick={() => handleBulkAction('deactivate')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Désactiver
                    </button>
                    <button
                      onClick={() => handleBulkAction('delete')}
                      className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                    >
                      Supprimer
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
                Tableau
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-2 text-sm ${viewMode === 'cards' ? 'bg-wine-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Cartes
              </button>
            </div>

            <button
              onClick={loadProducts}
              className="p-2 text-gray-600 hover:text-gray-800"
              title="Actualiser"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-wine-600" />
          <span className="ml-2 text-gray-600">Chargement des produits...</span>
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
                      checked={selectedProducts.length === sortedProducts.length && sortedProducts.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts(sortedProducts.map(p => p.id));
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
                      Produit
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('vintage')}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      Millésime
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('price_euros')}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      Prix
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('stock_quantity')}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      Stock
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedProducts.map((product) => {
                  const stockStatus = getStockStatus(product.stock_quantity);
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
                          {product.image_url && (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-10 h-10 rounded object-cover mr-3"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {product.producer}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.vintage}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.wine_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.price_euros.toFixed(2)} €
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                          {product.stock_quantity} • {stockStatus.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewProduct(product.id)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Voir sur le site"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditProduct(product.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(product.id)}
                            className="text-orange-600 hover:text-orange-900"
                            title={product.is_active ? 'Désactiver' : 'Activer'}
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Supprimer"
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

          {sortedProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun produit trouvé</h3>
              <p className="mt-1 text-sm text-gray-500">
                Aucun produit ne correspond à vos critères de recherche.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Cards View */}
      {!loading && viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedProducts.map((product) => {
            const stockStatus = getStockStatus(product.stock_quantity);
            return (
              <div key={product.id} className="bg-white rounded-lg shadow border overflow-hidden">
                {product.image_url && (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {product.name} {product.vintage}
                    </h3>
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
                  <p className="text-sm text-gray-600 mb-2">{product.producer}</p>
                  <p className="text-lg font-semibold text-wine-600 mb-2">
                    {product.price_euros.toFixed(2)} €
                  </p>

                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                      {stockStatus.label}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {product.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Stock: {product.stock_quantity}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleViewProduct(product.id)}
                        className="p-1 text-gray-600 hover:text-gray-900"
                        title="Voir sur le site"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditProduct(product.id)}
                        className="p-1 text-blue-600 hover:text-blue-900"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(product.id)}
                        className="p-1 text-orange-600 hover:text-orange-900"
                        title={product.is_active ? 'Désactiver' : 'Activer'}
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-1 text-red-600 hover:text-red-900"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}