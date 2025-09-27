'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Search,
  Filter,
  Calendar,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Euro,
  User,
  Mail,
  Phone,
  MapPin,
  Eye,
  Edit,
  RefreshCw,
  Download,
  ArrowUpDown,
  MoreHorizontal,
  Send,
  Ban,
  CreditCard
} from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  total_amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address: {
    name: string;
    street: string;
    city: string;
    postal_code: string;
    country: string;
  };
  billing_address: {
    name: string;
    street: string;
    city: string;
    postal_code: string;
    country: string;
  };
  items: Array<{
    id: string;
    product_name: string;
    vintage: number;
    quantity: number;
    unit_price: number;
    image_url?: string;
  }>;
  payment_method: string;
  tracking_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Sendcloud fields
  sendcloud_order_id?: string;
  sendcloud_parcel_id?: number;
  sendcloud_tracking_number?: string;
  sendcloud_tracking_url?: string;
  sendcloud_label_url?: string;
  sendcloud_status?: string;
  sendcloud_carrier?: string;
  shipped_at?: string;
  delivered_at?: string;
}

type SortField = 'order_number' | 'customer_name' | 'total_amount' | 'status' | 'created_at';
type SortDirection = 'asc' | 'desc';

const ORDER_STATUSES = [
  { value: 'all', label: 'Tous les statuts', color: 'text-gray-600' },
  { value: 'pending', label: 'En attente', color: 'text-yellow-600' },
  { value: 'confirmed', label: 'Confirmée', color: 'text-blue-600' },
  { value: 'processing', label: 'En préparation', color: 'text-orange-600' },
  { value: 'shipped', label: 'Expédiée', color: 'text-purple-600' },
  { value: 'delivered', label: 'Livrée', color: 'text-green-600' },
  { value: 'cancelled', label: 'Annulée', color: 'text-red-600' },
];

