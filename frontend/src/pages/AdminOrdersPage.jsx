import { useCallback, useEffect, useState } from 'react';
import { ordersApi } from '../api';
import Spinner from '../components/Spinner';

const STATUSES = ['pending', 'paid', 'shipped', 'cancelled'];

const statusConfig = {
  paid: { label: 'Pagado', class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  shipped: { label: 'Enviado', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  cancelled: { label: 'Cancelado', class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  pending: { label: 'Pendiente', class: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await ordersApi.list({ limit: 100 });
      setOrders(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const changeStatus = async (orderId, newStatus) => {
    await ordersApi.updateStatus(orderId, newStatus);
    loadOrders();
  };

  if (loading) return <Spinner />;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Gestión de Pedidos</h1>
        <p className="text-gray-500 mt-1">Revisa y actualiza el estado de las órdenes</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">ID</th>
                <th className="text-left p-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Usuario</th>
                <th className="text-left p-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Total</th>
                <th className="text-left p-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Estado</th>
                <th className="text-left p-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Fecha</th>
                <th className="text-left p-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {orders.map((order) => {
                const config = statusConfig[order.status] || statusConfig.pending;
                return (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="p-4 font-bold text-gray-900 dark:text-white">#{order.id}</td>
                    <td className="p-4 text-gray-500">Usuario #{order.user_id}</td>
                    <td className="p-4 font-semibold text-gray-900 dark:text-white">${order.total.toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${config.class}`}>
                        {config.label}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="p-4">
                      <select
                        value={order.status}
                        onChange={(e) => changeStatus(order.id, e.target.value)}
                        className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {statusConfig[status]?.label || status}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}