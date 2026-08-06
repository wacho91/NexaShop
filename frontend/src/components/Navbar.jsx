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
    `px-3 py-2 rounded-md text-sm font-medium transition ${
      isActive
        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`;

  return (
    <header className="bg-white dark:bg-gray-900 shadow sticky top-0 z-40">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            NexaShop
          </Link>

          <div className="hidden md:flex items-center gap-1">
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

        <div className="flex items-center gap-4">
          <ThemeToggle />

          <Link
            to="/carrito"
            className="relative p-2 text-gray-700 dark:text-gray-200 hover:text-primary-600"
            aria-label="Carrito"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            {items_count > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {items_count}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/perfil" className="text-sm font-medium hover:text-primary-600">
                {user.full_name}
              </Link>
              {isAdmin && (
                <Link to="/admin/productos" className="text-sm text-primary-600">
                  Panel
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:underline"
              >
                Salir
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Entrar
              </Link>
              <Link
                to="/registro"
                className="px-3 py-2 text-sm font-medium bg-primary-600 text-white rounded-md"
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
