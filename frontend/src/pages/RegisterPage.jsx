import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await register(fullName, email, password);
      navigate('/', { replace: true });
    } catch (err) {
      const detail = err.response?.data?.detail;
      const message = Array.isArray(detail)
        ? detail.map((d) => d.msg).join(', ')
        : detail || 'Error al registrarse';
      setError(message);
    }
  };

  return (
    <div className="max-w-md mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Crear cuenta</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Nombre completo"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="w-full border rounded-md px-4 py-2 dark:bg-gray-800 dark:border-gray-700"
        />

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
          placeholder="Contraseña (mín. 8, letras y números)"
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
          Registrarse
        </button>
      </form>

      <p className="text-center mt-4">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="text-primary-600">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
