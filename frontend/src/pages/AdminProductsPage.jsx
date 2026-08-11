import { useCallback, useEffect, useState } from 'react';
import { productsApi, categoriesApi } from '../api';
import Spinner from '../components/Spinner';

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  price: '',
  stock: 0,
  category_id: '',
  images: '',
  is_active: true,
  is_featured: false,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingSlug, setEditingSlug] = useState(null);
  const [error, setError] = useState('');

  // Estados para la creación rápida de categoría
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
    setEditingSlug(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  };

  const openEdit = (product) => {
    setEditingSlug(product.slug);
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: String(product.price),
      stock: product.stock,
      category_id: String(product.category_id),
      images: product.images.join(', '),
      is_active: product.is_active,
      is_featured: product.is_featured,
    });
    setError('');
    setShowModal(true);
  };

  // FUNCIÓN NUEVA: Crear categoría al vuelo
  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const { data } = await categoriesApi.create({ name: newCatName.trim() });
      setCategories([...categories, data]);
      setForm({ ...form, category_id: String(data.id) }); // Auto-selecciona la nueva
      setNewCatName('');
      setShowCatInput(false);
    } catch (err) {
      setError('Error al crear la categoría');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.category_id) {
      setError('Selecciona o crea una categoría.');
      return;
    }

    const payload = {
      ...form,
      price: parseFloat(form.price),
      stock: parseInt(form.stock, 10),
      category_id: parseInt(form.category_id, 10),
      images: form.images
        ? form.images.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
    };

    try {
      if (editingSlug) {
        const updatePayload = { ...payload };
        if (!updatePayload.slug) delete updatePayload.slug;
        await productsApi.update(editingSlug, updatePayload);
      } else {
        await productsApi.create(payload);
      }
      setShowModal(false);
      loadProducts();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(Array.isArray(detail) ? detail.map((d) => d.msg).join(', ') : detail || 'Error al guardar producto');
    }
  };

  const handleDelete = async (slug) => {
    if (!window.confirm('¿Desactivar este producto?')) return;
    await productsApi.remove(slug);
    loadProducts();
  };

  const inputClass = 'w-full border rounded-md px-3 py-2 dark:bg-gray-700 dark:border-gray-600';

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Productos</h1>
        <button onClick={openCreate} className="bg-primary-600 text-white px-4 py-2 rounded-md">
          Nuevo producto
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Nombre</th>
                <th className="text-left p-3">Precio</th>
                <th className="text-left p-3">Stock</th>
                <th className="text-left p-3">Categoría</th>
                <th className="text-left p-3">Estado</th>
                <th className="text-right p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const category = categories.find((c) => c.id === product.category_id);
                return (
                  <tr key={product.id} className="border-t dark:border-gray-700">
                    <td className="p-3">{product.id}</td>
                    <td className="p-3 font-medium">{product.name}</td>
                    <td className="p-3">${product.price.toFixed(2)}</td>
                    <td className="p-3">{product.stock}</td>
                    <td className="p-3">{category?.name || '—'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {product.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button onClick={() => openEdit(product)} className="text-blue-600 hover:underline">Editar</button>
                      {product.is_active && (
                        <button onClick={() => handleDelete(product.slug)} className="text-red-600 hover:underline">Desactivar</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal crear / editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingSlug ? 'Editar producto' : 'Nuevo producto'}</h2>

            <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <input required className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Slug (opcional)</label>
                <input className={inputClass} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generado" />
              </div>

              {/* SECCIÓN DE CATEGORÍA MEJORADA CON CREACIÓN RÁPIDA */}
              <div>
                <label className="block text-sm font-medium mb-1">Categoría</label>
                {!showCatInput ? (
                  <div className="flex gap-2">
                    <select required className={inputClass} value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                      <option value="">Seleccionar...</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => setShowCatInput(true)} className="bg-green-600 text-white px-3 rounded-md text-sm font-bold">+</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input type="text" placeholder="Nombre nueva categoría" className={inputClass} value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
                    <button type="button" onClick={handleCreateCategory} className="bg-primary-600 text-white px-3 rounded-md text-sm">OK</button>
                    <button type="button" onClick={() => setShowCatInput(false)} className="bg-gray-400 text-white px-3 rounded-md text-sm">X</button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Precio</label>
                <input required type="number" step="0.01" min="0.01" className={inputClass} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Stock</label>
                <input required type="number" min="0" className={inputClass} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Imágenes (URLs separadas por coma)</label>
                <input className={inputClass} value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} placeholder="https://ejemplo.com/imagen.jpg, https://..." />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea className={inputClass} rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Activo
              </label>

              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} /> Destacado
              </label>

              {error && (
                <div className="sm:col-span-2 bg-red-100 text-red-700 p-3 rounded-md text-sm">{error}</div>
              )}

              <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-md">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}