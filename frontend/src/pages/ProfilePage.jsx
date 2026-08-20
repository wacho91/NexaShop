import { useEffect, useState } from 'react';
import { ordersApi } from '../api';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/Spinner';

const statusConfig = {
  paid: { label: 'Pagado', class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  shipped: { label: 'Enviado', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  cancelled: { label: 'Cancelado', class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  pending: { label: 'Pendiente', class: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
};

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

  if (loading) return <Spinner />;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      {/* Encabezado de Perfil */}
      <div className="flex items-center gap-6 mb-10 pb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center text-white text-3xl font-extrabold shadow-lg">
          {user?.full_name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{user?.full_name}</h1>
          <p className="text-gray-500 mt-1">{user?.email}</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Mis Pedidos</h2>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500">Aún no has realizado ningún pedido.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const config = statusConfig[order.status] || statusConfig.pending;
            return (
              <div key={order.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition">
                <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pedido</span>
                    <p className="text-lg font-extrabold text-gray-900 dark:text-white">#{order.id}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha</span>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {new Date(order.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-center mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${config.class}`}>
                      {config.label}
                    </span>
                    <p className="text-2xl font-extrabold text-gray-900 dark:text-white">${order.total.toFixed(2)}</p>
                  </div>

                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                        <span>{item.product_name_snapshot}</span>
                        <span className="font-medium">x{item.quantity}</span>
                      </div>
                    ))}
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