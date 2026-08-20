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

  const inputClass = "border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition w-full md:w-auto";

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Catálogo de Productos</h1>
        <p className="text-gray-500 mt-1">Encuentra exactamente lo que buscas</p>
      </div>

      {/* Filtros Modernos */}
      <div className="flex flex-wrap gap-4 mb-8 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="w-5 h-5 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text"
            placeholder="Buscar productos..."
            defaultValue={q}
            onKeyDown={(e) => { if (e.key === 'Enter') updateParams('q', e.target.value.trim()); }}
            className={`${inputClass} pl-10`}
          />
        </div>

        <select
          value={category}
          onChange={(e) => updateParams('category', e.target.value)}
          className={inputClass}
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>

        <label className="flex items-center gap-2 cursor-pointer px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 font-medium text-sm">
          <input
            type="checkbox"
            checked={featured === 'true'}
            onChange={(e) => updateParams('featured', e.target.checked ? 'true' : '')}
            className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
          />
          Solo Destacados
        </label>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {products.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">No hay productos que coincidan con la búsqueda.</p>
            </div>
          )}

          {/* Paginación Premium */}
          <div className="flex justify-center items-center gap-4 mt-12">
            <button
              disabled={page <= 1}
              onClick={() => updateParams('page', String(page - 1))}
              className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Anterior
            </button>
            <span className="text-sm font-bold bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-4 py-2 rounded-lg">Página {page}</span>
            <button
              disabled={products.length < limit}
              onClick={() => updateParams('page', String(page + 1))}
              className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Siguiente
            </button>
          </div>
        </>
      )}
    </div>
  );
}