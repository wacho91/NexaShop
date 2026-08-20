import { useCallback, useEffect, useState } from 'react';
import { productsApi, categoriesApi } from '../api';
import Spinner from '../components/Spinner';

const emptyForm = {
  name: '', slug: '', description: '', price: '', stock: 0,
  category_id: '', images: '', is_active: true, is_featured: false,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingSlug, setEditingSlug] = useState(null);
  const [error, setError] = useState('');

  const [showCatInput, setShowCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const [activeRes, inactiveRes] = await Promise.all([
        productsApi.list({ limit: 100, is_active: true }),
        productsApi.list({ limit: 100, is_active: false }),
      ]);
      setProducts([...activeRes.data, ...inactiveRes.data]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    categoriesApi.list().then(({ data }) => setCategories(data));
  }, [loadProducts]);

  const openCreate = () => {
    setEditingSlug(null); setForm(emptyForm); setError(''); setShowModal(true);
  };

  const openEdit = (product) => {
    setEditingSlug(product.slug);
    setForm({
      name: product.name, slug: product.slug, description: product.description,
      price: String(product.price), stock: product.stock,
      category_id: String(product.category_id), images: product.images.join(', '),
      is_active: product.is_active, is_featured: product.is_featured,
    });
    setError(''); setShowModal(true);
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const { data } = await categoriesApi.create({ name: newCatName.trim() });
      setCategories([...categories, data]);
      setForm({ ...form, category_id: String(data.id) });
      setNewCatName(''); setShowCatInput(false);
    } catch (err) { setError('Error al crear la categoría'); }
  };

  const handleSave = async (e) => {
    e.preventDefault(); setError('');
    if (!form.category_id) { setError('Selecciona o crea una categoría.'); return; }

    const payload = {
      ...form, price: parseFloat(form.price), stock: parseInt(form.stock, 10),
      category_id: parseInt(form.category_id, 10),
      images: form.images ? form.images.split(',').map((s) => s.trim()).filter(Boolean) : [],
    };

    try {
      if (editingSlug) {
        const updatePayload = { ...payload };
        if (!updatePayload.slug) delete updatePayload.slug;
        await productsApi.update(editingSlug, updatePayload);
      } else {
        await productsApi.create(payload);
      }
      setShowModal(false); loadProducts();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(Array.isArray(detail) ? detail.map((d) => d.msg).join(', ') : detail || 'Error al guardar producto');
    }
  };

  const handleDelete = async (slug) => {
    if (!window.confirm('¿Desactivar este producto?')) return;
    await productsApi.remove(slug); loadProducts();
  };

  const inputClass = 'w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition';

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Gestión de Productos</h1>
          <p className="text-gray-500 mt-1">Administra tu inventario</p>
        </div>
        <button onClick={openCreate} className="bg-gradient-to-r from-primary-600 to-blue-500 text-white px-5 py-2.5 rounded-lg font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          Nuevo Producto
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">ID</th>
                  <th className="text-left p-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Nombre</th>
                  <th className="text-left p-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Precio</th>
                  <th className="text-left p-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Stock</th>
                  <th className="text-left p-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Categoría</th>
                  <th className="text-left p-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Estado</th>
                  <th className="text-right p-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {products.map((product) => {
                  const category = categories.find((c) => c.id === product.category_id);
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="p-4 text-gray-500">#{product.id}</td>
                      <td className="p-4 font-semibold text-gray-900 dark:text-white">{product.name}</td>
                      <td className="p-4 text-gray-700 dark:text-gray-300">${product.price.toFixed(2)}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${product.stock > 0 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500">{category?.name || '—'}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${product.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                          {product.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button onClick={() => openEdit(product)} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg font-semibold text-xs hover:bg-blue-100 dark:hover:bg-blue-900/40 transition">
                          Editar
                        </button>
                        {product.is_active && (
                          <button onClick={() => handleDelete(product.slug)} className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg font-semibold text-xs hover:bg-red-100 dark:hover:bg-red-900/40 transition">
                            Desactivar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal crear / editar Premium */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{editingSlug ? 'Editar Producto' : 'Nuevo Producto'}</h2>

            <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                <input required className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Slug (opcional)</label>
                <input className={inputClass} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generado" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
                {!showCatInput ? (
                  <div className="flex gap-2">
                    <select required className={inputClass} value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                      <option value="">Seleccionar...</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => setShowCatInput(true)} className="bg-green-600 text-white px-4 rounded-lg text-lg font-bold hover:bg-green-700 transition">+</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input type="text" placeholder="Nombre nueva categoría" className={inputClass} value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
                    <button type="button" onClick={handleCreateCategory} className="bg-primary-600 text-white px-4 rounded-lg font-bold hover:bg-primary-700 transition">OK</button>
                    <button type="button" onClick={() => setShowCatInput(false)} className="bg-gray-400 text-white px-4 rounded-lg font-bold hover:bg-gray-500 transition">X</button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Precio ($)</label>
                <input required type="number" step="0.01" min="0.01" className={inputClass} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Stock</label>
                <input required type="number" min="0" className={inputClass} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Imágenes (URLs separadas por coma)</label>
                <textarea 
                  className={inputClass} 
                  rows="3" 
                  value={form.images} 
                  onChange={(e) => setForm({ ...form, images: e.target.value })} 
                  placeholder="https://imagen1.jpg, https://imagen2.jpg, https://imagen3.jpg">
                </textarea>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                <textarea className={inputClass} rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}></textarea>
              </div>

              <div className="sm:col-span-2 flex gap-6 mt-2">
                <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300 font-semibold">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500" /> Activo
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300 font-semibold">
                  <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500" /> Destacado
                </label>
              </div>

              {error && (
                <div className="sm:col-span-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg text-sm font-medium border border-red-200 dark:border-red-800">{error}</div>
              )}

              <div className="sm:col-span-2 flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition">Cancelar</button>
                <button type="submit" className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-semibold shadow-md hover:bg-primary-700 transition">Guardar Producto</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}