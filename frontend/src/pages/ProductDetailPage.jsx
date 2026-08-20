import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsApi } from '../api';
import { useCart } from '../contexts/CartContext';
import Spinner from '../components/Spinner';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const { addItem } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    productsApi
      .get(slug)
      .then(({ data }) => setProduct(data))
      .catch(() => navigate('/productos'))
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  const handleAdd = async () => {
    await addItem(product.id, quantity);
    navigate('/carrito');
  };

  if (loading) return <Spinner />;
  if (!product) return null;

  // === ROMPE-CÓDIGOS A PRUEBA DE TODO PARA IMÁGENES ===
  let mainImage = '';
  try {
    if (Array.isArray(product.images) && product.images.length > 0) {
      mainImage = product.images[0];
    } else if (typeof product.images === 'string') {
      if (product.images.trim().startsWith('[')) {
        const parsed = JSON.parse(product.images);
        if (Array.isArray(parsed) && parsed.length > 0) mainImage = parsed[0];
      } else if (product.images.trim() !== '') {
        mainImage = product.images.split(',')[0].trim();
      }
    }
  } catch (e) {
    mainImage = '';
  }
  // ======================================================

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <div className="grid md:grid-cols-2 gap-10">
        {/* Imagen */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 aspect-square flex items-center justify-center">
          {mainImage ? (
            <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="text-gray-400 flex flex-col items-center gap-2">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span>Sin imagen disponible</span>
            </div>
          )}
        </div>

        {/* Detalles */}
        <div className="flex flex-col justify-center">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">{product.name}</h1>
          <p className="text-3xl font-bold text-primary-600 mb-6">${product.price.toFixed(2)}</p>
          
          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{product.description || "Este producto no tiene una descripción detallada aún."}</p>
          </div>

          <div className="mb-8">
            {product.stock > 0 ? (
              <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-3 py-1.5 rounded-full text-sm font-bold">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                En stock ({product.stock} disponibles)
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-3 py-1.5 rounded-full text-sm font-bold">
                Agotado
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-3 text-lg font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition">-</button>
              <input
                type="number"
                min="1"
                max={product.stock}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                className="w-14 text-center font-semibold text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none border-x border-gray-300 dark:border-gray-600 py-3"
              />
              <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="px-4 py-3 text-lg font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition">+</button>
            </div>

            <button
              onClick={handleAdd}
              disabled={product.stock === 0}
              className="flex-1 bg-gradient-to-r from-primary-600 to-blue-500 text-white px-8 py-3.5 rounded-lg font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Añadir al Carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}