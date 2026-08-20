import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsApi } from '../api';
import ProductCard from '../components/ProductCard';
import Spinner from '../components/Spinner';

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);

  // === IMÁGENES DE FONDO PARA EL CAROUSEL ===
  // Usamos imágenes de alta calidad de Unsplash (puedes cambiarlas por las que quieras)
  const heroImages = [
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop", // Moda/Ropa
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop", // Tienda General
    "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=2070&auto=format&fit=crop", // Tecnología
  ];

  // Lógica para cambiar la imagen cada 4 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    productsApi
      .list({ featured: true, limit: 8, is_active: true })
      .then(({ data }) => setFeatured(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white dark:bg-gray-900">
      {/* === HERO SECTION CON CAROUSEL DE FONDO === */}
      <section className="relative overflow-hidden h-[600px] flex items-center justify-center text-white">
        {/* Capa de imágenes del carousel */}
        {heroImages.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
              index === currentImage ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url(${img})` }}
          ></div>
        ))}

        {/* Capa de difuminado (Overlay) para hacer el contraste */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/40 backdrop-bl-sm"></div>

        {/* Contenido del Hero (Texto y Botón) */}
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <span className="inline-block bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
            🚀 Nueva Colección 2024
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight drop-shadow-lg">
            Eleva tu estilo con <span className="bg-gradient-to-r from-primary-400 to-blue-400 bg-clip-text text-transparent">NexaShop</span>
          </h1>
          <p className="text-lg md:text-xl mb-10 text-gray-200 max-w-2xl mx-auto drop-shadow-md">
            Descubre los productos de mayor calidad al mejor precio. Envíos rápidos y pagos 100% seguros.
          </p>
          <Link
            to="/productos"
            className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-full font-bold shadow-xl hover:shadow-2xl hover:bg-primary-50 transition-all duration-300 hover:scale-105"
          >
            Ver Productos
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
        </div>
      </section>

      {/* === BANNER DE CONFIANZA === */}
      <section className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-800">
          <div className="p-6 flex items-center justify-center gap-4 text-gray-600 dark:text-gray-300">
            <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1" /></svg>
            <div><p className="font-bold text-sm">Envío Rápido</p><p className="text-xs opacity-70">A todo el país</p></div>
          </div>
          <div className="p-6 flex items-center justify-center gap-4 text-gray-600 dark:text-gray-300">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            <div><p className="font-bold text-sm">Pago Seguro</p><p className="text-xs opacity-70">100% Encriptado</p></div>
          </div>
          <div className="p-6 flex items-center justify-center gap-4 text-gray-600 dark:text-gray-300">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 0a3 3 0 10-4.243-4.243M14.828 9.172L9.172 14.828m0 0a3 3 0 104.243 4.243M9.172 14.828L5.636 18.364" /></svg>
            <div><p className="font-bold text-sm">Soporte 24/7</p><p className="text-xs opacity-70">Siempre contigo</p></div>
          </div>
        </div>
      </section>

      {/* === PRODUCTOS DESTACADOS === */}
      <section className="max-w-7xl mx-auto py-16 px-4">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Productos Destacados</h2>
            <p className="text-gray-500 mt-1">Lo más vendido de la semana</p>
          </div>
          <Link to="/productos" className="text-primary-600 hover:text-primary-700 font-semibold text-sm hidden md:block">
            Ver todo →
          </Link>
        </div>

        {loading ? (
          <Spinner />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}