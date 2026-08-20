import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../contexts/CartContext';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { items_count } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const linkClass = ({ isActive }) =>
    `px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
      isActive
        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-primary-600 dark:hover:text-primary-400'
    }`;

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-gray-200 dark:border-gray-800">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo y Navegación principal */}
        <div className="flex items-center gap-10">
          <Link to="/" className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary-600 to-blue-500 dark:from-primary-400 dark:to-blue-400 bg-clip-text text-transparent hover:scale-105 transition-transform">
            NexaShop
          </Link>

          <div className="hidden md:flex items-center gap-2">
            <NavLink to="/" className={linkClass} end>
              Inicio
            </NavLink>
            <NavLink to="/productos" className={linkClass}>
              Productos
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin" className={linkClass}>
                Admin
              </NavLink>
            )}
          </div>
        </div>

        {/* Acciones derecha */}
        <div className="flex items-center gap-3 md:gap-5">
          <ThemeToggle />

          {/* Carrito Mejorado */}
          <Link
            to="/carrito"
            className="relative p-2.5 text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Carrito"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {items_count > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center ring-2 ring-white dark:ring-gray-900 animate-pulse">
                {items_count}
              </span>
            )}
          </Link>

          {/* Usuario / Login */}
          {user ? (
            <div className="flex items-center gap-4">
              <Link to="/perfil" className="text-sm font-semibold hover:text-primary-600 hidden sm:block">
                {user.full_name}
              </Link>
              {isAdmin && (
                <Link to="/admin/productos" className="text-xs font-bold text-primary-600 border border-primary-600 px-3 py-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30">
                  Panel
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-gray-500 hover:text-red-500 transition-colors"
              >
                Salir
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                Entrar
              </Link>
              <Link
                to="/registro"
                className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-primary-600 to-blue-500 text-white rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all"
              >
                Registrarse
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}