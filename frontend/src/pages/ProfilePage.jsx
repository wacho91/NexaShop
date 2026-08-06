import { useEffect, useState } from 'react';
import { ordersApi } from '../api';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/Spinner';

export default function ProfilePage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi
      .myOrders()
      .then(({ data }) => setOrders(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Mi perfil</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-6">{user?.email}</p>

      <h2 className="text-2xl font-semibold mb-4">Mis pedidos</h2>

      {loading ? (
        <Spinner />
      ) : orders.length === 0 ? (
        <p className="text-gray-500">No tienes pedidos todavía.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border rounded-lg p-4 dark:border-gray-700"
            >
              <div className="flex justify-between mb-2">
                <span className="font-semibold">Pedido #{order.id}</span>
                <span className="text-sm text-gray-500">
                  {new Date(order.created_at).toLocaleDateString()}
                </span>
              </div>

              <p className="text-sm mb-1">
                <strong>Estado:</strong> {order.status}
              </p>
              <p className="text-sm mb-1">
                <strong>Total:</strong> ${order.total.toFixed(2)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {order.items
                  .map((item) => `${item.product_name_snapshot} x${item.quantity}`)
                  .join(', ')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
