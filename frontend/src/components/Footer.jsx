import { Link } from 'react-router-dom';

export default function Footer() {
  // Obtiene el año actual de tu computadora (2026)
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
      <div className="max-w-7xl mx-auto py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Columna 1: Logo y Descripción */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-extrabold text-white mb-3">NexaShop</h3>
            <p className="text-sm text-gray-400 max-w-md">
              Tu tienda de confianza online. Ofrecemos los mejores productos de tecnología y moda, con envíos rápidos y pagos 100% seguros.
            </p>
            <div className="flex gap-4 mt-4">
              {/* Iconos de Redes Sociales */}
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82V14.706h-3.13v-3.622h3.13V8.413c0-3.099 1.894-4.785 4.659-4.785 1.325 0 2.464.099 2.795.143v3.24h-1.918c-1.504 0-1.795.715-1.795 1.763v2.31h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z" /></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>
              </a>
            </div>
          </div>

          {/* Columna 2: Tienda */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Tienda</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/productos" className="hover:text-primary-400 transition-colors">Todos los Productos</Link></li>
              <li><Link to="/productos?category=tecnologia" className="hover:text-primary-400 transition-colors">Tecnología</Link></li>
              <li><Link to="/productos?category=moda-mujer" className="hover:text-primary-400 transition-colors">Moda Mujer</Link></li>
              <li><Link to="/productos?category=moda-hombre" className="hover:text-primary-400 transition-colors">Moda Hombre</Link></li>
            </ul>
          </div>

          {/* Columna 3: Soporte */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Soporte</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-primary-400 transition-colors">Centro de Ayuda</a></li>
              <li><a href="#" className="hover:text-primary-400 transition-colors">Política de Devoluciones</a></li>
              <li><a href="#" className="hover:text-primary-400 transition-colors">Términos y Condiciones</a></li>
              <li><a href="#" className="hover:text-primary-400 transition-colors">Privacidad</a></li>
            </ul>
          </div>
        </div>

        {/* Derechos de Autor y Métodos de Pago */}
        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            &copy; {currentYear} NexaShop. Todos los derechos reservados.
          </p>
          
          <div className="flex items-center gap-2">
            {/* Íconos de tarjetas simulados */}
            <div className="bg-white/10 px-3 py-1 rounded text-xs font-bold">VISA</div>
            <div className="bg-white/10 px-3 py-1 rounded text-xs font-bold">MASTERCARD</div>
            <div className="bg-white/10 px-3 py-1 rounded text-xs font-bold">PAYPAL</div>
          </div>
        </div>
      </div>
    </footer>
  );
}