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
        <div className="inline-block p-6 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Tu carrito está vacío</h2>
        <p className="text-gray-500 mb-6">Parece que aún no has agregado productos.</p>
        <Link to="/productos" className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition">
          Ir a comprar
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-extrabold tracking-tight mb-8">Tu Carrito ({items_count})</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Lista de Productos */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden shrink-0">
                {item.product.images[0] ? (
                  <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Sin img</div>
                )}
              </div>

              <div className="flex-1">
                <p className="font-bold text-gray-900 dark:text-white">{item.product.name}</p>
                <p className="text-gray-500 text-sm">${item.product.price.toFixed(2)}</p>

                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                    <button onClick={() => handleQtyChange(item.id, item.quantity - 1)} className="px-3 py-1 text-lg font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition">-</button>
                    <span className="w-10 text-center font-semibold text-gray-900 dark:text-white">{item.quantity}</span>
                    <button onClick={() => handleQtyChange(item.id, item.quantity + 1)} className="px-3 py-1 text-lg font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition">+</button>
                  </div>
                  
                  <button onClick={() => removeItem(item.id)} className="text-red-500 text-sm font-medium hover:underline ml-2">
                    Eliminar
                  </button>
                </div>
              </div>

              <div className="text-right hidden sm:block">
                <p className="text-xs text-gray-500">Subtotal</p>
                <p className="font-extrabold text-lg text-gray-900 dark:text-white">
                  ${(item.product.price * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <button onClick={clearCart} className="text-red-500 text-sm font-medium hover:underline mt-2">
              Vaciar carrito
            </button>
          </div>
        </div>

        {/* Resumen de Compra */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-24">
            <h2 className="text-xl font-bold mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">Resumen del Pedido</h2>

            <div className="flex justify-between mb-3 text-gray-600 dark:text-gray-300">
              <span>Subtotal</span>
              <span className="font-semibold">${total.toFixed(2)}</span>
            </div>

            <div className="flex justify-between mb-6 text-gray-600 dark:text-gray-300">
              <span>Envío</span>
              <span className="text-sm font-medium">Calculado en checkout</span>
            </div>

            <div className="flex justify-between mb-6 pt-4 border-t border-gray-100 dark:border-gray-700">
              <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
              <span className="text-2xl font-extrabold text-primary-600">${total.toFixed(2)}</span>
            </div>

            <Link
              to={isAuthenticated ? '/checkout' : '/login?redirect=/checkout'}
              className="block text-center bg-gradient-to-r from-primary-600 to-blue-500 text-white py-3.5 rounded-lg font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all"
            >
              Finalizar Compra
            </Link>

            {!isAuthenticated && (
              <p className="text-xs text-gray-500 mt-3 text-center">
                Inicia sesión para continuar con el pago
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}