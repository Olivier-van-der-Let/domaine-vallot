'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  Activity,
  Calendar,
  Eye,
  ArrowRight,
  RefreshCw,
  Download,
  Filter,
  Settings,
  Bell,
  CheckCircle,
  Clock,
  XCircle,
  Euro
} from 'lucide-react';

interface DashboardStats {
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    percentChange: number;
  };
  orders: {
    total: number;
    thisMonth: number;
    pending: number;
    processing: number;
    shipped: number;
    completed: number;
  };
  products: {
    total: number;
    active: number;
    lowStock: number;
    outOfStock: number;
  };
  customers: {
    total: number;
    thisMonth: number;
    active: number;
  };
}

interface RecentOrder {
  id: string;
  order_number: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
}

interface TopProduct {
  id: string;
  name: string;
  vintage: number;
  total_quantity: number;
  total_revenue: number;
  image_url?: string;
}

interface Alert {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'failed_payment' | 'new_order';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  created_at: string;
}

const PERIOD_OPTIONS = [
  { value: '7d', label: '7 derniers jours' },
  { value: '30d', label: '30 derniers jours' },
  { value: '90d', label: '3 derniers mois' },
  { value: '1y', label: 'Cette année' },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  const supabase = createClient();

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStats(),
        loadRecentOrders(),
        loadTopProducts(),
        loadAlerts(),
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    const now = new Date();
    const periodDays = parseInt(selectedPeriod.replace('d', '')) || 30;
    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const prevStartDate = new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Revenue stats
    const { data: revenueData } = await supabase
      .from('orders')
      .select('total_amount, created_at')
      .eq('payment_status', 'paid')
      .gte('created_at', prevStartDate.toISOString());

    const currentPeriodRevenue = revenueData
      ?.filter(order => new Date(order.created_at) >= startDate)
      .reduce((sum, order) => sum + order.total_amount, 0) || 0;

    const previousPeriodRevenue = revenueData
      ?.filter(order => new Date(order.created_at) < startDate)
      .reduce((sum, order) => sum + order.total_amount, 0) || 0;

    const revenueChange = previousPeriodRevenue > 0
      ? ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100
      : 0;

    // Orders stats
    const { data: ordersData } = await supabase
      .from('orders')
      .select('status, created_at')
      .gte('created_at', startDate.toISOString());

    const orderStats = {
      total: ordersData?.length || 0,
      thisMonth: ordersData?.length || 0,
      pending: ordersData?.filter(o => o.status === 'pending').length || 0,
      processing: ordersData?.filter(o => o.status === 'processing').length || 0,
      shipped: ordersData?.filter(o => o.status === 'shipped').length || 0,
      completed: ordersData?.filter(o => o.status === 'delivered').length || 0,
    };

    // Products stats
    const { data: productsData } = await supabase
      .from('wine_products')
      .select('stock_quantity, is_active, low_stock_threshold');

    const productStats = {
      total: productsData?.length || 0,
      active: productsData?.filter(p => p.is_active).length || 0,
      lowStock: productsData?.filter(p =>
        p.stock_quantity <= (p.low_stock_threshold || 5) && p.stock_quantity > 0
      ).length || 0,
      outOfStock: productsData?.filter(p => p.stock_quantity === 0).length || 0,
    };

    // Customers stats
    const { data: customersData } = await supabase
      .from('customers')
      .select('created_at')
      .gte('created_at', startDate.toISOString());

    const customerStats = {
      total: customersData?.length || 0,
      thisMonth: customersData?.length || 0,
      active: customersData?.length || 0,
    };

    setStats({
      revenue: {
        total: currentPeriodRevenue,
        thisMonth: currentPeriodRevenue,
        lastMonth: previousPeriodRevenue,
        percentChange: revenueChange,
      },
      orders: orderStats,
      products: productStats,
      customers: customerStats,
    });
  };

  const loadRecentOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('id, order_number, customer_name, total_amount, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setRecentOrders(data);
    }
  };

  const loadTopProducts = async () => {
    const periodDays = parseInt(selectedPeriod.replace('d', '')) || 30;
    const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('order_items')
      .select(`
        quantity,
        unit_price,
        orders!inner(created_at),
        wine_products!inner(id, name, vintage, image_url)
      `)
      .gte('orders.created_at', startDate.toISOString())
      .limit(10);

    if (!error && data) {
      const productSales = data.reduce((acc: Record<string, any>, item) => {
        const productId = item.wine_products.id;
        if (!acc[productId]) {
          acc[productId] = {
            id: productId,
            name: item.wine_products.name,
            vintage: item.wine_products.vintage,
            image_url: item.wine_products.image_url,
            total_quantity: 0,
            total_revenue: 0,
          };
        }
        acc[productId].total_quantity += item.quantity;
        acc[productId].total_revenue += item.quantity * item.unit_price;
        return acc;
      }, {});

      const topProducts = Object.values(productSales)
        .sort((a: any, b: any) => b.total_revenue - a.total_revenue)
        .slice(0, 5);

      setTopProducts(topProducts as TopProduct[]);
    }
  };

  const loadAlerts = async () => {
    // Generate alerts based on current data
    const alertsList: Alert[] = [];

    // Low stock alerts
    const { data: lowStockProducts } = await supabase
      .from('wine_products')
      .select('id, name, stock_quantity, low_stock_threshold')
      .lte('stock_quantity', 5)
      .gt('stock_quantity', 0)
      .eq('is_active', true);

    lowStockProducts?.forEach(product => {
      alertsList.push({
        id: `low-stock-${product.id}`,
        type: 'low_stock',
        title: 'Stock faible',
        message: `${product.name} - ${product.stock_quantity} restant(s)`,
        severity: 'medium',
        created_at: new Date().toISOString(),
      });
    });

    // Out of stock alerts
    const { data: outOfStockProducts } = await supabase
      .from('wine_products')
      .select('id, name')
      .eq('stock_quantity', 0)
      .eq('is_active', true);

    outOfStockProducts?.forEach(product => {
      alertsList.push({
        id: `out-of-stock-${product.id}`,
        type: 'out_of_stock',
        title: 'Rupture de stock',
        message: `${product.name} - Stock épuisé`,
        severity: 'high',
        created_at: new Date().toISOString(),
      });
    });

    // Failed payment alerts
    const { data: failedPayments } = await supabase
      .from('orders')
      .select('id, order_number, customer_name')
      .eq('payment_status', 'failed')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    failedPayments?.forEach(order => {
      alertsList.push({
        id: `failed-payment-${order.id}`,
        type: 'failed_payment',
        title: 'Paiement échoué',
        message: `Commande #${order.order_number} - ${order.customer_name}`,
        severity: 'high',
        created_at: new Date().toISOString(),
      });
    });

    setAlerts(alertsList.slice(0, 10));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'confirmed': return 'text-blue-600 bg-blue-100';
      case 'processing': return 'text-orange-600 bg-orange-100';
      case 'shipped': return 'text-purple-600 bg-purple-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'processing': return <Package className="w-4 h-4" />;
      case 'shipped': return <Activity className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'low_stock': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'out_of_stock': return <Package className="w-5 h-5 text-red-500" />;
      case 'failed_payment': return <DollarSign className="w-5 h-5 text-red-500" />;
      case 'new_order': return <ShoppingCart className="w-5 h-5 text-green-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-wine-600" />
        <span className="ml-2 text-gray-600">Chargement du tableau de bord...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-600">Vue d'ensemble de votre boutique en ligne</p>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
          >
            {PERIOD_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            onClick={loadDashboardData}
            className="p-2 text-gray-600 hover:text-gray-800"
            title="Actualiser"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Revenue Card */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Chiffre d'affaires</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.revenue.total.toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                    maximumFractionDigits: 0
                  })}
                </p>
                <div className="flex items-center mt-1">
                  {stats.revenue.percentChange >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm ml-1 ${
                    stats.revenue.percentChange >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {Math.abs(stats.revenue.percentChange).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Euro className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Orders Card */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Commandes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.orders.total}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {stats.orders.pending} en attente
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Products Card */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Produits</p>
                <p className="text-2xl font-bold text-gray-900">{stats.products.total}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {stats.products.active} actifs
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Customers Card */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Clients</p>
                <p className="text-2xl font-bold text-gray-900">{stats.customers.total}</p>
                <p className="text-sm text-gray-600 mt-1">
                  +{stats.customers.thisMonth} ce mois
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Alertes</h2>
              <span className="text-sm text-gray-500">{alerts.length} alerte{alerts.length > 1 ? 's' : ''}</span>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{alert.title}</h4>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                    alert.severity === 'medium' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {alert.severity === 'high' ? 'Critique' :
                     alert.severity === 'medium' ? 'Important' : 'Info'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Commandes récentes</h2>
              <Link
                href="/admin/orders"
                className="text-sm text-wine-600 hover:text-wine-700 flex items-center gap-1"
              >
                Voir tout
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`p-2 rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        #{order.order_number}
                      </p>
                      <p className="text-sm text-gray-500">{order.customer_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {order.total_amount.toFixed(2)} €
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))}

              {recentOrders.length === 0 && (
                <div className="text-center py-8">
                  <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune commande</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Les nouvelles commandes apparaîtront ici.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Produits populaires</h2>
              <Link
                href="/admin/products"
                className="text-sm text-wine-600 hover:text-wine-700 flex items-center gap-1"
              >
                Voir tout
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500 w-6">
                      #{index + 1}
                    </span>
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-10 h-10 rounded object-cover"
                      />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {product.name} {product.vintage}
                      </p>
                      <p className="text-sm text-gray-500">
                        {product.total_quantity} vendu{product.total_quantity > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {product.total_revenue.toFixed(2)} €
                    </p>
                  </div>
                </div>
              ))}

              {topProducts.length === 0 && (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune vente</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Les produits vendus apparaîtront ici.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Actions rapides</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/admin/products"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Package className="w-8 h-8 text-wine-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Produits</span>
            </Link>

            <Link
              href="/admin/orders"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ShoppingCart className="w-8 h-8 text-wine-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Commandes</span>
            </Link>

            <button
              onClick={() => window.open('/api/sync/google?format=xml', '_blank')}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-8 h-8 text-wine-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Export</span>
            </button>

            <Link
              href="/admin/settings"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-8 h-8 text-wine-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Paramètres</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Stock Status */}
      {stats && (stats.products.lowStock > 0 || stats.products.outOfStock > 0) && (
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">État des stocks</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {stats.products.lowStock > 0 && (
                <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium text-orange-900">
                      {stats.products.lowStock} produit{stats.products.lowStock > 1 ? 's' : ''} en stock faible
                    </p>
                    <p className="text-sm text-orange-700">
                      Réapprovisionnement recommandé
                    </p>
                  </div>
                  <Link
                    href="/admin/products?filter=low_stock"
                    className="ml-auto px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
                  >
                    Voir
                  </Link>
                </div>
              )}

              {stats.products.outOfStock > 0 && (
                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
                  <Package className="w-6 h-6 text-red-500" />
                  <div>
                    <p className="text-sm font-medium text-red-900">
                      {stats.products.outOfStock} produit{stats.products.outOfStock > 1 ? 's' : ''} en rupture
                    </p>
                    <p className="text-sm text-red-700">
                      Réapprovisionnement urgent requis
                    </p>
                  </div>
                  <Link
                    href="/admin/products?filter=out_of_stock"
                    className="ml-auto px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Voir
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}