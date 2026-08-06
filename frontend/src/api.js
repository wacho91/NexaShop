import axios from 'axios';

/**
 * Cliente HTTP para NexaShop.
 * Endpoints exactos del backend FastAPI (backend/src/routes.py)
 * Base URL: /api/v1 (en desarrollo usa el proxy de Vite hacia http://localhost:8000)
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------
const TOKEN_KEY = 'nexashop_access_token';
const REFRESH_KEY = 'nexashop_refresh_token';
const SESSION_KEY = 'nexashop_session_id';

export const tokenStorage = {
  getAccess: () => localStorage.getItem(TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  setTokens: ({ access_token, refresh_token }) => {
    localStorage.setItem(TOKEN_KEY, access_token);
    localStorage.setItem(REFRESH_KEY, refresh_token);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export const sessionStorageHelper = {
  getSessionId: () => {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  },
  clear: () => localStorage.removeItem(SESSION_KEY),
};

// ---------------------------------------------------------------------------
// Request interceptor
// Agrega Authorization Bearer y X-Session-ID para carrito de invitados.
// ---------------------------------------------------------------------------
api.interceptors.request.use((config) => {
  const accessToken = tokenStorage.getAccess();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  } else if (config.url.includes('/cart')) {
    config.headers['X-Session-ID'] = sessionStorageHelper.getSessionId();
  }

  return config;
});

// ---------------------------------------------------------------------------
// Response interceptor: refresh automático
// ---------------------------------------------------------------------------
let refreshPromise = null;

async function refreshAccessToken() {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) throw new Error('No refresh token');

  const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
    refresh_token: refreshToken,
  });

  tokenStorage.setTokens(response.data);
  return response.data.access_token;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken();
        }
        const newToken = await refreshPromise;
        refreshPromise = null;

        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshError) {
        refreshPromise = null;
        tokenStorage.clear();
        window.dispatchEvent(new Event('auth-unauthorized'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// Endpoints de la API
// ---------------------------------------------------------------------------
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  refresh: (data) => api.post('/auth/refresh', data),
  logout: (refresh_token) => api.post('/auth/logout', { refresh_token }),
};

export const usersApi = {
  me: () => api.get('/users/me'),
};

export const categoriesApi = {
  list: () => api.get('/categories'),
  get: (slug) => api.get(`/categories/${slug}`),
  create: (data) => api.post('/categories', data),
  update: (slug, data) => api.patch(`/categories/${slug}`, data),
  remove: (slug) => api.delete(`/categories/${slug}`),
};

export const productsApi = {
  list: (params) => api.get('/products', { params }),
  get: (slug) => api.get(`/products/${slug}`),
  create: (data) => api.post('/products', data),
  update: (slug, data) => api.patch(`/products/${slug}`, data),
  remove: (slug) => api.delete(`/products/${slug}`),
};

export const cartApi = {
  get: () => api.get('/cart'),
  addItem: (data) => api.post('/cart/items', data),
  updateItem: (itemId, data) => api.patch(`/cart/items/${itemId}`, data),
  removeItem: (itemId) => api.delete(`/cart/items/${itemId}`),
  clear: () => api.delete('/cart'),
};

export const ordersApi = {
  create: (data) => api.post('/orders', data),
  list: (params) => api.get('/orders', { params }),
  myOrders: () => api.get('/orders/me'),
  get: (orderId) => api.get(`/orders/${orderId}`),
  updateStatus: (orderId, status) => api.patch(`/orders/${orderId}/status`, { status }),
};

export default api;
