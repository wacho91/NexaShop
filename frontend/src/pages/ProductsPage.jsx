import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productsApi, categoriesApi } from '../api';
import ProductCard from '../components/ProductCard';
import Spinner from '../components/Spinner';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const q = searchParams.get('q') || '';
  const featured = searchParams.get('featured');
  const page = parseInt(searchParams.get('page') || '1', 10);

  const limit = 12;

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoriesApi.list().then(({ data }) => setCategories(data));
  }, []);

  useEffect(() => {
    setLoading(true);

    const params = { skip: (page - 1) * limit, limit, is_active: true };
    if (category) params.category = category;
    if (q) params.q = q;
    if (featured) params.featured = featured === 'true';

    productsApi
      .list(params)
      .then(({ data }) => setProducts(data))
      .finally(() => setLoading(false));
  }, [category, q, featured, page]);

  const updateParams = (name, value) => {
    const newParams = new URLSearchParams(searchParams);

    if (value) newParams.set(name, value);
    else newParams.delete(name);

    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Productos</h1>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="Buscar..."
          defaultValue={q}
          onKeyDown={(e) => {
            if (e.key === 'Enter') updateParams('q', e.target.value.trim());
          }}
          className="border rounded-md px-4 py-2 dark:bg-gray-800 dark:border-gray-700"
        />

        <select
          value={category}
          onChange={(e) => updateParams('category', e.target.value)}
          className="border rounded-md px-4 py-2 dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={featured === 'true'}
            onChange={(e) =>
              updateParams('featured', e.target.checked ? 'true' : '')
            }
          />
          Destacados
        </label>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {products.length === 0 && (
            <p className="text-center text-gray-500 py-12">
              No hay productos que coincidan con la búsqueda.
            </p>
          )}

          {/* Paginación */}
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              disabled={page <= 1}
              onClick={() => updateParams('page', String(page - 1))}
              className="px-4 py-2 border rounded-md disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="text-sm">Página {page}</span>
            <button
              disabled={products.length < limit}
              onClick={() => updateParams('page', String(page + 1))}
              className="px-4 py-2 border rounded-md disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </>
      )}
    </div>
  );
}
