import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/Spinner';

export default function CartPage() {
  const { items, total, items_count, loading, updateItem, removeItem, clearCart } = useCart();
  const { isAuthenticated } = useAuth();

  const handleQtyChange = async (itemId, qty) => {
    if (qty <= 0) return;
    await updateItem(itemId, qty);
  };

  if (loading) return <Spinner />;

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Tu carrito está vacío</h2>
        <Link to="/productos" className="text-primary-600 font-semibold">
          Ir a comprar
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">
        Carrito ({items_count} {items_count === 1 ? 'item' : 'items'})
      </h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 border rounded-lg p-4 dark:border-gray-700"
            >
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden shrink-0">
                {item.product.images[0] && (
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <div className="flex-1">
                <p className="font-semibold">{item.product.name}</p>
                <p className="text-gray-600 dark:text-gray-300">
                  ${item.product.price.toFixed(2)}
                </p>

                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => handleQtyChange(item.id, item.quantity - 1)}
                    className="border rounded px-2 dark:border-gray-700"
                  >
                    -
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => handleQtyChange(item.id, item.quantity + 1)}
                    className="border rounded px-2 dark:border-gray-700"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="text-right">
                <p className="font-semibold">
                  ${(item.product.price * item.quantity).toFixed(2)}
                </p>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-600 text-sm mt-2 hover:underline"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <button onClick={clearCart} className="text-red-600 text-sm hover:underline">
              Vaciar carrito
            </button>
          </div>
        </div>

        <div className="border rounded-lg p-6 h-fit dark:border-gray-700">
          <h2 className="text-xl font-bold mb-4">Resumen</h2>

          <div className="flex justify-between mb-2">
            <span>Subtotal</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <div className="flex justify-between mb-4">
            <span>Envío</span>
            <span className="text-sm text-gray-500">Calculado en checkout</span>
          </div>

          <Link
            to={isAuthenticated ? '/checkout' : '/login?redirect=/checkout'}
            className="block text-center bg-primary-600 text-white py-3 rounded-md font-semibold"
          >
            Finalizar compra
          </Link>

          {!isAuthenticated && (
            <p className="text-sm text-gray-500 mt-2 text-center">
              Inicia sesión para continuar
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
