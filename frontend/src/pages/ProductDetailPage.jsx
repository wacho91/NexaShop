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

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
          {product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-96 object-cover"
            />
          ) : (
            <div className="h-96 flex items-center justify-center text-gray-400">
              Sin imagen
            </div>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          <p className="text-2xl font-semibold text-primary-600 mb-4">
            ${product.price.toFixed(2)}
          </p>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {product.description}
          </p>

          <p
            className={`mb-4 ${
              product.stock > 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {product.stock > 0
              ? `En stock (${product.stock} disponibles)`
              : 'Agotado'}
          </p>

          <div className="flex items-center gap-4">
            <input
              type="number"
              min="1"
              max={product.stock}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
              className="border rounded-md px-3 py-2 w-20 dark:bg-gray-800 dark:border-gray-700"
            />

            <button
              onClick={handleAdd}
              disabled={product.stock === 0}
              className="bg-primary-600 text-white px-6 py-2 rounded-md font-semibold disabled:opacity-50"
            >
              Añadir al carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