const PAYMENT_STATUSES = [
  { value: 'all', label: 'Tous les paiements', color: 'text-gray-600' },
  { value: 'pending', label: 'En attente', color: 'text-yellow-600' },
  { value: 'paid', label: 'Payé', color: 'text-green-600' },
  { value: 'failed', label: 'Échoué', color: 'text-red-600' },
  { value: 'refunded', label: 'Remboursé', color: 'text-purple-600' },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          payment_status,
          total_amount,
          customer_name,
          customer_email,
          customer_phone,
          shipping_address,
          billing_address,
          payment_method,
          tracking_number,
          notes,
          created_at,
          updated_at,
          sendcloud_order_id,
          sendcloud_parcel_id,
          sendcloud_tracking_number,
          sendcloud_tracking_url,
          sendcloud_label_url,
          sendcloud_status,
          sendcloud_carrier,
          shipped_at,
          delivered_at,
          order_items (
            id,
            quantity,
            unit_price,
            wine_products (
              name,
              vintage,
              image_url
            )
          )
        `)
        .order(sortField, { ascending: sortDirection === 'asc' });

      if (error) throw error;

      const ordersWithItems: Order[] = data?.map(order => ({
        ...order,
        items: order.order_items?.map(item => ({
          id: item.id,
          product_name: item.wine_products?.name || 'Produit supprimé',
          vintage: item.wine_products?.vintage || 0,
          quantity: item.quantity,
          unit_price: item.unit_price,
          image_url: item.wine_products?.image_url,
        })) || [],
      })) || [];

      setOrders(ordersWithItems);
    } catch (error) {
      console.error('Failed to load orders:', error);
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

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    setUpdatingStatus(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) throw error;

      await loadOrders();

      // Send notification email if status is important
      if (['confirmed', 'shipped', 'delivered'].includes(newStatus)) {
        // Call API to send status update email
        await fetch('/api/orders/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, status: newStatus }),
        });
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, newStatus: Order['payment_status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) throw error;

      await loadOrders();
    } catch (error) {
      console.error('Failed to update payment status:', error);
    }
  };

  const handleAddTrackingNumber = async (orderId: string, trackingNumber: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          tracking_number: trackingNumber,
          status: 'shipped',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) throw error;

      await loadOrders();

      // Send shipping notification email
      await fetch('/api/orders/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: 'shipped', trackingNumber }),
      });
    } catch (error) {
      console.error('Failed to add tracking number:', error);
    }
  };

  const handleCreateLabel = async (orderId: string) => {
    try {
      setUpdatingStatus(orderId);

      const response = await fetch(`/api/orders/${orderId}/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create label');
      }

      const result = await response.json();

      // Refresh orders to show updated information
      await loadOrders();

      alert(`Étiquette créée avec succès!\nNuméro de suivi: ${result.tracking_number || 'En attente'}`);
    } catch (error) {
      console.error('Failed to create label:', error);
      alert(`Erreur lors de la création de l'étiquette: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleViewLabel = (labelUrl: string) => {
    window.open(labelUrl, '_blank');
  };

  const handleTrackPackage = (trackingUrl: string) => {
    window.open(trackingUrl, '_blank');
  };

  const getSendcloudActionButton = (order: Order) => {
    // If order doesn't have Sendcloud integration yet
    if (!order.sendcloud_order_id) {
      return (
        <span className="text-xs text-gray-400" title="Commande non synchronisée avec Sendcloud">
          Non sync.
        </span>
      );
    }

    // If label already exists
    if (order.sendcloud_label_url) {
      return (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleViewLabel(order.sendcloud_label_url!)}
            className="text-blue-600 hover:text-blue-900"
            title="Voir l'étiquette"
          >
            <Download className="w-4 h-4" />
          </button>
          {order.sendcloud_tracking_url && (
            <button
              onClick={() => handleTrackPackage(order.sendcloud_tracking_url!)}
              className="text-green-600 hover:text-green-900"
              title="Suivre le colis"
            >
              <Truck className="w-4 h-4" />
            </button>
          )}
        </div>
      );
    }

    // If order is confirmed but no label yet
    if (order.status === 'confirmed' || order.status === 'processing') {
      return (
        <button
          onClick={() => handleCreateLabel(order.id)}
          disabled={updatingStatus === order.id}
          className="text-purple-600 hover:text-purple-900 disabled:opacity-50"
          title="Créer une étiquette"
        >
          <Send className="w-4 h-4" />
        </button>
      );
    }

    return null;
  };

  const exportOrders = () => {
    const csvContent = [
      ['Numéro', 'Client', 'Email', 'Statut', 'Paiement', 'Total', 'Date', 'Suivi'].join(','),
      ...filteredOrders.map(order => [
        order.order_number,
        `"${order.customer_name}"`,
        order.customer_email,
        order.status,
        order.payment_status,
        order.total_amount.toFixed(2),
        new Date(order.created_at).toLocaleDateString('fr-FR'),
        order.tracking_number || '',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `commandes-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || order.payment_status === paymentFilter;

    const matchesDate = (() => {
      if (dateRange === 'all') return true;

      const orderDate = new Date(order.created_at);
      const now = new Date();

      switch (dateRange) {
        case 'today':
          return orderDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return orderDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return orderDate >= monthAgo;
        default:
          return true;
      }
    })();

    return matchesSearch && matchesStatus && matchesPayment && matchesDate;
  });

  const getStatusColor = (status: string) => {
    const statusConfig = ORDER_STATUSES.find(s => s.value === status);
    return statusConfig?.color || 'text-gray-600';
  };

  const getPaymentStatusColor = (status: string) => {
    const statusConfig = PAYMENT_STATUSES.find(s => s.value === status);
    return statusConfig?.color || 'text-gray-600';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'processing': return <Package className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-wine-600" />
        <span className="ml-2 text-gray-600">Chargement des commandes...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des commandes</h1>
          <p className="text-gray-600">
            {orders.length} commande{orders.length > 1 ? 's' : ''} au total
            {filteredOrders.length !== orders.length && ` • ${filteredOrders.length} affichée${filteredOrders.length > 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={exportOrders}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exporter
          </button>
          <button
            onClick={loadOrders}
            className="px-4 py-2 bg-wine-600 text-white rounded-lg hover:bg-wine-700 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher une commande..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500 w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
            >
              {ORDER_STATUSES.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
            >
              {PAYMENT_STATUSES.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine-500"
            >
              <option value="all">Toutes les dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('order_number')}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    Commande
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('customer_name')}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    Client
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('total_amount')}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    Total
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    Statut
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paiement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('created_at')}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    Date
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        #{order.order_number}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.items.length} article{order.items.length > 1 ? 's' : ''}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {order.customer_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.customer_email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.total_amount.toFixed(2)} €
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={getStatusColor(order.status)}>
                        {getStatusIcon(order.status)}
                      </span>
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as Order['status'])}
                        disabled={updatingStatus === order.id}
                        className={`text-sm border-none bg-transparent focus:outline-none focus:ring-0 ${getStatusColor(order.status)}`}
                      >
                        <option value="pending">En attente</option>
                        <option value="confirmed">Confirmée</option>
                        <option value="processing">En préparation</option>
                        <option value="shipped">Expédiée</option>
                        <option value="delivered">Livrée</option>
                        <option value="cancelled">Annulée</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={order.payment_status}
                      onChange={(e) => handleUpdatePaymentStatus(order.id, e.target.value as Order['payment_status'])}
                      className={`text-sm border-none bg-transparent focus:outline-none focus:ring-0 ${getPaymentStatusColor(order.payment_status)}`}
                    >
                      <option value="pending">En attente</option>
                      <option value="paid">Payé</option>
                      <option value="failed">Échoué</option>
                      <option value="refunded">Remboursé</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowOrderDetails(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Sendcloud Actions */}
                      {getSendcloudActionButton(order)}

                      {/* Legacy tracking for non-Sendcloud orders */}
                      {!order.sendcloud_order_id && order.status === 'processing' && (
                        <button
                          onClick={() => {
                            const trackingNumber = prompt('Numéro de suivi:');
                            if (trackingNumber) {
                              handleAddTrackingNumber(order.id, trackingNumber);
                            }
                          }}
                          className="text-green-600 hover:text-green-900"
                          title="Ajouter un numéro de suivi (manuel)"
                        >
                          <Truck className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune commande trouvée</h3>
            <p className="mt-1 text-sm text-gray-500">
              Aucune commande ne correspond à vos critères de recherche.
            </p>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Commande #{selectedOrder.order_number}
                </h2>
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Customer Information */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Informations client</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{selectedOrder.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{selectedOrder.customer_email}</span>
                      </div>
                      {selectedOrder.customer_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{selectedOrder.customer_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Adresse de livraison</h4>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                      <div className="text-sm text-gray-600">
                        <div>{selectedOrder.shipping_address.name}</div>
                        <div>{selectedOrder.shipping_address.street}</div>
                        <div>
                          {selectedOrder.shipping_address.postal_code} {selectedOrder.shipping_address.city}
                        </div>
                        <div>{selectedOrder.shipping_address.country}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Adresse de facturation</h4>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                      <div className="text-sm text-gray-600">
                        <div>{selectedOrder.billing_address.name}</div>
                        <div>{selectedOrder.billing_address.street}</div>
                        <div>
                          {selectedOrder.billing_address.postal_code} {selectedOrder.billing_address.city}
                        </div>
                        <div>{selectedOrder.billing_address.country}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Details */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Détails de la commande</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span>{new Date(selectedOrder.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Statut:</span>
                        <span className={getStatusColor(selectedOrder.status)}>
                          {ORDER_STATUSES.find(s => s.value === selectedOrder.status)?.label}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Paiement:</span>
                        <span className={getPaymentStatusColor(selectedOrder.payment_status)}>
                          {PAYMENT_STATUSES.find(s => s.value === selectedOrder.payment_status)?.label}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Mode de paiement:</span>
                        <span>{selectedOrder.payment_method}</span>
                      </div>
                      {selectedOrder.sendcloud_tracking_number && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Suivi Sendcloud:</span>
                          <div className="text-right">
                            <div className="font-mono">{selectedOrder.sendcloud_tracking_number}</div>
                            {selectedOrder.sendcloud_carrier && (
                              <div className="text-xs text-gray-500 uppercase">{selectedOrder.sendcloud_carrier}</div>
                            )}
                          </div>
                        </div>
                      )}
                      {selectedOrder.sendcloud_status && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Statut expédition:</span>
                          <span className="text-sm">{selectedOrder.sendcloud_status}</span>
                        </div>
                      )}
                      {selectedOrder.tracking_number && !selectedOrder.sendcloud_tracking_number && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Suivi (manuel):</span>
                          <span className="font-mono">{selectedOrder.tracking_number}</span>
                        </div>
                      )}
                      {selectedOrder.shipped_at && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Expédié le:</span>
                          <span>{new Date(selectedOrder.shipped_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      )}
                      {selectedOrder.delivered_at && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Livré le:</span>
                          <span>{new Date(selectedOrder.delivered_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedOrder.notes && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                        {selectedOrder.notes}
                      </p>
                    </div>
                  )}

                  {/* Sendcloud Actions */}
                  {selectedOrder.sendcloud_order_id && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Actions Sendcloud</h4>
                      <div className="flex gap-2">
                        {selectedOrder.sendcloud_label_url && (
                          <button
                            onClick={() => handleViewLabel(selectedOrder.sendcloud_label_url!)}
                            className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Télécharger l'étiquette
                          </button>
                        )}
                        {selectedOrder.sendcloud_tracking_url && (
                          <button
                            onClick={() => handleTrackPackage(selectedOrder.sendcloud_tracking_url!)}
                            className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 flex items-center gap-2"
                          >
                            <Truck className="w-4 h-4" />
                            Suivre le colis
                          </button>
                        )}
                        {!selectedOrder.sendcloud_label_url && (selectedOrder.status === 'confirmed' || selectedOrder.status === 'processing') && (
                          <button
                            onClick={() => handleCreateLabel(selectedOrder.id)}
                            disabled={updatingStatus === selectedOrder.id}
                            className="px-3 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                          >
                            <Send className="w-4 h-4" />
                            Créer une étiquette
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Articles commandés</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Produit
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Quantité
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Prix unitaire
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedOrder.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {item.image_url && (
                                <img
                                  src={item.image_url}
                                  alt={item.product_name}
                                  className="w-10 h-10 rounded object-cover mr-3"
                                />
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {item.product_name} {item.vintage}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.unit_price.toFixed(2)} €
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(item.quantity * item.unit_price).toFixed(2)} €
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex justify-end">
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">
                      Total: {selectedOrder.total_amount.toFixed(2)} €
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}