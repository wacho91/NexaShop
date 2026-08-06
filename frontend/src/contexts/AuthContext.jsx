import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authApi, usersApi, tokenStorage } from '../api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const accessToken = tokenStorage.getAccess();
    if (!accessToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const { data } = await usersApi.me();
      setUser(data);
    } catch {
      tokenStorage.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();

    const onUnauthorized = () => setUser(null);
    window.addEventListener('auth-unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth-unauthorized', onUnauthorized);
  }, [loadUser]);

  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login({ email, password });
    tokenStorage.setTokens(data);

    const me = await usersApi.me();
    setUser(me.data);
    return me.data;
  }, []);

  const register = useCallback(async (fullName, email, password) => {
    const { data } = await authApi.register({
      full_name: fullName,
      email,
      password,
    });
    tokenStorage.setTokens(data);

    const me = await usersApi.me();
    setUser(me.data);
    return me.data;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = tokenStorage.getRefresh();

    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // Ignorar error de logout si el token ya expiró
      }
    }

    tokenStorage.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
    }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
