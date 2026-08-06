import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsApi } from '../api';
import ProductCard from '../components/ProductCard';
import Spinner from '../components/Spinner';

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productsApi
      .list({ featured: true, limit: 8, is_active: true })
      .then(({ data }) => setFeatured(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto py-20 px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Bienvenido a NexaShop</h1>
          <p className="text-lg mb-8">
            Los mejores productos al mejor precio
          </p>
          <Link
            to="/productos"
            className="inline-block bg-white text-primary-700 px-6 py-3 rounded-lg font-semibold"
          >
            Ver productos
          </Link>
        </div>
      </section>

      {/* Productos destacados */}
      <section className="max-w-7xl mx-auto py-12 px-4">
        <h2 className="text-2xl font-bold mb-6">Productos destacados</h2>

        {loading ? (
          <Spinner />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
