import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from 'recharts';
import { ordersApi } from '../api';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/Spinner';

const COLORS = ['#0ea5e9', '#f59e0b', '#10b981', '#ef4444'];

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi
      .list({ limit: 100 })
      .then(({ data }) => setOrders(data))
      .finally(() => setLoading(false));
  }, []);

  const salesByDay = useMemo(() => {
    const map = {};

    orders.forEach((order) => {
      if (order.status === 'cancelled') return;

      const day = order.created_at.slice(0, 10);
      map[day] = (map[day] || 0) + order.total;
    });

    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, total]) => ({
        day,
        total: Math.round(total * 100) / 100,
      }));
  }, [orders]);

  const statusData = useMemo(() => {
    const counts = {};

    orders.forEach((order) => {
      counts[order.status] = (counts[order.status] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const totalRevenue = useMemo(
    () =>
      orders
        .filter((order) => order.status !== 'cancelled')
        .reduce((sum, order) => sum + order.total, 0),
    [orders]
  );

  if (loading) return <Spinner />;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h1 className="text-3xl font-bold">Dashboard Admin</h1>

        <div className="flex gap-2">
          <Link
            to="/admin/productos"
            className="bg-primary-600 text-white px-4 py-2 rounded-md"
          >
            Productos
          </Link>
          <Link
            to="/admin/pedidos"
            className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-md"
          >
            Pedidos
          </Link>
        </div>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Ingresos totales</p>
          <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Pedidos</p>
          <p className="text-2xl font-bold">{orders.length}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Bienvenido</p>
          <p className="text-2xl font-bold truncate">{user?.full_name}</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Ventas por día</h2>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#0ea5e9" name="Ventas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Estado de pedidos</h2>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {statusData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
