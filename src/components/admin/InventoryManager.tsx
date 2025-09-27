'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Plus,
  Minus,
  Edit,
  Eye,
  BarChart3
} from 'lucide-react';

export interface InventoryItem {
  id: string;
  name: string;
  vintage: number;
  producer: string;
  varietal: string;
  stock_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  price_eur: number;
  last_updated: string;
  low_stock_threshold: number;
  reorder_point: number;
  cost_price?: number;
  profit_margin?: number;
  image_url?: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  movement_type: 'in' | 'out' | 'adjustment' | 'reserved' | 'unreserved';
  quantity: number;
  reason: string;
  reference?: string;
  created_at: string;
  created_by: string;
  notes?: string;
}

export interface InventoryStats {
  total_products: number;
  total_stock_value: number;
  low_stock_items: number;
  out_of_stock_items: number;
  reserved_items: number;
  recent_movements: number;
}

export interface InventoryManagerProps {
  onProductEdit?: (productId: string) => void;
  onProductView?: (productId: string) => void;
}

const MOVEMENT_TYPES = [
  { value: 'in', label: 'Entrée de stock', color: 'text-green-600' },
  { value: 'out', label: 'Sortie de stock', color: 'text-red-600' },
  { value: 'adjustment', label: 'Ajustement', color: 'text-blue-600' },
  { value: 'reserved', label: 'Réservation', color: 'text-orange-600' },
  { value: 'unreserved', label: 'Annulation réservation', color: 'text-orange-400' },
];

const STOCK_FILTERS = [
  { value: 'all', label: 'Tous les produits' },
  { value: 'low_stock', label: 'Stock faible' },
  { value: 'out_of_stock', label: 'Rupture de stock' },
  { value: 'reserved', label: 'Avec réservations' },
  { value: 'high_value', label: 'Valeur élevée' },
];

