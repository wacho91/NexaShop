import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsApi, categoriesApi } from '../api';
import ProductCard from '../components/ProductCard';
import Spinner from '../components/Spinner';

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);

  // === IMÁGENES DE FONDO PARA EL CAROUSEL Y CATEGORÍAS ===
  const heroImages = [
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=2070&auto=format&fit=crop",
  ];

  // Imágenes para las tarjetas de categorías
   const categoryImages = [
    "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?q=80&w=800&auto=format&fit=crop", // Hombre
    "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800&auto=format&fit=crop", // Mujer (Nueva imagen garantizada)
    "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop", // Tecnología
  ];

  const testimonials = [
    { name: "Carlos M.", role: "Cliente Verificado", text: "La calidad de los productos es increíble. Pedí unos audífonos y llegaron al día siguiente. ¡100% recomendados!" },
    { name: "Laura G.", role: "Cliente Verificado", text: "Compré por primera vez y el proceso de pago fue súper seguro y fácil. El soporte me ayudó en todo." },
    { name: "Andrés P.", role: "Cliente Verificado", text: "NexaShop se ha convertido en mi tienda de confianza. Los productos de tecnología son de alta calidad." }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setLoading(true);
    productsApi
      .list({ featured: true, limit: 8, is_active: true })
      .then(({ data }) => setFeatured(data))
      .finally(() => setLoading(false));
      
    categoriesApi.list().then(({ data }) => setCategories(data)).catch(() => {});
  }, []);

  return (
    <div className="bg-white dark:bg-gray-900">
      {/* === HERO SECTION === */}
      <section className="relative overflow-hidden h-[600px] flex items-center justify-center text-white">
        {heroImages.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
              index === currentImage ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url(${img})` }}
          ></div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/40 backdrop-bl-sm"></div>

        <div className="relative z-10 text-center px-4 max-w-4xl">
          <span className="inline-block bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
            🚀 Nueva Colección
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

      {/* === EXPLORAR CATEGORÍAS (CON IMÁGENES REALES) === */}
      {categories.length > 0 && (
        <section className="bg-gray-50 dark:bg-gray-800/50 py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Explora por Categorías</h2>
              <p className="text-gray-500 mt-2">Encuentra lo que buscas en un clic</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {categories.map((cat, index) => (
                <Link 
                  key={cat.id} 
                  to={`/productos?category=${cat.slug}`} 
                  className="group relative h-64 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300"
                >
                  {/* Imagen de fondo */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                    style={{ backgroundImage: `url(${categoryImages[index % categoryImages.length]})` }}
                  ></div>
                  {/* Difuminado oscuro para que el texto se lea */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent group-hover:from-black/90 transition-colors"></div>
                  
                  <div className="relative h-full flex flex-col items-center justify-end text-white p-6 text-center">
                    <h3 className="text-3xl font-extrabold capitalize drop-shadow-lg mb-2">{cat.name}</h3>
                    <span className="mt-2 text-sm font-semibold bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                      Ver productos →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* === TESTIMONIOS === */}
      <section className="max-w-7xl mx-auto py-16 px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Lo que dicen nuestros clientes</h2>
          <p className="text-gray-500 mt-2">Miles de personas ya confían en NexaShop</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 hover:shadow-md transition">
              <div className="flex gap-1 mb-4 text-yellow-400">
                {[...Array(5)].map((_, index) => (
                  <svg key={index} className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                ))}
              </div>
              <p className="text-gray-600 dark:text-gray-300 italic mb-6">"{t.text}"</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{t.name}</p>
                  <p className="text-xs text-green-600 font-semibold">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* === NEWSLETTER (CAPTACIÓN DE CLIENTES) === */}
      <section className="bg-gray-50 dark:bg-gray-800/50 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">Únete a la comunidad NexaShop</h2>
          <p className="text-gray-500 mb-8 max-w-xl mx-auto">Suscríbete y recibe un <span className="font-bold text-primary-600">10% de descuento</span> en tu primera compra, además de ofertas exclusivas.</p>
          
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              required 
              placeholder="tu@email.com" 
              className="flex-1 px-5 py-3.5 rounded-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition outline-none"
            />
            <button 
              type="submit" 
              className="bg-gradient-to-r from-primary-600 to-blue-500 text-white px-8 py-3.5 rounded-full font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all whitespace-nowrap"
            >
              Suscribirme
            </button>
          </form>
        </div>
      </section>

    </div>
  );
}