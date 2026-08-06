import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersApi } from '../api';
import { useCart } from '../contexts/CartContext';

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const [shippingAddress, setShippingAddress] = useState({
    full_name: '',
    address: '',
    city: '',
    postal_code: '',
    country: '',
  });
  const [shippingCost, setShippingCost] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const { data } = await ordersApi.create({
        shipping_address: shippingAddress,
        shipping_cost: shippingCost,
      });

      await clearCart();
      navigate('/perfil', { state: { orderCreated: data.id } });
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(Array.isArray(detail) ? detail.map((d) => d.msg).join(', ') : detail || 'Error al crear la orden');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-lg">No hay items en el carrito</p>
      </div>
    );
  }

  const updateAddress = (key, value) => {
    setShippingAddress((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            required
            placeholder="Nombre completo"
            value={shippingAddress.full_name}
            onChange={(e) => updateAddress('full_name', e.target.value)}
            className="border rounded-md px-4 py-2 dark:bg-gray-800 dark:border-gray-700"
          />
          <input
            required
            placeholder="Dirección"
            value={shippingAddress.address}
            onChange={(e) => updateAddress('address', e.target.value)}
            className="border rounded-md px-4 py-2 dark:bg-gray-800 dark:border-gray-700"
          />
          <input
            required
            placeholder="Ciudad"
            value={shippingAddress.city}
            onChange={(e) => updateAddress('city', e.target.value)}
            className="border rounded-md px-4 py-2 dark:bg-gray-800 dark:border-gray-700"
          />
          <input
            required
            placeholder="Código postal"
            value={shippingAddress.postal_code}
            onChange={(e) => updateAddress('postal_code', e.target.value)}
            className="border rounded-md px-4 py-2 dark:bg-gray-800 dark:border-gray-700"
          />
          <input
            required
            placeholder="País"
            value={shippingAddress.country}
            onChange={(e) => updateAddress('country', e.target.value)}
            className="border rounded-md px-4 py-2 dark:bg-gray-800 dark:border-gray-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Costo de envío
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={shippingCost}
            onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
            className="border rounded-md px-4 py-2 dark:bg-gray-800 dark:border-gray-700"
          />
        </div>

        <div className="border rounded-lg p-4 dark:border-gray-700">
          <p className="mb-1">Subtotal: ${total.toFixed(2)}</p>
          <p className="mb-1">Envío: ${shippingCost.toFixed(2)}</p>
          <p className="font-bold text-lg">
            Total: ${(total + shippingCost).toFixed(2)}
          </p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="bg-primary-600 text-white py-3 px-6 rounded-md font-semibold disabled:opacity-50"
        >
          {submitting ? 'Procesando...' : 'Confirmar pedido'}
        </button>
      </form>
    </div>
  );
}