export default function InventoryManager({ onProductEdit, onProductView }: InventoryManagerProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showMovements, setShowMovements] = useState(false);
  const [showStockAdjustment, setShowStockAdjustment] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);
  const [adjustmentData, setAdjustmentData] = useState({
    quantity: 0,
    type: 'adjustment' as const,
    reason: '',
    notes: '',
  });

  const supabase = createClient();

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadInventory(),
        loadStats(),
        loadRecentMovements(),
      ]);
    } catch (error) {
      console.error('Failed to load inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInventory = async () => {
    const { data, error } = await supabase
      .from('wine_products')
      .select(`
        id,
        name,
        vintage,
        producer,
        wine_type,
        stock_quantity,
        reserved_quantity,
        price_eur,
        updated_at,
        low_stock_threshold,
        reorder_point,
        cost_price,
        image_url
      `)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Failed to load inventory:', error);
      return;
    }

    const inventoryItems: InventoryItem[] = data.map(item => ({
      ...item,
      available_quantity: item.stock_quantity - (item.reserved_quantity || 0),
      last_updated: item.updated_at,
      profit_margin: item.cost_price
        ? ((item.price_eur - item.cost_price) / item.cost_price) * 100
        : undefined,
    }));

    setInventory(inventoryItems);
  };

  const loadStats = async () => {
    const { data, error } = await supabase
      .from('wine_products')
      .select('stock_quantity, reserved_quantity, price_eur, cost_price, low_stock_threshold')
      .eq('is_active', true);

    if (error) {
      console.error('Failed to load stats:', error);
      return;
    }

    const stats: InventoryStats = {
      total_products: data.length,
      total_stock_value: data.reduce((sum, item) =>
        sum + (item.stock_quantity * (item.cost_price || item.price_eur)), 0
      ),
      low_stock_items: data.filter(item =>
        item.stock_quantity <= (item.low_stock_threshold || 5)
      ).length,
      out_of_stock_items: data.filter(item => item.stock_quantity === 0).length,
      reserved_items: data.filter(item => (item.reserved_quantity || 0) > 0).length,
      recent_movements: 0, // Will be updated from movements query
    };

    setStats(stats);
  };

  const loadRecentMovements = async () => {
    const { data, error } = await supabase
      .from('stock_movements')
      .select(`
        id,
        product_id,
        movement_type,
        quantity,
        reason,
        reference,
        created_at,
        created_by,
        notes,
        wine_products!inner(name, vintage)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Failed to load movements:', error);
      return;
    }

    setMovements(data || []);

    // Update recent movements count in stats
    if (stats) {
      const recentCount = data?.filter(movement =>
        new Date(movement.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length || 0;

      setStats(prev => prev ? { ...prev, recent_movements: recentCount } : null);
    }
  };

  const handleStockAdjustment = async () => {
    if (!selectedProduct || adjustmentData.quantity === 0) return;

    try {
      const newQuantity = selectedProduct.stock_quantity + adjustmentData.quantity;

      // Update product stock
      const { error: updateError } = await supabase
        .from('wine_products')
        .update({
          stock_quantity: newQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedProduct.id);

      if (updateError) throw updateError;

      // Log the movement
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          product_id: selectedProduct.id,
          movement_type: adjustmentData.type,
          quantity: adjustmentData.quantity,
          reason: adjustmentData.reason,
          notes: adjustmentData.notes,
          created_by: 'current-user-id', // Replace with actual user ID
        });

      if (movementError) throw movementError;

      // Reload data
      await loadInventoryData();

      // Reset form
      setShowStockAdjustment(false);
      setSelectedProduct(null);
      setAdjustmentData({
        quantity: 0,
        type: 'adjustment',
        reason: '',
        notes: '',
      });
    } catch (error) {
      console.error('Failed to adjust stock:', error);
    }
  };

  const exportInventory = () => {
    const csvContent = [
      ['Produit', 'Millésime', 'Producteur', 'Type', 'Stock', 'Réservé', 'Disponible', 'Prix', 'Valeur Stock'].join(','),
      ...filteredInventory.map(item => [
        `"${item.name}"`,
        item.vintage,
        `"${item.producer}"`,
        `"${item.wine_type}"`,
        item.stock_quantity,
        item.reserved_quantity || 0,
        item.available_quantity,
        item.price_eur.toFixed(2),
        (item.stock_quantity * item.price_eur).toFixed(2),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventaire-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.producer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vintage.toString().includes(searchTerm);

    const matchesFilter = (() => {
      switch (selectedFilter) {
        case 'low_stock':
          return item.stock_quantity <= (item.low_stock_threshold || 5);
        case 'out_of_stock':
          return item.stock_quantity === 0;
        case 'reserved':
          return (item.reserved_quantity || 0) > 0;
        case 'high_value':
          return (item.stock_quantity * item.price_eur) > 1000;
        default:
          return true;
      }
    })();

    return matchesSearch && matchesFilter;
  });

  const getStockStatus = (item: InventoryItem) => {
    if (item.stock_quantity === 0) {
      return { label: 'Rupture', color: 'bg-red-100 text-red-800' };
    }
    if (item.stock_quantity <= (item.low_stock_threshold || 5)) {
      return { label: 'Stock faible', color: 'bg-orange-100 text-orange-800' };
    }
    return { label: 'En stock', color: 'bg-green-100 text-green-800' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-wine-600" />
        <span className="ml-2 text-gray-600">Chargement de l'inventaire...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Produits</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_products}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Valeur stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total_stock_value.toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                    maximumFractionDigits: 0
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Stock faible</p>
                <p className="text-2xl font-bold text-gray-900">{stats.low_stock_items}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <TrendingDown className="w-8 h-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Ruptures</p>
                <p className="text-2xl font-bold text-gray-900">{stats.out_of_stock_items}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Réservés</p>
                <p className="text-2xl font-bold text-gray-900">{stats.reserved_items}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-indigo-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Mvt. 24h</p>
                <p className="text-2xl font-bold text-gray-900">{stats.recent_movements}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white p-4 rounded-lg shadow border">
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
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
            >
              {STOCK_FILTERS.map(filter => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowMovements(!showMovements)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Mouvements
            </button>
            <button
              onClick={exportInventory}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exporter
            </button>
            <button
              onClick={loadInventoryData}
              className="px-4 py-2 bg-wine-600 text-white rounded-lg hover:bg-wine-700 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Réservé
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Disponible
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prix
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valeur
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
              {filteredInventory.map((item) => {
                const status = getStockStatus(item);
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-10 h-10 rounded object-cover mr-3"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.name} {item.vintage}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.producer} • {item.wine_type}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.stock_quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.reserved_quantity || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.available_quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.price_eur.toFixed(2)} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(item.stock_quantity * item.price_eur).toFixed(2)} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedProduct(item);
                            setShowStockAdjustment(true);
                          }}
                          className="text-wine-600 hover:text-wine-900"
                          title="Ajuster le stock"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {onProductView && (
                          <button
                            onClick={() => onProductView(item.id)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Voir le produit"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {onProductEdit && (
                          <button
                            onClick={() => onProductEdit(item.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Modifier le produit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredInventory.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun produit trouvé</h3>
            <p className="mt-1 text-sm text-gray-500">
              Aucun produit ne correspond à vos critères de recherche.
            </p>
          </div>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {showStockAdjustment && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Ajuster le stock - {selectedProduct.name} {selectedProduct.vintage}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Stock actuel: {selectedProduct.stock_quantity}
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type d'ajustement
                </label>
                <select
                  value={adjustmentData.type}
                  onChange={(e) => setAdjustmentData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
                >
                  <option value="in">Entrée de stock</option>
                  <option value="out">Sortie de stock</option>
                  <option value="adjustment">Ajustement</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantité {adjustmentData.type === 'out' ? '(négative)' : '(positive)'}
                </label>
                <input
                  type="number"
                  value={adjustmentData.quantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    const quantity = adjustmentData.type === 'out' ? -Math.abs(value) : Math.abs(value);
                    setAdjustmentData(prev => ({ ...prev, quantity }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Nouveau stock: {selectedProduct.stock_quantity + adjustmentData.quantity}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Raison *
                </label>
                <input
                  type="text"
                  value={adjustmentData.reason}
                  onChange={(e) => setAdjustmentData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
                  placeholder="Ex: Réception marchandise, Vente, Casse..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={adjustmentData.notes}
                  onChange={(e) => setAdjustmentData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
                  rows={2}
                  placeholder="Notes additionnelles..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowStockAdjustment(false);
                  setSelectedProduct(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleStockAdjustment}
                disabled={!adjustmentData.reason || adjustmentData.quantity === 0}
                className="px-4 py-2 bg-wine-600 text-white rounded-lg hover:bg-wine-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Movements */}
      {showMovements && (
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Mouvements de stock récents</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Raison
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {movements.slice(0, 20).map((movement) => {
                  const type = MOVEMENT_TYPES.find(t => t.value === movement.movement_type);
                  return (
                    <tr key={movement.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(movement.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.wine_products?.name} {movement.wine_products?.vintage}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${type?.color || 'text-gray-600'}`}>
                          {type?.label || movement.movement_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.reason}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}