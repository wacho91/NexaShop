import { useCallback, useEffect, useState } from 'react';
import { ordersApi } from '../api';
import Spinner from '../components/Spinner';

const STATUSES = ['pending', 'paid', 'shipped', 'cancelled'];

const statusClass = (status) => {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-700';
    case 'shipped':
      return 'bg-blue-100 text-blue-700';
    case 'cancelled':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-yellow-100 text-yellow-700';
  }
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

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const changeStatus = async (orderId, newStatus) => {
    await ordersApi.updateStatus(orderId, newStatus);
    loadOrders();
  };

  if (loading) return <Spinner />;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Pedidos</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">Usuario</th>
              <th className="text-left p-3">Total</th>
              <th className="text-left p-3">Estado</th>
              <th className="text-left p-3">Fecha</th>
              <th className="text-left p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t dark:border-gray-700">
                <td className="p-3">#{order.id}</td>
                <td className="p-3">{order.user_id}</td>
                <td className="p-3">${order.total.toFixed(2)}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${statusClass(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="p-3">
                  {new Date(order.created_at).toLocaleDateString()}
                </td>
                <td className="p-3">
                  <select
                    value={order.status}
                    onChange={(e) => changeStatus(order.id, e.target.value)}
                    className="border rounded-md px-2 py-1 dark:bg-gray-700 dark:border-gray-600"
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
