import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      navigate(redirect, { replace: true });
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(detail || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="max-w-md mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Iniciar sesión</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border rounded-md px-4 py-2 dark:bg-gray-800 dark:border-gray-700"
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border rounded-md px-4 py-2 dark:bg-gray-800 dark:border-gray-700"
        />

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-primary-600 text-white py-2 rounded-md font-semibold"
        >
          Entrar
        </button>
      </form>

      <p className="text-center mt-4">
        ¿No tienes cuenta?{' '}
        <Link to="/registro" className="text-primary-600">
          Regístrate
        </Link>
      </p>
    </div>
  );
}
