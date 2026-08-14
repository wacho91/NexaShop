import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

export default function ProductCard({ product }) {
  const { addItem } = useCart();

  // === ROMPE-CÓDIGOS A PRUEBA DE TODO PARA IMÁGENES ===
  let mainImage = '';
  try {
    if (Array.isArray(product.images) && product.images.length > 0) {
      mainImage = product.images[0];
    } else if (typeof product.images === 'string') {
      // Si viene como texto tipo '["url"]'
      if (product.images.trim().startsWith('[')) {
        const parsed = JSON.parse(product.images);
        if (Array.isArray(parsed) && parsed.length > 0) mainImage = parsed[0];
      } else if (product.images.trim() !== '') {
        // Si viene como texto plano separado por comas 'url1, url2'
        mainImage = product.images.split(',')[0].trim();
      }
    }
  } catch (e) {
    mainImage = ''; // Si todo falla, mostramos "Sin imagen"
  }
  // ======================================================

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition hover:shadow-lg">
      <Link to={`/productos/${product.slug}`}>
        <div className="h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden">
          {mainImage ? (
            <img
              src={mainImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              Sin imagen
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link to={`/productos/${product.slug}`}>
          <h3 className="font-semibold mb-1 hover:text-primary-600">
            {product.name}
          </h3>
        </Link>

        <p className="text-primary-600 font-bold mb-2">
          ${product.price.toFixed(2)}
        </p>

        <div className="flex items-center justify-between">
          <span
            className={`text-xs ${
              product.stock > 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {product.stock > 0 ? 'Disponible' : 'Agotado'}
          </span>

          <button
            onClick={() => addItem(product.id, 1)}
            disabled={product.stock === 0}
            className="text-sm bg-primary-600 text-white px-3 py-1.5 rounded-md disabled:opacity-50"
          >
            Añadir
          </button>
        </div>
      </div>
    </div>
  );
}