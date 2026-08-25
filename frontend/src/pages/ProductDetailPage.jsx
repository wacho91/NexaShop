import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsApi } from '../api';
import { useCart } from '../contexts/CartContext';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast'; // <--- Importación del Toast

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  
  // Nuevo estado para la galería de imágenes
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState('');

  const { addItem } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    productsApi
      .get(slug)
      .then(({ data }) => {
        setProduct(data);
        
        // === ROMPE-CÓDIGOS PARA PARSEAR TODAS LAS IMÁGENES ===
        let parsedImages = [];
        try {
          if (Array.isArray(data.images) && data.images.length > 0) {
            parsedImages = data.images;
          } else if (typeof data.images === 'string') {
            if (data.images.trim().startsWith('[')) {
              const parsed = JSON.parse(data.images);
              if (Array.isArray(parsed)) parsedImages = parsed;
            } else if (data.images.trim() !== '') {
              // Si vienen separadas por coma en texto plano
              parsedImages = data.images.split(',').map(s => s.trim()).filter(Boolean);
            }
          }
        } catch (e) {
          parsedImages = [];
        }
        
        setImages(parsedImages);
        setSelectedImage(parsedImages[0] || ''); // Seleccionamos la primera por defecto
        // ======================================================
      })
      .catch(() => navigate('/productos'))
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  // === FUNCIÓN MODIFICADA PARA TOAST ===
  const handleAdd = async () => {
    try {
      await addItem(product.id, quantity);
      toast.success(`${quantity} ${product.name} agregado al carrito!`);
    } catch (error) {
      toast.error('No se pudo agregar el producto.');
    }
  };
  // ======================================

  if (loading) return <Spinner />;
  if (!product) return null;

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <div className="grid md:grid-cols-2 gap-10">
        
        {/* === COLUMNA DE IMÁGENES (GALERÍA) === */}
        <div className="flex flex-col gap-4">
          {/* Imagen Principal Grande */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 aspect-square flex items-center justify-center relative">
            {selectedImage ? (
              <img 
                src={selectedImage} 
                alt={product.name} 
                className="w-full h-full object-cover transition-all duration-300"
              />
            ) : (
              <div className="text-gray-400 flex flex-col items-center gap-2">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span>Sin imagen disponible</span>
              </div>
            )}
          </div>

          {/* Miniaturas (Thumbnails) - Solo se muestran si hay más de 1 imagen */}
          {images.length > 1 && (
            <div className="grid grid-cols-6 gap-2">
              {images.map((img, index) => (
                <button 
                  key={index} 
                  onClick={() => setSelectedImage(img)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === img 
                      ? 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-900/50 scale-105' 
                      : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`vista ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* === COLUMNA DE DETALLES === */}
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