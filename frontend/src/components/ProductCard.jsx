import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import toast from 'react-hot-toast'; // <--- Importación del Toast

export default function ProductCard({ product }) {
  const { addItem } = useCart();

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
    mainImage = ''; // Si todo falla, mostramos "Sin imagen"
  }
  // ======================================================

  // === FUNCIÓN PARA AGREGAR Y MOSTRAR NOTIFICACIÓN ===
  const handleAddToCart = async () => {
    try {
      await addItem(product.id, 1);
      toast.success('¡Producto agregado al carrito!');
    } catch (error) {
      toast.error('No se pudo agregar el producto.');
    }
  };
  // ====================================================

  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 flex flex-col">
      
      {/* Imagen y Enlace */}
      <Link to={`/productos/${product.slug}`} className="relative block h-56 bg-gray-100 dark:bg-gray-700 overflow-hidden">
        {mainImage ? (
          <img
            src={mainImage}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 flex-col gap-2">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="text-xs font-semibold">Sin imagen</span>
          </div>
        )}
        
        {/* Etiqueta de Agotado sobre la imagen */}
        {product.stock === 0 && (
          <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
            Agotado
          </span>
        )}
      </Link>

      {/* Botón flotante de añadir al carrito (Aparece al pasar el ratón en PC, fijo en móvil) */}
      {product.stock > 0 && (
        <button
          onClick={handleAddToCart} // <--- CAMBIO AQUÍ: Usamos la nueva función
          className="absolute bottom-[150px] left-1/2 -translate-x-1/2 w-[90%] bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-primary-600 dark:text-white font-bold py-2.5 rounded-xl shadow-lg opacity-100 translate-y-4 md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all duration-300 hover:bg-primary-600 hover:text-white flex items-center justify-center gap-2 z-10"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          Añadir al Carrito
        </button>
      )}

      {/* Detalles del Producto */}
      <div className="p-5 flex flex-col flex-grow">
        <Link to={`/productos/${product.slug}`} className="block">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 truncate group-hover:text-primary-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex-grow">
          {product.stock > 0 ? 'Disponible para envío inmediato' : 'Producto no disponible'}
        </p>

        <div className="flex items-end justify-between mt-auto">
          <div>
            <span className="text-xs text-gray-400 block font-medium">Precio</span>
            <p className="text-2xl font-extrabold text-gray-900 dark:text-white">
              ${product.price.toFixed(2)}
            </p>
          </div>
          
          {/* Indicador de stock verde */}
          {product.stock > 0 && (
            <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              En Stock
            </span>
          )}
        </div>
      </div>
    </div>
  );
}